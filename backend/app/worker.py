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
        if user_id:
            scan_db = Scan(
                user_id=user_id,
                url=url,
                prediction=result["prediction"],
                risk_score=result["risk_score"],
                features_json=result["features"]
            )
            db.add(scan_db)
            db.commit()
            db.refresh(scan_db)
            
            result["id"] = str(scan_db.id)

            # --- Slack/Teams Webhook Integration ---
            if result["prediction"] == "Phishing":
                user = db.query(User).filter(User.id == user_id).first()
                if user and user.slack_webhook_url:
                    try:
                        import requests
                        payload = {
                            "text": f"🚨 *PhishX Alert:* A high-risk phishing URL was detected!\n\n"
                                    f"*URL:* {url}\n"
                                    f"*Risk Score:* {result['risk_score']}%\n"
                                    f"*AI Explanation:* {result['features'].get('ai_explanation', 'N/A')}"
                        }
                        requests.post(user.slack_webhook_url, json=payload, timeout=5)
                    except Exception as e:
                        logger.error(f"Failed to send Slack webhook for user {user_id}: {e}")
        else:
            import uuid
            result["id"] = str(uuid.uuid4())
            
        return result
    except Exception as e:
        logger.error(f"Error in Celery background task: {e}")
        return {"error": str(e), "url": url}
    finally:
        db.close()
