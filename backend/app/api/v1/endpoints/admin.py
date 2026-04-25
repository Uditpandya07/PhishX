from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.api import deps
from app.db.models import User, Scan, Feedback, ApiKey, DeletionRequest

router = APIRouter()

@router.get("/stats")
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
    ).filter(Scan.timestamp >= seven_days_ago).group_by(func.date(Scan.timestamp)).all()
    
    time_series = [{"date": str(s.date), "count": s.count} for s in scans_over_time]
    
    return {
        "total_users": total_users,
        "total_scans": total_scans,
        "total_threats": total_threats,
        "total_feedback": total_feedback,
        "scans_over_time": time_series,
    }

@router.get("/deletion-requests")
def get_deletion_requests(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Get all pending deletion requests with user info (Fixed Serialization)."""
    requests = db.query(DeletionRequest).options(joinedload(DeletionRequest.user)).all()
    
    # Manually convert to dict to prevent Pydantic serialization errors
    results = []
    for r in requests:
        if r.status == "pending":
            results.append({
                "id": str(r.id),
                "user_id": str(r.user_id),
                "status": r.status,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                "user": {
                    "email": r.user.email if r.user else "N/A"
                }
            })
    
    print(f"\n[DEBUG] Admin Panel sync successful. Found: {len(results)} pending requests.\n")
    return results

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
