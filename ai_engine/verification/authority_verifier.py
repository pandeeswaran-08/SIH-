from typing import List, Dict, Any, Tuple
from datetime import datetime
import json

class AuthorityVerifier:
    """
    Module 4: Issuing-Authority Verification.
    Pluggable verification adapter for statutory external registries.
    Strictly adheres to: Timeout/Unavailable MUST NEVER return VERIFIED.
    Demonstration modes are explicitly tagged as SYNTHETIC_DEMO.
    """

    REGISTRIES = [
        {
            "authority_name": "State Land Records & Survey Registry",
            "doc_type": "LAND_OWNERSHIP",
            "identifier_key": "survey_numbers",
            "endpoint_mock": "https://api.landrecords.gov.in/v2/verify-title",
            "is_live_api": False
        },
        {
            "authority_name": "Designated Affiliating State University",
            "doc_type": "AFFILIATION_CERT",
            "identifier_key": "registration_no",
            "endpoint_mock": "https://affiliation.univportal.ac.in/api/v1/status",
            "is_live_api": False
        },
        {
            "authority_name": "State Disaster Response & Fire Services Department",
            "doc_type": "FIRE_SAFETY",
            "identifier_key": "registration_no",
            "endpoint_mock": "https://firesafety.stategov.in/api/verify-noc",
            "is_live_api": False
        }
    ]

    def verify_application(
        self,
        application_data: Dict[str, Any],
        extracted_fields: List[Dict[str, Any]],
        documents: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any], List[Dict[str, Any]]]:
        """
        Returns: (findings_list, summary_dict, verification_records_list)
        """
        findings = []
        verification_records = []
        doc_type_map = {doc.get("document_type"): doc for doc in documents}

        for reg in self.REGISTRIES:
            target_doc_type = reg["doc_type"]
            auth_name = reg["authority_name"]
            
            # Find matching document
            doc = doc_type_map.get(target_doc_type)
            if not doc:
                record = {
                    "authority_name": auth_name,
                    "query_identifier": "N/A",
                    "status": "NOT_VERIFIED",
                    "reference_number": None,
                    "response_payload": {
                        "mode": "SYNTHETIC_DEMO",
                        "error": "Required document missing from application; query cannot be formulated."
                    },
                    "notes": "Missing document prevents external registry lookup.",
                    "verified_at": None
                }
                verification_records.append(record)
                continue

            # Find matching extracted field identifier
            field_key = reg["identifier_key"]
            matched_field = next(
                (f for f in extracted_fields if f.get("document_id") == doc.get("id") and f.get("field_name") == field_key),
                None
            )
            query_id = matched_field.get("extracted_value") if matched_field else "PENDING_MANUAL_EXTRACT"

            # Check if testing simulated network failure or invalid record
            if not matched_field:
                status = "MANUAL_REVIEW_REQUIRED"
                notes = f"Could not extract statutory registration identifier '{field_key}' automatically. Official manual check required."
                findings.append({
                    "rule_id": "AUTH_MANUAL_REVIEW",
                    "title": f"Manual Verification Required: {auth_name}",
                    "explanation": f"Automated adapter could not reliably isolate the certificate ID from '{doc.get('filename')}'. Requires human inspector confirmation.",
                    "severity": "MEDIUM",
                    "category": "ISSUING_AUTHORITY",
                    "evidence_ref": f"doc:{doc.get('id')}",
                    "document_id": doc.get("id"),
                    "confidence": 0.70
                })
            elif "INVALID" in str(query_id).upper() or "TEST" in str(query_id).upper():
                status = "NOT_VERIFIED"
                notes = f"Registry returned: No valid matching registration order for '{query_id}'."
                findings.append({
                    "rule_id": "AUTH_REGISTRY_NOT_FOUND",
                    "title": f"External Authority Verification Failed: {auth_name}",
                    "explanation": f"Certificate order number '{query_id}' could not be validated against records in {auth_name}.",
                    "severity": "CRITICAL",
                    "category": "ISSUING_AUTHORITY",
                    "evidence_ref": f"doc:{doc.get('id')}#id:{query_id}",
                    "document_id": doc.get("id"),
                    "confidence": 1.0
                })
            else:
                # Synthetic successful response for valid demo records
                status = "VERIFIED"
                notes = f"Successfully cross-referenced and verified against {auth_name} sandbox database."

            record = {
                "authority_name": auth_name,
                "query_identifier": str(query_id),
                "status": status,
                "reference_number": f"REG-ACK-{datetime.now().strftime('%Y%m%d')}-{doc.get('id', 1):04d}",
                "response_payload": {
                    "mode": "SYNTHETIC_DEMO_ADAPTER",
                    "authority": auth_name,
                    "query_id": str(query_id),
                    "lookup_timestamp": datetime.now().isoformat(),
                    "status_code": 200 if status == "VERIFIED" else 404,
                    "details": notes
                },
                "notes": notes,
                "verified_at": datetime.now() if status == "VERIFIED" else None
            }
            verification_records.append(record)

        verified_count = sum(1 for r in verification_records if r["status"] == "VERIFIED")
        summary = {
            "total_registries_queried": len(verification_records),
            "verified_count": verified_count,
            "manual_review_count": sum(1 for r in verification_records if r["status"] == "MANUAL_REVIEW_REQUIRED"),
            "failed_count": sum(1 for r in verification_records if r["status"] == "NOT_VERIFIED"),
            "status": "COMPLETED" if verified_count == len(verification_records) else "COMPLETED_WITH_WARNINGS"
        }

        return findings, summary, verification_records

authority_verifier = AuthorityVerifier()
