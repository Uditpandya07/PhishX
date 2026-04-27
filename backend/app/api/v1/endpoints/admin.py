from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, text
from app.api import deps
from app.schemas.admin import GlobalStats, DeletionRequestResponse
from app.db.models import User, Scan, Feedback, ApiKey, DeletionRequest

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
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception:
        return {
            "status": "unhealthy",
            "database": "error",
            "timestamp": datetime.utcnow().isoformat()
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
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
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

@router.get("/deletion-requests", response_model=List[DeletionRequestResponse])
def get_deletion_requests(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Get all pending deletion requests with user info."""
    requests = db.query(DeletionRequest).options(joinedload(DeletionRequest.user)).filter(DeletionRequest.status == "pending").all()
    return requests

@router.post("/deletion-requests/{request_id}/approve")
def approve_deletion(
    request_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Approve deletion: Delete the user and all their data."""
    req = db.query(DeletionRequest).filter(DeletionRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    target_user = db.query(User).filter(User.id == req.user_id).first()
    if target_user:
        # Loophole Fix 1: Cannot delete the LAST admin
        if target_user.is_superuser:
            admin_count = db.query(func.count(User.id)).filter(User.is_superuser == True).scalar()
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Critical System Safety: Cannot delete the final administrator account."
                )
        
        # Loophole Fix 2: Admin cannot approve their OWN deletion (prevents accidental clicks)
        if target_user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Safety Lock: Administrators cannot approve their own deletion. Please have another admin process this request."
            )

        db.delete(target_user) # Cascade will handle scans/feedback
    
    db.delete(req)
    db.commit()
    return {"detail": "User and all associated data permanently deleted."}

@router.post("/deletion-requests/{request_id}/deny")
def deny_deletion(
    request_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Deny deletion: Keep the user."""
    req = db.query(DeletionRequest).filter(DeletionRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = "denied"
    req.processed_at = datetime.utcnow()
    db.commit()
    return {"detail": "Deletion request denied. User remains active."}
