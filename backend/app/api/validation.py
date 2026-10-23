import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.application import Application
from app.models.validation import ValidationRun, ValidationRunStatus
from app.models.finding import ValidationFinding, ReviewerDisposition
from app.models.user import User, RoleEnum
from app.schemas.schemas import (
    ValidationRunResponse, ValidationFindingResponse,
    FindingDispositionUpdate
)
from app.security.deps import get_current_user, require_roles
from app.services.orchestrator_service import orchestrator_service
from app.services.audit_service import audit_service

router = APIRouter(tags=["Validation"])

@router.post("/applications/{id}/validate", response_model=ValidationRunResponse)
def trigger_validation(
    id: int,
    idempotency_key: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    key = idempotency_key or f"val-{id}-{uuid.uuid4().hex[:8]}"
    actor_id = str(current_user.id) if current_user else "SYSTEM"
    actor_role = current_user.role.value if current_user else "VALIDATION_OFFICER"

    try:
        val_run = orchestrator_service.run_validation_pipeline(
            db=db,
            application_id=id,
            idempotency_key=key,
            actor_id=actor_id,
            actor_role=actor_role
        )
        return val_run
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation orchestration error: {str(e)}")

@router.get("/applications/{id}/validation-status", response_model=Optional[ValidationRunResponse])
def get_validation_status(id: int, db: Session = Depends(get_db)):
    val_run = db.query(ValidationRun).filter(
        ValidationRun.application_id == id,
        ValidationRun.is_current == True
    ).first()
    if not val_run:
        val_run = db.query(ValidationRun).filter(
            ValidationRun.application_id == id
        ).order_by(ValidationRun.id.desc()).first()
    return val_run

@router.get("/applications/{id}/findings", response_model=List[ValidationFindingResponse])
def get_application_findings(id: int, db: Session = Depends(get_db)):
    val_run = db.query(ValidationRun).filter(
        ValidationRun.application_id == id,
        ValidationRun.is_current == True
    ).first()
    if not val_run:
        return []
    findings = db.query(ValidationFinding).filter(ValidationFinding.validation_run_id == val_run.id).all()
    return findings

@router.patch("/findings/{id}/disposition", response_model=ValidationFindingResponse)
def update_finding_disposition(
    id: int,
    disposition_in: FindingDispositionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.VALIDATION_OFFICER, RoleEnum.SENIOR_REVIEWING_OFFICER, RoleEnum.SYSTEM_ADMINISTRATOR]))
):
    finding = db.query(ValidationFinding).filter(ValidationFinding.id == id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    old_disp = finding.reviewer_disposition.value
    finding.reviewer_disposition = ReviewerDisposition(disposition_in.disposition)
    finding.reviewer_notes = disposition_in.notes
    finding.reviewed_by_user_id = current_user.id
    db.commit()
    db.refresh(finding)

    audit_service.record_event(
        db=db,
        actor_id=str(current_user.id),
        actor_role=current_user.role.value,
        action="FINDING_DISPOSITION_UPDATED",
        entity_type="FINDING",
        entity_id=str(finding.id),
        metadata={
            "rule_id": finding.rule_id,
            "old_disposition": old_disp,
            "new_disposition": finding.reviewer_disposition.value,
            "notes": disposition_in.notes
        }
    )

    return finding
