from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.db.base import Base

class ValidationRunStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    COMPLETED_WITH_WARNINGS = "COMPLETED_WITH_WARNINGS"
    FAILED = "FAILED"

class ModuleExecutionState(str, enum.Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    COMPLETED_WITH_WARNINGS = "COMPLETED_WITH_WARNINGS"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"

class ModuleName(str, enum.Enum):
    DOCUMENT_COMPLETENESS = "DOCUMENT_COMPLETENESS"
    INSTITUTIONAL_HISTORY = "INSTITUTIONAL_HISTORY"
    ANOMALY_FORGERY = "ANOMALY_FORGERY"
    ISSUING_AUTHORITY = "ISSUING_AUTHORITY"
    INFRASTRUCTURE_CV = "INFRASTRUCTURE_CV"

class ValidationRun(Base):
    __tablename__ = "validation_runs"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    run_number = Column(Integer, default=1)
    status = Column(Enum(ValidationRunStatus), default=ValidationRunStatus.QUEUED, nullable=False)
    idempotency_key = Column(String(100), unique=True, index=True, nullable=False)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    execution_time_ms = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    risk_band = Column(String(50), default="LOW")
    total_findings = Column(Integer, default=0)
    critical_findings = Column(Integer, default=0)
    high_findings = Column(Integer, default=0)
    medium_findings = Column(Integer, default=0)
    low_findings = Column(Integer, default=0)
    is_current = Column(Boolean, default=True)

    application = relationship("Application", back_populates="validation_runs")
    module_runs = relationship("ModuleRun", back_populates="validation_run", cascade="all, delete-orphan")
    findings = relationship("ValidationFinding", back_populates="validation_run", cascade="all, delete-orphan")
    risk_contributions = relationship("RiskScoreContribution", back_populates="validation_run", cascade="all, delete-orphan")

class ModuleRun(Base):
    __tablename__ = "module_runs"

    id = Column(Integer, primary_key=True, index=True)
    validation_run_id = Column(Integer, ForeignKey("validation_runs.id"), nullable=False, index=True)
    module_name = Column(Enum(ModuleName), nullable=False)
    status = Column(Enum(ModuleExecutionState), default=ModuleExecutionState.QUEUED, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    execution_time_ms = Column(Integer, default=0)
    progress_pct = Column(Integer, default=0)
    retry_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    summary_json = Column(Text, nullable=True) # JSON summary of execution results and evidence stats

    validation_run = relationship("ValidationRun", back_populates="module_runs")
