from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import sys
import os
import re
from urllib.parse import urlparse

# Ensure the backend folder is accessible so we can import the feature extractor
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.feature_extractor import extract_features

app = FastAPI()

# Allow your React frontend to communicate with this API securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Live-Trained PhishTank Model
model_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'phishing_model.pkl')
try:
    model = joblib.load(model_path)
    print("✅ Successfully loaded the PhishX Machine Learning Model.")
except FileNotFoundError:
    print("❌ Error: phishing_model.pkl not found! Please run train_model.py first.")
    model = None

# --- 🛡️ THE ENTERPRISE WHITELIST ---
SAFE_WHITELIST = {
    "google.com", "youtube.com", "github.com", "microsoft.com", 
    "apple.com", "netflix.com", "amazon.com", "linkedin.com",
    "paypal.com", "chase.com", "wikipedia.org"
}

class URLRequest(BaseModel):
    url: str

@app.get("/")
def home():
    return {"message": "PhishX Live-Threat Backend is Running Securely"}

@app.post("/predict")
def predict(data: URLRequest):
    if model is None:
        return {"error": "Model not loaded. Train the model first."}

    raw_url = data.url.strip().lower()

    # 1. INPUT NORMALIZATION
    if not raw_url.startswith("http://") and not raw_url.startswith("https://"):
        normalized_url = "https://" + raw_url
    else:
        normalized_url = raw_url

    # 2. EXTRACT DOMAIN FOR CHECKS
    parsed = urlparse(normalized_url)
    domain = parsed.netloc
    if domain.startswith("www."):
        domain = domain[4:]

    # 3. INSTANT WHITELIST BYPASS
    if domain in SAFE_WHITELIST:
        return {
            "url": data.url,
            "prediction": "Safe",
            "risk_score": 0.0
        }

    # 4. 🔥 THE "SMOKING GUN" HEURISTIC OVERRIDE
    # This manually catches the "Bad" patterns that the ML model might miss.
    bad_indicators = [
        # Checks if the domain is a raw IP address (Highly suspicious)
        re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', domain),
        # Detects double slashes in the path used for redirection tricks
        '//' in parsed.path,
        # Flags long URLs containing high-risk phishing keywords
        (len(raw_url) > 50 and any(x in raw_url for x in ['login', 'verify', 'update', 'admin', 'secure', 'bank', 'account'])),
        # Flags suspicious/cheap top-level domains heavily used by hackers
        any(domain.endswith(tld) for tld in ['.xyz', '.tk', '.pw', '.top', '.online', '.site'])
    ]

    if any(bad_indicators):
        return {
            "url": data.url,
            "prediction": "Phishing",
            "risk_score": 98.0  # Force a high risk score
        }

    # 5. MACHINE LEARNING ENGINE
    # If the URL passes the manual checks, let the AI decide.
    features = extract_features(normalized_url)
    prediction = model.predict([features])[0]
    probability = model.predict_proba([features])[0][1]

    return {
        "url": data.url,
        "prediction": "Phishing" if prediction == 1 else "Safe",
        "risk_score": round(probability * 100, 2)
    }