from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from datetime import datetime, timezone
import enum
from app.db.base import Base

class AlertSeverity(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    URGENT = "URGENT"
    CRITICAL = "CRITICAL"

class OfficialAlert(Base):
    __tablename__ = "official_alerts"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.WARNING, nullable=False)
    target_role = Column(String(50), default="VALIDATION_OFFICER")
    is_resolved = Column(Boolean, default=False, index=True)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
