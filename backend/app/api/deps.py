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
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
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
        # Strict local JWT verification
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"]
        )
            
        user_id = payload.get("sub")
        email = payload.get("email")
        metadata = payload.get("user_metadata", {})
        
        if not user_id:
            raise HTTPException(status_code=403, detail="Invalid token: missing sub")
            
    except (jwt.JWTError, ValidationError) as e:
        import logging
        logging.getLogger(__name__).warning(f"Token validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Could not validate credentials: {str(e)}",
        )
        
    # Check if user exists in our local DB
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    
    # If user doesn't exist locally (e.g., created via Google OAuth), lazy-create them
    if not user:
        user = User(
            id=uuid.UUID(user_id),
            email=email,
            name=metadata.get("full_name", "PhishX User"),
            is_active=True,
            is_verified=True # If they have a valid token, they are verified
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user

def get_optional_user(
    request: Request,
    db: Session = Depends(get_db), 
    token_from_header: Optional[str] = Depends(reusable_oauth2)
) -> Optional[User]:
    token = request.cookies.get("access_token") or token_from_header
    if not token:
        return None
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"]
        )
        user_id = payload.get("sub")
        if not user_id:
            return None
    except Exception:
        return None
        
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
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

from app.api.limiter import RateLimiter
free_scan_limiter = RateLimiter(requests_limit=1, window_seconds=31536000, resource_name="free_scans")

async def check_free_scan_limit(
    request: Request,
    current_user: Optional[User] = Depends(get_optional_user)
):
    if not current_user:
        await free_scan_limiter(request)
