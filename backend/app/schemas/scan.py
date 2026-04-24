from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class ScanCreate(BaseModel):
    url: str

class ScanResponse(BaseModel):
    id: UUID
    url: str
    prediction: str
    risk_score: float
    features_json: Optional[Dict[str, Any]] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class BatchScanCreate(BaseModel):
    urls: list[str]

class BatchScanResponse(BaseModel):
    results: list[ScanResponse]
