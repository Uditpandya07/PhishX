from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, text
import logging
from app.api import deps
from app.schemas.admin import GlobalStats, DeletedAccountLog
from app.db.models import User, Scan, Feedback, ApiKey, DeletionRequest

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/health")
def health_check(
    db: Session = Depends(deps.get_db),
) -> Any:
    """Check system health and database connectivity."""
    try:
        # Simple query to check DB
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception:
        return {
            "status": "unhealthy",
            "database": "error",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

@router.post("/repair-db")
def repair_database(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Force re-initialization of all database tables and optimize."""
    try:
        from app.db.base import Base
        from app.db.session import engine
        import app.db.models as models # Ensure models are loaded
        
        # This creates missing tables without affecting existing data
        Base.metadata.create_all(bind=engine)
        
        # Clear any stalled connections or session states
        db.execute(text("ANALYZE")) 
        
        return {"status": "success", "message": "Database tables synchronized and optimized."}
    except Exception:
        raise HTTPException(status_code=500, detail="Database synchronization and optimization failed.")

@router.get("/stats", response_model=GlobalStats)
def get_global_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Get global statistics for the admin dashboard."""
    total_users = db.query(func.count(User.id)).scalar()
    total_scans = db.query(func.count(Scan.id)).scalar()
    total_threats = db.query(func.count(Scan.id)).filter(Scan.prediction == "Phishing").scalar()
    total_feedback = db.query(func.count(Feedback.id)).scalar()
    
    # Get scans over the last 7 days
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    scans_over_time = db.query(
        func.date(Scan.timestamp).label('date'),
        func.count(Scan.id).label('count')
    ).filter(Scan.timestamp >= seven_days_ago).group_by(func.date(Scan.timestamp)).order_by(func.date(Scan.timestamp).asc()).all()
    
    time_series = [{"date": str(s.date), "count": s.count} for s in scans_over_time]
    
    return {
        "total_users": total_users,
        "total_scans": total_scans,
        "total_threats": total_threats,
        "total_feedback": total_feedback,
        "scans_over_time": time_series,
    }

@router.get("/deleted-accounts", response_model=List[DeletedAccountLog])
def get_deleted_accounts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Return audit log of all self-deleted accounts.
    Shows the email, deletion timestamp, and any reason provided.
    Records persist permanently even after the user row is gone.
    """
    logs = (
        db.query(DeletionRequest)
        .filter(DeletionRequest.status == "deleted")
        .order_by(DeletionRequest.deleted_at.desc())
        .all()
    )
    return logs

@router.get("/stripe-health")
def check_stripe_health(
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Real check of Stripe integration health."""
    import stripe
    from app.core.config import settings
    import time
    
    if not settings.STRIPE_API_KEY:
        return {
            "status": "unhealthy",
            "message": "Stripe API Key is missing in environment configuration."
        }
        
    try:
        stripe.api_key = settings.STRIPE_API_KEY
        
        # 1. Contact Stripe API & measure latency
        start_time = time.time()
        account_details = stripe.Account.retrieve().to_dict()
        latency = round((time.time() - start_time) * 1000)
        
        # 2. Check if the configured Plan IDs are valid
        pro_plan_id = settings.STRIPE_PRO_PLAN_ID
        ent_plan_id = settings.STRIPE_ENTERPRISE_PLAN_ID
        
        pro_status = "unconfigured"
        ent_status = "unconfigured"
        
        if pro_plan_id:
            try:
                stripe.Price.retrieve(pro_plan_id)
                pro_status = "active"
            except Exception as e:
                logger.error(f"Failed to retrieve Stripe Pro Price {pro_plan_id}: {e}")
                pro_status = "error: price retrieval failed"
                
        if ent_plan_id:
            try:
                stripe.Price.retrieve(ent_plan_id)
                ent_status = "active"
            except Exception as e:
                logger.error(f"Failed to retrieve Stripe Enterprise Price {ent_plan_id}: {e}")
                ent_status = "error: price retrieval failed"
                
        is_healthy = (pro_status == "active")
        
        return {
            "status": "healthy" if is_healthy else "degraded",
            "latency_ms": latency,
            "account_id": account_details.get("id"),
            "account_email": account_details.get("email"),
            "charges_enabled": account_details.get("charges_enabled"),
            "pro_plan": {
                "id": pro_plan_id,
                "status": pro_status
            },
            "enterprise_plan": {
                "id": ent_plan_id,
                "status": ent_status
            }
        }
    except Exception as e:
        logger.error(f"Stripe health check failed: {e}", exc_info=True)
        return {
            "status": "unhealthy",
            "message": "Stripe connection failed. Refer to server logs for diagnostics."
        }

