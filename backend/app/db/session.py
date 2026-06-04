import os
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy import create_engine
from app.core.config import settings


class Base(DeclarativeBase):
    pass


def _get_database_url() -> str:
    url = settings.DATABASE_URL
    if url:
        return url
    # Only allow SQLite fallback in explicit local development
    if os.getenv("PHISHX_ENV", "development") == "development":
        return "sqlite:///./phishx_local.db"
    raise RuntimeError(
        "DATABASE_URL is not set. Refusing to start in production without a database."
    )


_db_url = _get_database_url()
_is_sqlite = _db_url.startswith("sqlite")

engine = create_engine(
    _db_url,
    pool_pre_ping=True,
    **({"connect_args": {"check_same_thread": False}} if _is_sqlite else {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_recycle": 300,
    })
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
