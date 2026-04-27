from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class DeletionRequestUser(BaseModel):
    email: str

class DeletionRequestResponse(BaseModel):
    id: UUID
    user_id: UUID
    status: str
    timestamp: datetime
    user: Optional[DeletionRequestUser] = None

    class Config:
        from_attributes = True

class TimeSeriesData(BaseModel):
    date: str
    count: int

class GlobalStats(BaseModel):
    total_users: int
    total_scans: int
    total_threats: int
    total_feedback: int
    scans_over_time: List[TimeSeriesData]
