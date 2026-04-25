import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import Base
from app.api.deps import get_db

from sqlalchemy import Column, String, create_engine
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# We must ensure SQLite can handle the PG UUID type by mocking the column type if needed, 
# or by simply ensuring the metadata creation is robust.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

setup_test_db()

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_home():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "PhishX API is running"}

import uuid

def test_user_registration():
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password", "name": "Test User"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert "id" in data

def test_user_login():
    email = f"login_{uuid.uuid4().hex[:8]}@example.com"
    # Register first
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password", "name": "Login User"}
    )
    # Then login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "password"}
    )
    assert response.status_code == 200
    # Now we check if the access_token cookie is set
    assert "access_token" in response.cookies
