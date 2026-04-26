from datetime import timedelta
from typing import Any
import httpx
import uuid
from jose import jwt
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.models import User
from app.api import deps
from app.core import security
from app.core.config import settings
from app.schemas.token import Token
from app.schemas.user import UserCreate, User as UserSchema

router = APIRouter()

@router.post("/logout")
def logout(response: Response):
    """Clear the authentication cookie."""
    response.delete_cookie(key="access_token", httponly=True, secure=True, samesite="lax")
    return {"message": "Logged out successfully"}

@router.get("/verify")
def verify_email(token: str, db: Session = Depends(deps.get_db)):
    """Verify a user's email address using a token."""
    try:
        payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid verification token")
        
        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        user.is_verified = True
        db.commit()
        
        # Redirect to frontend with a success message
        return RedirectResponse(f"{settings.FRONTEND_URL}?verified=true")
    except Exception as e:
        return RedirectResponse(f"{settings.FRONTEND_URL}?error=verification_failed")

from app.api.limiter import auth_limiter

@router.post("/login", dependencies=[Depends(auth_limiter)])
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """OAuth2 compatible token login, get an access token for future requests."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token = security.create_access_token(
        user.id, 
        secret_key=settings.SUPABASE_JWT_SECRET,
        extra_claims={"email": user.email}
    )
    
    # Return JSON with token and user info, while also setting the cookie
    return_data = {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Login successful",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "subscription_tier": user.subscription_tier,
            "is_superuser": user.is_superuser
        }
    }
    
    from fastapi.responses import JSONResponse
    response = JSONResponse(content=return_data)
    response.set_cookie(
        key="access_token", 
        value=access_token, 
        httponly=True, 
        secure=True, 
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    return response

@router.post("/register", response_model=UserSchema, dependencies=[Depends(auth_limiter)])
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
        is_verified=False # Start unverified
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Send verification email if SendGrid is configured
    from app.services.email import email_service
    # Generate a temporary verification token (reusing the access token logic for simplicity)
    verify_token = security.create_access_token(user.id, expires_delta=timedelta(hours=24))
    email_service.send_verification_email(user.email, user.name, verify_token)
    
    return user

from fastapi.responses import RedirectResponse

@router.get("/google/login")
def google_login():
    """Redirect to Google Login."""
    # Note: Replace this with your actual Google Client ID from Google Cloud Console
    client_id = settings.GOOGLE_CLIENT_ID
    redirect_uri = f"{settings.API_V1_STR_FULL}/auth/callback"
    scope = "openid email profile"
    google_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope={scope}"
    )
    return RedirectResponse(google_url)

@router.get("/callback")
async def google_callback(
    code: str,
    db: Session = Depends(deps.get_db)
) -> Any:
    """Handle Google OAuth2 callback, set cookie, and redirect to frontend."""
    
    # These should be in your .env file eventually
    client_id = settings.GOOGLE_CLIENT_ID
    client_secret = settings.GOOGLE_CLIENT_SECRET
    # IMPORTANT: This MUST match the redirect_uri sent to Google in the first step
    redirect_uri = f"{settings.API_V1_STR_FULL}/auth/callback"
    
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
            return RedirectResponse(f"{settings.FRONTEND_URL}?error=google_auth_failed")
            
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
    phishx_token = security.create_access_token(
        user.id, 
        secret_key=settings.SUPABASE_JWT_SECRET,
        extra_claims={"email": user.email}
    )
    
    # 5. Redirect to frontend with the cookie set
    response = RedirectResponse(url=settings.FRONTEND_URL)
    response.set_cookie(
        key="access_token", 
        value=phishx_token, 
        httponly=True, 
        secure=True, 
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    return response
