from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import stripe
import logging
from app.api import deps
from app.core.config import settings
from app.db.models import User, Payment, SubscriptionPlan

logger = logging.getLogger(__name__)

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

        stripe_price_id = settings.STRIPE_PRO_PLAN_ID if plan_id == "pro" else settings.STRIPE_ENTERPRISE_PLAN_ID

        checkout_session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[
                {
                    'price': stripe_price_id,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=f"{settings.FRONTEND_URL}/?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/",
            metadata={"user_id": str(current_user.id), "plan_id": plan_id}
        )
        return {"url": checkout_session.url}
    except Exception as e:
        logger.error(f"Checkout session creation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Failed to create checkout session. Please try again.")

@router.get("/verify-session")
def verify_session(
    session_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Verify a Stripe checkout session and upgrade the user."""
    if not settings.STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe is not configured")
    try:
        session = stripe.checkout.Session.retrieve(session_id).to_dict()
        if session.get("payment_status") == "paid":
            plan_id = session.get("metadata", {}).get("plan_id", "pro")
            current_user.subscription_tier = plan_id
            db.commit()
            return {"status": "success", "tier": plan_id}
        else:
            return {"status": "pending"}
    except Exception as e:
        logger.error(f"Session verification failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Failed to verify checkout session. Please contact support.")

@router.get("/subscription")
def get_subscription_details(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get active subscription details from Stripe."""
    if not settings.STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe is not configured")
    
    if not current_user.stripe_customer_id:
        return {"has_subscription": False}
        
    try:
        subscriptions = stripe.Subscription.list(
            customer=current_user.stripe_customer_id,
            status="active",
            limit=1
        ).to_dict()
        
        sub_list = subscriptions.get("data", [])
        if not sub_list:
            return {"has_subscription": False}
            
        sub = sub_list[0]
        items = sub.get("items", {}).get("data", [])
        if items:
            item = items[0]
            price = item.get("price", {})
            amount = price.get("unit_amount", 0) / 100
            currency = price.get("currency", "usd").upper()
            import datetime
            current_period_end = datetime.datetime.fromtimestamp(item.get("current_period_end", 0)).strftime('%Y-%m-%d')
        else:
            amount = 0
            currency = "USD"
            current_period_end = "N/A"
        
        return {
            "has_subscription": True,
            "tier": current_user.subscription_tier,
            "amount": amount,
            "currency": currency,
            "next_billing_date": current_period_end,
            "status": sub.get("status"),
            "subscription_id": sub.get("id")
        }
    except Exception as e:
        logger.error(f"Subscription retrieval failed: {e}", exc_info=True)
        return {"has_subscription": False, "error": "An error occurred while retrieving subscription details."}

@router.post("/customer-portal")
def create_customer_portal(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a Stripe Customer Portal session."""
    if not settings.STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe is not configured")
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="User does not have a Stripe Customer ID")
    try:
        session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url=f"{settings.FRONTEND_URL}/",
        )
        return {"url": session.url}
    except Exception as e:
        logger.error(f"Customer portal creation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Failed to create customer portal session. Please try again.")

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
