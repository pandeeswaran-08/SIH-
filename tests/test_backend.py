import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.services.audit_service import audit_service
from app.models.user import User

client = TestClient(app)

def test_system_health():
    response = client.get("/api/system/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["OPERATIONAL", "HEALTHY"]
    assert "database" in data
    assert "ai_hardware" in data

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_applications" in data
    assert "risk_distribution" in data
    assert "ocr_success_rate" in data

def test_list_applications():
    response = client.get("/api/applications")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_application_creation_and_category_detection():
    payload = {
        "legal_name": "Delhi Polytechnic Institute of Engineering & Technology",
        "category": "ENGINEERING_TECH",
        "academic_year": "2026-2027",
        "state": "Delhi",
        "district": "South Delhi",
        "pin_code": "110016",
        "address": "Okhla Industrial Area Phase III",
        "establishment_year": 2012,
        "contact_email": "director@delhipoly.edu.in",
        "contact_phone": "011-26901234",
        "declared_land_acres": 5.0,
        "declared_builtup_sqm": 7200.0
    }
    response = client.post("/api/applications", json=payload)
    assert response.status_code == 200
    app_data = response.json()
    assert app_data["category"] == "ENGINEERING_TECH"
    assert app_data["detected_category"] == "ENGINEERING_TECH"
    assert app_data["application_number"].startswith("APP-")

def test_tamper_evident_audit_verification():
    response = client.post("/api/audit/verify")
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["total_events_checked"] >= 1
    assert data["error_explanation"] is None

def test_alerts_listing():
    response = client.get("/api/alerts?unresolved_only=false")
    assert response.status_code == 200
    alerts = response.json()
    assert isinstance(alerts, list)

def test_rules_admin_listing():
    response = client.get("/api/admin/rules")
    assert response.status_code == 200
    rules = response.json()
    assert "categories" in rules
    assert "checklists" in rules
    assert "scoring" in rules
