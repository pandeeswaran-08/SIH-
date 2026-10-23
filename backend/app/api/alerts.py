from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.alert import OfficialAlert
from app.models.application import Application
from app.models.user import User, RoleEnum
from app.schemas.schemas import AlertResponse, AlertUpdate
from app.security.deps import get_current_user, require_roles
from app.services.audit_service import audit_service

router = APIRouter(prefix="/alerts", tags=["Alerts & Case Management"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    unresolved_only: bool = Query(True),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(OfficialAlert)
    if unresolved_only:
        query = query.filter(OfficialAlert.is_resolved == False)
    alerts = query.order_by(OfficialAlert.created_at.desc()).offset(skip).limit(limit).all()
    return alerts

@router.patch("/{id}", response_model=AlertResponse)
def update_alert(
    id: int,
    alert_in: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.VALIDATION_OFFICER, RoleEnum.SENIOR_REVIEWING_OFFICER, RoleEnum.SYSTEM_ADMINISTRATOR]))
):
    alert = db.query(OfficialAlert).filter(OfficialAlert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_resolved = alert_in.is_resolved
    alert.resolution_notes = alert_in.resolution_notes
    if alert_in.is_resolved:
        alert.resolved_at = datetime.now(timezone.utc)
        alert.assigned_to_user_id = current_user.id

    db.commit()
    db.refresh(alert)

    audit_service.record_event(
        db=db,
        actor_id=str(current_user.id),
        actor_role=current_user.role.value,
        action="ALERT_RESOLVED" if alert.is_resolved else "ALERT_UPDATED",
        entity_type="ALERT",
        entity_id=str(alert.id),
        metadata={
            "application_id": alert.application_id,
            "resolution_notes": alert.resolution_notes
        }
    )

    return alert
