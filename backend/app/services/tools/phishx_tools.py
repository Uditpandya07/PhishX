"""
PhishX LangChain Agent Tools
=============================
Decorated @tool functions that give the PhishX AI the ability to
actively investigate URLs rather than just describe threats from context.

Tools included:
  - scan_url_ml      : Run the local RandomForest model on a URL
  - check_virustotal : Query VirusTotal API (requires VIRUSTOTAL_API_KEY in .env)
  - lookup_whois     : Fetch WHOIS registration data (domain age, registrar)
  - fetch_page_title : Lightweight HTML title grab for brand impersonation check

Usage (for future agentic executor):
    from app.services.tools.phishx_tools import ALL_TOOLS
    agent = create_tool_calling_agent(llm, ALL_TOOLS, prompt)
    executor = AgentExecutor(agent=agent, tools=ALL_TOOLS)
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tool 1 — Local ML Scanner
# ---------------------------------------------------------------------------

def scan_url_ml(url: str) -> dict:
    """
    Scan a URL using the PhishX RandomForest ML model.
    Returns risk_score (0-100), prediction label, and extracted features.
    Use this to get an objective ML-based threat score for any URL.
    """
    try:
        import joblib
        import os
        from app.services.feature_extractor import extract_features
        from app.core.config import settings

        model_path = settings.MODEL_PATH
        if not os.path.isabs(model_path):
            model_path = os.path.join(os.getcwd(), model_path)

        model = joblib.load(model_path)
        features = extract_features(url)

        classes = list(model.classes_)
        phish_idx = classes.index("Phishing") if "Phishing" in classes else (classes.index(1) if 1 in classes else 1)
        probability = model.predict_proba([features])[0][phish_idx]
        risk_score = float(round(probability * 100, 2))

        if probability >= 0.70:
            prediction = "Phishing"
        elif probability >= 0.40:
            prediction = "Suspicious"
        else:
            prediction = "Safe"

        return {"risk_score": risk_score, "prediction": prediction, "features": features}
    except Exception as e:
        logger.error(f"scan_url_ml error: {e}")
        return {"error": str(e), "risk_score": 50.0, "prediction": "Unknown"}


# ---------------------------------------------------------------------------
# Tool 2 — VirusTotal Reputation Check
# ---------------------------------------------------------------------------

def check_virustotal(url: str) -> dict:
    """
    Check a URL's reputation against VirusTotal threat intelligence database.
    Returns the number of security vendors that flagged this URL as malicious.
    Requires VIRUSTOTAL_API_KEY to be set in .env (free tier available at virustotal.com).
    """
    try:
        from app.core.config import settings
        import httpx
        import base64

        api_key = settings.VIRUSTOTAL_API_KEY
        if not api_key:
            return {
                "available": False,
                "message": "VirusTotal API key not configured. Add VIRUSTOTAL_API_KEY to .env (free at virustotal.com).",
            }

        # VirusTotal URL ID = base64url-encoded URL without padding
        url_id = base64.urlsafe_b64encode(url.encode()).decode().rstrip("=")
        headers = {"x-apikey": api_key}

        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                f"https://www.virustotal.com/api/v3/urls/{url_id}",
                headers=headers,
            )

        if response.status_code == 404:
            # Submit URL for analysis if not cached
            with httpx.Client(timeout=10.0) as client:
                submit = client.post(
                    "https://www.virustotal.com/api/v3/urls",
                    headers=headers,
                    data={"url": url},
                )
            return {"available": True, "status": "submitted_for_analysis", "url": url}

        if response.status_code != 200:
            return {"available": False, "error": f"VirusTotal API error: {response.status_code}"}

        data = response.json()
        stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
        malicious = stats.get("malicious", 0)
        suspicious = stats.get("suspicious", 0)
        total = sum(stats.values()) or 1

        return {
            "available": True,
            "malicious_vendors": malicious,
            "suspicious_vendors": suspicious,
            "total_vendors": total,
            "threat_percentage": round((malicious + suspicious) / total * 100, 1),
            "verdict": "malicious" if malicious > 3 else ("suspicious" if suspicious > 3 else "clean"),
        }
    except Exception as e:
        logger.error(f"check_virustotal error: {e}")
        return {"available": False, "error": str(e)}


# ---------------------------------------------------------------------------
# Tool 3 — WHOIS Domain Lookup
# ---------------------------------------------------------------------------

def lookup_whois(domain: str) -> dict:
    """
    Look up WHOIS registration data for a domain.
    Returns domain age, registrar, creation date, and expiry date.
    Newly registered domains (< 30 days) are a strong phishing indicator.
    """
    try:
        import whois
        from datetime import datetime, timezone

        w = whois.whois(domain)
        creation_date = w.creation_date
        if isinstance(creation_date, list):
            creation_date = creation_date[0]

        expiry_date = w.expiration_date
        if isinstance(expiry_date, list):
            expiry_date = expiry_date[0]

        age_days = None
        is_newly_registered = False
        if creation_date:
            if creation_date.tzinfo is None:
                creation_date = creation_date.replace(tzinfo=timezone.utc)
            age_days = (datetime.now(timezone.utc) - creation_date).days
            is_newly_registered = age_days < 30

        return {
            "domain": w.domain_name,
            "registrar": w.registrar,
            "creation_date": str(creation_date) if creation_date else None,
            "expiry_date": str(expiry_date) if expiry_date else None,
            "age_days": age_days,
            "is_newly_registered": is_newly_registered,
            "country": w.country,
            "phishing_risk_factor": "HIGH — domain registered within 30 days" if is_newly_registered else "NORMAL",
        }
    except Exception as e:
        logger.error(f"lookup_whois error for {domain}: {e}")
        return {"error": str(e), "domain": domain}


# ---------------------------------------------------------------------------
# Tool 4 — Page Title Fetcher (Brand Impersonation Check)
# ---------------------------------------------------------------------------

def fetch_page_title(url: str) -> dict:
    """
    Fetch the HTML title of a web page to detect brand impersonation.
    Returns the page title and a flag if it contains a well-known brand name
    while the domain does not belong to that brand.
    """
    try:
        import httpx
        from urllib.parse import urlparse

        parsed = urlparse(url if "://" in url else f"https://{url}")
        domain = parsed.netloc.lstrip("www.")

        with httpx.Client(timeout=3.0, verify=False, follow_redirects=True) as client:
            resp = client.get(url, headers={"User-Agent": "Mozilla/5.0 PhishX-Scanner/3.0"})
            html = resp.text.lower()

        title = ""
        if "<title>" in html:
            start = html.find("<title>") + 7
            end = html.find("</title>")
            if end > start:
                title = html[start:end].strip()

        major_brands = [
            "paypal", "microsoft", "google", "apple", "facebook",
            "amazon", "netflix", "bank of america", "chase", "wellsfargo",
            "instagram", "twitter", "linkedin", "dropbox", "docusign",
        ]
        impersonated_brands = [b for b in major_brands if b in title and b not in domain]

        return {
            "title": title[:200],
            "domain": domain,
            "impersonated_brands": impersonated_brands,
            "brand_impersonation_detected": len(impersonated_brands) > 0,
            "status_code": resp.status_code,
        }
    except Exception as e:
        logger.error(f"fetch_page_title error for {url}: {e}")
        return {"error": str(e), "url": url}


# ---------------------------------------------------------------------------
# LangChain @tool decorated versions (for use in AgentExecutor)
# ---------------------------------------------------------------------------

def _make_lc_tools():
    """Lazily create LangChain tool wrappers to avoid import errors at module load."""
    try:
        from langchain_core.tools import tool as lc_tool

        scan_url_ml_tool = lc_tool(scan_url_ml)
        check_virustotal_tool = lc_tool(check_virustotal)
        lookup_whois_tool = lc_tool(lookup_whois)
        fetch_page_title_tool = lc_tool(fetch_page_title)

        return [scan_url_ml_tool, check_virustotal_tool, lookup_whois_tool, fetch_page_title_tool]
    except ImportError:
        logger.warning("langchain-core not available; LangChain tool wrappers skipped.")
        return []


# Exported list of all LangChain-wrapped tools
ALL_TOOLS = _make_lc_tools()