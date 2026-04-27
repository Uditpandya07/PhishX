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
from app.core.config import settings
from fastapi.concurrency import run_in_threadpool

# Wait, instead of importing feature_extractor here, we should put it in services
from app.services.feature_extractor import extract_features
from app.services.whitelist import TRUSTED_DOMAINS

router = APIRouter()

# Global model cache
model = None

def get_model():
    global model
    if model is None:
        # Resolve path - allow absolute or relative to root
        if os.path.isabs(settings.MODEL_PATH):
            model_path = settings.MODEL_PATH
        else:
            # Assume relative to project root
            # This is a more robust way to find the model file
            root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
            model_path = os.path.join(root_dir, settings.MODEL_PATH)
        
        # INTEGRITY CHECK
        import hashlib
        try:
            with open(model_path, 'rb') as f:
                content = f.read()
                file_hash = hashlib.sha256(content).hexdigest()
                
                # Check against configured hash
                if file_hash != settings.EXPECTED_MODEL_HASH:
                    # In dev, we might have a different model, so we log warning but don't halt 
                    # unless it's a known production-critical mismatch
                    print(f"CRITICAL: Model Integrity Violation! Found: {file_hash}")
                    if os.getenv("STRICT_MODEL_CHECK", "False").lower() == "true":
                        raise HTTPException(status_code=500, detail="Security violation: ML model tampered.")
            
            model = joblib.load(model_path)
        except FileNotFoundError:
            # Fallback for local development if the path above is slightly off
            alt_path = os.path.join(os.getcwd(), settings.MODEL_PATH)
            if os.path.exists(alt_path):
                model = joblib.load(alt_path)
            else:
                raise HTTPException(status_code=500, detail=f"Machine learning model not found at {model_path}")
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
        
        # Determine the index of the 'Phishing' class dynamically
        classes = list(model_instance.classes_)
        # We assume the label is either "Phishing" or 1
        phish_idx = classes.index("Phishing") if "Phishing" in classes else (classes.index(1) if 1 in classes else 1)
        
        probability = model_instance.predict_proba([features])[0][phish_idx]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Error: {str(e)}")

    return {
        "url": url,
        "prediction": "Phishing" if prediction == 1 else "Safe",
        "risk_score": float(round(probability * 100, 2)),
        "features": {"extracted_features": features}
    }

from app.api.limiter import scan_limiter

@router.post("/predict", response_model=ScanResponse, dependencies=[Depends(scan_limiter)])
async def predict_url(
    *,
    db: Session = Depends(deps.get_db),
    scan_in: ScanCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Predict if a URL is phishing or safe."""
    try:
        ml_model = get_model()
        
        # Analyze - run CPU intensive task in threadpool
        result = await run_in_threadpool(analyze_url, scan_in.url, ml_model)
        
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

@router.delete("/{scan_id}")
def delete_scan(
    scan_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Delete a specific scan from history."""
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found or unauthorized")
    
    db.delete(scan)
    db.commit()
    return {"detail": "Scan deleted successfully"}
