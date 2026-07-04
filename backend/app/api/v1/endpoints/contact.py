from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.future import select
from typing import List, Any
from app.db.session import get_db
from app.api.deps import get_current_user, get_current_active_superuser
from app.db.models import User, ContactQuery
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter()

class ContactQueryCreate(BaseModel):
    query_text: str = Field(..., max_length=1000)

class ContactQueryResponse(BaseModel):
    id: str
    user_id: str
    query_text: str
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True

class AdminContactQueryResponse(ContactQueryResponse):
    user_email: str

@router.post("/submit", response_model=ContactQueryResponse)
async def submit_query(
    query_in: ContactQueryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Submit a new contact query."""
    new_query = ContactQuery(
        user_id=current_user.id,
        query_text=query_in.query_text
    )
    db.add(new_query)
    db.commit()
    db.refresh(new_query)
    
    # Return as response (uuid cast to string for pydantic)
    return {
        "id": str(new_query.id),
        "user_id": str(new_query.user_id),
        "query_text": new_query.query_text,
        "status": new_query.status,
        "timestamp": new_query.timestamp
    }

@router.get("/admin/queries", response_model=List[AdminContactQueryResponse])
async def get_all_queries(
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db)
) -> Any:
    """Admin only: Fetch all contact queries with user emails."""
    queries = db.query(ContactQuery).join(User).order_by(ContactQuery.timestamp.desc()).all()
    
    result = []
    for q in queries:
        result.append({
            "id": str(q.id),
            "user_id": str(q.user_id),
            "query_text": q.query_text,
            "status": q.status,
            "timestamp": q.timestamp,
            "user_email": q.user.email
        })
    return result
