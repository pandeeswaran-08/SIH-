import sys
import os
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.user import User, RoleEnum
from app.models.institution import Institution
from app.models.application import Application, ApplicationStatus, ApplicationType, RiskBand
from app.models.document import ApplicationDocument, DocumentType, DocumentStatus
from app.models.checklist import ChecklistSnapshot
from app.models.alert import OfficialAlert, AlertSeverity
from app.core.security import get_password_hash
from app.services.storage_service import storage_service
from app.services.audit_service import audit_service
from app.services.orchestrator_service import orchestrator_service

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).count() > 0:
        return

    print("Seeding synthetic demonstration users and applications...")

    # 1. Seed RBAC Users
    users = [
        User(
            email="applicant@institute.edu.in",
            full_name="Dr. Rajesh Sharma (Applicant)",
            hashed_password=get_password_hash("Applicant@123"),
            role=RoleEnum.APPLICANT,
            is_active=True
        ),
        User(
            email="officer@aicte.gov.in",
            full_name="P. K. Narayanan (Validation Officer)",
            hashed_password=get_password_hash("Officer@123"),
            role=RoleEnum.VALIDATION_OFFICER,
            is_active=True
        ),
        User(
            email="senior.officer@aicte.gov.in",
            full_name="Dr. Sunita Deshmukh (Senior Reviewing Officer)",
            hashed_password=get_password_hash("Senior@123"),
            role=RoleEnum.SENIOR_REVIEWING_OFFICER,
            is_active=True
        ),
        User(
            email="admin@aicte.gov.in",
            full_name="System Administrator (IT Cell)",
            hashed_password=get_password_hash("Admin@123"),
            role=RoleEnum.SYSTEM_ADMINISTRATOR,
            is_active=True
        ),
        User(
            email="auditor@aicte.gov.in",
            full_name="Statutory Compliance Auditor",
            hashed_password=get_password_hash("Auditor@123"),
            role=RoleEnum.AUDITOR,
            is_active=True
        )
    ]
    for u in users:
        db.add(u)
    db.commit()

    # 2. Seed Institutions
    inst1 = Institution(
        aicte_permanent_id="1-429381023",
        legal_name="National Institute of Advanced Engineering & Technology",
        category="ENGINEERING_TECH",
        state="Maharashtra",
        district="Pune",
        pin_code="411007",
        address="Survey No. 42/B, Hinjewadi Knowledge Park",
        establishment_year=2008,
        land_area_acres=10.5,
        builtup_area_sqm=12500.0,
        contact_email="principal@niaet.edu.in",
        contact_phone="020-22934000",
        trust_or_society_name="Vishwa Vidya Educational Foundation"
    )
    inst2 = Institution(
        aicte_permanent_id="1-789214451",
        legal_name="Apex Global Business School",
        category="MANAGEMENT",
        state="Karnataka",
        district="Bengaluru Urban",
        pin_code="560100",
        address="Plot 18, Electronic City Phase 1",
        establishment_year=2014,
        land_area_acres=3.2,
        builtup_area_sqm=6200.0,
        contact_email="dean@apexbschool.ac.in",
        contact_phone="080-41123400",
        trust_or_society_name="Apex Knowledge Trust"
    )
    inst3 = Institution(
        aicte_permanent_id="1-901238492",
        legal_name="Saraswati College of Pharmaceutical Sciences",
        category="PHARMACY",
        state="Uttar Pradesh",
        district="Lucknow",
        pin_code="226028",
        address="NH-24, Faizabad Road",
        establishment_year=2019,
        land_area_acres=2.8,
        builtup_area_sqm=4800.0,
        contact_email="director@scpspharmacy.edu.in",
        contact_phone="0522-2891230",
        trust_or_society_name="Saraswati Seva Samiti"
    )
    db.add_all([inst1, inst2, inst3])
    db.commit()

    # 3. Create Sample Documents on disk
    sample_text_land = """
    REGISTERED LAND TITLE DEED & SALE CONVEYANCE
    Government of Maharashtra, Sub-Registrar Office, Haveli-Pune
    Document Registration No: B-2022/49210
    Dated: 14/06/2018
    This Indenture certifies that Vishwa Vidya Educational Foundation holds absolute,
    unencumbered ownership of campus property measuring 10.5 Acres of Land
    situated at Survey Nos: 42/B, 43/1A in Hinjewadi, Pune.
    AICTE Permanent ID Reference: 1-429381023
    Title verified free of all mortgage and court litigation.
    """
    path_land, sha_land, sz_land = storage_service.save_bytes(
        sample_text_land.encode('utf-8'),
        "Land_Deed_Hinjewadi_Survey42.pdf",
        subfolder="documents"
    )

    sample_text_fire = """
    FIRE SAFETY & DISASTER COMPLIANCE NOC
    Office of the Director, Maharashtra Fire Services
    Certificate No: MFS/NOC/2026/89412
    Date of Issue: 10/01/2026
    Valid upto: 09/01/2027
    Certified that the premises of National Institute of Advanced Engineering & Technology
    at Hinjewadi, Pune has satisfied all fire prevention standards under NBC 2016 Part IV.
    Installed: Automatic sprinkler systems, hose reels, fire extinguishers, and emergency exits.
    """
    path_fire, sha_fire, sz_fire = storage_service.save_bytes(
        sample_text_fire.encode('utf-8'),
        "Fire_Safety_NOC_2026.pdf",
        subfolder="documents"
    )

    sample_text_affiliation = """
    SAVITRIBAI PHULE PUNE UNIVERSITY - AFFILIATION BRANCH
    Order No: SPPU/AFF/ENGG/2025-26/1844
    Date: 28/05/2025
    Subject: Continuation of Permanent Affiliation for Academic Year 2026-2027
    Permanent affiliation is hereby granted to National Institute of Advanced Engineering & Technology
    for B.Tech Computer Engineering (180 seats), Mechanical (60 seats), E&TC (60 seats).
    Valid for Academic Year: 2026-2027
    """
    path_aff, sha_aff, sz_aff = storage_service.save_bytes(
        sample_text_affiliation.encode('utf-8'),
        "University_Affiliation_SPPU_2026.pdf",
        subfolder="documents"
    )

    # 4. Seed Applications
    app1 = Application(
        application_number="APP-2026-ENG-8419",
        institution_id=inst1.id,
        academic_year="2026-2027",
        category="ENGINEERING_TECH",
        detected_category="ENGINEERING_TECH",
        category_classification_method="DETERMINISTIC_RULES",
        category_confidence=0.98,
        application_type=ApplicationType.EXTENSION_OF_APPROVAL,
        status=ApplicationStatus.SUBMITTED,
        declared_land_acres=10.5,
        declared_builtup_sqm=12500.0,
        declared_faculty_count=84,
        declared_student_intake=480,
        overall_risk_score=14.0,
        risk_band=RiskBand.LOW,
        attention_required=False
    )
    
    app2 = Application(
        application_number="APP-2026-MGMT-5102",
        institution_id=inst2.id,
        academic_year="2026-2027",
        category="MANAGEMENT",
        detected_category="MANAGEMENT",
        category_classification_method="DETERMINISTIC_RULES",
        category_confidence=0.94,
        application_type=ApplicationType.INCREASE_IN_INTAKE,
        status=ApplicationStatus.REQUIRES_ATTENTION,
        declared_land_acres=3.2,
        declared_builtup_sqm=6200.0,
        declared_faculty_count=32,
        declared_student_intake=240,
        overall_risk_score=68.5,
        risk_band=RiskBand.HIGH,
        attention_required=True,
        attention_reasons="1 Critical Regulatory Discrepancies Detected; High Composite Risk Score: 68.5/100"
    )

    db.add_all([app1, app2])
    db.commit()

    # Add documents to app1
    d1 = ApplicationDocument(
        application_id=app1.id,
        document_type=DocumentType.LAND_OWNERSHIP,
        filename="Land_Deed_Hinjewadi_Survey42.pdf",
        original_filename="Registered_Land_Deed.pdf",
        storage_path=path_land,
        file_size_bytes=sz_land,
        sha256_hash=sha_land,
        mime_type="application/pdf",
        status=DocumentStatus.VERIFIED,
        page_count=2,
        is_unreadable=False,
        ocr_completed=True,
        extracted_text=sample_text_land
    )
    d2 = ApplicationDocument(
        application_id=app1.id,
        document_type=DocumentType.FIRE_SAFETY,
        filename="Fire_Safety_NOC_2026.pdf",
        original_filename="Fire_Safety_Certificate.pdf",
        storage_path=path_fire,
        file_size_bytes=sz_fire,
        sha256_hash=sha_fire,
        mime_type="application/pdf",
        status=DocumentStatus.VERIFIED,
        page_count=1,
        is_unreadable=False,
        ocr_completed=True,
        extracted_text=sample_text_fire
    )
    d3 = ApplicationDocument(
        application_id=app1.id,
        document_type=DocumentType.AFFILIATION_CERT,
        filename="University_Affiliation_SPPU_2026.pdf",
        original_filename="SPPU_Affiliation_Letter.pdf",
        storage_path=path_aff,
        file_size_bytes=sz_aff,
        sha256_hash=sha_aff,
        mime_type="application/pdf",
        status=DocumentStatus.VERIFIED,
        page_count=1,
        is_unreadable=False,
        ocr_completed=True,
        extracted_text=sample_text_affiliation
    )
    db.add_all([d1, d2, d3])
    db.commit()

    # Checklist snapshots
    chk_items_1 = [
        {"code": "CHK_ENG_01", "title": "Clear Land Title Deed / 30-Year Registered Lease", "doc_type": "LAND_OWNERSHIP", "is_mandatory": True, "status": "PRESENT"},
        {"code": "CHK_ENG_02", "title": "University Affiliation Letter / NOC", "doc_type": "AFFILIATION_CERT", "is_mandatory": True, "status": "PRESENT"},
        {"code": "CHK_ENG_03", "title": "Approved Building Plan with Competent Authority Sign-off", "doc_type": "BUILDING_PLAN", "is_mandatory": True, "status": "PRESENT"},
        {"code": "CHK_ENG_04", "title": "Fire & Life Safety Certificate", "doc_type": "FIRE_SAFETY", "is_mandatory": True, "status": "PRESENT"},
        {"code": "CHK_ENG_05", "title": "Cadre Ratio and Faculty Roster", "doc_type": "FACULTY_LIST", "is_mandatory": True, "status": "PRESENT"}
    ]
    snap1 = ChecklistSnapshot(
        application_id=app1.id,
        template_code="CHK_ENG_2026",
        rule_version="2026.1.0",
        academic_year="2026-2027",
        items_json=json.dumps(chk_items_1)
    )
    db.add(snap1)

    chk_items_2 = [
        {"code": "CHK_MGMT_01", "title": "Land Title Deed / Unencumbered Possession", "doc_type": "LAND_OWNERSHIP", "is_mandatory": True, "status": "MISSING"},
        {"code": "CHK_MGMT_02", "title": "University Affiliation / State NOC", "doc_type": "AFFILIATION_CERT", "is_mandatory": True, "status": "PRESENT"},
        {"code": "CHK_MGMT_03", "title": "Sanctioned Master Plan & Built-up Area", "doc_type": "BUILDING_PLAN", "is_mandatory": True, "status": "PRESENT"},
        {"code": "CHK_MGMT_04", "title": "Fire Safety Certificate", "doc_type": "FIRE_SAFETY", "is_mandatory": True, "status": "EXPIRED"}
    ]
    snap2 = ChecklistSnapshot(
        application_id=app2.id,
        template_code="CHK_MGMT_2026",
        rule_version="2026.1.0",
        academic_year="2026-2027",
        items_json=json.dumps(chk_items_2)
    )
    db.add(snap2)
    db.commit()

    # Run initial validation pipeline on app1 to produce initial baseline report
    try:
        orchestrator_service.run_validation_pipeline(
            db=db,
            application_id=app1.id,
            idempotency_key="SEED_INIT_RUN_APP1",
            actor_id="SYSTEM_SEED",
            actor_role="SYSTEM_AUTOMATION"
        )
    except Exception as e:
        print(f"Seed validation for app1 skipped: {e}")

    # Create Alert for app2
    alert = OfficialAlert(
        application_id=app2.id,
        title="Immediate Scrutiny Required: APP-2026-MGMT-5102",
        reason="Apex Global Business School: 1 Critical Missing Mandatory Document (Land Ownership Deed); Expired Fire Safety Certificate.",
        severity=AlertSeverity.CRITICAL,
        target_role="VALIDATION_OFFICER",
        is_resolved=False
    )
    db.add(alert)
    db.commit()

    print("Synthetic demonstration data seeded successfully!")
