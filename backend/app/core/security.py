from datetime import datetime, timedelta
from typing import Any, Union, Optional
from jose import jwt
import bcrypt
from app.core.config import settings

def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None, secret_key: Optional[str] = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    key = secret_key or settings.SECRET_KEY
    encoded_jwt = jwt.encode(to_encode, key, algorithm="HS256")
    return encoded_jwt

def create_refresh_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None, secret_key: Optional[str] = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    key = secret_key or settings.SECRET_KEY
    encoded_jwt = jwt.encode(to_encode, key, algorithm="HS256")
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
