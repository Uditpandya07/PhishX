from typing import Any, List
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.user import User as UserSchema, UserUpdate
from app.db.models import User, ApiKey
import secrets
import hashlib

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/me")
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get current user."""
    try:
        return UserSchema.from_orm(current_user) if hasattr(UserSchema, "from_orm") else UserSchema.model_validate(current_user)
    except Exception as e:
        logger.error(f"User serialization error: {e}")
        raise HTTPException(status_code=500, detail="Failed to load user profile")

@router.put("/me", response_model=UserSchema)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update own user."""
    user_data = user_in.model_dump(exclude_unset=True)
    if "password" in user_data:
        new_pwd = user_data.pop("password")
        if new_pwd:
            from app.core.security import get_password_hash, verify_password
            if current_user.password_hash and current_user.password_hash != "google_oauth_protected":
                old_pwd = user_data.get("old_password")
                if not old_pwd or not verify_password(old_pwd, current_user.password_hash):
                    raise HTTPException(status_code=400, detail="Incorrect current password. Please check and try again.")
            current_user.password_hash = get_password_hash(new_pwd)
    if "old_password" in user_data:
        del user_data["old_password"]
        
    if "slack_webhook_url" in user_data and user_data["slack_webhook_url"]:
        from urllib.parse import urlparse
        parsed_url = urlparse(str(user_data["slack_webhook_url"]).strip())
        allowed_hosts = ["hooks.slack.com", "outlook.office.com", "outlook.office365.com", "discord.com", "discordapp.com"]
        if parsed_url.scheme != "https" or parsed_url.netloc not in allowed_hosts:
            raise HTTPException(status_code=400, detail="Invalid webhook URL. Must be an HTTPS URL from an approved provider (Slack, Microsoft Teams, or Discord).")
    
    for field, value in user_data.items():
        setattr(current_user, field, value)
        
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/api-keys")
def generate_api_key(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Generate a new API key for the user. Only returns the raw key once."""
    if current_user.subscription_tier not in ["pro", "enterprise"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="API Access requires a Pro or Enterprise subscription.")
        
    # For now, allow 1 key per user. Delete old ones.
    db.query(ApiKey).filter(ApiKey.user_id == current_user.id).delete()
    
    raw_key = "px_" + secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    
    new_key = ApiKey(
        user_id=current_user.id,
        key_hash=key_hash
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    
    return {"id": str(new_key.id), "key_value": raw_key}

@router.post("/alerts")
def update_alert_preferences(
    alert_preferences: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Update alert preferences for Pro/Enterprise users."""
    if current_user.subscription_tier not in ["pro", "enterprise"]:
        raise HTTPException(status_code=403, detail="Alert configuration requires a Pro or Enterprise subscription.")
        
    current_user.alert_preferences = alert_preferences
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return {"detail": "Alert preferences updated successfully", "preferences": current_user.alert_preferences}

@router.delete("/me")
def delete_own_account(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Permanently delete the authenticated user's account and all their data.
    No admin approval required — deletion is immediate and irreversible.
    An audit log entry (with the user's email) is written before deletion
    so administrators can see who deleted their account.
    """
    from app.db.models import DeletionRequest

    # Safety: prevent the last superuser from deleting themselves
    if current_user.is_superuser:
        from sqlalchemy import func as _func
        admin_count = db.query(_func.count(User.id)).filter(User.is_superuser == True).scalar()
        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the last administrator account."
            )

    # 1. Capture email BEFORE deletion (user row will be gone after)
    email_snapshot = current_user.email

    # 2. Write audit log — SET NULL FK means this row survives the user deletion
    audit_entry = DeletionRequest(
        user_id=current_user.id,
        user_email=email_snapshot,
        status="deleted",
    )
    db.add(audit_entry)

    # 3. Delete the user — cascade handles scans, api_keys, feedbacks, etc.
    db.delete(current_user)

    # 4. Commit both operations atomically
    db.commit()

    logger.info(f"ACCOUNT SELF-DELETED: {email_snapshot}")
    return {"detail": "Your account and all associated data have been permanently deleted."}
