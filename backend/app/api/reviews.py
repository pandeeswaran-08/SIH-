from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.application import Application, ApplicationStatus
from app.models.review import RegulatoryDecision, ReviewComment, DecisionType
from app.models.user import User, RoleEnum
from app.schemas.schemas import (
    DecisionCreate, DecisionResponse,
    CommentCreate, CommentResponse
)
from app.security.deps import get_current_user, require_roles
from app.services.audit_service import audit_service

router = APIRouter(tags=["Review & Human Decisions"])

@router.post("/applications/{id}/review", response_model=DecisionResponse)
def record_decision(
    id: int,
    decision_in: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.VALIDATION_OFFICER, RoleEnum.SENIOR_REVIEWING_OFFICER, RoleEnum.SYSTEM_ADMINISTRATOR]))
):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    decision = RegulatoryDecision(
        application_id=app.id,
        officer_id=current_user.id,
        decision_type=DecisionType(decision_in.decision_type),
        notes=decision_in.notes,
        clarification_details=decision_in.clarification_details,
        official_signature=decision_in.official_signature,
        decision_timestamp=datetime.now(timezone.utc)
    )
    db.add(decision)

    # Update application status reflecting human regulatory decision
    if decision.decision_type == DecisionType.APPROVAL_RECOMMENDED:
        app.status = ApplicationStatus.APPROVED
    elif decision.decision_type == DecisionType.REJECTION_RECOMMENDED:
        app.status = ApplicationStatus.REJECTED
    elif decision.decision_type == DecisionType.CLARIFICATION_REQUESTED:
        app.status = ApplicationStatus.CLARIFICATION_REQUESTED
    elif decision.decision_type == DecisionType.ESCALATED_TO_COMMITTEE:
        app.status = ApplicationStatus.IN_SENIOR_REVIEW

    db.commit()
    db.refresh(decision)

    audit_service.record_event(
        db=db,
        actor_id=str(current_user.id),
        actor_role=current_user.role.value,
        action="REGULATORY_DECISION_RECORDED",
        entity_type="APPLICATION",
        entity_id=str(app.id),
        metadata={
            "decision_type": decision.decision_type.value,
            "signature": decision.official_signature,
            "notes": decision.notes
        }
    )

    return decision

@router.get("/applications/{id}/reviews", response_model=List[DecisionResponse])
def get_decisions(id: int, db: Session = Depends(get_db)):
    decisions = db.query(RegulatoryDecision).filter(RegulatoryDecision.application_id == id).order_by(RegulatoryDecision.decision_timestamp.desc()).all()
    return decisions

@router.post("/applications/{id}/comments", response_model=CommentResponse)
def add_comment(
    id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    comment = ReviewComment(
        application_id=app.id,
        user_id=current_user.id,
        comment_text=comment_in.comment_text
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    audit_service.record_event(
        db=db,
        actor_id=str(current_user.id),
        actor_role=current_user.role.value,
        action="REVIEW_COMMENT_ADDED",
        entity_type="APPLICATION",
        entity_id=str(app.id),
        metadata={"comment_text": comment.comment_text[:100]}
    )

    return comment

@router.get("/applications/{id}/comments", response_model=List[CommentResponse])
def get_comments(id: int, db: Session = Depends(get_db)):
    comments = db.query(ReviewComment).filter(ReviewComment.application_id == id).order_by(ReviewComment.created_at.asc()).all()
    return comments
