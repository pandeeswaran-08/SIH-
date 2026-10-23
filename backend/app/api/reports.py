import os
import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.application import Application
from app.models.institution import Institution
from app.models.validation import ValidationRun
from app.models.finding import ValidationFinding
from app.models.risk import RiskScoreContribution
from app.models.report import ValidationReport
from app.models.document import ApplicationDocument
from app.models.extracted_field import ExtractedField
from app.models.verification import AuthorityVerificationRecord
from app.services.report_service import report_service
from app.services.storage_service import storage_service

router = APIRouter(tags=["Reports & Evidence"])

@router.get("/applications/{id}/report")
def get_validation_report(id: int, db: Session = Depends(get_db)):
    report = db.query(ValidationReport).filter(
        ValidationReport.application_id == id
    ).order_by(ValidationReport.id.desc()).first()

    if not report:
        raise HTTPException(status_code=404, detail="Validation report has not been generated yet. Please run validation first.")

    return {
        "id": report.id,
        "application_id": report.application_id,
        "report_number": report.report_number,
        "risk_score": report.risk_score,
        "risk_band": report.risk_band,
        "recommended_action": report.recommended_action,
        "generated_at": report.generated_at,
        "summary": json.loads(report.summary_json),
        "full_report": json.loads(report.full_report_json)
    }

@router.get("/applications/{id}/report/pdf")
def get_report_pdf(id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    report = db.query(ValidationReport).filter(
        ValidationReport.application_id == id
    ).order_by(ValidationReport.id.desc()).first()

    if not report:
        raise HTTPException(status_code=404, detail="Validation report has not been generated yet.")

    institution = db.query(Institution).filter(Institution.id == app.institution_id).first()
    val_run = db.query(ValidationRun).filter(ValidationRun.id == report.validation_run_id).first()
    findings = db.query(ValidationFinding).filter(ValidationFinding.validation_run_id == report.validation_run_id).all()

    report_payload = {
        "application": {
            "application_number": app.application_number,
            "academic_year": app.academic_year,
            "legal_name": institution.legal_name if institution else "",
            "aicte_permanent_id": institution.aicte_permanent_id if institution else "",
            "category": app.category
        },
        "risk_score": report.risk_score,
        "risk_band": report.risk_band,
        "recommended_action": report.recommended_action,
        "summary": json.loads(report.summary_json),
        "findings": [
            {
                "severity": f.severity.value,
                "module_name": f.module_name,
                "title": f.title,
                "explanation": f.explanation,
                "evidence_ref": f.evidence_ref
            }
            for f in findings
        ]
    }

    filename = f"AICTE_Report_{app.application_number}.pdf"
    rel_pdf_path = report_service.generate_pdf_report(report_payload, filename)
    full_pdf_path = storage_service.get_full_path(rel_pdf_path)

    return FileResponse(
        path=full_pdf_path,
        media_type="application/pdf",
        filename=filename
    )

@router.get("/applications/{id}/evidence")
def get_evidence_explorer(id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    docs = db.query(ApplicationDocument).filter(ApplicationDocument.application_id == id).all()
    fields = db.query(ExtractedField).filter(ExtractedField.application_id == id).all()
    verifications = db.query(AuthorityVerificationRecord).filter(AuthorityVerificationRecord.application_id == id).all()
    
    val_run = db.query(ValidationRun).filter(
        ValidationRun.application_id == id,
        ValidationRun.is_current == True
    ).first()
    
    findings = []
    contributions = []
    if val_run:
        findings = db.query(ValidationFinding).filter(ValidationFinding.validation_run_id == val_run.id).all()
        contributions = db.query(RiskScoreContribution).filter(RiskScoreContribution.validation_run_id == val_run.id).all()

    return {
        "application_number": app.application_number,
        "documents": [
            {
                "id": d.id,
                "filename": d.filename,
                "document_type": d.document_type.value,
                "file_size": d.file_size_bytes,
                "sha256": d.sha256_hash,
                "page_count": d.page_count,
                "status": d.status.value,
                "is_unreadable": d.is_unreadable
            }
            for d in docs
        ],
        "extracted_fields": [
            {
                "id": ef.id,
                "document_id": ef.document_id,
                "field_name": ef.field_name,
                "declared_value": ef.declared_value,
                "extracted_value": ef.extracted_value,
                "confidence": ef.confidence,
                "source_page": ef.source_page,
                "evidence_ref": ef.evidence_ref,
                "bbox": json.loads(ef.bbox_json) if ef.bbox_json else None
            }
            for ef in fields
        ],
        "authority_verifications": [
            {
                "authority_name": v.authority_name,
                "query_identifier": v.query_identifier,
                "status": v.status.value,
                "reference_number": v.reference_number,
                "notes": v.notes,
                "verified_at": v.verified_at
            }
            for v in verifications
        ],
        "findings": [
            {
                "id": f.id,
                "module_name": f.module_name,
                "rule_id": f.rule_id,
                "title": f.title,
                "explanation": f.explanation,
                "severity": f.severity.value,
                "category": f.category,
                "evidence_ref": f.evidence_ref,
                "disposition": f.reviewer_disposition.value,
                "notes": f.reviewer_notes
            }
            for f in findings
        ],
        "risk_contributions": [
            {
                "rule_id": c.rule_id,
                "category": c.category,
                "weight": c.weight,
                "contribution": c.contribution,
                "explanation": c.explanation,
                "evidence_ref": c.evidence_ref
            }
            for c in contributions
        ]
    }
