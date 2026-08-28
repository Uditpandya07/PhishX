"""
PhishX Threat Analysis Graph — LangGraph Edition
================================================
A stateful multi-node threat analysis pipeline that replaces the monolithic
analyze_url() function. Each node is a focused, testable unit of work:

  [url_normalizer]
       |
       v
  [whitelist_check]  --> SAFE (short-circuit)
       |
       v
  [semantic_rules]   --> HIGH RISK (short-circuit if score >= 80)
       |
       v
  [ml_classifier]
       |
       +-- Suspicious/Phishing --> [live_content_check] --> [ai_explainer]
       |
       +-- Safe ----------------> [ai_explainer]
       |
       v
  [report_finalizer]
"""

import logging
import os
import re
from typing import TypedDict, Optional, List
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# State Schema
# ---------------------------------------------------------------------------

class ThreatState(TypedDict):
    """The shared state object passed between LangGraph nodes."""
    url: str
    normalized_url: str
    domain: str
    # Whitelist / shortcut flags
    is_whitelisted: bool
    # Semantic rule output
    semantic_risk_score: float
    semantic_triggered: bool
    # ML classifier output
    ml_risk_score: float
    ml_prediction: str          # "Safe" | "Suspicious" | "Phishing"
    ml_features: dict
    # Live content check
    live_risk_score: float
    live_triggered: bool
    # AI explanation (from LangChain / Gemini)
    ai_explanation: str
    # Final verdict
    final_prediction: str       # "Safe" | "Suspicious" | "Phishing"
    final_risk_score: float
    final_features: dict
    # Routing control
    route: str                  # "whitelist" | "semantic_block" | "ml"


# ---------------------------------------------------------------------------
# Helper utilities (shared across nodes)
# ---------------------------------------------------------------------------

def _normalize_url(url: str) -> tuple[str, str]:
    """Returns (normalized_url, domain)."""
    raw = url.strip().lower()
    if not raw.startswith("http://") and not raw.startswith("https://"):
        normalized = "https://" + raw
    else:
        normalized = raw
    parsed = urlparse(normalized)
    domain = parsed.netloc
    if domain.startswith("www."):
        domain = domain[4:]
    return normalized, domain


def _is_system_page(url: str) -> bool:
    system_prefixes = [
        "chrome://", "chrome-extension://", "edge://",
        "about:", "file://", "moz-extension://", "view-source:",
    ]
    return any(url.startswith(p) for p in system_prefixes)


# ---------------------------------------------------------------------------
# Node 1 — URL Normalizer
# ---------------------------------------------------------------------------

def url_normalizer_node(state: ThreatState) -> ThreatState:
    """Normalizes the raw URL and extracts the base domain."""
    url = state["url"]
    normalized, domain = _normalize_url(url)
    return {**state, "normalized_url": normalized, "domain": domain}


# ---------------------------------------------------------------------------
# Node 2 — Whitelist Check
# ---------------------------------------------------------------------------

def whitelist_check_node(state: ThreatState) -> ThreatState:
    """
    Checks system pages, creator domains, and the top-10k trusted domain list.
    Sets is_whitelisted=True and short-circuits the graph if matched.
    """
    url = state["url"]
    domain = state["domain"]

    # System pages (chrome://, about:, etc.)
    if _is_system_page(url.strip().lower()):
        return {
            **state,
            "is_whitelisted": True,
            "final_prediction": "Safe",
            "final_risk_score": 0.0,
            "final_features": {"system_page_whitelist": True},
            "route": "whitelist",
        }

    # Creator / app domains
    creator_domains = [
        "phishx.vercel.app", "phishx-app.vercel.app", "phishx.io",
        "phishtra.vercel.app", "uditpandya07.github.io", "uditpandya.vercel.app",
    ]
    is_creator = (
        domain in creator_domains
        or any(domain.endswith("." + d) for d in creator_domains)
        or domain.startswith("localhost")
        or domain.startswith("127.0.0.1")
    )
    if is_creator:
        return {
            **state,
            "is_whitelisted": True,
            "final_prediction": "Safe",
            "final_risk_score": 0.0,
            "final_features": {"top_10k_whitelist": True, "is_creator_domain": True},
            "route": "whitelist",
        }

    # Top-10k list
    try:
        from app.services.top_10k import TOP_10K_DOMAINS
        if domain in TOP_10K_DOMAINS:
            return {
                **state,
                "is_whitelisted": True,
                "final_prediction": "Safe",
                "final_risk_score": 0.0,
                "final_features": {"top_10k_whitelist": True},
                "route": "whitelist",
            }
    except ImportError:
        pass

    # Built-in whitelist
    try:
        from app.services.whitelist import TRUSTED_DOMAINS
        if domain in TRUSTED_DOMAINS:
            return {
                **state,
                "is_whitelisted": True,
                "final_prediction": "Safe",
                "final_risk_score": 0.0,
                "final_features": {},
                "route": "whitelist",
            }
    except ImportError:
        pass

    return {**state, "is_whitelisted": False, "route": "semantic"}


# ---------------------------------------------------------------------------
# Node 3 — Semantic Rules
# ---------------------------------------------------------------------------

def semantic_rules_node(state: ThreatState) -> ThreatState:
    """
    Applies fast, zero-ML heuristic rules (IP addresses, punycode, typosquatting,
    cheap TLDs with sensitive keywords, etc.).
    Sets route='semantic_block' if risk >= 80, otherwise route='ml'.
    """
    domain = state["domain"]
    normalized_url = state["normalized_url"]
    parsed = urlparse(normalized_url)

    is_ip = bool(re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", domain))
    is_punycode = "xn--" in domain
    sensitive_words = [
        "login", "verify", "update", "admin", "secure", "bank",
        "account", "auth", "payment", "wallet", "credential",
    ]
    has_sensitive_word = any(w in domain for w in sensitive_words)
    cheap_tlds = [".xyz", ".tk", ".pw", ".top", ".online", ".site", ".club", ".biz", ".info", ".cc", ".ws"]
    has_cheap_tld = any(domain.endswith(t) for t in cheap_tlds)
    subdomain_count = len(domain.split(".")) - 2
    excessive_subdomains = subdomain_count >= 3
    typosquatting = any(
        x in domain
        for x in ["paypa1", "goog1e", "g00gle", "micros0ft", "yaho0", "app1e", "1nstagram"]
    )

    risk_score = 0.0
    if is_ip:
        risk_score = max(risk_score, 99.0)
    if is_punycode:
        risk_score = max(risk_score, 95.0)
    if typosquatting:
        risk_score = max(risk_score, 98.0)
    if has_cheap_tld and has_sensitive_word:
        risk_score = max(risk_score, 90.0)
    if excessive_subdomains and has_sensitive_word:
        risk_score = max(risk_score, 85.0)
    if "//" in parsed.path:
        risk_score = max(risk_score, 80.0)

    if risk_score >= 80.0:
        return {
            **state,
            "semantic_risk_score": risk_score,
            "semantic_triggered": True,
            "final_prediction": "Phishing",
            "final_risk_score": risk_score,
            "final_features": {"semantic_rule_trigger": True},
            "route": "semantic_block",
        }

    return {
        **state,
        "semantic_risk_score": risk_score,
        "semantic_triggered": False,
        "route": "ml",
    }


# ---------------------------------------------------------------------------
# Node 4 — ML Classifier
# ---------------------------------------------------------------------------

def ml_classifier_node(state: ThreatState) -> ThreatState:
    """
    Runs the phishing_model.pkl RandomForest classifier on extracted URL features.
    """
    normalized_url = state["normalized_url"]
    try:
        from app.core.ml_cache import get_ml_model
        from app.services.feature_extractor import extract_features

        model = get_ml_model()
        features = extract_features(normalized_url)

        classes = list(model.classes_)
        if "Phishing" in classes:
            phish_idx = classes.index("Phishing")
        elif 1 in classes:
            phish_idx = classes.index(1)
        else:
            phish_idx = 1

        probability = model.predict_proba([features])[0][phish_idx]

        if probability >= 0.70:
            prediction = "Phishing"
        elif probability >= 0.40:
            prediction = "Suspicious"
        else:
            prediction = "Safe"

        risk_score = float(round(probability * 100, 2))

        # Route suspicious/phishing URLs to live content check
        next_route = "live_content" if prediction in ("Suspicious", "Phishing") else "explain"

        return {
            **state,
            "ml_risk_score": risk_score,
            "ml_prediction": prediction,
            "ml_features": {"extracted_features": features},
            "final_prediction": prediction,
            "final_risk_score": risk_score,
            "final_features": {"extracted_features": features},
            "route": next_route,
        }
    except Exception as e:
        logger.error(f"ML classifier error: {e}")
        return {
            **state,
            "ml_risk_score": 50.0,
            "ml_prediction": "Suspicious",
            "ml_features": {"error": str(e)},
            "final_prediction": "Suspicious",
            "final_risk_score": 50.0,
            "final_features": {"ml_error": True},
            "route": "explain",
        }


# ---------------------------------------------------------------------------
# Node 5 — Live Content Check
# ---------------------------------------------------------------------------

def live_content_check_node(state: ThreatState) -> ThreatState:
    """
    Performs a quick (1.5s timeout) live HTML fetch to look for credential
    harvesting forms and brand impersonation in the page title.
    """
    import httpx
    import asyncio as _asyncio
    import ipaddress
    import socket

    normalized_url = state["normalized_url"]
    domain = state["domain"]
    current_risk = state["final_risk_score"]

    async def _fetch_html(target_url: str) -> str:
        try:
            parsed = urlparse(target_url)
            if parsed.scheme not in ["http", "https"]:
                return ""
            hostname = parsed.hostname or ""
            if hostname in ["localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.169.254"] or hostname.endswith(".local"):
                return ""
            try:
                ip_str = socket.gethostbyname(hostname)
                ip_obj = ipaddress.ip_address(ip_str)
                if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_multicast or ip_obj.is_reserved:
                    return ""
            except Exception:
                pass
            async with httpx.AsyncClient(timeout=1.5, verify=False, follow_redirects=False) as client:
                resp = await client.get(target_url)
                return resp.text.lower()
        except Exception:
            return ""

    try:
        html = _asyncio.run(_fetch_html(normalized_url))
        risk_score = current_risk
        live_triggered = False

        if html:
            if 'type="password"' in html or "type='password'" in html:
                has_cheap_tld = any(domain.endswith(t) for t in [".xyz", ".tk", ".pw", ".top", ".online"])
                if has_cheap_tld or not normalized_url.startswith("https://"):
                    risk_score = max(risk_score, 85.0)
                    live_triggered = True

            if "<title>" in html:
                title_start = html.find("<title>") + 7
                title_end = html.find("</title>")
                if title_end > title_start:
                    title = html[title_start:title_end]
                    major_brands = [
                        "paypal", "microsoft", "google", "apple", "facebook",
                        "amazon", "netflix", "bank of america", "chase", "wellsfargo",
                    ]
                    for brand in major_brands:
                        if brand in title and brand not in domain:
                            risk_score = max(risk_score, 90.0)
                            live_triggered = True

        if live_triggered and risk_score >= 80.0:
            return {
                **state,
                "live_risk_score": risk_score,
                "live_triggered": True,
                "final_prediction": "Phishing",
                "final_risk_score": risk_score,
                "final_features": {**state["final_features"], "live_analysis_trigger": True},
                "route": "explain",
            }

        return {
            **state,
            "live_risk_score": risk_score,
            "live_triggered": live_triggered,
            "final_risk_score": risk_score,
            "route": "explain",
        }
    except Exception as e:
        logger.warning(f"Live content check skipped for {normalized_url}: {e}")
        return {**state, "live_risk_score": current_risk, "live_triggered": False, "route": "explain"}


# ---------------------------------------------------------------------------
# Node 6 — AI Explainer
# ---------------------------------------------------------------------------

def ai_explainer_node(state: ThreatState) -> ThreatState:
    """
    Uses LangChain + Gemini to generate a human-readable threat explanation
    for non-safe URLs. Gracefully skips if AI is unconfigured.
    """
    if state["final_prediction"] == "Safe":
        return {**state, "ai_explanation": "", "route": "done"}

    try:
        from app.services.live_ai import generate_live_threat_explanation
        explanation = generate_live_threat_explanation(
            url=state["url"],
            risk_score=state["final_risk_score"],
            features=state["final_features"],
        )
        return {**state, "ai_explanation": explanation, "route": "done"}
    except Exception as e:
        logger.warning(f"AI explainer skipped: {e}")
        return {**state, "ai_explanation": "", "route": "done"}


# ---------------------------------------------------------------------------
# Graph Builder
# ---------------------------------------------------------------------------

def _route_after_whitelist(state: ThreatState) -> str:
    return "done" if state["is_whitelisted"] else "semantic_rules"


def _route_after_semantic(state: ThreatState) -> str:
    if state["route"] == "semantic_block":
        return "ai_explainer"
    return "ml_classifier"


def _route_after_ml(state: ThreatState) -> str:
    return state["route"]  # "live_content" or "explain"


def _route_after_live(state: ThreatState) -> str:
    return "ai_explainer"


def build_threat_graph():
    """
    Builds and compiles the LangGraph threat analysis state machine.
    Returns a compiled graph that can be invoked with .invoke({"url": ...}).
    """
    try:
        from langgraph.graph import StateGraph, END

        graph = StateGraph(ThreatState)

        # Register nodes
        graph.add_node("url_normalizer", url_normalizer_node)
        graph.add_node("whitelist_check", whitelist_check_node)
        graph.add_node("semantic_rules", semantic_rules_node)
        graph.add_node("ml_classifier", ml_classifier_node)
        graph.add_node("live_content_check", live_content_check_node)
        graph.add_node("ai_explainer", ai_explainer_node)

        # Wire the graph
        graph.set_entry_point("url_normalizer")
        graph.add_edge("url_normalizer", "whitelist_check")
        graph.add_conditional_edges(
            "whitelist_check",
            _route_after_whitelist,
            {"done": END, "semantic_rules": "semantic_rules"},
        )
        graph.add_conditional_edges(
            "semantic_rules",
            _route_after_semantic,
            {"ai_explainer": "ai_explainer", "ml_classifier": "ml_classifier"},
        )
        graph.add_conditional_edges(
            "ml_classifier",
            _route_after_ml,
            {"live_content": "live_content_check", "explain": "ai_explainer"},
        )
        graph.add_edge("live_content_check", "ai_explainer")
        graph.add_edge("ai_explainer", END)

        return graph.compile()
    except ImportError:
        logger.error("langgraph is not installed. Run: pip install langgraph")
        return None


# Singleton compiled graph (built once on module load)
_threat_graph = None


def get_threat_graph():
    global _threat_graph
    if _threat_graph is None:
        _threat_graph = build_threat_graph()
    return _threat_graph


# ---------------------------------------------------------------------------
# Public API — used by scans.py
# ---------------------------------------------------------------------------

def analyze_url_with_graph(url: str, *args, **kwargs) -> dict:
    """
    Runs the full LangGraph threat pipeline and returns a result dict compatible
    with the existing analyze_url() return format used by scans.py.
    Falls back to a basic error response if LangGraph is unavailable.
    """
    graph = get_threat_graph()
    if graph is None:
        # Fallback: return a generic suspicious result if graph not available
        return {
            "url": url,
            "prediction": "Suspicious",
            "risk_score": 50.0,
            "features": {"graph_unavailable": True},
        }

    initial_state: ThreatState = {
        "url": url,
        "normalized_url": "",
        "domain": "",
        "is_whitelisted": False,
        "semantic_risk_score": 0.0,
        "semantic_triggered": False,
        "ml_risk_score": 0.0,
        "ml_prediction": "Safe",
        "ml_features": {},
        "live_risk_score": 0.0,
        "live_triggered": False,
        "ai_explanation": "",
        "final_prediction": "Safe",
        "final_risk_score": 0.0,
        "final_features": {},
        "route": "",
    }

    try:
        final_state = graph.invoke(initial_state)
        result = {
            "url": url,
            "prediction": final_state["final_prediction"],
            "risk_score": final_state["final_risk_score"],
            "features": final_state["final_features"],
        }
        if final_state.get("ai_explanation"):
            result["ai_explanation"] = final_state["ai_explanation"]
        return result
    except Exception as e:
        logger.error(f"Threat graph execution error for {url}: {e}", exc_info=True)
        return {
            "url": url,
            "prediction": "Suspicious",
            "risk_score": 50.0,
            "features": {"graph_error": str(e)},
        }