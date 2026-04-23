from pydantic import BaseModel, UUID4
from typing import Optional, Literal, Dict, Any
from datetime import datetime

class ScanShort(BaseModel):
    id: UUID4
    url: str
    prediction: str
    risk_score: float

    class Config:
        from_attributes = True

class FeedbackCreate(BaseModel):
    scan_id: UUID4
    feedback_type: Literal["false_positive", "false_negative"]
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: UUID4
    scan_id: UUID4
    user_id: Optional[UUID4]
    feedback_type: str
    comment: Optional[str]
    timestamp: datetime
    scan: Optional[ScanShort] = None  # Include basic scan info

    class Config:
        from_attributes = True
