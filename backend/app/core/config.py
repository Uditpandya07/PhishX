import secrets
from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, EmailStr, PostgresDsn, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PhishX"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super-secret-key-please-change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BACKEND_URL: str = "http://localhost:8000"
    
    @property
    def API_V1_STR_FULL(self) -> str:
        return f"{self.BACKEND_URL}{self.API_V1_STR}"
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database
    DATABASE_URL: Optional[str] = None
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "phishx"
    
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # Stripe
    STRIPE_API_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PRO_PLAN_ID: Optional[str] = None
    STRIPE_ENTERPRISE_PLAN_ID: Optional[str] = None

    # Email
    SENDGRID_API_KEY: Optional[str] = None

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Model Integrity
    EXPECTED_MODEL_HASH: str = "5d1d2d16fabd7ad78a9896cb3dfe5855c622cdccdedcfefe70d47f434c55d899"
    MODEL_PATH: str = "model/phishing_model.pkl" # Relative to project root or absolute

    # Sentry
    SENTRY_DSN: Optional[str] = None

    class Config:
        case_sensitive = True
        env_file = "../.env"

settings = Settings()
