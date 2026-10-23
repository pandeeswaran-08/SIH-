from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from datetime import datetime, timezone
import enum
from app.db.base import Base

class AuthorityStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    NOT_VERIFIED = "NOT_VERIFIED"
    PENDING = "PENDING"
    UNAVAILABLE = "UNAVAILABLE"
    MANUAL_REVIEW_REQUIRED = "MANUAL_REVIEW_REQUIRED"

class AuthorityVerificationRecord(Base):
    __tablename__ = "authority_verifications"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    authority_name = Column(String(100), nullable=False) # e.g. "State Land Records Registry", "Affiliating University Portal", "Fire Services Portal"
    query_identifier = Column(String(255), nullable=False) # survey no, NOC no, affiliation order id
    status = Column(Enum(AuthorityStatus), default=AuthorityStatus.PENDING, nullable=False)
    reference_number = Column(String(100), nullable=True)
    response_payload_json = Column(Text, nullable=True) # Full structured response payload
    notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
