from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class URLRequest(BaseModel):
    url: str

@app.get("/")
def home():
    return {"message": "PhishX backend is running"}

@app.post("/predict")
def predict(data: URLRequest):
    return {
        "url": data.url,
        "risk_score": 0,
        "prediction": "Model not trained yet"
    }