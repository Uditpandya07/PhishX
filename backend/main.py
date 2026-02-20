from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.feature_extractor import extract_features

app = FastAPI()

# 🔥 CORS MUST COME AFTER app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'phishing_model.pkl')
model = joblib.load(model_path)

class URLRequest(BaseModel):
    url: str

@app.get("/")
def home():
    return {"message": "PhishX backend is running"}

@app.post("/predict")
def predict(data: URLRequest):
    features = extract_features(data.url)
    prediction = model.predict([features])[0]
    probability = model.predict_proba([features])[0][1]

    return {
        "url": data.url,
        "prediction": "Phishing" if prediction == 1 else "Safe",
        "risk_score": round(probability * 100, 2)
    }