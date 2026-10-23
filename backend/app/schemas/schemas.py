from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# --- Auth Schemas ---
class RoleEnum(str, Enum):
    APPLICANT = "APPLICANT"
    VALIDATION_OFFICER = "VALIDATION_OFFICER"
    SENIOR_REVIEWING_OFFICER = "SENIOR_REVIEWING_OFFICER"
    SYSTEM_ADMINISTRATOR = "SYSTEM_ADMINISTRATOR"
    AUDITOR = "AUDITOR"

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    full_name: str
    role: RoleEnum
    email: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: RoleEnum = RoleEnum.VALIDATION_OFFICER

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: RoleEnum
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Institution Schemas ---
class InstitutionCreate(BaseModel):
    legal_name: str
    aicte_permanent_id: str
    category: str
    sub_category: Optional[str] = None
    state: str
    district: str
    pin_code: str
    address: str
    establishment_year: int
    land_area_acres: Optional[float] = None
    builtup_area_sqm: Optional[float] = None
    contact_email: EmailStr
    contact_phone: str
    trust_or_society_name: Optional[str] = None

class InstitutionResponse(InstitutionCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Application Schemas ---
class ApplicationCreate(BaseModel):
    institution_id: Optional[int] = None
    # If creating institution concurrently in submission wizard:
    legal_name: Optional[str] = None
    aicte_permanent_id: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pin_code: Optional[str] = None
    address: Optional[str] = None
    establishment_year: Optional[int] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    category: str = "ENGINEERING_TECH"
    academic_year: str = "2026-2027"
    application_type: str = "EXTENSION_OF_APPROVAL"
    declared_land_acres: Optional[float] = None
    declared_builtup_sqm: Optional[float] = None
    declared_faculty_count: Optional[int] = None
    declared_student_intake: Optional[int] = None

class ApplicationResponse(BaseModel):
    id: int
    application_number: str
    institution_id: int
    academic_year: str
    category: str
    detected_category: Optional[str]
    category_classification_method: str
    category_confidence: float
    category_overridden: bool
    application_type: str
    status: str
    submission_date: datetime
    declared_land_acres: Optional[float]
    declared_builtup_sqm: Optional[float]
    declared_faculty_count: Optional[int]
    declared_student_intake: Optional[int]
    overall_risk_score: float
    risk_band: str
    attention_required: bool
    attention_reasons: Optional[str]
    institution: Optional[InstitutionResponse] = None

    class Config:
        from_attributes = True

# --- Document Schemas ---
class DocumentResponse(BaseModel):
    id: int
    application_id: int
    document_type: str
    filename: str
    original_filename: str
    storage_path: str
    file_size_bytes: int
    sha256_hash: str
    mime_type: str
    status: str
    page_count: int
    is_unreadable: bool
    ocr_completed: bool
    extracted_text: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ExtractedFieldResponse(BaseModel):
    id: int
    application_id: int
    document_id: int
    field_name: str
    declared_value: Optional[str]
    extracted_value: Optional[str]
    confidence: float
    match_status: str
    source_page: int
    bbox_json: Optional[str]
    evidence_ref: Optional[str]

    class Config:
        from_attributes = True

# --- Finding & Validation Schemas ---
class FindingDispositionUpdate(BaseModel):
    disposition: str # "CONFIRMED", "FALSE_POSITIVE", "REQUIRES_FURTHER_REVIEW"
    notes: Optional[str] = None

class ValidationFindingResponse(BaseModel):
    id: int
    validation_run_id: int
    module_name: str
    rule_id: str
    rule_version: str
    title: str
    explanation: str
    severity: str
    category: str
    evidence_ref: Optional[str]
    document_id: Optional[int]
    confidence: float
    reviewer_disposition: str
    reviewer_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ModuleRunResponse(BaseModel):
    id: int
    module_name: str
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    execution_time_ms: int
    progress_pct: int
    summary_json: Optional[str]

    class Config:
        from_attributes = True

class ValidationRunResponse(BaseModel):
    id: int
    application_id: int
    run_number: int
    status: str
    idempotency_key: str
    started_at: datetime
    completed_at: Optional[datetime]
    execution_time_ms: int
    risk_score: float
    risk_band: str
    total_findings: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    is_current: bool
    module_runs: List[ModuleRunResponse] = []
    findings: List[ValidationFindingResponse] = []

    class Config:
        from_attributes = True

# --- Alert & Review Schemas ---
class AlertResponse(BaseModel):
    id: int
    application_id: int
    title: str
    reason: str
    severity: str
    target_role: str
    is_resolved: bool
    resolution_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    is_resolved: bool
    resolution_notes: Optional[str] = None

class DecisionCreate(BaseModel):
    decision_type: str # "APPROVAL_RECOMMENDED", "REJECTION_RECOMMENDED", "CLARIFICATION_REQUESTED", "ESCALATED_TO_COMMITTEE"
    notes: str
    clarification_details: Optional[str] = None
    official_signature: str

class DecisionResponse(BaseModel):
    id: int
    application_id: int
    officer_id: int
    decision_type: str
    notes: str
    clarification_details: Optional[str]
    official_signature: str
    decision_timestamp: datetime

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    comment_text: str

class CommentResponse(BaseModel):
    id: int
    application_id: int
    user_id: int
    comment_text: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Dashboard & Audit ---
class DashboardSummaryResponse(BaseModel):
    total_applications: int
    applications_processing: int
    completed_validations: int
    attention_required_count: int
    risk_distribution: Dict[str, int]
    category_distribution: Dict[str, int]
    avg_processing_latency_ms: float
    ocr_success_rate: float
    active_alerts_count: int
    system_health: Dict[str, Any]

class AuditEventResponse(BaseModel):
    id: int
    event_id: str
    timestamp: datetime
    actor_id: str
    actor_role: str
    action: str
    entity_type: str
    entity_id: str
    metadata_json: str
    previous_event_hash: str
    event_hash: str

    class Config:
        from_attributes = True

class AuditChainVerifyResponse(BaseModel):
    is_valid: bool
    total_events_checked: int
    error_explanation: Optional[str] = None
