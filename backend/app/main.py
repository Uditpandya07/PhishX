import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

from app.db.base import Base
from app.db.session import engine
# Auto-creation is disabled in favor of Alembic migrations
# Base.metadata.create_all(bind=engine)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-load the ML model at startup so the first request isn't slow/timed-out."""
    try:
        from app.api.v1.endpoints.scans import get_model
        logger.info("Loading ML model at startup...")
        get_model()
        logger.info("ML model loaded successfully and ready to serve predictions.")
    except Exception as e:
        logger.error(f"Failed to pre-load ML model at startup: {e}")
        # Don't crash the server — model will be loaded lazily on first request
    yield
    # Shutdown
    logger.info("Shutting down PhishX API.")

app = FastAPI(
    lifespan=lifespan,
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Production-grade AI-powered phishing URL detection API",
    version="1.0.0"
)

# Set all CORS enabled origins
origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS] if settings.BACKEND_CORS_ORIGINS else []
if settings.FRONTEND_URL not in origins:
    origins.append(settings.FRONTEND_URL)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def home():
    return {"message": "PhishX API is running"}
