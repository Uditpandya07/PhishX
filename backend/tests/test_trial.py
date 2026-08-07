import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_db
from app.db.session import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_trial.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
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

def test_request_trial_otp_success():
    response = client.post(
        "/api/v1/trial/request-otp",
        json={
            "name": "Test User",
            "email": "valid.user@example.com",
            "consent": True,
            "device_uuid": "dev_test_123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "Verification OTP code sent" in data["message"]
    assert "dev_otp_code" in data or "email" in data

def test_request_trial_otp_disposable_email_blocked():
    response = client.post(
        "/api/v1/trial/request-otp",
        json={
            "name": "Spammer",
            "email": "test@tempmail.com",
            "consent": True
        }
    )
    assert response.status_code == 400
    assert "disposable" in response.json()["detail"].lower()

def test_verify_trial_otp_success():
    # 1. Request OTP
    req_resp = client.post(
        "/api/v1/trial/request-otp",
        json={
            "name": "Verify User",
            "email": "verify.user@example.com",
            "consent": True,
            "device_uuid": "dev_verify_456"
        }
    )
    data = req_resp.json()
    otp_code = data.get("dev_otp_code")
    if not otp_code:
        pytest.skip("No dev_otp_code returned")

    # 2. Verify OTP
    verify_resp = client.post(
        "/api/v1/trial/verify-otp",
        json={
            "email": "verify.user@example.com",
            "otp_code": otp_code,
            "device_uuid": "dev_verify_456"
        }
    )
    assert verify_resp.status_code == 200
    val = verify_resp.json()
    assert "trial_token" in val
    assert val["days_remaining"] == 15

def test_get_trial_status():
    status_resp = client.get("/api/v1/trial/status?device_uuid=dev_verify_456")
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "active"
