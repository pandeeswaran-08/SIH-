from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.db.base import Base

class SeverityLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ReviewerDisposition(str, enum.Enum):
    UNREVIEWED = "UNREVIEWED"
    CONFIRMED = "CONFIRMED"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    REQUIRES_FURTHER_REVIEW = "REQUIRES_FURTHER_REVIEW"

class ValidationFinding(Base):
    __tablename__ = "validation_findings"

    id = Column(Integer, primary_key=True, index=True)
    validation_run_id = Column(Integer, ForeignKey("validation_runs.id"), nullable=False, index=True)
    module_name = Column(String(50), nullable=False, index=True)
    rule_id = Column(String(100), nullable=False, index=True)
    rule_version = Column(String(50), default="2026.1.0")
    title = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    severity = Column(Enum(SeverityLevel), default=SeverityLevel.MEDIUM, nullable=False, index=True)
    category = Column(String(100), nullable=False) # e.g. "EXPIRED_DOCUMENT", "DUPLICATE_FILE", "AREA_MISMATCH"
    evidence_ref = Column(String(255), nullable=True) # e.g. "doc:12#page:1", "img:25#bbox:[10,20,30,40]"
    document_id = Column(Integer, ForeignKey("application_documents.id"), nullable=True)
    confidence = Column(Float, default=1.0)
    reviewer_disposition = Column(Enum(ReviewerDisposition), default=ReviewerDisposition.UNREVIEWED, nullable=False)
    reviewer_notes = Column(Text, nullable=True)
    reviewed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    validation_run = relationship("ValidationRun", back_populates="findings")
