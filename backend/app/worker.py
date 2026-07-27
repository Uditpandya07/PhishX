import asyncio
import os
from celery import Celery
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Celery app
celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_always_eager=True if "redis" in settings.REDIS_URL and os.getenv("PHISHX_ENV", "development") == "development" else False
)

# Background task for ML prediction & XAI processing
from typing import Optional

def get_domain_age_from_rdap(domain: str) -> str:
    import httpx
    from datetime import datetime
    
    # Extract base domain to avoid subdomains failing the RDAP lookup
    parts = domain.split('.')
    if len(parts) > 2:
        if len(parts[-2]) <= 3 and parts[-1] in ['uk', 'jp', 'cn', 'br', 'au', 'nz', 'za', 'in']:
            base_domain = '.'.join(parts[-3:])
        else:
            base_domain = '.'.join(parts[-2:])
    else:
        base_domain = domain
        
    try:
        resp = httpx.get(f"https://rdap.org/domain/{base_domain}", timeout=2.0, follow_redirects=True)
        if resp.status_code == 200:
            data = resp.json()
            events = data.get("events", [])
            for event in events:
                if event.get("eventAction") == "registration":
                    reg_date_str = event.get("eventDate")
                    date_part = reg_date_str.split("T")[0]
                    reg_date = datetime.strptime(date_part, "%Y-%m-%d")
                    age_days = (datetime.now() - reg_date).days
                    if age_days < 365:
                        months = max(1, age_days // 30)
                        return f"{months} month(s)"
                    else:
                        years = age_days // 365
                        return f"{years} year(s)"
    except Exception as e:
        logger.warning(f"RDAP lookup failed for {base_domain}: {e}")
    return "Unknown"

@celery_app.task(name="process_url_scan")
def process_url_scan(url: str, user_id: Optional[str] = None):
    """
    Perform deep ML and XAI analysis in the background.
    """
    # Since Celery runs synchronously by default, we need to handle the DB session and sync/async bridges.
    # To keep it simple, we will call a synchronous wrapper for our analysis, or use asyncio.run
    
    # We'll use the existing sync ML model
    from app.api.v1.endpoints.scans import get_model, analyze_url
    from app.services.xai import generate_xai_report
    from app.db.session import SessionLocal
    from app.db.models import Scan, User
    import json
    
    db = SessionLocal()
    try:
        ml_model = get_model()
        
        # ML Analysis
        result = analyze_url(url, ml_model)
        
        # XAI Generation
        explanation = generate_xai_report(
            url=result["url"],
            risk_score=result["risk_score"],
            features=result["features"]
        )
        result["features"]["ai_explanation"] = explanation
        
        # Save to DB
        whois_data_dict = None
        if user_id:
            import uuid as _uuid
            try:
                user_uuid = _uuid.UUID(str(user_id)) if not isinstance(user_id, _uuid.UUID) else user_id
            except Exception:
                user_uuid = user_id
                
            user = db.query(User).filter(User.id == user_uuid).first()
            is_premium = user and user.subscription_tier in ["pro", "enterprise"]
            
            if is_premium:
                from urllib.parse import urlparse
                parsed = urlparse(url)
                domain = parsed.netloc or parsed.path.split('/')[0]
                
                from app.services.feature_extractor import calculate_entropy
                entropy_val = calculate_entropy(domain)
                
                # Heuristics flags trigger
                triggered_flags = []
                import re
                if bool(re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', domain)):
                    triggered_flags.append("IP Address in Domain")
                if "xn--" in domain:
                    triggered_flags.append("Punycode Homograph")
                if any(x in domain for x in ['paypa1', 'goog1e', 'micros0ft', 'yaho0', 'app1e', '1nstagram']):
                    triggered_flags.append("Brand Typosquatting")
                
                cheap_tlds = ['.xyz', '.tk', '.pw', '.top', '.online', '.site', '.club', '.biz', '.info', '.cc', '.ws']
                has_cheap_tld = any(domain.endswith(tld) for tld in cheap_tlds)
                sensitive_words = ['login', 'verify', 'update', 'secure', 'bank', 'account', 'auth', 'cmd', 'admin', 'payment']
                has_sensitive_word = any(word in domain for word in sensitive_words)
                if has_cheap_tld:
                    triggered_flags.append("High-Risk TLD")
                if has_sensitive_word:
                    triggered_flags.append("Sensitive Phishing Keywords")
                if len(domain.split('.')) - 2 >= 3:
                    triggered_flags.append("Excessive Subdomains")
                if '//' in parsed.path:
                    triggered_flags.append("Redirection Slashing")
                
                if not triggered_flags:
                    triggered_flags = ["Heuristic Lexical Check Pass"]
                    
                domain_age = get_domain_age_from_rdap(domain)
                whois_data_dict = {"age": domain_age}
                result["whois_data"] = whois_data_dict
                result["features"]["entropy"] = entropy_val
                result["features"]["triggered_flags"] = triggered_flags
                
            scan_db = Scan(
                user_id=user_uuid,
                url=url,
                prediction=result["prediction"],
                risk_score=result["risk_score"],
                features_json=result["features"],
                whois_data=whois_data_dict
            )
            db.add(scan_db)
            db.commit()
            db.refresh(scan_db)
            
            result["id"] = str(scan_db.id)
            
            # --- Slack/Teams Webhook Integration ---
            if result["prediction"] == "Phishing":
                if user and user.slack_webhook_url:
                    try:
                        from urllib.parse import urlparse
                        webhook_url = str(user.slack_webhook_url).strip()
                        parsed_wh = urlparse(webhook_url)
                        allowed_hosts = ["hooks.slack.com", "outlook.office.com", "outlook.office365.com", "discord.com", "discordapp.com"]
                        if parsed_wh.scheme == "https" and parsed_wh.netloc in allowed_hosts:
                            import requests
                            payload = {
                                "text": f"🚨 *PhishX Alert:* A high-risk phishing URL was detected!\n\n"
                                        f"*URL:* {url}\n"
                                        f"*Risk Score:* {result['risk_score']}%\n"
                                        f"*AI Explanation:* {result['features'].get('ai_explanation', 'N/A')}"
                            }
                            requests.post(webhook_url, json=payload, timeout=5)
                    except Exception as e:
                        logger.error(f"Failed to send Slack webhook for user {user_id}: {e}")
        else:
            import uuid
            result["id"] = str(uuid.uuid4())
            
        return result
    except Exception as e:
        logger.error(f"Error in Celery background task: {e}", exc_info=True)
        return {"error": "Internal analysis error", "url": url}
    finally:
        db.close()
