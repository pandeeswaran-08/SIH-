import os
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.core.config import settings
from ai_engine.model_registry.registry import model_registry

router = APIRouter(prefix="/system", tags=["System Health & Diagnostics"])

@router.get("/health")
def get_system_health(db: Session = Depends(get_db)):
    # 1. Database check
    db_status = "HEALTHY"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"ERROR: {str(e)}"

    # 2. Storage check
    storage_status = "HEALTHY"
    storage_free_mb = 0
    try:
        stat = os.statvfs(settings.STORAGE_LOCAL_DIR) if hasattr(os, 'statvfs') else None
        if not os.path.exists(settings.STORAGE_LOCAL_DIR):
            storage_status = "DIR_NOT_FOUND"
    except Exception:
        pass

    # 3. Model registry and hardware
    sys_metrics = model_registry.get_system_stats()

    return {
        "status": "OPERATIONAL" if db_status == "HEALTHY" else "DEGRADED",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": {
            "status": db_status,
            "engine": "PostgreSQL" if settings.DATABASE_URL.startswith("postgresql") else "SQLite3"
        },
        "storage": {
            "status": storage_status,
            "backend": settings.STORAGE_BACKEND,
            "local_dir": settings.STORAGE_LOCAL_DIR
        },
        "ai_hardware": sys_metrics,
        "concurrency": {
            "max_workers": settings.MAX_CONCURRENT_WORKERS,
            "mode": settings.EXECUTION_MODE
        }
    }
