import asyncio
import os
import sys

# Ensure we're running from backend folder and can import app modules
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.config import settings
from app.services.tools.phishx_tools import check_virustotal
from app.services.live_ai import generate_live_threat_explanation

def test_virustotal():
    print("Testing VirusTotal API...")
    if not settings.VIRUSTOTAL_API_KEY:
        print("VIRUSTOTAL_API_KEY not found in settings!")
        return False

    res = check_virustotal("https://google.com")
    if res.get("available") or "stats" in res:
        print("VirusTotal check successful:", res)
        return True
    else:
        print("VirusTotal check failed:", res)
        return False

def test_langsmith():
    print("\nTesting LangChain/LangSmith Integration...")
    
    if settings.LANGCHAIN_TRACING_V2:
        print("LANGCHAIN_TRACING_V2 is enabled.")
    else:
        print("LANGCHAIN_TRACING_V2 is disabled or missing.")

    if not settings.LANGCHAIN_API_KEY:
        print("LANGCHAIN_API_KEY not found in settings!")
        return False

    try:
        # Trigger an LLM call which will be traced by LangSmith
        explanation = generate_live_threat_explanation(
            url="http://example-phishing-site.com",
            risk_score=95.0,
            features={"triggered_flags": ["suspicious_domain", "no_https"]}
        )
        print("LangChain response generated successfully:")
        print("--- Response ---")
        print(explanation)
        print("----------------")
        print("Check your LangSmith dashboard to see the new trace!")
        return True
    except Exception as e:
        print("LangChain generation failed:", e)
        return False

if __name__ == "__main__":
    vt_ok = test_virustotal()
    ls_ok = test_langsmith()
    
    if vt_ok and ls_ok:
        print("\nBoth integrations are working perfectly!")
    else:
        print("\nOne or more integrations failed.")
