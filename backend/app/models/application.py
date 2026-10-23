from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.db.base import Base

class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    VALIDATING = "VALIDATING"
    REQUIRES_ATTENTION = "REQUIRES_ATTENTION"
    CLARIFICATION_REQUESTED = "CLARIFICATION_REQUESTED"
    PRELIMINARY_VALIDATION_COMPLETED = "PRELIMINARY_VALIDATION_COMPLETED"
    IN_SENIOR_REVIEW = "IN_SENIOR_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class ApplicationType(str, enum.Enum):
    EXTENSION_OF_APPROVAL = "EXTENSION_OF_APPROVAL"
    NEW_INSTITUTION = "NEW_INSTITUTION"
    INCREASE_IN_INTAKE = "INCREASE_IN_INTAKE"
    INTRODUCTION_OF_NEW_COURSE = "INTRODUCTION_OF_NEW_COURSE"
    CLOSURE_OF_INSTITUTION = "CLOSURE_OF_INSTITUTION"

class RiskBand(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String(50), unique=True, index=True, nullable=False)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False, index=True)
    applicant_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    academic_year = Column(String(20), default="2026-2027", nullable=False)
    category = Column(String(100), nullable=False)
    detected_category = Column(String(100), nullable=True)
    category_classification_method = Column(String(100), default="DETERMINISTIC_RULES")
    category_confidence = Column(Float, default=1.0)
    category_overridden = Column(Boolean, default=False)
    application_type = Column(Enum(ApplicationType), default=ApplicationType.EXTENSION_OF_APPROVAL, nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.SUBMITTED, nullable=False, index=True)
    submission_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Declarations made in the application
    declared_land_acres = Column(Float, nullable=True)
    declared_builtup_sqm = Column(Float, nullable=True)
    declared_faculty_count = Column(Integer, nullable=True)
    declared_student_intake = Column(Integer, nullable=True)
    
    # Risk and Decision Support
    overall_risk_score = Column(Float, default=0.0)
    risk_band = Column(Enum(RiskBand), default=RiskBand.LOW)
    attention_required = Column(Boolean, default=False, index=True)
    attention_reasons = Column(Text, nullable=True)
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    institution = relationship("Institution", backref="applications")
    documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")
    validation_runs = relationship("ValidationRun", back_populates="application", cascade="all, delete-orphan")
