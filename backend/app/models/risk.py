from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base

class RiskScoreContribution(Base):
    __tablename__ = "risk_score_contributions"

    id = Column(Integer, primary_key=True, index=True)
    validation_run_id = Column(Integer, ForeignKey("validation_runs.id"), nullable=False, index=True)
    rule_id = Column(String(100), nullable=False)
    rule_version = Column(String(50), default="2026.1.0")
    category = Column(String(100), nullable=False)
    weight = Column(Float, nullable=False)
    contribution = Column(Float, nullable=False)
    explanation = Column(Text, nullable=False)
    evidence_ref = Column(String(255), nullable=True)
    reviewer_adjustment = Column(Float, default=0.0)
    reviewer_justification = Column(Text, nullable=True)
    adjusted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    validation_run = relationship("ValidationRun", back_populates="risk_contributions")
