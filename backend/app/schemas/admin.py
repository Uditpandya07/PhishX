from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class DeletedAccountLog(BaseModel):
    """Audit log entry for a self-deleted account."""
    id: UUID
    user_email: str          # denormalized — survives after user row is gone
    deleted_at: datetime
    reason: Optional[str] = None

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
