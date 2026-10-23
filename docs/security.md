# AICTE Scrutiny Platform: Security & Compliance Specification

## 1. Authentication & Role-Based Access Control (RBAC)

The platform enforces strict least-privilege role boundaries using HMAC-SHA256 signed JSON Web Tokens (JWT).

| Role | Permissions |
|:---|:---|
| **APPLICANT** | Submit application, upload evidence documents, track scrutiny status. Cannot view internal scrutiny notes or risk rules. |
| **VALIDATION_OFFICER** | Inspect all 5 validation modules, review OCR extractions, record finding dispositions, trigger verification runs, resolve routing alerts. |
| **SENIOR_REVIEWING_OFFICER** | All Validation Officer permissions, plus ability to issue formal statutory decisions (Approved / Deficient / Rejected) and escalate cases. |
| **SYSTEM_ADMINISTRATOR** | Manage checklist schemas, versioned regulatory rules, model registry flags, and user access accounts. |
| **AUDITOR** | Read-only access to historical dossiers and tamper-evident audit logs; execute SHA-256 chain verification. |

---

## 2. Document Security & Storage Protections

### File Upload Sanitation
- **MIME & Magic-Byte Sniffing:** Verifies actual file header signatures (e.g., `%PDF-`, `\xFF\xD8\xFF`) rather than relying on user-provided file extensions.
- **Maximum File Limits:** Enforces a 25 MB limit per document and a 15-page cap per PDF to prevent resource exhaustion attacks.
- **SHA-256 Digest:** Computes cryptographic hashes upon receipt; identical binary files are deduplicated and tagged.
- **Private Storage:** Files are stored outside the web root (`storage_data/documents/`) or in MinIO buckets with private ACLs. Direct public URL access is blocked.

---

## 3. Tamper-Evident SHA-256 Audit Trail

To safeguard regulatory integrity, all critical actions are committed to an append-only cryptographic ledger:

```
[Genesis Hash: "0" * 64]
         │
         ▼
[Event 1: APP_SUBMITTED] ─── Hash: SHA256(PrevHash + EventPayload)
         │
         ▼
[Event 2: VALIDATION_RUN] ─── Hash: SHA256(PrevHash + EventPayload)
         │
         ▼
[Event 3: REGULATORY_DECISION] ─── Hash: SHA256(PrevHash + EventPayload)
```

- Any unauthorized manual modification, deletion, or back-dating of records immediately breaks downstream hashes.
- Officials can trigger the `/api/audit/verify` endpoint at any time to guarantee ledger immutability.
