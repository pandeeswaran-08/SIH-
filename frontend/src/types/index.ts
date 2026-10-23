export type Role = 'APPLICANT' | 'VALIDATION_OFFICER' | 'SENIOR_REVIEWING_OFFICER' | 'SYSTEM_ADMINISTRATOR' | 'AUDITOR';

export type ApplicationStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VALIDATING'
  | 'REQUIRES_ATTENTION'
  | 'CLARIFICATION_REQUESTED'
  | 'PRELIMINARY_VALIDATION_COMPLETED'
  | 'IN_SENIOR_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type RiskBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export interface Institution {
  id: number;
  aicte_permanent_id: string;
  legal_name: string;
  category: string;
  sub_category?: string;
  state: string;
  district: string;
  pin_code: string;
  address: string;
  establishment_year: number;
  land_area_acres?: number;
  builtup_area_sqm?: number;
  contact_email: string;
  contact_phone: string;
  trust_or_society_name?: string;
}

export interface Application {
  id: number;
  application_number: string;
  institution_id: number;
  academic_year: string;
  category: string;
  detected_category?: string;
  category_classification_method: string;
  category_confidence: number;
  category_overridden: boolean;
  application_type: string;
  status: ApplicationStatus;
  submission_date: string;
  declared_land_acres?: number;
  declared_builtup_sqm?: number;
  declared_faculty_count?: number;
  declared_student_intake?: number;
  overall_risk_score: number;
  risk_band: RiskBand;
  attention_required: boolean;
  attention_reasons?: string;
  institution?: Institution;
}

export interface ApplicationDocument {
  id: number;
  application_id: number;
  document_type: string;
  filename: string;
  original_filename: string;
  storage_path: string;
  file_size_bytes: number;
  sha256_hash: string;
  mime_type: string;
  status: string;
  page_count: number;
  is_unreadable: boolean;
  ocr_completed: boolean;
  extracted_text?: string;
  created_at: string;
}

export interface ExtractedField {
  id: number;
  application_id: number;
  document_id: number;
  field_name: string;
  declared_value?: string;
  extracted_value?: string;
  confidence: number;
  match_status: string;
  source_page: number;
  bbox_json?: string;
  evidence_ref?: string;
}

export interface ValidationFinding {
  id: number;
  validation_run_id: number;
  module_name: string;
  rule_id: string;
  rule_version: string;
  title: string;
  explanation: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  evidence_ref?: string;
  document_id?: number;
  confidence: number;
  reviewer_disposition: 'UNREVIEWED' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'REQUIRES_FURTHER_REVIEW';
  reviewer_notes?: string;
  created_at: string;
}

export interface ModuleRun {
  id: number;
  module_name: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'COMPLETED_WITH_WARNINGS' | 'FAILED' | 'SKIPPED';
  started_at?: string;
  completed_at?: string;
  execution_time_ms: number;
  progress_pct: number;
  summary_json?: string;
}

export interface ValidationRun {
  id: number;
  application_id: number;
  run_number: number;
  status: string;
  idempotency_key: string;
  started_at: string;
  completed_at?: string;
  execution_time_ms: number;
  risk_score: number;
  risk_band: RiskBand;
  total_findings: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  is_current: boolean;
  module_runs: ModuleRun[];
  findings: ValidationFinding[];
}

export interface OfficialAlert {
  id: number;
  application_id: number;
  title: string;
  reason: string;
  severity: 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';
  target_role: string;
  is_resolved: boolean;
  resolution_notes?: string;
  created_at: string;
}

export interface AuditEvent {
  id: number;
  event_id: string;
  timestamp: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata_json: string;
  previous_event_hash: string;
  event_hash: string;
}

export interface DashboardStats {
  total_applications: number;
  applications_processing: number;
  completed_validations: number;
  attention_required_count: number;
  risk_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  avg_processing_latency_ms: number;
  ocr_success_rate: number;
  active_alerts_count: number;
  system_health: {
    device: string;
    cpu_percent: number;
    ram_used_mb: number;
    ram_total_mb: number;
    ram_percent: number;
    models_loaded: string[];
  };
}
