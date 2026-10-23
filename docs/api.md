# AICTE Scrutiny Platform: REST API Reference

The backend exposes an OpenAPI 3.1 compliant REST API at `/api`. Interactive documentation is available at `http://localhost:8000/docs`.

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/login`
Authenticates an official or applicant and returns a scoped JWT bearer token.

- **Request Body (`application/x-www-form-urlencoded` or JSON):**
  ```json
  {
    "username": "officer@aicte.gov.in",
    "password": "officer123"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "officer@aicte.gov.in",
      "full_name": "P. K. Narayanan",
      "role": "VALIDATION_OFFICER"
    }
  }
  ```

---

## 2. Applications Intake & Processing (`/api/applications`)

### `POST /api/applications`
Submits a new institution approval application. Automatically classifies the technical category and snapshots the active regulatory checklist.

### `GET /api/applications`
Queries all applications with filtering support by `status`, `category`, `risk_band`, and keyword search.

### `GET /api/applications/{id}`
Retrieves complete application profile, institution declarations, checklist items, and validation summaries.

### `POST /api/applications/{id}/documents`
Uploads evidence documents (PDF/JPEG/PNG) with SHA-256 fingerprinting, MIME sniffing, and magic-byte signature validation.

### `GET /api/applications/{id}/documents`
Lists uploaded evidence items with storage keys, page counts, and extraction status.

---

## 3. Validation Orchestration (`/api/validation`)

### `POST /api/applications/{id}/validate`
Triggers the asynchronous validation orchestrator. Executes all 5 validation modules in parallel, calculates the deterministic 0–100 risk score, generates findings, and dispatches attention alerts.

### `GET /api/applications/{id}/validation-status`
Returns the execution status (`RUNNING`, `COMPLETED`, `FAILED`) of each validation module.

### `PATCH /api/validation/findings/{finding_id}/disposition`
Enables an authorized official to record a human disposition (`CONFIRMED`, `FALSE_POSITIVE`, `REQUIRES_FURTHER_REVIEW`) with review comments.

---

## 4. Dossier & Reporting (`/api/reports`)

### `GET /api/applications/{id}/report`
Fetches the 15-section structured JSON scrutiny report.

### `GET /api/applications/{id}/report/pdf`
Streams a formatted, printable PDF scrutiny dossier built with ReportLab.

---

## 5. Case Management & Official Alerts (`/api/alerts`)

### `GET /api/alerts`
Retrieves routing alerts flagged by the risk-scoring engine.

### `PATCH /api/alerts/{id}/resolve`
Marks an alert as acknowledged or resolved with resolution notes and reviewer ID.

---

## 6. Tamper-Evident Audit Ledger (`/api/audit`)

### `GET /api/audit`
Lists cryptographic audit entries with previous hash, event hash, actor email, and timestamp.

### `GET /api/audit/verify`
Runs an end-to-end cryptographic integrity verification across all historical blocks in the ledger.
```json
{
  "total_events": 14,
  "chain_valid": true,
  "verified_at": "2026-10-22T06:30:00Z"
}
```
