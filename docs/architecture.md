# AICTE Application Validation & Decision-Support Platform: Architecture

## 1. Executive Overview

The **AICTE AI-Powered Application Validation & Decision-Support Platform** is an enterprise-grade regulatory assistance suite designed to automate preliminary scrutiny of technical education institution applications for approval and renewal.

### Statutory Decision-Support Principle
> **CRITICAL DIRECTIVE:** The platform is explicitly a **decision-support** system. AI modules screen evidence, identify potential discrepancies, detect anomalies, cross-reference declarations, and compute explainable risk scores. **The system NEVER autonomously approves, rejects, or penalizes an institution.** Final regulatory actions are reserved exclusively for authorized human officers.

---

## 2. Core Workflow Pipeline

```
[ Application Submission ]
         │
         ▼
[ Category Auto-Detection ] (Deterministic keywords + optional NLP)
         │
         ▼
[ Load Dynamic Checklist Snapshot ] (Land norms, built-up area, Fire NOC, etc.)
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
[ Deterministic Risk-Scoring Engine ] (0–100 Explainable Scale, Deduplicated Penalties)
                    │
                    ▼
[ Attention-Routing & Official Alerting ] (Threshold >= 50 or Critical Discrepancy)
                    │
                    ▼
[ Comprehensive Scrutiny Dossier / ReportLab PDF Export ]
                    │
                    ▼
[ Human Reviewer Disposition & Action ] (Confirmed / False Positive / In Review)
                    │
                    ▼
[ SHA-256 Tamper-Evident Cryptographic Audit Ledger ]
```

---

## 3. The Five Parallel Validation Modules

### Module 1: Document OCR, Extraction, and Completeness
- **Engines:** PyMuPDF / PyPDF pure-Python fallback (CPU-safe) with regex and layout-aware heuristics.
- **Responsibilities:** Extracts land area, survey numbers, approval dates, registration numbers, building square meters. Verifies mandatory document completeness, valid signatures, and non-expired certifications.
- **Evidence Reference:** Bounding coordinates `[ymin, xmin, ymax, xmax]` and source page indices.

### Module 2: Institutional History Cross-Check
- **Responsibilities:** Evaluates multi-year approval history. Detects sudden land shrinkage, campus address shifts, unapproved changes in institute legal name, or trustee turnover.
- **Evidence Reference:** Historical delta ledger containing past verified baseline values vs current declarations.

### Module 3: Anomaly & Potential Forgery Screening
- **Engines:** OpenCV, Error Level Analysis (ELA), Difference Hashing (dHash), and PDF metadata inspection.
- **Responsibilities:** Detects duplicate and near-duplicate uploads across submissions, metadata editing timestamps indicating alteration, and image splicing indicators.
- **Human Safeguard:** Findings are classified as *Screening Indicators*, never as definitive accusations of fraud.

### Module 4: Issuing-Authority Verification
- **Architecture:** Pluggable adapter interfaces for Land Revenue portals, Affiliating Universities, and State Fire Services.
- **Non-Verified Safety:** Network timeouts, unavailable APIs, or missing external registry endpoints **never default to VERIFIED**; they strictly return `MANUAL_REVIEW_REQUIRED` or `UNAVAILABLE`.

### Module 5: Infrastructure Evidence Analysis
- **Engines:** OpenCV blur and dimension heuristics with optional YOLOv8/Detectron2 object detection.
- **Responsibilities:** Verifies classroom, laboratory, computer centre, and fire extinguisher photographic evidence. Compares photographic counts with applicant-declared capacity.
- **Safety Rule:** Photographs alone never grant statutory compliance without physical or video inspection.

---

## 4. Explainable 0–100 Risk-Scoring Engine

The score is calculated from deterministic deductions across five categories with single-root-cause penalty deduplication:

| Risk Band | Score Range | Default Attention Action |
|:---|:---:|:---|
| **Low** | 0 – 24 | Routine verification; eligible for fast-track processing |
| **Medium** | 25 – 49 | Minor documentation defects; standard officer scrutiny |
| **High** | 50 – 74 | Priority alert routed to Validation Officer with specific defect checklist |
| **Critical** | 75 – 100 | Escalated immediately to Senior Reviewing Officer with audit flagging |

---

## 5. Low-Resource Optimization Strategy

Designed to operate seamlessly on standard office hardware:
- **Target Profile:** Windows 11, Intel Core i7 8th Gen, 8GB RAM, NVIDIA MX130 (2GB VRAM).
- **CPU Baseline:** All deterministic rules, perceptual hashing, and PDF parsing execute purely on CPU.
- **Lazy Loading:** Heavy deep-learning frameworks (YOLOv8, Detectron2, LayoutLMv3) remain uninstantiated until demanded.
- **Page & Job Caps:** Hard limits on concurrent workers (default: 2) and PDF pages (default: 15) to prevent OOM termination.
