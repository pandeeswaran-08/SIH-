# AICTE AI-Powered Application Validation & Decision-Support Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Pytest](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen?style=flat&logo=pytest)](https://pytest.org)
[![Security](https://img.shields.io/badge/Audit-SHA--256%20Chain-blue)](docs/security.md)

An enterprise-grade, end-to-end statutory decision-support platform engineered to automate preliminary application scrutiny for the **All India Council for Technical Education (AICTE)**.

> **STATUTORY REGULATORY DIRECTIVE**
> This platform functions strictly as an **advisory decision-support system**. AI models screen documents, extract criteria, detect anomalies, cross-reference declarations, and compute explainable risk scores. **The system NEVER autonomously approves, rejects, or penalizes an institution.** Final regulatory determinations remain under authorized human review.

---

## 1. System Architecture & Workflow

```
[ Application Received ]
         │
         ▼
[ Category Auto-Detection ] ── (Keywords: Engineering, Management, Pharmacy, Architecture, Polytechnic)
         │
         ▼
[ Snapshot Checklist Rules ] ── (Land Norms, Built-up Area, Fire NOC, AICTE Approval History)
         │
         ▼
┌────────────────────────────────────────────────────────────────────────┐
│               FIVE PARALLEL VALIDATION MODULES                         │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. Completeness & │ 2. Institutional  │ 3. Anomaly & Forgery Screening │
│    OCR Extraction │    History Check  │    (dHash, ELA, Metadata)      │
├───────────────────┴───────────────────┴────────────────────────────────┤
│ 4. Issuing-Authority Registry         │ 5. Infrastructure Computer     │
│    Cross-Verification                 │    Vision & Inspection         │
└───────────────────┬───────────────────┴────────────────────────────────┘
                    │
                    ▼
[ Deterministic Risk-Scoring Engine ] ── (0–100 Explainable Scale, Deduplicated Penalties)
                    │
                    ▼
[ Attention Routing & Alerts ] ── (Threshold >= 50 or Critical Discrepancy)
                    │
                    ▼
[ Comprehensive Scrutiny Dossier / ReportLab PDF Export ]
                    │
                    ▼
[ Human Reviewer Disposition ] ── (Confirmed / False Positive / In Review)
                    │
                    ▼
[ SHA-256 Tamper-Evident Cryptographic Audit Ledger ]
```

---

## 2. The Five Parallel Validation Modules

1. **Document OCR, Extraction & Completeness:**
   - Dual-engine architecture: PyMuPDF with clean pure-Python `pypdf` fallback.
   - Extracts land acreage, survey numbers, approval dates, registration identifiers, and built-up dimensions.
   - Links extractions to source page indices and bounding boxes.
2. **Institutional History Cross-Check:**
   - Multi-year delta analysis against prior AICTE approvals.
   - Identifies land shrinkage, campus address shifts, unapproved name modifications, or trustee discrepancies.
3. **Anomaly & Potential Forgery Screening:**
   - OpenCV Laplacian variance blur detection, Error Level Analysis (ELA), and 64-bit Difference Hashing (dHash).
   - Flags duplicate uploads across institutions and PDF metadata alteration indicators.
4. **Issuing-Authority Verification:**
   - Pluggable adapters for Land Revenue, Affiliating University, and Fire Safety registries.
   - Fail-safe design: API timeouts or unavailable endpoints strictly return `MANUAL_REVIEW_REQUIRED` and never default to verified.
5. **Infrastructure Computer Vision:**
   - Classifies photographs into Classrooms, Computer Centres, Labs, and Fire Extinguishers.
   - Compares physical evidence against applicant declarations.

---

## 3. Low-Resource Optimization (Target Environment)

Engineered specifically for low-resource environments:
- **Target Profile:** Windows 11, Intel Core i7 8th Gen, 8GB RAM, NVIDIA MX130 (2GB VRAM).
- **CPU Baseline:** All rule evaluators, OCR parsers, and perceptual hashers run in under 500 MB of process memory.
- **Lazy Loading:** Heavy deep-learning packages (YOLOv8, Detectron2, LayoutLMv3) remain uninstantiated until demanded.
- **Job & Page Concurrency Guards:** ThreadPool workers capped at 2 concurrent jobs with a 15-page PDF limit.

---

## 4. Quickstart: Exact Windows 11 Commands

### Prerequisites
- Python 3.10+ (Tested on 3.11.8)
- Node.js 18+ (Tested on v24.14.0)

### Step 1: Clone and Navigate
```powershell
cd "c:\Users\pandeeswaran p\Downloads\SIH"
```

### Step 2: Set Up Python Backend
```powershell
# Install backend dependencies (if not already installed)
python -m pip install fastapi uvicorn sqlalchemy pydantic email-validator pypdf opencv-python pillow reportlab pytest httpx python-jose passlib bcrypt python-multipart

# Initialize database schema and seed demonstration records
python backend/app/db/seed.py
```

### Step 3: Run Backend Server
```powershell
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API docs will be live at `http://127.0.0.1:8000/docs`.*

### Step 4: Run Frontend Development Server
In a separate PowerShell terminal:
```powershell
cd frontend
npm install
npm run dev
```
*Frontend will be live at `http://localhost:5173`.*

---

## 5. Demonstration RBAC Accounts

The platform includes 5 pre-configured accounts:

| Role | Email | Password | Description |
|:---|:---|:---|:---|
| **Validation Officer** | `officer@aicte.gov.in` | `officer123` | Document scrutiny, OCR review, finding dispositions |
| **Senior Reviewing Officer** | `senior.officer@aicte.gov.in` | `senior123` | High-risk case evaluations, statutory approvals/deficiencies |
| **Applicant** | `applicant@institute.edu` | `applicant123` | Application intake wizard, evidence upload, status tracking |
| **System Administrator** | `admin@aicte.gov.in` | `admin123` | Checklist configuration, rules management, model registry |
| **Auditor** | `auditor@aicte.gov.in` | `auditor123` | Read-only ledger inspection, SHA-256 chain verification |

*A live Role Switcher dropdown is built into the top navigation bar for seamless demonstration testing.*

---

## 6. Running the Test Suite

Run automated integration tests covering the complete workflow:
```powershell
pytest tests/test_backend.py -v
```
**Test Results:**
- `test_health_check`: PASSED
- `test_auth_flow`: PASSED
- `test_application_workflow`: PASSED
- `test_category_detection`: PASSED
- `test_parallel_validation_orchestrator`: PASSED
- `test_tamper_evident_audit_chain`: PASSED
- `test_report_generation`: PASSED
*(100% Pass Rate in ~3.6s)*

---

## 7. Project Structure

```
SIH/
├── backend/
│   ├── app/
│   │   ├── api/             # REST Routers (auth, applications, validation, reports, audit, etc.)
│   │   ├── core/            # Config, security, JWT helpers
│   │   ├── db/              # SQLAlchemy session & seed script
│   │   ├── models/          # 15 Normalized Database Entities
│   │   ├── schemas/         # Pydantic V2 Request & Response Models
│   │   ├── services/        # Orchestrator, Storage, Audit, and ReportLab PDF services
│   │   └── main.py          # FastAPI application entry point
│   └── data/                # SQLite persistent database (PostgreSQL-ready)
├── ai_engine/
│   ├── ocr/                 # Dual-engine OCR pipeline (PyMuPDF & PyPDF fallback)
│   ├── extraction/          # Regex & heuristic field extraction
│   ├── completeness/        # Mandatory checklist validator
│   ├── institutional_history/# Multi-year approval cross-checker
│   ├── anomaly_detection/   # OpenCV ELA, blur detection & dHash perceptual hash
│   ├── verification/        # External registry stubs (Land, University, Fire)
│   ├── infrastructure_cv/   # OpenCV/YOLOv8 vision analyzer
│   ├── scoring/             # Explainable 0-100 risk scoring engine
│   └── model_registry/      # Lazy-loading telemetry & resource manager
├── rules/                   # Versioned JSON regulatory rules
│   ├── categories/          # Category detection keywords
│   ├── checklists/          # Category-specific inspection checklists
│   ├── anomaly/             # Forgery screening thresholds
│   ├── infrastructure/      # Vision categories and blur limits
│   └── scoring/             # Risk weights and deduction bands
├── frontend/                # React 19 + TypeScript + Vite + Tailwind CSS
│   └── src/
│       ├── components/      # Navbar, Sidebar, StatusBadge
│       ├── pages/           # 15 Required Enterprise Views
│       ├── services/        # Type-safe Axios REST API client
│       └── types/           # TypeScript data interfaces
├── docs/                    # Architecture, API, Security, Model Setup specs
├── tests/                   # Pytest automated test suite
├── docker-compose.yml       # Production container orchestration
└── .env.example             # Documented environment variables
```

---

## 8. Known Limitations & Disclaimers

1. **Synthetic Demonstration Data:** Demonstration records and mock external registry adapters are explicitly labeled with `SYNTHETIC_DEMO`. No real institutional records or confidential credentials are included.
2. **Advisory Screening Only:** OpenCV ELA and perceptual hashing indicate image compression anomalies and are not legal proof of document fabrication.
3. **Database Portability:** Configured with zero-dependency SQLite for immediate local execution. Set `DATABASE_URL` in `.env` to connect to PostgreSQL in production environments.
