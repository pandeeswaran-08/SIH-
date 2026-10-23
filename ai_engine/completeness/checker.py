from typing import List, Dict, Any, Tuple
from datetime import datetime
import json
import os

class CompletenessChecker:
    def __init__(self):
        pass

    def run_check(
        self,
        application_data: Dict[str, Any],
        checklist_items: List[Dict[str, Any]],
        documents: List[Dict[str, Any]],
        extracted_fields: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Executes Module 1: Document OCR, Extraction and Completeness.
        Returns: (findings_list, summary_dict)
        """
        findings = []
        doc_type_map = {doc["document_type"]: doc for doc in documents}
        uploaded_hashes = {}
        
        # 1. Duplicate file uploads check within the same application
        for doc in documents:
            sha = doc.get("sha256_hash")
            if sha in uploaded_hashes:
                prev_doc = uploaded_hashes[sha]
                findings.append({
                    "rule_id": "COMP_DUP_UPLOAD",
                    "title": f"Duplicate Document File Detected: {doc.get('filename')}",
                    "explanation": f"Document '{doc.get('filename')}' has an identical SHA-256 fingerprint to '{prev_doc.get('filename')}'. Re-uploading identical files under multiple categories is flagged.",
                    "severity": "HIGH",
                    "category": "DUPLICATE_FILES",
                    "evidence_ref": f"doc:{doc.get('id')}#sha256:{sha[:12]}",
                    "document_id": doc.get("id"),
                    "confidence": 1.0
                })
            else:
                uploaded_hashes[sha] = doc

        # 2. Check each checklist item against present documents
        present_count = 0
        missing_count = 0
        expired_count = 0

        for item in checklist_items:
            expected_type = item.get("doc_type")
            is_mandatory = item.get("is_mandatory", True)
            
            if expected_type in doc_type_map:
                present_count += 1
                doc = doc_type_map[expected_type]
                item["status"] = "PRESENT"
                item["doc_id"] = doc.get("id")

                # Check unreadable
                if doc.get("is_unreadable"):
                    item["status"] = "REQUIRES_REVIEW"
                    findings.append({
                        "rule_id": "COMP_UNREADABLE_DOC",
                        "title": f"Unreadable Document Page: {doc.get('filename')}",
                        "explanation": f"Document '{doc.get('filename')}' contains insufficient or unreadable textual content. Scan clarity is below required OCR threshold.",
                        "severity": "HIGH",
                        "category": "DOCUMENT_QUALITY",
                        "evidence_ref": f"doc:{doc.get('id')}#page:1",
                        "document_id": doc.get("id"),
                        "confidence": 0.95
                    })

                # Check expiry if extracted
                fields_for_doc = [f for f in extracted_fields if f.get("document_id") == doc.get("id")]
                for f in fields_for_doc:
                    if f.get("field_name") == "expiry_date":
                        exp_str = f.get("extracted_value", "")
                        # Try parsing standard date
                        try:
                            # If date format is YYYY or DD/MM/YYYY
                            for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%Y"):
                                try:
                                    dt = datetime.strptime(exp_str[:10], fmt)
                                    if dt < datetime.now():
                                        item["status"] = "EXPIRED"
                                        expired_count += 1
                                        findings.append({
                                            "rule_id": "COMP_DOC_EXPIRED",
                                            "title": f"Expired Regulatory Document: {doc.get('filename')}",
                                            "explanation": f"Document has expired on '{exp_str}'. Mandatory statutory clearances must be active for the current academic session.",
                                            "severity": "CRITICAL" if is_mandatory else "MEDIUM",
                                            "category": "EXPIRED_DOCUMENT",
                                            "evidence_ref": f.get("evidence_ref"),
                                            "document_id": doc.get("id"),
                                            "confidence": 0.90
                                        })
                                    break
                                except ValueError:
                                    continue
                        except Exception:
                            pass

            else:
                if is_mandatory:
                    missing_count += 1
                    item["status"] = "MISSING"
                    findings.append({
                        "rule_id": "COMP_MISSING_MANDATORY",
                        "title": f"Missing Mandatory Document: {item.get('title')}",
                        "explanation": f"Required document type '{expected_type}' is missing from the application submission. Regulatory compliance cannot proceed without it.",
                        "severity": "CRITICAL",
                        "category": "MISSING_DOCUMENTS",
                        "evidence_ref": f"checklist:{item.get('code')}",
                        "confidence": 1.0
                    })
                else:
                    item["status"] = "NOT_APPLICABLE"

        # 3. Cross-check extracted values with application declarations
        declared_land = application_data.get("declared_land_acres")
        for f in extracted_fields:
            if f.get("field_name") == "land_area" and declared_land:
                try:
                    ext_land = float(f.get("extracted_value"))
                    if ext_land < (declared_land * 0.95): # Significant discrepancy
                        findings.append({
                            "rule_id": "COMP_LAND_AREA_MISMATCH",
                            "title": "Declared Land Area Exceeds Extracted Deed Measurement",
                            "explanation": f"Application declares {declared_land} Acres, whereas extracted title deed specifies {ext_land} Acres. Potential shortfall detected.",
                            "severity": "HIGH",
                            "category": "FIELD_DISCREPANCY",
                            "evidence_ref": f.get("evidence_ref"),
                            "document_id": f.get("document_id"),
                            "confidence": 0.88
                        })
                except (ValueError, TypeError):
                    pass

        summary = {
            "total_checklist_items": len(checklist_items),
            "present_count": present_count,
            "missing_count": missing_count,
            "expired_count": expired_count,
            "status": "COMPLETED" if missing_count == 0 and expired_count == 0 else "COMPLETED_WITH_WARNINGS"
        }

        return findings, summary

completeness_checker = CompletenessChecker()
