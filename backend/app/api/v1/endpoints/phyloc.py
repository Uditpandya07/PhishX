from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from datetime import datetime
import re

from app.api.deps import get_db, get_optional_user
from app.db.models import User, PhylocLookup, PhylocBulkJob
from app.services.phyloc_service import analyze_email_service, process_bulk_job
from app.api.limiter import RateLimiter
from typing import Optional, List

# 20 email lookups per minute per IP — prevents abuse without blocking legitimate use
phyloc_limiter = RateLimiter(requests_limit=20, window_seconds=60, resource_name="phyloc_lookups")

router = APIRouter()

# Basic email regex for early rejection of garbage input
_EMAIL_RE = re.compile(r'^[^@\s]+@[^@\.\s]+(?:\.[^@\.\s]+)+$')

class LookupRequest(BaseModel):
    email: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        v = v.strip().lower()
        if not v:
            raise ValueError('Email is required')
        if len(v) > 254:  # RFC 5321 max length
            raise ValueError('Email address is too long')
        if not _EMAIL_RE.match(v):
            raise ValueError('Invalid email address format')
        return v

class BulkLookupRequest(BaseModel):
    emails: List[str]

@router.post("/lookups", dependencies=[Depends(phyloc_limiter)])
async def create_lookup(
    request: LookupRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    analysis = await analyze_email_service(request.email)
    
    # Save to db if user is logged in
    if current_user:
        lookup_record = PhylocLookup(
            user_id=current_user.id,
            email=analysis["email"],
            verdict=analysis["verdict"],
            trust_score=analysis["trustScore"],
            risk_level=analysis["riskLevel"],
            analysis_data=analysis
        )
        db.add(lookup_record)
        db.commit()
        db.refresh(lookup_record)
    
    return {"lookup": analysis}

@router.post("/bulk-jobs")
async def create_bulk_job(
    request: BulkLookupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required for bulk scanning")
        
    filtered_emails = [e.strip().lower() for e in request.emails if e and _EMAIL_RE.match(e.strip().lower())][:250]
    if not filtered_emails:
        raise HTTPException(status_code=400, detail="Provide at least one valid email address.")
        
    job = PhylocBulkJob(
        user_id=current_user.id,
        name=f"Bulk Scan {datetime.now().strftime('%Y-%m-%d')}",
        status="processing",
        progress=0,
        summary=f"Initializing scan for {len(filtered_emails)} addresses...",
        emails=filtered_emails,
        results=[]
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    background_tasks.add_task(process_bulk_job, str(job.id), filtered_emails)
    
    return {"job": {"id": str(job.id), "status": job.status, "summary": job.summary}}

@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    if not current_user:
        lookups = []
        bulk_jobs = []
    else:
        lookups = db.query(PhylocLookup).filter(PhylocLookup.user_id == current_user.id).order_by(PhylocLookup.timestamp.desc()).all()
        bulk_jobs = db.query(PhylocBulkJob).filter(PhylocBulkJob.user_id == current_user.id).order_by(PhylocBulkJob.timestamp.desc()).all()

    
    formatted_lookups = []
    for l in lookups:
        # BUGFIX: copy dict so we don't mutate the stored JSON in the DB session
        data = dict(l.analysis_data) if l.analysis_data else {}
        data["id"] = str(l.id)
        data["createdAt"] = l.timestamp.isoformat()
        formatted_lookups.append(data)
        
    formatted_bulk = []
    for b in bulk_jobs:
        formatted_bulk.append({
            "id": str(b.id),
            "name": b.name,
            "status": b.status,
            "progress": b.progress,
            "summary": b.summary,
            "emails": b.emails,
            "results": b.results,
            "createdAt": b.timestamp.isoformat()
        })
        
    latest_lookup = formatted_lookups[0] if formatted_lookups else None
    
    # Compute dashboard metrics
    verdicts = {"Safe": 0, "Low Risk": 0, "Caution": 0, "High Risk": 0, "Critical Risk": 0}
    breached_count = 0
    disposable_count = 0
    threat_counts = {}
    total_score = 0
    active_threats = 0
    
    for l in formatted_lookups:
        v = l.get("verdict", "Unknown")
        if v in verdicts:
            verdicts[v] += 1
        else:
            verdicts[v] = 1
            
        if l.get("leakcheck") and l["leakcheck"].get("found") or l.get("xposedornot") and l["xposedornot"].get("found"):
            breached_count += 1
            
        if l.get("disposable") and l["disposable"].get("isDisposable"):
            disposable_count += 1
            
        for s in l.get("signals", []):
            threat_counts[s] = threat_counts.get(s, 0) + 1
            
        total_score += l.get("trustScore", 0)
        if v in ["High Risk", "Critical Risk"]:
            active_threats += 1
            
    total = len(formatted_lookups)
    
    top_threats = []
    for signal, count in sorted(threat_counts.items(), key=lambda item: item[1], reverse=True)[:10]:
        top_threats.append({
            "signal": signal, 
            "count": count, 
            "percentage": round((count / total) * 100) if total > 0 else 0
        })
        
    metrics = {
        "totalLookups": total,
        "averageScore": round(total_score / total) if total > 0 else 0,
        "activeThreats": active_threats,
        "safePercentage": round((verdicts.get("Safe", 0) / total) * 100) if total > 0 else 0,
        "lowRiskPercentage": round((verdicts.get("Low Risk", 0) / total) * 100) if total > 0 else 0,
        "cautionPercentage": round((verdicts.get("Caution", 0) / total) * 100) if total > 0 else 0,
        "highRiskPercentage": round((verdicts.get("High Risk", 0) / total) * 100) if total > 0 else 0,
        "criticalRiskPercentage": round((verdicts.get("Critical Risk", 0) / total) * 100) if total > 0 else 0,
        "breachRate": round((breached_count / total) * 100) if total > 0 else 0,
        "disposableRate": round((disposable_count / total) * 100) if total > 0 else 0,
        "riskDistribution": verdicts,
        "topThreats": top_threats
    }
    
    return {
        "lookups": formatted_lookups,
        "bulkJobs": formatted_bulk,
        "latestLookup": latest_lookup,
        "metrics": metrics
    }

@router.get("/health")
def health_check():
    return {"status": "operational", "service": "phyloc_engine"}
