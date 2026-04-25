from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import stripe
from app.api import deps
from app.core.config import settings
from app.db.models import User, Payment, SubscriptionPlan

router = APIRouter()

stripe.api_key = settings.STRIPE_API_KEY

@router.post("/create-checkout-session")
def create_checkout_session(
    plan_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a Stripe checkout session."""
    if not settings.STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe is not configured")

    try:
        # Create or get Stripe Customer
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                metadata={"user_id": str(current_user.id)}
            )
            current_user.stripe_customer_id = customer.id
            db.commit()

        checkout_session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[
                {
                    'price': plan_id,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=f"{settings.FRONTEND_URL}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/pricing",
            metadata={"user_id": str(current_user.id), "plan_id": plan_id}
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(deps.get_db)) -> Any:
    """Handle Stripe webhooks."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        # Fulfill the purchase...
        user_id = session.get("metadata", {}).get("user_id")
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.subscription_tier = "pro"  # simplify for now
                db.commit()

    return {"status": "success"}
