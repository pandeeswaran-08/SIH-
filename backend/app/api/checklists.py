import os
import json
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.checklist import ChecklistSnapshot
from app.core.config import settings

router = APIRouter(prefix="/checklists", tags=["Checklists"])

@router.get("")
def get_checklist_templates():
    path = os.path.join(settings.RULES_DIR, "checklists", "checklists.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {"templates": {}}

@router.get("/applications/{id}")
def get_application_checklist(id: int, db: Session = Depends(get_db)):
    snap = db.query(ChecklistSnapshot).filter(ChecklistSnapshot.application_id == id).first()
    if not snap:
        raise HTTPException(status_code=404, detail="Checklist snapshot not found for application")
    return {
        "id": snap.id,
        "template_code": snap.template_code,
        "rule_version": snap.rule_version,
        "academic_year": snap.academic_year,
        "items": json.loads(snap.items_json)
    }
