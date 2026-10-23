import os
import json
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, RoleEnum
from app.security.deps import require_roles
from app.core.config import settings
from app.services.audit_service import audit_service

router = APIRouter(prefix="/admin/rules", tags=["Rules & Thresholds"])

@router.get("")
def get_all_rules():
    """Returns all active versioned rules and threshold definitions."""
    results = {}
    rule_types = ["categories", "checklists", "anomaly", "infrastructure", "scoring"]
    
    for rt in rule_types:
        folder = os.path.join(settings.RULES_DIR, rt)
        if os.path.exists(folder):
            files = os.listdir(folder)
            for f in files:
                if f.endswith(".json"):
                    with open(os.path.join(folder, f), "r") as fp:
                        results[rt] = json.load(fp)
    return results

@router.post("/{rule_type}")
def update_rule_config(
    rule_type: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.SYSTEM_ADMINISTRATOR]))
):
    target_folder = os.path.join(settings.RULES_DIR, rule_type)
    if not os.path.exists(target_folder):
        raise HTTPException(status_code=404, detail=f"Rule type '{rule_type}' not recognized.")

    target_file = os.path.join(target_folder, "weights.json" if rule_type == "scoring" else ("checklists.json" if rule_type == "checklists" else "rules.json"))
    
    with open(target_file, "w") as fp:
        json.dump(payload, fp, indent=2)

    audit_service.record_event(
        db=db,
        actor_id=str(current_user.id),
        actor_role=current_user.role.value,
        action="RULE_CONFIGURATION_MODIFIED",
        entity_type="SYSTEM_RULES",
        entity_id=rule_type,
        metadata={"rule_type": rule_type, "new_version": payload.get("version", "unknown")}
    )

    return {"message": f"Rule configuration '{rule_type}' successfully updated and audited.", "version": payload.get("version")}
