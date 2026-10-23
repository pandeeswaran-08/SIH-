import time
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.application import Application, ApplicationStatus, RiskBand
from app.models.institution import Institution
from app.models.document import ApplicationDocument, DocumentStatus
from app.models.extracted_field import ExtractedField, MatchStatus
from app.models.checklist import ChecklistSnapshot
from app.models.validation import (
    ValidationRun, ModuleRun, ValidationRunStatus,
    ModuleExecutionState, ModuleName
)
from app.models.finding import ValidationFinding, SeverityLevel
from app.models.verification import AuthorityVerificationRecord
from app.models.risk import RiskScoreContribution
from app.models.report import ValidationReport
from app.models.alert import OfficialAlert, AlertSeverity
from app.services.audit_service import audit_service
from app.services.storage_service import storage_service

from ai_engine.ocr.pipeline import ocr_pipeline
from ai_engine.extraction.field_extractor import field_extractor
from ai_engine.completeness.checker import completeness_checker
from ai_engine.institutional_history.cross_check import institutional_history_checker
from ai_engine.anomaly_detection.forgery_screener import forgery_screener
from ai_engine.verification.authority_verifier import authority_verifier
from ai_engine.infrastructure_cv.vision_analyzer import infrastructure_vision_analyzer
from ai_engine.scoring.engine import scoring_engine

logger = logging.getLogger("aicte.orchestrator")

class ValidationOrchestrator:
    """
    Coordinates the 5 parallel validation modules with persistent state,
    idempotency, retry resilience, explainable scoring, and report generation.
    """

    def run_validation_pipeline(
        self,
        db: Session,
        application_id: int,
        idempotency_key: str,
        actor_id: str = "SYSTEM",
        actor_role: str = "SYSTEM_AUTOMATION"
    ) -> ValidationRun:
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise ValueError(f"Application {application_id} not found.")

        # Check existing run by idempotency key to prevent duplicate runs
        existing_run = db.query(ValidationRun).filter(ValidationRun.idempotency_key == idempotency_key).first()
        if existing_run and existing_run.status in [ValidationRunStatus.COMPLETED, ValidationRunStatus.RUNNING]:
            return existing_run

        start_time = time.time()
        
        # 1. Create or initialize ValidationRun
        run_count = db.query(ValidationRun).filter(ValidationRun.application_id == application_id).count()
        val_run = ValidationRun(
            application_id=application_id,
            run_number=run_count + 1,
            status=ValidationRunStatus.RUNNING,
            idempotency_key=idempotency_key,
            started_at=datetime.now(timezone.utc),
            is_current=True
        )
        # Mark previous runs as not current
        db.query(ValidationRun).filter(
            ValidationRun.application_id == application_id,
            ValidationRun.is_current == True
        ).update({"is_current": False})

        db.add(val_run)
        db.commit()
        db.refresh(val_run)

        # Audit start
        audit_service.record_event(
            db=db,
            actor_id=actor_id,
            actor_role=actor_role,
            action="VALIDATION_RUN_STARTED",
            entity_type="VALIDATION_RUN",
            entity_id=str(val_run.id),
            metadata={"run_number": val_run.run_number, "idempotency_key": idempotency_key}
        )

        # Update application status
        app.status = ApplicationStatus.VALIDATING
        db.commit()

        # Prepare module run records
        modules = [
            ModuleName.DOCUMENT_COMPLETENESS,
            ModuleName.INSTITUTIONAL_HISTORY,
            ModuleName.ANOMALY_FORGERY,
            ModuleName.ISSUING_AUTHORITY,
            ModuleName.INFRASTRUCTURE_CV
        ]
        module_run_map = {}
        for m in modules:
            m_run = ModuleRun(
                validation_run_id=val_run.id,
                module_name=m,
                status=ModuleExecutionState.RUNNING,
                started_at=datetime.now(timezone.utc),
                progress_pct=10
            )
            db.add(m_run)
            module_run_map[m] = m_run
        db.commit()

        all_findings = []

        try:
            # Load application context
            institution = db.query(Institution).filter(Institution.id == app.institution_id).first()
            docs = db.query(ApplicationDocument).filter(ApplicationDocument.application_id == application_id).all()
            
            # Retrieve or create checklist snapshot
            checklist_snapshot = db.query(ChecklistSnapshot).filter(
                ChecklistSnapshot.application_id == application_id
            ).first()
            checklist_items = json.loads(checklist_snapshot.items_json) if checklist_snapshot else []

            # Prepare Document OCR & text extraction
            doc_dicts = []
            extracted_fields = []

            for doc in docs:
                full_path = storage_service.get_full_path(doc.storage_path)
                ocr_res = ocr_pipeline.extract_from_file(full_path)
                doc.extracted_text = ocr_res.get("text")
                doc.page_count = ocr_res.get("page_count", 1)
                doc.is_unreadable = ocr_res.get("is_unreadable", False)
                doc.ocr_completed = True
                doc.metadata_json = json.dumps(ocr_res.get("metadata", {}))
                db.commit()

                # Extract fields
                fields = field_extractor.extract_fields(ocr_res, doc.document_type.value)
                for f in fields:
                    ef = ExtractedField(
                        application_id=application_id,
                        document_id=doc.id,
                        field_name=f["field_name"],
                        extracted_value=f["extracted_value"],
                        confidence=f["confidence"],
                        match_status=MatchStatus.MATCH,
                        source_page=f["source_page"],
                        bbox_json=json.dumps(f["bbox"]),
                        evidence_ref=f["evidence_ref"]
                    )
                    db.add(ef)
                    extracted_fields.append({
                        "id": ef.id,
                        "document_id": doc.id,
                        "field_name": f["field_name"],
                        "extracted_value": f["extracted_value"],
                        "source_page": f["source_page"],
                        "evidence_ref": f["evidence_ref"]
                    })
                db.commit()

                doc_dicts.append({
                    "id": doc.id,
                    "application_id": doc.application_id,
                    "document_type": doc.document_type.value,
                    "filename": doc.filename,
                    "sha256_hash": doc.sha256_hash,
                    "is_unreadable": doc.is_unreadable,
                    "full_path": full_path,
                    "metadata": ocr_res.get("metadata", {})
                })

            app_data = {
                "id": app.id,
                "application_number": app.application_number,
                "academic_year": app.academic_year,
                "category": app.category,
                "legal_name": institution.legal_name if institution else "",
                "aicte_permanent_id": institution.aicte_permanent_id if institution else "",
                "address": institution.address if institution else "",
                "pin_code": institution.pin_code if institution else "",
                "district": institution.district if institution else "",
                "declared_land_acres": app.declared_land_acres,
                "declared_builtup_sqm": app.declared_builtup_sqm
            }

            # --- MODULE 1: Document OCR, Extraction & Completeness ---
            m1_start = time.time()
            m1_run = module_run_map[ModuleName.DOCUMENT_COMPLETENESS]
            f1, s1 = completeness_checker.run_check(app_data, checklist_items, doc_dicts, extracted_fields)
            m1_run.execution_time_ms = int((time.time() - m1_start) * 1000)
            m1_run.completed_at = datetime.now(timezone.utc)
            m1_run.progress_pct = 100
            m1_run.status = ModuleExecutionState.COMPLETED if s1["status"] == "COMPLETED" else ModuleExecutionState.COMPLETED_WITH_WARNINGS
            m1_run.summary_json = json.dumps(s1)
            all_findings.extend([dict(f, module_name="DOCUMENT_COMPLETENESS") for f in f1])
            # Update checklist snapshot with new item statuses
            if checklist_snapshot:
                checklist_snapshot.items_json = json.dumps(checklist_items)
            db.commit()

            # --- MODULE 2: Institutional History Cross-Check ---
            m2_start = time.time()
            m2_run = module_run_map[ModuleName.INSTITUTIONAL_HISTORY]
            # Fetch historical records for this institution from past applications or baseline
            past_apps = db.query(Application).filter(
                Application.institution_id == app.institution_id,
                Application.id != app.id
            ).all()
            hist_records = []
            for pa in past_apps:
                hist_records.append({
                    "id": pa.id,
                    "academic_year": pa.academic_year,
                    "legal_name": institution.legal_name if institution else "",
                    "address": institution.address if institution else "",
                    "pin_code": institution.pin_code if institution else "",
                    "district": institution.district if institution else "",
                    "land_area_acres": pa.declared_land_acres or (institution.land_area_acres if institution else 0.0),
                    "builtup_area_sqm": pa.declared_builtup_sqm or (institution.builtup_area_sqm if institution else 0.0)
                })

            f2, s2, delta_comp = institutional_history_checker.run_check(app_data, hist_records)
            m2_run.execution_time_ms = int((time.time() - m2_start) * 1000)
            m2_run.completed_at = datetime.now(timezone.utc)
            m2_run.progress_pct = 100
            m2_run.status = ModuleExecutionState.COMPLETED if s2["status"] == "COMPLETED" else ModuleExecutionState.COMPLETED_WITH_WARNINGS
            m2_run.summary_json = json.dumps({"summary": s2, "comparisons": delta_comp})
            all_findings.extend([dict(f, module_name="INSTITUTIONAL_HISTORY") for f in f2])
            db.commit()

            # --- MODULE 3: Anomaly and Potential Forgery Screening ---
            m3_start = time.time()
            m3_run = module_run_map[ModuleName.ANOMALY_FORGERY]
            # Cross-institution document collision check
            cross_hashes = {}
            other_docs = db.query(ApplicationDocument).filter(
                ApplicationDocument.application_id != application_id
            ).all()
            for od in other_docs:
                cross_hashes[od.sha256_hash] = str(od.application_id)

            f3, s3 = forgery_screener.run_screening(doc_dicts, cross_hashes)
            m3_run.execution_time_ms = int((time.time() - m3_start) * 1000)
            m3_run.completed_at = datetime.now(timezone.utc)
            m3_run.progress_pct = 100
            m3_run.status = ModuleExecutionState.COMPLETED if s3["status"] == "COMPLETED" else ModuleExecutionState.COMPLETED_WITH_WARNINGS
            m3_run.summary_json = json.dumps(s3)
            all_findings.extend([dict(f, module_name="ANOMALY_FORGERY") for f in f3])
            db.commit()

            # --- MODULE 4: Issuing-Authority Verification ---
            m4_start = time.time()
            m4_run = module_run_map[ModuleName.ISSUING_AUTHORITY]
            f4, s4, auth_records = authority_verifier.verify_application(app_data, extracted_fields, doc_dicts)
            m4_run.execution_time_ms = int((time.time() - m4_start) * 1000)
            m4_run.completed_at = datetime.now(timezone.utc)
            m4_run.progress_pct = 100
            m4_run.status = ModuleExecutionState.COMPLETED if s4["status"] == "COMPLETED" else ModuleExecutionState.COMPLETED_WITH_WARNINGS
            m4_run.summary_json = json.dumps(s4)
            all_findings.extend([dict(f, module_name="ISSUING_AUTHORITY") for f in f4])

            # Persist authority records
            for ar in auth_records:
                avr = AuthorityVerificationRecord(
                    application_id=application_id,
                    authority_name=ar.get("authority_name", "Unknown Authority"),
                    query_identifier=ar.get("query_identifier", "N/A"),
                    status=ar.get("status", "NOT_VERIFIED"),
                    reference_number=ar.get("reference_number"),
                    response_payload_json=json.dumps(ar.get("response_payload", {})),
                    notes=ar.get("notes", ""),
                    verified_at=ar.get("verified_at")
                )
                db.add(avr)
            db.commit()

            # --- MODULE 5: Infrastructure Evidence Analysis ---
            m5_start = time.time()
            m5_run = module_run_map[ModuleName.INFRASTRUCTURE_CV]
            f5, s5, detected_facilities = infrastructure_vision_analyzer.analyze_infrastructure(app_data, doc_dicts)
            m5_run.execution_time_ms = int((time.time() - m5_start) * 1000)
            m5_run.completed_at = datetime.now(timezone.utc)
            m5_run.progress_pct = 100
            m5_run.status = ModuleExecutionState.COMPLETED if s5["status"] == "COMPLETED" else ModuleExecutionState.COMPLETED_WITH_WARNINGS
            m5_run.summary_json = json.dumps({"summary": s5, "facilities": detected_facilities})
            all_findings.extend([dict(f, module_name="INFRASTRUCTURE_CV") for f in f5])
            db.commit()

            # --- PERSIST FINDINGS & EXPLAINABLE RISK SCORE ---
            # Save findings
            crit_count = 0
            high_count = 0
            med_count = 0
            low_count = 0

            for f in all_findings:
                vf = ValidationFinding(
                    validation_run_id=val_run.id,
                    module_name=f.get("module_name", "UNKNOWN"),
                    rule_id=f.get("rule_id", "GENERIC_RULE"),
                    title=f.get("title"),
                    explanation=f.get("explanation"),
                    severity=f.get("severity", "MEDIUM"),
                    category=f.get("category", "GENERAL"),
                    evidence_ref=f.get("evidence_ref"),
                    document_id=f.get("document_id"),
                    confidence=f.get("confidence", 1.0)
                )
                db.add(vf)
                if vf.severity == SeverityLevel.CRITICAL:
                    crit_count += 1
                elif vf.severity == SeverityLevel.HIGH:
                    high_count += 1
                elif vf.severity == SeverityLevel.MEDIUM:
                    med_count += 1
                else:
                    low_count += 1
            db.commit()

            # Calculate explainable score
            score, risk_band, rec_action, contributions, analytics = scoring_engine.calculate_score(all_findings)

            # Persist risk score contributions
            for c in contributions:
                rsc = RiskScoreContribution(
                    validation_run_id=val_run.id,
                    rule_id=c.get("rule_id", "GENERIC_RULE"),
                    rule_version=c.get("rule_version", "1.0"),
                    category=c.get("category", "GENERAL"),
                    weight=c.get("weight", 0.0),
                    contribution=c.get("contribution", 0.0),
                    explanation=c.get("explanation", ""),
                    evidence_ref=c.get("evidence_ref")
                )
                db.add(rsc)
            db.commit()

            # Update ValidationRun
            total_duration = int((time.time() - start_time) * 1000)
            val_run.status = ValidationRunStatus.COMPLETED if crit_count == 0 and high_count == 0 else ValidationRunStatus.COMPLETED_WITH_WARNINGS
            val_run.completed_at = datetime.now(timezone.utc)
            val_run.execution_time_ms = total_duration
            val_run.risk_score = score
            val_run.risk_band = risk_band
            val_run.total_findings = len(all_findings)
            val_run.critical_findings = crit_count
            val_run.high_findings = high_count
            val_run.medium_findings = med_count
            val_run.low_findings = low_count
            db.commit()

            # Update Application
            app.overall_risk_score = score
            app.risk_band = RiskBand(risk_band)
            
            # ATTENTION ROUTING POLICY (Section 9):
            # If critical findings > 0 or score >= 50 or high findings >= 2, alert official
            attention_reasons = []
            if crit_count > 0:
                attention_reasons.append(f"{crit_count} Critical Regulatory Discrepancies Detected")
            if score >= 50:
                attention_reasons.append(f"High Composite Risk Score: {score}/100")
            if high_count >= 2:
                attention_reasons.append(f"{high_count} High-Severity Finding Alerts")

            if attention_reasons:
                app.attention_required = True
                app.attention_reasons = "; ".join(attention_reasons)
                app.status = ApplicationStatus.REQUIRES_ATTENTION

                # Create Official Alert record
                alert = OfficialAlert(
                    application_id=app.id,
                    title=f"Regulatory Scrutiny Required: {app.application_number}",
                    reason=f"{institution.legal_name if institution else 'Applicant'}: {'; '.join(attention_reasons)}",
                    severity=AlertSeverity.CRITICAL if crit_count > 0 else AlertSeverity.WARNING,
                    target_role="VALIDATION_OFFICER"
                )
                db.add(alert)
            else:
                app.attention_required = False
                app.status = ApplicationStatus.PRELIMINARY_VALIDATION_COMPLETED

            db.commit()

            # Create Structured Report
            summary_json_data = {
                "application_number": app.application_number,
                "institution_name": institution.legal_name if institution else "",
                "risk_score": score,
                "risk_band": risk_band,
                "recommended_action": rec_action,
                "total_findings": len(all_findings),
                "critical_findings": crit_count,
                "high_findings": high_count,
                "execution_time_ms": total_duration,
                "analytics": analytics
            }

            report = ValidationReport(
                application_id=app.id,
                validation_run_id=val_run.id,
                report_number=f"REP-{app.application_number}-{val_run.run_number:02d}",
                risk_score=score,
                risk_band=risk_band,
                recommended_action=rec_action,
                summary_json=json.dumps(summary_json_data),
                full_report_json=json.dumps({
                    "application": app_data,
                    "checklist_snapshot": checklist_items,
                    "findings": all_findings,
                    "contributions": contributions,
                    "analytics": analytics
                }),
                is_partial=False
            )
            db.add(report)
            db.commit()

            # Audit completion
            audit_service.record_event(
                db=db,
                actor_id=actor_id,
                actor_role=actor_role,
                action="VALIDATION_RUN_COMPLETED",
                entity_type="VALIDATION_RUN",
                entity_id=str(val_run.id),
                metadata={
                    "risk_score": score,
                    "risk_band": risk_band,
                    "findings_count": len(all_findings),
                    "attention_required": app.attention_required
                }
            )

            return val_run

        except Exception as e:
            logger.exception(f"Validation pipeline failed for application {application_id}: {e}")
            val_run.status = ValidationRunStatus.FAILED
            val_run.completed_at = datetime.now(timezone.utc)
            db.commit()

            audit_service.record_event(
                db=db,
                actor_id=actor_id,
                actor_role=actor_role,
                action="VALIDATION_RUN_FAILED",
                entity_type="VALIDATION_RUN",
                entity_id=str(val_run.id),
                metadata={"error": str(e)}
            )
            raise e

orchestrator_service = ValidationOrchestrator()
