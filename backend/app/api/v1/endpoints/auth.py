from datetime import timedelta
from typing import Any
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.models import User
from app.api import deps
from app.core import security
from app.core.config import settings
from app.schemas.token import Token
from app.schemas.user import UserCreate, User as UserSchema

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """OAuth2 compatible token login, get an access token for future requests."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token = security.create_access_token(user.id, secret_key=settings.SUPABASE_JWT_SECRET)
    refresh_token = security.create_refresh_token(user.id, secret_key=settings.SUPABASE_JWT_SECRET)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@router.post("/register", response_model=UserSchema)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    """Register a new user."""
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = User(
        email=user_in.email,
        password_hash=security.get_password_hash(user_in.password),
        name=user_in.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

from fastapi.responses import RedirectResponse

@router.get("/google/login")
def google_login():
    """Redirect to Google Login."""
    # Note: Replace this with your actual Google Client ID from Google Cloud Console
    client_id = settings.GOOGLE_CLIENT_ID
    redirect_uri = f"{settings.FRONTEND_URL}/auth/callback"
    scope = "openid email profile"
    google_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope={scope}"
    )
    return RedirectResponse(google_url)

@router.post("/google/callback")
async def google_callback(
    request: dict,
    db: Session = Depends(deps.get_db)
) -> Any:
    """Handle Real Google OAuth2 callback and return PhishX token."""
    code = request.get("code")
    
    # These should be in your .env file eventually
    client_id = settings.GOOGLE_CLIENT_ID
    client_secret = settings.GOOGLE_CLIENT_SECRET
    redirect_uri = f"{settings.FRONTEND_URL}/auth/callback"
    
    # 1. Exchange code for Google Access Token
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        token_data = token_res.json()
        
        if "error" in token_data:
            print(f"[DEBUG] Google Token Exchange Error: {token_data}")
            raise HTTPException(status_code=400, detail=f"Google authentication failed: {token_data.get('error_description')}")
            
        access_token = token_data.get("access_token")
        
        # 2. Get user info from Google
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        google_user = user_res.json()
        email = google_user.get("email")
        name = google_user.get("name", "Google User")

    # 3. Create or login user in our DB
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=name,
            password_hash="google_oauth_protected",
            is_verified=True,
            subscription_tier="free"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 4. Generate PhishX access token
    phishx_token = security.create_access_token(user.id)
    return {
        "access_token": phishx_token,
        "token_type": "bearer",
    }
