import json
import os
from typing import List, Dict, Any, Tuple
from app.core.config import settings

class ExplainableScoringEngine:
    """
    Deterministic Explainable Risk-Scoring Engine.
    Maps findings from the 5 validation modules to a calibrated 0-100 composite risk score.
    Reproducible, auditable, and consolidates related deductions to avoid multi-penalization.
    """

    def __init__(self):
        self.weights_config = self._load_weights()

    def _load_weights(self) -> Dict[str, Any]:
        rules_path = os.path.join(settings.RULES_DIR, "scoring", "weights.json")
        if os.path.exists(rules_path):
            with open(rules_path, "r") as f:
                return json.load(f)
        # Default fallback config
        return {
            "version": "2026.1.0",
            "bands": {
                "LOW": {"min": 0, "max": 24, "label": "Low Risk", "action": "Routine Documentation Verification"},
                "MEDIUM": {"min": 25, "max": 49, "label": "Medium Risk", "action": "Document Scrutiny with Clarification Notice"},
                "HIGH": {"min": 50, "max": 74, "label": "High Risk", "action": "Senior Officer Physical Scrutiny Required"},
                "CRITICAL": {"min": 75, "max": 100, "label": "Critical Risk", "action": "Immediate Inspection Committee Escalation"}
            }
        }

    def calculate_score(
        self,
        findings: List[Dict[str, Any]]
    ) -> Tuple[float, str, str, List[Dict[str, Any]], Dict[str, Any]]:
        """
        Calculates reproducible 0-100 risk score and returns itemized contributions.
        Returns: (total_score, risk_band, recommended_action, contributions_list, analytics_breakdown)
        """
        contributions = []
        seen_underlying_issues = set()
        total_risk = 0.0

        # Severity Base Weights
        SEVERITY_WEIGHTS = {
            "CRITICAL": 25.0,
            "HIGH": 15.0,
            "MEDIUM": 8.0,
            "LOW": 3.0
        }

        # Module Category Weights
        CATEGORY_MULTIPLIERS = {
            "DUPLICATE_FILES": 1.1,
            "DUPLICATE_IMAGES": 1.05,
            "EXPIRED_DOCUMENT": 1.0,
            "MISSING_DOCUMENTS": 1.0,
            "INSTITUTIONAL_HISTORY": 1.0,
            "METADATA_ANOMALY": 0.9,
            "ISSUING_AUTHORITY": 1.0,
            "INFRASTRUCTURE_CV": 0.85,
            "DOCUMENT_QUALITY": 0.8
        }

        for finding in findings:
            rule_id = finding.get("rule_id", "GENERIC_RULE")
            severity = finding.get("severity", "MEDIUM")
            cat = finding.get("category", "GENERAL")
            doc_id = finding.get("document_id")

            # Avoid double penalty if both OCR and Anomaly flagged the exact same duplicate file on same doc_id
            dedup_key = f"{cat}_{doc_id or rule_id}"
            if dedup_key in seen_underlying_issues:
                # Apply 50% discount to secondary linked finding
                discount = 0.5
            else:
                discount = 1.0
                seen_underlying_issues.add(dedup_key)

            base_w = SEVERITY_WEIGHTS.get(severity, 8.0)
            mult = CATEGORY_MULTIPLIERS.get(cat, 1.0)
            applied_contrib = round(base_w * mult * discount, 1)

            total_risk += applied_contrib

            contributions.append({
                "rule_id": rule_id,
                "rule_version": self.weights_config.get("version", "2026.1.0"),
                "category": cat,
                "weight": base_w,
                "contribution": applied_contrib,
                "explanation": finding.get("explanation"),
                "evidence_ref": finding.get("evidence_ref"),
                "severity": severity,
                "reviewer_adjustment": 0.0,
                "reviewer_justification": None
            })

        # Cap final risk score at 100.0
        final_score = min(100.0, round(total_risk, 1))

        # Determine Risk Band
        bands = self.weights_config.get("bands", {})
        selected_band = "LOW"
        recommended_action = "Routine Documentation Verification"

        if final_score >= bands.get("CRITICAL", {}).get("min", 75):
            selected_band = "CRITICAL"
            recommended_action = bands.get("CRITICAL", {}).get("action", "Immediate Inspection Committee Escalation")
        elif final_score >= bands.get("HIGH", {}).get("min", 50):
            selected_band = "HIGH"
            recommended_action = bands.get("HIGH", {}).get("action", "Senior Officer Physical Scrutiny Required")
        elif final_score >= bands.get("MEDIUM", {}).get("min", 25):
            selected_band = "MEDIUM"
            recommended_action = bands.get("MEDIUM", {}).get("action", "Document Scrutiny with Clarification Notice")
        else:
            selected_band = "LOW"
            recommended_action = bands.get("LOW", {}).get("action", "Routine Documentation Verification")

        # Category breakdown for radar and bar charts
        category_breakdown = {}
        for c in contributions:
            category_breakdown[c["category"]] = category_breakdown.get(c["category"], 0.0) + c["contribution"]

        analytics = {
            "category_scores": category_breakdown,
            "total_penalties_consolidated": len(findings) - len(seen_underlying_issues),
            "scoring_formula": "Normalized additive penalty matrix with single-root consolidation",
            "regulatory_status_note": "Score represents automated scrutiny risk index, NOT legal probability of fraud or autonomous regulatory decision."
        }

        return final_score, selected_band, recommended_action, contributions, analytics

scoring_engine = ExplainableScoringEngine()
