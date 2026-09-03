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

@router.get("/razorpay-health")
def check_razorpay_health(
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Real check of Razorpay integration health."""
    import razorpay
    from app.core.config import settings
    import time
    
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        return {
            "status": "unhealthy",
            "message": "Razorpay keys are missing in environment configuration."
        }
        
    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
        start_time = time.time()
        # A simple lightweight call to verify auth
        client.order.all({'count': 1})
        latency = round((time.time() - start_time) * 1000)
        
        return {
            "status": "healthy",
            "latency_ms": latency,
        }
    except Exception as e:
        logger.error(f"Razorpay health check failed: {e}", exc_info=True)
        return {
            "status": "unhealthy",
            "message": "Razorpay connection failed. Refer to server logs for diagnostics."
        }


@router.get("/ai-health")
def check_ai_health(
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Real check of Gemini AI integration health."""
    from app.core.config import settings
    import time
    
    if not settings.GEMINI_API_KEY:
        return {
            "status": "unhealthy",
            "message": "GEMINI_API_KEY is missing in environment configuration."
        }
        
    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        candidate_models = [
            getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite"),
            getattr(settings, "GEMINI_FALLBACK_MODEL", "gemini-3.7-flash"),
            "gemini-flash-latest",
        ]
        candidate_models = list(dict.fromkeys(candidate_models))

        for model_name in candidate_models:
            try:
                start_time = time.time()
                response = client.models.generate_content(
                    model=model_name,
                    contents='Return the word OK',
                )
                latency = round((time.time() - start_time) * 1000)
                return {
                    "status": "healthy",
                    "latency_ms": latency,
                    "model": model_name,
                }
            except Exception as model_err:
                logger.warning(f"AI diagnostic pulse failed for model {model_name}: {model_err}")
                continue

        return {
            "status": "unhealthy",
            "message": "All Gemini AI candidate models failed during pulse check."
        }
    except Exception as e:
        logger.error(f"AI health check failed: {e}", exc_info=True)
        return {
            "status": "unhealthy",
            "message": "Gemini AI connection failed. Refer to server logs for diagnostics."
        }

