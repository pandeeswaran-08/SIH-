from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from datetime import datetime, timezone
import enum
from app.db.base import Base

class DecisionType(str, enum.Enum):
    APPROVAL_RECOMMENDED = "APPROVAL_RECOMMENDED"
    REJECTION_RECOMMENDED = "REJECTION_RECOMMENDED"
    CLARIFICATION_REQUESTED = "CLARIFICATION_REQUESTED"
    ESCALATED_TO_COMMITTEE = "ESCALATED_TO_COMMITTEE"

class RegulatoryDecision(Base):
    __tablename__ = "regulatory_decisions"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    decision_type = Column(Enum(DecisionType), nullable=False)
    notes = Column(Text, nullable=False)
    clarification_details = Column(Text, nullable=True)
    official_signature = Column(String(255), nullable=False)
    decision_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ReviewComment(Base):
    __tablename__ = "review_comments"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
