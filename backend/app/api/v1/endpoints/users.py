from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.user import User as UserSchema, UserUpdate
from app.db.models import User, ApiKey
import secrets
import hashlib

router = APIRouter()

@router.get("/me")
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get current user."""
    try:
        return UserSchema.from_orm(current_user) if hasattr(UserSchema, "from_orm") else UserSchema.model_validate(current_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Serialization Error: {e}")

@router.put("/me", response_model=UserSchema)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update own user."""
    user_data = user_in.dict(exclude_unset=True)
    if "password" in user_data:
        from app.core.security import get_password_hash
        hashed_password = get_password_hash(user_data["password"])
        current_user.password_hash = hashed_password
        del user_data["password"]
    
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

@router.post("/delete-request")
def request_account_deletion(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Save account deletion request to DB."""
    from app.db.models import DeletionRequest
    
    # Check if a pending request already exists
    existing = db.query(DeletionRequest).filter(
        DeletionRequest.user_id == current_user.id,
        DeletionRequest.status == "pending"
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="A deletion request is already pending.")

    new_request = DeletionRequest(user_id=current_user.id)
    db.add(new_request)
    db.commit()
    
    # Still print to console for visibility
    print(f"\n📧 NEW DELETION REQUEST: {current_user.email}\n")
    
    return {"detail": "Deletion request received. Our team will process it shortly."}
