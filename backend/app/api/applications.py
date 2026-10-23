import json
import os
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.application import Application, ApplicationStatus, ApplicationType, RiskBand
from app.models.institution import Institution
from app.models.checklist import ChecklistSnapshot
from app.models.user import User, RoleEnum
from app.schemas.schemas import ApplicationCreate, ApplicationResponse
from app.security.deps import get_current_user, require_roles
from app.core.security import generate_reference_id
from app.core.config import settings
from app.services.audit_service import audit_service

router = APIRouter(prefix="/applications", tags=["Applications"])

def detect_category(name: str, requested_category: str) -> tuple[str, str, float]:
    """Applies category rules based on institutional name and requested programs."""
    rules_path = os.path.join(settings.RULES_DIR, "categories", "rules.json")
    if os.path.exists(rules_path):
        with open(rules_path, "r") as f:
            data = json.load(f)
            categories = data.get("categories", [])
            name_lower = name.lower()
            for cat in categories:
                for kw in cat.get("keywords", []):
                    if kw in name_lower:
                        return cat["id"], "DETERMINISTIC_RULES", 0.95
    return requested_category, "DECLARATION_MATCH", 0.85

@router.post("", response_model=ApplicationResponse)
def create_application(
    app_in: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    actor_id = str(current_user.id) if current_user else "GUEST_APPLICANT"
    actor_role = current_user.role.value if current_user else "APPLICANT"

    # 1. Institution lookup or create
    inst_id = app_in.institution_id
    if not inst_id:
        # Create new institution record
        perm_id = app_in.aicte_permanent_id or f"1-{datetime.now().strftime('%Y%m%d%H%M')}"
        institution = Institution(
            legal_name=app_in.legal_name or "New Technical Institute",
            aicte_permanent_id=perm_id,
            category=app_in.category,
            state=app_in.state or "Delhi",
            district=app_in.district or "New Delhi",
            pin_code=app_in.pin_code or "110001",
            address=app_in.address or "Institutional Area, Sector 5",
            establishment_year=app_in.establishment_year or 2020,
            land_area_acres=app_in.declared_land_acres,
            builtup_area_sqm=app_in.declared_builtup_sqm,
            contact_email=app_in.contact_email or "contact@institute.edu.in",
            contact_phone=app_in.contact_phone or "011-23456789"
        )
        db.add(institution)
        db.commit()
        db.refresh(institution)
        inst_id = institution.id
    else:
        institution = db.query(Institution).filter(Institution.id == inst_id).first()
        if not institution:
            raise HTTPException(status_code=404, detail="Specified Institution ID not found")

    # 2. Category Detection
    detected_cat, method, confidence = detect_category(institution.legal_name, app_in.category)

    # 3. Create Application
    app_num = generate_reference_id("APP")
    application = Application(
        application_number=app_num,
        institution_id=inst_id,
        applicant_user_id=current_user.id if current_user else None,
        academic_year=app_in.academic_year,
        category=app_in.category,
        detected_category=detected_cat,
        category_classification_method=method,
        category_confidence=confidence,
        application_type=ApplicationType(app_in.application_type),
        status=ApplicationStatus.SUBMITTED,
        declared_land_acres=app_in.declared_land_acres,
        declared_builtup_sqm=app_in.declared_builtup_sqm,
        declared_faculty_count=app_in.declared_faculty_count,
        declared_student_intake=app_in.declared_student_intake
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    # 4. Attach Category-Specific Checklist Snapshot
    checklist_path = os.path.join(settings.RULES_DIR, "checklists", "checklists.json")
    items_to_snapshot = []
    template_code = "CHK_ENG_2026"
    
    if os.path.exists(checklist_path):
        with open(checklist_path, "r") as f:
            chk_data = json.load(f)
            templates = chk_data.get("templates", {})
            # Match template by category
            for t_code, t_val in templates.items():
                if t_val.get("category") == app_in.category:
                    template_code = t_code
                    items_to_snapshot = [dict(it, status="PENDING") for it in t_val.get("items", [])]
                    break
    
    if not items_to_snapshot:
        # Fallback items
        items_to_snapshot = [
            {"code": "CHK_01", "title": "Land Ownership Deed", "doc_type": "LAND_OWNERSHIP", "is_mandatory": True, "status": "PENDING"},
            {"code": "CHK_02", "title": "Affiliation Certificate", "doc_type": "AFFILIATION_CERT", "is_mandatory": True, "status": "PENDING"},
            {"code": "CHK_03", "title": "Building Sanction Plan", "doc_type": "BUILDING_PLAN", "is_mandatory": True, "status": "PENDING"},
            {"code": "CHK_04", "title": "Fire Safety NOC", "doc_type": "FIRE_SAFETY", "is_mandatory": True, "status": "PENDING"}
        ]

    snapshot = ChecklistSnapshot(
        application_id=application.id,
        template_code=template_code,
        rule_version="2026.1.0",
        academic_year=app_in.academic_year,
        items_json=json.dumps(items_to_snapshot)
    )
    db.add(snapshot)
    db.commit()

    # 5. Audit event
    audit_service.record_event(
        db=db,
        actor_id=actor_id,
        actor_role=actor_role,
        action="APPLICATION_SUBMITTED",
        entity_type="APPLICATION",
        entity_id=str(application.id),
        metadata={
            "application_number": application.application_number,
            "category": application.category,
            "academic_year": application.academic_year
        }
    )

    return application

@router.get("", response_model=List[ApplicationResponse])
def list_applications(
    search: Optional[str] = Query(None, description="Search by application number or institute name"),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    risk_band: Optional[str] = Query(None),
    attention_only: Optional[bool] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Application).join(Institution, Application.institution_id == Institution.id)

    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                Application.application_number.ilike(s),
                Institution.legal_name.ilike(s),
                Institution.aicte_permanent_id.ilike(s)
            )
        )
    if category:
        query = query.filter(Application.category == category)
    if status:
        query = query.filter(Application.status == status)
    if risk_band:
        query = query.filter(Application.risk_band == risk_band)
    if attention_only:
        query = query.filter(Application.attention_required == True)

    apps = query.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()
    return apps

@router.get("/{id}", response_model=ApplicationResponse)
def get_application(id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app

@router.patch("/{id}/category", response_model=ApplicationResponse)
def correct_category(
    id: int,
    new_category: str = Query(...),
    justification: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.VALIDATION_OFFICER, RoleEnum.SENIOR_REVIEWING_OFFICER, RoleEnum.SYSTEM_ADMINISTRATOR]))
):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    old_cat = app.category
    app.category = new_category
    app.category_overridden = True
    db.commit()

    audit_service.record_event(
        db=db,
        actor_id=str(current_user.id),
        actor_role=current_user.role.value,
        action="CATEGORY_OVERRIDDEN",
        entity_type="APPLICATION",
        entity_id=str(app.id),
        metadata={
            "old_category": old_cat,
            "new_category": new_category,
            "justification": justification
        }
    )

    return app
