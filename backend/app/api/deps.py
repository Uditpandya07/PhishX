from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.config import settings
from app.db.models import User
import uuid

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    request: Request,
    db: Session = Depends(get_db), 
    token_from_header: Optional[str] = Depends(reusable_oauth2)
) -> User:
    token = request.cookies.get("access_token") or token_from_header
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        # Use Supabase JWT Secret to decode
        payload = jwt.decode(
            token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"], 
            audience="authenticated" # Supabase default audience
        )
        user_id = payload.get("sub")
        email = payload.get("email")
        metadata = payload.get("user_metadata", {})
        
        if not user_id:
            raise HTTPException(status_code=403, detail="Invalid token")
            
    except (jwt.JWTError, ValidationError) as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Could not validate credentials: {e}",
        )
        
    # Check if user exists in our local DB
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    
    # Lazy-create user if they exist in Supabase but not in our DB yet
    if not user:
        user = User(
            id=uuid.UUID(user_id),
            email=email,
            name=metadata.get("full_name", "Supabase User"),
            is_active=True,
            is_verified=True # If they have a valid token, they are verified
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user
