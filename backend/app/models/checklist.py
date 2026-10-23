from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from datetime import datetime, timezone
import enum
from app.db.base import Base

class ChecklistStatus(str, enum.Enum):
    PENDING = "PENDING"
    PRESENT = "PRESENT"
    MISSING = "MISSING"
    EXPIRED = "EXPIRED"
    INCONSISTENT = "INCONSISTENT"
    REQUIRES_REVIEW = "REQUIRES_REVIEW"
    NOT_APPLICABLE = "NOT_APPLICABLE"

class ChecklistSnapshot(Base):
    __tablename__ = "checklist_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    template_code = Column(String(100), nullable=False)
    rule_version = Column(String(50), nullable=False)
    academic_year = Column(String(20), nullable=False)
    items_json = Column(Text, nullable=False) # JSON array of checklist items with status, doc_ref, notes
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
