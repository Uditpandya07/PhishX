from typing import Any, List
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.scan import ScanCreate, ScanResponse, BatchScanCreate, BatchScanResponse, TaskResponse
from app.db.models import User, Scan
import joblib
import os
import re
from urllib.parse import urlparse
from app.core.config import settings
from fastapi.concurrency import run_in_threadpool

from app.services.feature_extractor import extract_features
from app.services.whitelist import TRUSTED_DOMAINS

logger = logging.getLogger(__name__)

router = APIRouter()

# Global model cache
model = None

def get_model():
    global model
    if model is None:
        model_path = settings.MODEL_PATH

        # If not absolute, resolve relative to the working directory
        if not os.path.isabs(model_path):
            model_path = os.path.join(os.getcwd(), model_path)

        if not os.path.exists(model_path):
            raise HTTPException(
                status_code=500,
                detail=f"Machine learning model not found at {model_path}"
            )

        # INTEGRITY CHECK — chunked read to avoid double-loading 198MB into RAM
        import hashlib
        sha256 = hashlib.sha256()
        with open(model_path, 'rb') as f:
            for chunk in iter(lambda: f.read(65536), b''):
                sha256.update(chunk)
        file_hash = sha256.hexdigest()

        if file_hash != settings.EXPECTED_MODEL_HASH:
            logger.critical(f"Model Integrity Violation! Expected={settings.EXPECTED_MODEL_HASH}, Found={file_hash}")
            if os.getenv("STRICT_MODEL_CHECK", "false").lower() == "true":
                raise HTTPException(status_code=500, detail="Security violation: ML model tampered.")

        model = joblib.load(model_path)
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

    # Custom Whitelist for Creator Domains
    is_phishx_app = domain == "phishx.vercel.app" or domain.endswith(".phishx.vercel.app")
    is_phishtra = domain == "phishtra.vercel.app" or domain.endswith(".phishtra.vercel.app") or domain == "uditpandya07.github.io"
    is_udit_domain = domain == "uditpandya.vercel.app" or domain.endswith(".uditpandya.vercel.app")
    
    if is_phishx_app or is_phishtra or is_udit_domain:
        return {
            "url": url, 
            "prediction": "Safe", 
            "risk_score": 0.0, 
            "features": {
                "top_10k_whitelist": True,
                "is_phishx_app": is_phishx_app,
                "is_creator_domain": True
            }
        }

    # 100% FREE PERMANENT FIX: Check Offline Top 10k List
    try:
        from app.services.top_10k import TOP_10K_DOMAINS
        if domain in TOP_10K_DOMAINS:
            return {"url": url, "prediction": "Safe", "risk_score": 0.0, "features": {"top_10k_whitelist": True}}
    except ImportError:
        pass

    if domain in SAFE_WHITELIST:
        return {"url": url, "prediction": "Safe", "risk_score": 0.0, "features": {}}

    # --- ENHANCED SEMANTIC RULES (Zero-RAM High Accuracy) ---
    # 1. Raw IP address instead of domain
    is_ip = bool(re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', domain))
    
    # 2. Punycode (homograph attacks like "googlė.com" -> "xn--")
    is_punycode = "xn--" in domain
    
    # 3. Suspicious Keywords in Path/Domain
    sensitive_words = ['login', 'verify', 'update', 'admin', 'secure', 'bank', 'account', 'auth', 'payment', 'wallet', 'credential']
    has_sensitive_word = any(word in domain for word in sensitive_words)
    
    # 4. Abused Free/Cheap TLDs
    cheap_tlds = ['.xyz', '.tk', '.pw', '.top', '.online', '.site', '.club', '.biz', '.info', '.cc', '.ws']
    has_cheap_tld = any(domain.endswith(tld) for tld in cheap_tlds)
    
    # 5. Suspicious Subdomains (e.g. login.paypal.com.scam.net)
    subdomain_count = len(domain.split('.')) - 2
    excessive_subdomains = subdomain_count >= 3
    
    # 6. Typosquatting patterns (very basic check for common replacements)
    typosquatting = any(x in domain for x in ['paypa1', 'goog1e', 'micros0ft', 'yaho0', 'app1e', '1nstagram'])
    
    # Evaluate Rules
    risk_score = 0.0
    if is_ip: risk_score = max(risk_score, 99.0)
    if is_punycode: risk_score = max(risk_score, 95.0)
    if typosquatting: risk_score = max(risk_score, 98.0)
    if has_cheap_tld and has_sensitive_word: risk_score = max(risk_score, 90.0)
    if excessive_subdomains and has_sensitive_word: risk_score = max(risk_score, 85.0)
    if '//' in parsed.path: risk_score = max(risk_score, 80.0)

    if risk_score >= 80.0:
        return {"url": url, "prediction": "Phishing", "risk_score": risk_score, "features": {"semantic_rule_trigger": True}}

    # --- LIVE CONTENT ANALYSIS LAYER ---
    import httpx
    try:
        with httpx.Client(timeout=3.0, verify=False, follow_redirects=True) as client:
            response = client.get(normalized_url)
            html = response.text.lower()
            
            # Check for credential harvesting
            if 'type="password"' in html or "type='password'" in html:
                if has_cheap_tld or not normalized_url.startswith("https://"):
                    risk_score = max(risk_score, 85.0)
            
            # Very basic brand impersonation check
            if "<title>" in html:
                title_start = html.find("<title>") + 7
                title_end = html.find("</title>")
                if title_end > title_start:
                    title = html[title_start:title_end]
                    major_brands = ["paypal", "microsoft", "google", "apple", "facebook", "amazon", "netflix", "bank of america", "chase", "wellsfargo"]
                    for brand in major_brands:
                        if brand in title and brand not in domain:
                            risk_score = max(risk_score, 90.0)
                            
            if risk_score >= 80.0:
                return {"url": url, "prediction": "Phishing", "risk_score": risk_score, "features": {"live_analysis_trigger": True}}
    except Exception as e:
        # Failsafe: if the site is down, blocks our bot, or times out, proceed to ML analysis
        import logging
        logging.getLogger(__name__).warning(f"Live analysis failed for {url}: {e}")


    try:
        from app.services.feature_extractor import extract_features
        features = extract_features(normalized_url)
        prediction = model_instance.predict([features])[0]
        
        # Determine the index of the 'Phishing' class dynamically
        classes = list(model_instance.classes_)
        if "Phishing" in classes:
            phish_idx = classes.index("Phishing")
            is_phishing = prediction == "Phishing"
        elif 1 in classes:
            phish_idx = classes.index(1)
            is_phishing = prediction == 1
        else:
            phish_idx = 1
            is_phishing = prediction == 1
        
        probability = model_instance.predict_proba([features])[0][phish_idx]
        
        if probability >= 0.70:
            final_prediction = "Phishing"
        elif probability >= 0.40:
            final_prediction = "Suspicious"
        else:
            final_prediction = "Safe"
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Error: {str(e)}")

    return {
        "url": url,
        "prediction": final_prediction,
        "risk_score": float(round(probability * 100, 2)),
        "features": {"extracted_features": features}
    }

from app.api.limiter import scan_limiter

@router.post("/predict", response_model=TaskResponse, dependencies=[Depends(scan_limiter)])
async def predict_url(
    *,
    db: Session = Depends(deps.get_db),
    scan_in: ScanCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Predict if a URL is phishing or safe using a background Celery task."""
    try:
        from app.worker import process_url_scan
        
        # Dispatch to celery queue
        task = process_url_scan.delay(scan_in.url, current_user.id)
        
        return {
            "task_id": task.id,
            "status": "QUEUED",
            "message": "Scan dispatched to background worker"
        }
    except Exception as e:
        logger.error(f"Prediction Dispatch Error: {e}", exc_info=True)
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
