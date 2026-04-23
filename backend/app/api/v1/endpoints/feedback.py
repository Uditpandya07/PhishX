from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.db.session import get_db
from app.db.models import Feedback, Scan, User
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    feedback_in: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit feedback (false positive/negative) for a specific scan.
    """
    # Verify the scan exists
    scan = db.query(Scan).filter(Scan.id == feedback_in.scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    # Check if user owns the scan (unless they are admin)
    if scan.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to provide feedback for this scan")

    # Create feedback
    new_feedback = Feedback(
        scan_id=feedback_in.scan_id,
        user_id=current_user.id,
        feedback_type=feedback_in.feedback_type,
        comment=feedback_in.comment
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    
    # Reload with scan relationship for the response
    return db.query(Feedback).options(joinedload(Feedback.scan)).filter(Feedback.id == new_feedback.id).first()

@router.get("/", response_model=List[FeedbackResponse])
def get_user_feedbacks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all feedbacks. Regular users only see their own. Admins see all.
    """
    query = db.query(Feedback).options(joinedload(Feedback.scan))
    
    if current_user.is_superuser:
        feedbacks = query.offset(skip).limit(limit).all()
    else:
        feedbacks = query.filter(Feedback.user_id == current_user.id).offset(skip).limit(limit).all()
    return feedbacks
