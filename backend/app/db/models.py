from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from sqlalchemy.types import Uuid

class User(Base):
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)
    subscription_tier = Column(String, default="free")
    api_key = Column(String, unique=True, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    ai_training_enabled = Column(Boolean, default=True)
    razorpay_customer_id = Column(String, unique=True, nullable=True)
    razorpay_subscription_id = Column(String, unique=True, nullable=True)
    subscription_status = Column(String, default="active")
    metadata_json = Column(JSON, nullable=True)
    slack_webhook_url = Column(String, nullable=True)
    alert_preferences = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    scans = relationship("Scan", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user")
    phyloc_lookups = relationship("PhylocLookup", back_populates="user", cascade="all, delete-orphan")
    phyloc_bulk_jobs = relationship("PhylocBulkJob", back_populates="user", cascade="all, delete-orphan")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    url = Column(String, index=True, nullable=False)
    prediction = Column(String, nullable=False)
    risk_score = Column(Float, nullable=False)
    features_json = Column(JSON, nullable=True)
    whois_data = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="scans")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    razorpay_payment_id = Column(String, unique=True, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="usd")
    status = Column(String, nullable=False)
    plan = Column(String, nullable=False)
    billing_period = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="payments")


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    key_hash = Column(String, nullable=False, unique=True)
    last_used = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    rotated_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="api_keys")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="audit_logs")


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, unique=True, index=True)
    price = Column(Float, nullable=False)
    scan_limit = Column(Integer, default=-1) # -1 means unlimited
    features_json = Column(JSON, nullable=True)


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    scan_id = Column(Uuid, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    feedback_type = Column(String, nullable=False) # "false_positive" or "false_negative"
    comment = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    scan = relationship("Scan", backref="feedbacks")
    user = relationship("User", back_populates="feedbacks")


class DeletionRequest(Base):
    """
    Immutable audit log entry created when a user self-deletes their account.
    The user_email is captured BEFORE deletion so the record persists
    even after the users row is gone.
    """
    __tablename__ = "deletion_requests"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # SET NULL so log survives
    user_email = Column(String, nullable=False, index=True)   # captured before deletion
    status = Column(String, default="deleted")                # always "deleted" for self-deletes
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), server_default=func.now())


class ContactQuery(Base):
    __tablename__ = "contact_queries"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    query_text = Column(String(1000), nullable=False)
    status = Column(String, default="pending") # pending, resolved
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="contact_queries")


class TrialRecord(Base):
    __tablename__ = "trial_records"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    device_uuid = Column(String, index=True, nullable=True)
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_verified = Column(Boolean, default=False)
    trial_start = Column(DateTime(timezone=True), nullable=True)
    trial_end = Column(DateTime(timezone=True), nullable=True)
    trial_token = Column(String, unique=True, index=True, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PhylocLookup(Base):
    __tablename__ = "phyloc_lookups"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email = Column(String, index=True, nullable=False)
    verdict = Column(String, nullable=False)
    trust_score = Column(Integer, nullable=False)
    risk_level = Column(String, nullable=False)
    analysis_data = Column(JSON, nullable=False) # Stores the complete analysis details (signals, details, etc.)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="phyloc_lookups")

class PhylocBulkJob(Base):
    __tablename__ = "phyloc_bulk_jobs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    status = Column(String, default="processing") # processing, completed, failed
    progress = Column(Integer, default=0)
    summary = Column(String, nullable=True)
    emails = Column(JSON, nullable=False)
    results = Column(JSON, default=list)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="phyloc_bulk_jobs")

