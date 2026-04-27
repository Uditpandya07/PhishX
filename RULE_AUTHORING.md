# ✍️ PhishX Rule Authoring Guide

This guide explains how to add new detection rules or whitelist domains to the PhishX engine.

---

## 1. Adding Whitelisted Domains
To add a new trusted domain (e.g., a new government portal or corporate site):

1.  Open `backend/app/services/whitelist.py`.
2.  Add the domain string to the `TRUSTED_DOMAINS` set.
3.  **Rule:** Use the base domain only (e.g., `example.com`), not the protocol or subdirectories.
4.  **Note:** The engine automatically handles `www.` prefixes.

```python
TRUSTED_DOMAINS = {
    "my-new-trusted-site.in",
    # ...
}
```

## 2. Adding Heuristic Overrides
To catch a new specific attack pattern that the AI might miss:

1.  Open `backend/app/api/v1/endpoints/scans.py`.
2.  Locate the `bad_indicators` list inside the `analyze_url` function.
3.  Add a new boolean condition.

**Example: Catching URLs with "@" symbols in the path (often used for spoofing):**
```python
bad_indicators = [
    # ... existing rules
    '@' in parsed.path, 
]
```

## 3. Updating the ML Engine
If you find the AI is consistently missing a specific *type* of URL structure:

1.  **Add Feature:** Modify `backend/app/services/feature_extractor.py` to extract a new mathematical signal.
2.  **Retrain:** Run `python model/train_model.py` to generate a new `phishing_model.pkl`.
3.  **Update Hash:** Calculate the new SHA256 hash of the `.pkl` file and update `EXPECTED_MODEL_HASH` in your `.env` or `scans.py`.

---

## 4. Best Practices
*   **Keep it Lexical:** Rules should rely on the URL structure, not on fetching the page content (to maintain sub-millisecond latency).
*   **Avoid Over-Aggression:** Ensure new heuristics don't catch legitimate deep-links (e.g., Google Drive sharing links).
*   **Test Before Deploy:** Always run `pytest` after adding rules to ensure no regressions in detection accuracy.
