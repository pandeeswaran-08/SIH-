from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
from datetime import datetime, timezone
from app.db.base import Base

class ValidationReport(Base):
    __tablename__ = "validation_reports"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    validation_run_id = Column(Integer, ForeignKey("validation_runs.id"), nullable=False, index=True)
    report_number = Column(String(100), unique=True, index=True, nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_band = Column(String(50), nullable=False)
    recommended_action = Column(String(255), nullable=False)
    summary_json = Column(Text, nullable=False) # High-level KPI and module breakdown
    full_report_json = Column(Text, nullable=False) # Complete 15-section report document
    is_partial = Column(Boolean, default=False)
    pdf_path = Column(String(500), nullable=True)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
