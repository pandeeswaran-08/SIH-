from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.db.base import Base

class MatchStatus(str, enum.Enum):
    MATCH = "MATCH"
    MISMATCH = "MISMATCH"
    PARTIAL = "PARTIAL"
    NOT_EXTRACTED = "NOT_EXTRACTED"
    REQUIRES_REVIEW = "REQUIRES_REVIEW"

class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("application_documents.id"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False) # e.g., institution_name, land_area, registration_no, issue_date, expiry_date
    declared_value = Column(String(500), nullable=True)
    extracted_value = Column(String(500), nullable=True)
    confidence = Column(Float, default=1.0)
    match_status = Column(Enum(MatchStatus), default=MatchStatus.MATCH, nullable=False)
    source_page = Column(Integer, default=1)
    bbox_json = Column(Text, nullable=True) # [x0, y0, x1, y1] or polygon
    evidence_ref = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("ApplicationDocument", back_populates="extracted_fields")
