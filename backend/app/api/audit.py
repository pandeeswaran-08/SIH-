from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.audit import AuditEvent
from app.schemas.schemas import AuditEventResponse, AuditChainVerifyResponse
from app.services.audit_service import audit_service

router = APIRouter(prefix="/audit", tags=["Tamper-Evident Audit Trail"])

@router.get("", response_model=List[AuditEventResponse])
def get_audit_trail(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)
    if entity_type:
        query = query.filter(AuditEvent.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditEvent.entity_id == str(entity_id))
    
    events = query.order_by(AuditEvent.id.desc()).offset(skip).limit(limit).all()
    return events

@router.post("/verify", response_model=AuditChainVerifyResponse)
def verify_audit_chain(db: Session = Depends(get_db)):
    """
    Cryptographically traverses the entire SHA-256 hash chain from genesis to head,
    verifying block links and canonical hash integrity.
    """
    is_valid, checked_count, error_msg = audit_service.verify_chain_integrity(db)
    return {
        "is_valid": is_valid,
        "total_events_checked": checked_count,
        "error_explanation": error_msg
    }
