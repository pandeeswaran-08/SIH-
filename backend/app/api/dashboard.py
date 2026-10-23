from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.application import Application, ApplicationStatus, RiskBand
from app.models.alert import OfficialAlert
from app.models.document import ApplicationDocument
from app.models.validation import ValidationRun
from app.schemas.schemas import DashboardSummaryResponse
from ai_engine.model_registry.registry import model_registry

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_apps = db.query(Application).count()
    processing_count = db.query(Application).filter(Application.status == ApplicationStatus.VALIDATING).count()
    completed_count = db.query(Application).filter(
        Application.status.in_([
            ApplicationStatus.PRELIMINARY_VALIDATION_COMPLETED,
            ApplicationStatus.APPROVED,
            ApplicationStatus.REJECTED
        ])
    ).count()
    attention_count = db.query(Application).filter(Application.attention_required == True).count()

    # Risk Distribution
    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    risk_counts = db.query(Application.risk_band, func.count(Application.id)).group_by(Application.risk_band).all()
    for rb, cnt in risk_counts:
        if rb:
            risk_dist[rb.value] = cnt

    # Category Distribution
    cat_counts = db.query(Application.category, func.count(Application.id)).group_by(Application.category).all()
    cat_dist = {cat: cnt for cat, cnt in cat_counts if cat}

    # Avg Processing Latency
    avg_latency = db.query(func.avg(ValidationRun.execution_time_ms)).scalar() or 1240.0

    # OCR Success Rate
    total_docs = db.query(ApplicationDocument).count()
    unreadable_docs = db.query(ApplicationDocument).filter(ApplicationDocument.is_unreadable == True).count()
    ocr_rate = round(100.0 * (total_docs - unreadable_docs) / max(1, total_docs), 1)

    # Active Alerts
    active_alerts = db.query(OfficialAlert).filter(OfficialAlert.is_resolved == False).count()

    # Hardware & System Health
    sys_health = model_registry.get_system_stats()

    return {
        "total_applications": total_apps,
        "applications_processing": processing_count,
        "completed_validations": completed_count,
        "attention_required_count": attention_count,
        "risk_distribution": risk_dist,
        "category_distribution": cat_dist,
        "avg_processing_latency_ms": round(float(avg_latency), 1),
        "ocr_success_rate": ocr_rate,
        "active_alerts_count": active_alerts,
        "system_health": sys_health
    }
