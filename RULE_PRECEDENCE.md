# ⚖️ PhishX Rule Precedence

To ensure maximum accuracy and sub-millisecond response times, PhishX follows a strict hierarchical evaluation order for every URL scan. This prevents unnecessary ML compute and ensures that trusted services are never accidentally flagged.

---

## 1. The Execution Hierarchy

Rules are evaluated in the following order:

### Layer 1: Enterprise Whitelist (The "Safe Pass")
*   **Mechanism:** Direct string matching against `TRUSTED_DOMAINS` in `whitelist.py`.
*   **Action:** If matched, return **0.0% Risk** immediately.
*   **Rationale:** Major domains like `google.com` or `irctc.co.in` should never be subjected to AI analysis to avoid "Hallucinated" risks.

### Layer 2: Heuristic "Smoking Gun" Overrides (The "Trap")
*   **Mechanism:** Regex and structural pattern matching in `scans.py`.
*   **Indicators:**
    1.  **Raw IP addresses** as domains.
    2.  **Double slashes `//`** inside the URL path (common redirection trick).
    3.  **High-Risk TLDs** (`.xyz`, `.tk`, `.pw`).
    4.  **Keyword Stuffing** in long URLs (e.g., `paypal-verify-account-update...`).
*   **Action:** If matched, return **98.0% Risk** immediately.
*   **Rationale:** These are mathematical certainties of malicious intent.

### Layer 3: Machine Learning Engine (The "Brain")
*   **Mechanism:** Scikit-Learn Random Forest Classifier (V2 Engine).
*   **Features:** Extracts 15 lexical features (entropy, length, digit density, etc.).
*   **Action:** Returns a probability-based risk score (0-100%).
*   **Rationale:** Handles subtle, never-before-seen phishing patterns that don't trigger Layer 2.

---

## 2. Conflict Resolution

*   **Whitelist vs. Heuristic:** Layer 1 always wins. If a domain is whitelisted, its structure (even if "suspicious") is ignored.
*   **Heuristic vs. ML:** Layer 2 always wins. If a "Smoking Gun" is found, the ML engine is bypassed for speed and safety.
*   **ML vs. User Feedback:** Future iterations will allow User Feedback to refine the ML engine via retraining, but Layer 1 and 2 remain authoritative.
