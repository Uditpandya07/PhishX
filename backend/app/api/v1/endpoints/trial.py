import random
import string
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models import TrialRecord
from app.services.email import email_service

router = APIRouter()

# Comprehensive Disposable Email Domain Blocklist
DISPOSABLE_EMAIL_DOMAINS = {
    "tempmail.com", "temp-mail.org", "guerrillamail.com", "guerrillamail.net",
    "mailinator.com", "10minutemail.com", "10minutemail.net", "yopmail.com",
    "yopmail.fr", "trashmail.com", "dispostable.com", "getnada.com",
    "crazymailing.com", "maildrop.cc", "throwawaymail.com", "fakeinbox.com",
    "tempail.com", "mohmal.com", "burnermail.io", "inboxkitten.com",
    "emailondeck.com", "mytemp.email", "generator.email", "getairmail.com",
    "zeroe.ml", "disposable.com", "tempmailo.com", "minutemail.com"
}

def is_disposable_email(email: str) -> bool:
    try:
        domain = email.strip().lower().split('@')[-1]
        return domain in DISPOSABLE_EMAIL_DOMAINS
    except Exception:
        return True

class TrialOTPRequest(BaseModel):
    name: str
    email: EmailStr
    consent: bool
    device_uuid: Optional[str] = None

class TrialOTPVerify(BaseModel):
    email: EmailStr
    otp_code: str
    device_uuid: Optional[str] = None

@router.post("/request-otp")
def request_trial_otp(
    req: TrialOTPRequest,
    request: Request,
    db: Session = Depends(deps.get_db)
) -> Any:
    """Validate user registration and send 6-digit OTP for 15-day trial."""
    if not req.consent:
        raise HTTPException(
            status_code=400,
            detail="Consent is required to start your free 15-day trial."
        )

    clean_email = req.email.strip().lower()

    # 1. Reject Disposable Emails
    if is_disposable_email(clean_email):
        raise HTTPException(
            status_code=400,
            detail="Temporary or disposable email addresses are not permitted. Please use your personal or work email."
        )

    # 2. Check Device & Email Anti-Jailbreak Protection
    client_ip = request.client.host if request.client else "unknown"

    existing_record = db.query(TrialRecord).filter(TrialRecord.email == clean_email).first()
    if existing_record and existing_record.is_verified:
        # Check if trial has already expired or is active
        now = datetime.now(timezone.utc)
        if existing_record.trial_end and existing_record.trial_end < now:
            raise HTTPException(
                status_code=400,
                detail="This email has already completed a 15-day trial. Please upgrade to PhishX Pro to continue."
            )
        else:
            return {
                "message": "Trial already active for this email.",
                "trial_token": existing_record.trial_token,
                "is_verified": True
            }

    if req.device_uuid:
        device_record = db.query(TrialRecord).filter(
            TrialRecord.device_uuid == req.device_uuid,
            TrialRecord.is_verified == True
        ).first()
        if device_record and device_record.email != clean_email:
            raise HTTPException(
                status_code=400,
                detail="A 15-day trial has already been used on this device installation. Please upgrade to PhishX Pro."
            )

    # 3. Generate 6-Digit OTP Code
    otp_code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    if not existing_record:
        trial_record = TrialRecord(
            name=req.name.strip(),
            email=clean_email,
            device_uuid=req.device_uuid,
            otp_code=otp_code,
            otp_expires_at=expires_at,
            ip_address=client_ip,
            is_verified=False
        )
        db.add(trial_record)
    else:
        existing_record.name = req.name.strip()
        existing_record.otp_code = otp_code
        existing_record.otp_expires_at = expires_at
        existing_record.device_uuid = req.device_uuid or existing_record.device_uuid
        existing_record.ip_address = client_ip

    db.commit()

    # 4. Dispatch Email OTP
    sent = email_service.send_trial_otp_email(clean_email, req.name.strip(), otp_code)

    resp_data = {
        "message": f"Verification OTP code sent to {clean_email}.",
        "email": clean_email
    }
    # For development environment without SendGrid, include otp_code in response for quick testing
    if not sent:
        resp_data["dev_otp_code"] = otp_code

    return resp_data

@router.post("/verify-otp")
def verify_trial_otp(
    req: TrialOTPVerify,
    db: Session = Depends(deps.get_db)
) -> Any:
    """Verify 6-digit OTP code and activate 15-day trial."""
    clean_email = req.email.strip().lower()
    record = db.query(TrialRecord).filter(TrialRecord.email == clean_email).first()

    if not record or not record.otp_code:
        raise HTTPException(status_code=404, detail="No trial request found for this email.")

    if record.otp_code != req.otp_code.strip():
        raise HTTPException(status_code=400, detail="Invalid 6-digit verification code.")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    otp_exp = record.otp_expires_at.replace(tzinfo=None) if record.otp_expires_at else None
    if otp_exp and otp_exp < now:
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")

    # Activate 15-Day Window
    trial_start = now
    trial_end = now + timedelta(days=15)
    trial_token = f"PX-TRIAL-{secrets.token_urlsafe(32)}"

    record.is_verified = True
    record.otp_code = None
    record.trial_start = trial_start
    record.trial_end = trial_end
    record.trial_token = trial_token
    if req.device_uuid:
        record.device_uuid = req.device_uuid

    db.commit()
    db.refresh(record)

    return {
        "message": "15-Day Free Trial activated successfully!",
        "trial_token": trial_token,
        "trial_start": record.trial_start.isoformat(),
        "trial_end": record.trial_end.isoformat(),
        "days_remaining": 15
    }

@router.get("/status")
def get_trial_status(
    trial_token: Optional[str] = None,
    device_uuid: Optional[str] = None,
    db: Session = Depends(deps.get_db)
) -> Any:
    """Check trial status and remaining days."""
    query = db.query(TrialRecord).filter(TrialRecord.is_verified == True)
    if trial_token:
        record = query.filter(TrialRecord.trial_token == trial_token).first()
    elif device_uuid:
        record = query.filter(TrialRecord.device_uuid == device_uuid).first()
    else:
        raise HTTPException(status_code=400, detail="Missing trial_token or device_uuid.")

    if not record:
        return {"status": "unregistered", "days_remaining": 0}

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    t_end = record.trial_end.replace(tzinfo=None) if record.trial_end else None

    if t_end and t_end < now:
        return {
            "status": "expired",
            "days_remaining": 0,
            "email": record.email,
            "message": "Your 15-day trial has ended. Please upgrade to PhishX Pro."
        }

    days_left = max(1, (t_end - now).days) if t_end else 15

    return {
        "status": "active",
        "days_remaining": days_left,
        "email": record.email,
        "trial_end": record.trial_end.isoformat() if record.trial_end else None
    }
