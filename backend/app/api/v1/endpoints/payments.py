from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import razorpay
import logging
from pydantic import BaseModel
from app.api import deps
from app.core.config import settings
from app.db.models import User, Payment, SubscriptionPlan
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter()

def get_razorpay_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay is not configured")
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class SubscriptionCreate(BaseModel):
    plan_id: str

# Helper to get or create a razorpay plan dynamically
def get_or_create_plan(client, plan_name: str, amount_paise: int):
    # In a production app, we would cache plan IDs in DB.
    # We will just create a new plan for simplicity of this implementation.
    try:
        plan = client.plan.create({
            "item": {
                "name": plan_name,
                "amount": amount_paise,
                "currency": "INR",
                "description": f"{plan_name} Monthly"
            },
            "period": "monthly",
            "interval": 1
        })
        return plan["id"]
    except Exception as e:
        logger.error(f"Failed to create Razorpay Plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize billing plan")

@router.post("/create-subscription")
def create_subscription(
    sub_in: SubscriptionCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a Razorpay subscription for an upgrade."""
    client = get_razorpay_client()
    
    amount = 499900 if sub_in.plan_id == "enterprise" else 99900 # ₹4999 or ₹999
    plan_name = "PhishX Enterprise" if sub_in.plan_id == "enterprise" else "PhishX Standard"
    
    try:
        # Check if pre-configured plan IDs exist in environment
        rzp_plan_id = None
        if sub_in.plan_id == "enterprise" and settings.RAZORPAY_ENTERPRISE_PLAN_ID:
            rzp_plan_id = settings.RAZORPAY_ENTERPRISE_PLAN_ID
        elif sub_in.plan_id == "pro" and settings.RAZORPAY_PRO_PLAN_ID:
            rzp_plan_id = settings.RAZORPAY_PRO_PLAN_ID
            
        if not rzp_plan_id:
            # Fallback to dynamic creation (works in Test mode, often blocked in Live mode)
            rzp_plan_id = get_or_create_plan(client, plan_name, amount)
        
        # Create Razorpay subscription
        subscription = client.subscription.create({
            "plan_id": rzp_plan_id,
            "total_count": 120, # 10 years duration
            "customer_notify": 1,
            "notes": {
                "user_id": str(current_user.id),
                "tier": sub_in.plan_id
            }
        })
        
        return {
            "subscription_id": subscription["id"],
            "amount": amount,
            "currency": "INR",
            "key_id": settings.RAZORPAY_KEY_ID
        }
    except Exception as e:
        logger.error(f"Subscription creation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Failed to create Razorpay subscription.")

class PaymentVerification(BaseModel):
    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str
    plan_id: str

@router.post("/verify-payment")
def verify_payment(
    payment_data: PaymentVerification,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Verify a Razorpay subscription payment and upgrade the user."""
    client = get_razorpay_client()
    try:
        # Verify signature for subscription
        client.utility.verify_subscription_payment_signature({
            'razorpay_subscription_id': payment_data.razorpay_subscription_id,
            'razorpay_payment_id': payment_data.razorpay_payment_id,
            'razorpay_signature': payment_data.razorpay_signature
        })
        
        # Upgrade user
        current_user.subscription_tier = payment_data.plan_id
        current_user.razorpay_subscription_id = payment_data.razorpay_subscription_id
        current_user.subscription_status = "active"
        db.commit()
        
        return {"status": "success", "tier": payment_data.plan_id}
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    except Exception as e:
        logger.error(f"Payment verification failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Failed to verify payment. Please contact support.")

@router.get("/subscription")
def get_subscription_details(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get active subscription details live from Razorpay."""
    if current_user.subscription_tier == "free" or not current_user.razorpay_subscription_id:
        return {"has_subscription": False}
        
    client = get_razorpay_client()
    try:
        sub = client.subscription.fetch(current_user.razorpay_subscription_id)
        
        next_billing_date = "N/A"
        if sub.get("charge_at"):
            next_billing_date = datetime.fromtimestamp(sub["charge_at"]).strftime("%B %d, %Y")
            
        return {
            "has_subscription": True,
            "tier": current_user.subscription_tier,
            "amount": sub.get("plan_id"), # In real app, we fetch plan details
            "currency": "INR",
            "next_billing_date": next_billing_date,
            "status": sub.get("status", "unknown"),
            "subscription_id": current_user.razorpay_subscription_id
        }
    except Exception as e:
        logger.error(f"Failed to fetch subscription: {e}")
        # Fallback to local DB status
        return {
            "has_subscription": True,
            "tier": current_user.subscription_tier,
            "status": current_user.subscription_status,
            "subscription_id": current_user.razorpay_subscription_id,
            "next_billing_date": "Error fetching live data"
        }

@router.post("/cancel-subscription")
def cancel_subscription(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Cancel Razorpay subscription."""
    if not current_user.razorpay_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription found")
        
    client = get_razorpay_client()
    try:
        client.subscription.cancel(current_user.razorpay_subscription_id)
        
        current_user.subscription_tier = "free"
        current_user.subscription_status = "cancelled"
        db.commit()
        
        return {"status": "success", "message": "Subscription cancelled successfully"}
    except Exception as e:
        logger.error(f"Failed to cancel subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")
