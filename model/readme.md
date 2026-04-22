# 🛡️ PhishX: Live Threat-Intelligence Phishing Detector

PhishX is a full-stack, AI-powered cybersecurity platform designed to detect malicious URLs in real-time. Instead of relying on slow HTML web-scraping, PhishX utilizes a **Pure Lexical Machine Learning Engine**, analyzing the mathematical signature and structural anomalies of a URL to catch advanced phishing attacks with sub-millisecond latency.

---

## 🏗️ Architecture Stack
* **Frontend:** React, Vite, Framer Motion, GSAP (Glassmorphism UI, animated risk parsing)
* **Backend:** FastAPI (Python, Uvicorn)
* **Machine Learning:** Scikit-Learn (Random Forest Classifier), Pandas, Joblib
* **Data Sources:** Kaggle Phishing Dataset (Fallback/Baseline) & PhishTank API

---

## 🔬 Detection Capabilities
Our V2 Engine extracts **15 distinct mathematical features** from every URL, combined with a **Heuristic Override Layer** to catch highly deceptive attacks. 

The model successfully detects:
1. **Subdomain Smuggling:** Catching fake roots (e.g., `secure.login.paypal.com.baddomain.net/verify`).
2. **Trusted-Brand Typosquatting:** Identifying abnormal hyphenation and high-risk keywords (e.g., `https://www.netflix-billing-update-center.com/auth`).
3. **Raw IP Attacks:** Instantly flagging domains that use naked IPv4 addresses instead of registered names.
4. **Deep Directory Hiding:** Penalizing URLs with excessive path depths and malicious query parameters.
5. **Cheap TLD Abuse:** Flagging top-level domains heavily favored by threat actors (`.xyz`, `.tk`, `.top`).
6. **Zero-False-Positive Whitelisting:** Major global domains (Google, GitHub, Wikipedia) bypass the ML compute via an Enterprise Whitelist for instant 0.0% risk scores.

---

## 🚧 Engineering Challenges & Solutions

During the development of PhishX, several critical architectural hurdles were identified and resolved:

### 1. The "Catastrophic Regex Backtracking" Bug (Frontend Freeze)
* **The Problem:** When pasting "dirty" URLs from datasets containing long strings of hyphens and complex subdirectories, the React frontend would completely lock up (White Screen of Death / CPU max out).
* **The Solution:** We identified a nested "zero-or-more" asterisk loop in the input validation Regex. We replaced the overly strict frontend regex with a safe, optimized structural validator. We shifted the heavy lifting to the Python backend, treating the frontend purely as a secure "Gatekeeper."

### 2. PhishTank API Rate Limiting (HTTP 429)
* **The Problem:** The training pipeline was blocked by PhishTank's enterprise firewall due to automated scraping without a commercial API key.
* **The Solution:** Built a resilient offline fallback mechanism. The `train_model.py` script was rewritten to seamlessly ingest a localized, 100k+ row Kaggle CSV dataset, ensuring the engine can be retrained locally without internet constraints.

### 3. Data Leakage & "Lazy" AI Classifications
* **The Problem:** The Kaggle dataset contained an imbalance of Safe vs. Phishing URLs. The Random Forest model became biased, occasionally scoring highly complex malicious URLs as "Safe."
* **The Solution:** Implemented a strict **50/50 Data Balancing pipeline** in the training script. We forced the model to train on an equal number of safe and malicious links (e.g., 50k Safe / 50k Bad) and increased the `max_depth` to 25 to force the AI to learn deeper, more complex decision boundaries.

### 4. The "Smoking Gun" Heuristic Blindspot
* **The Problem:** A pure Machine Learning model is highly capable of finding subtle patterns, but occasionally misses blatantly obvious attacks if the exact structural pattern wasn't in the training data.
* **The Solution:** Introduced a **Heuristic Override Layer** in the FastAPI backend. Before the ML model runs, the backend scans for "smoking gun" indicators (e.g., Double slashes `//` in paths, raw IP addresses). If triggered, the AI is bypassed entirely, and a forced 98.0% High-Risk score is returned instantly.

---

## 🚀 Setup & Installation

### 1. Train the ML Model
Before booting the backend, you must train the AI and generate the `.pkl` file.
```bash
cd model
# Ensure phishing_site_urls.csv is in this directory
python train_model.py