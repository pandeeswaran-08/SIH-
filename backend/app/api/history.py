import json
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.application import Application
from app.models.institution import Institution
from app.models.validation import ValidationRun, ModuleRun, ModuleName

router = APIRouter(prefix="/history", tags=["Institutional History"])

@router.get("/applications/{id}")
def get_institutional_history(id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    institution = db.query(Institution).filter(Institution.id == app.institution_id).first()

    # Get current validation run module 2 summary if available
    val_run = db.query(ValidationRun).filter(
        ValidationRun.application_id == id,
        ValidationRun.is_current == True
    ).first()

    comparisons = []
    summary = {}

    if val_run:
        m2_run = db.query(ModuleRun).filter(
            ModuleRun.validation_run_id == val_run.id,
            ModuleRun.module_name == ModuleName.INSTITUTIONAL_HISTORY
        ).first()
        if m2_run and m2_run.summary_json:
            parsed = json.loads(m2_run.summary_json)
            comparisons = parsed.get("comparisons", [])
            summary = parsed.get("summary", {})

    # Also list all historical application records for this institution
    all_past = db.query(Application).filter(
        Application.institution_id == app.institution_id
    ).order_by(Application.created_at.desc()).all()

    timeline = [
        {
            "application_id": p.id,
            "application_number": p.application_number,
            "academic_year": p.academic_year,
            "status": p.status.value,
            "risk_score": p.overall_risk_score,
            "submission_date": p.submission_date
        }
        for p in all_past
    ]

    return {
        "institution": {
            "legal_name": institution.legal_name if institution else "",
            "aicte_permanent_id": institution.aicte_permanent_id if institution else "",
            "establishment_year": institution.establishment_year if institution else 2020,
            "state": institution.state if institution else "",
            "district": institution.district if institution else ""
        },
        "comparisons": comparisons,
        "summary": summary,
        "timeline": timeline
    }
