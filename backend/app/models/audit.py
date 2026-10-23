from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone
from app.db.base import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    actor_id = Column(String(100), nullable=False) # user id or "SYSTEM"
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False, index=True) # e.g. "APPLICATION_SUBMITTED", "VALIDATION_RUN_STARTED", "RULE_MODIFIED", "DECISION_RECORDED"
    entity_type = Column(String(50), nullable=False, index=True) # "APPLICATION", "DOCUMENT", "FINDING", "REPORT", "ALERT"
    entity_id = Column(String(100), nullable=False, index=True)
    metadata_json = Column(Text, nullable=False) # Canonical JSON of structured event payload
    previous_event_hash = Column(String(64), nullable=False)
    event_hash = Column(String(64), nullable=False, unique=True, index=True)
