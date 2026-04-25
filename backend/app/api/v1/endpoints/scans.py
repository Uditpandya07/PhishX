from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.scan import ScanCreate, ScanResponse, BatchScanCreate, BatchScanResponse
from app.db.models import User, Scan
import joblib
import os
import re
from urllib.parse import urlparse

# Wait, instead of importing feature_extractor here, we should put it in services
from app.services.feature_extractor import extract_features
from app.services.whitelist import TRUSTED_DOMAINS

router = APIRouter()

# Global model cache
model = None

def get_model():
    global model
    if model is None:
        # Construct path to the model file (up 5 levels from endpoints to root)
        model_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..', 'model', 'phishing_model.pkl')
        try:
            model = joblib.load(model_path)
        except FileNotFoundError:
            raise HTTPException(status_code=500, detail="Machine learning model not found.")
    return model

SAFE_WHITELIST = TRUSTED_DOMAINS

def analyze_url(url: str, model_instance) -> dict:
    raw_url = url.strip().lower()
    if not raw_url.startswith("http://") and not raw_url.startswith("https://"):
        normalized_url = "https://" + raw_url
    else:
        normalized_url = raw_url

    parsed = urlparse(normalized_url)
    domain = parsed.netloc
    if domain.startswith("www."):
        domain = domain[4:]

    if domain in SAFE_WHITELIST:
        return {"url": url, "prediction": "Safe", "risk_score": 0.0, "features": {}}

    bad_indicators = [
        re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', domain),
        '//' in parsed.path,
        (len(raw_url) > 50 and any(x in raw_url for x in ['login', 'verify', 'update', 'admin', 'secure', 'bank', 'account'])),
        any(domain.endswith(tld) for tld in ['.xyz', '.tk', '.pw', '.top', '.online', '.site'])
    ]

    if any(bad_indicators):
        return {"url": url, "prediction": "Phishing", "risk_score": 98.0, "features": {"manual_override": True}}

    try:
        from app.services.feature_extractor import extract_features
        features = extract_features(normalized_url)
        prediction = model_instance.predict([features])[0]
        probability = model_instance.predict_proba([features])[0][1]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Error: {str(e)}")

    return {
        "url": url,
        "prediction": "Phishing" if prediction == 1 else "Safe",
        "risk_score": float(round(probability * 100, 2)),
        "features": {"extracted_features": features}
    }

@router.post("/predict", response_model=ScanResponse)
def predict_url(
    *,
    db: Session = Depends(deps.get_db),
    scan_in: ScanCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Predict if a URL is phishing or safe."""
    try:
        ml_model = get_model()
        
        # Analyze
        result = analyze_url(scan_in.url, ml_model)
        
        # Save to DB
        scan = Scan(
            user_id=current_user.id,
            url=scan_in.url,
            prediction=result["prediction"],
            risk_score=result["risk_score"],
            features_json=result["features"]
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
        return scan
    except Exception as e:
        print(f"Prediction Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal analysis engine error. Please try again later.")

@router.get("/history", response_model=List[ScanResponse])
def get_scan_history(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Get scan history for current user."""
    scans = db.query(Scan).filter(Scan.user_id == current_user.id).order_by(Scan.timestamp.desc()).offset(skip).limit(limit).all()
    return scans

@router.get("/", response_model=List[ScanResponse])
def get_all_scans(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Get all scans (Admin only)."""
    scans = db.query(Scan).order_by(Scan.timestamp.desc()).offset(skip).limit(limit).all()
    return scans

@router.delete("/me")
def delete_my_scans(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Delete all scan history for the current user."""
    try:
        db.query(Scan).filter(Scan.user_id == current_user.id).delete()
        db.commit()
        return {"detail": "History cleared successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {str(e)}")
