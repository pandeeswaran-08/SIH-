from typing import List, Dict, Any, Tuple
from datetime import datetime

class InstitutionalHistoryChecker:
    """
    Module 2: Institutional History Cross-Check.
    Compares current application declarations with historical institutional master records.
    """

    def run_check(
        self,
        current_data: Dict[str, Any],
        historical_records: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any], List[Dict[str, Any]]]:
        """
        Returns: (findings_list, summary_dict, delta_comparisons_list)
        """
        findings = []
        comparisons = []

        if not historical_records:
            # New institution or first-time application: No historical record is not misconduct
            summary = {
                "historical_records_found": 0,
                "status": "COMPLETED",
                "notes": "First-time application / No prior historical records found in registry."
            }
            return findings, summary, comparisons

        # Use the latest historical record as baseline
        latest_hist = historical_records[0]

        # 1. Compare Legal Name
        curr_name = (current_data.get("legal_name") or "").strip().lower()
        hist_name = (latest_hist.get("legal_name") or "").strip().lower()
        if curr_name and hist_name and curr_name != hist_name:
            comparisons.append({
                "field": "Institution Name",
                "current_value": current_data.get("legal_name"),
                "historical_value": latest_hist.get("legal_name"),
                "status": "CHANGED",
                "timestamp": latest_hist.get("academic_year", "Previous Year"),
                "evidence_ref": f"hist:record_id_{latest_hist.get('id', 'master')}"
            })
            findings.append({
                "rule_id": "HIST_NAME_CHANGE",
                "title": "Unnotified Institution Name Modification",
                "explanation": f"Current application declares '{current_data.get('legal_name')}', while historical AICTE records indicate '{latest_hist.get('legal_name')}'. Gazette notification or statutory name-change approval must be verified.",
                "severity": "MEDIUM",
                "category": "INSTITUTIONAL_HISTORY",
                "evidence_ref": f"hist:name_delta",
                "confidence": 0.98
            })
        else:
            comparisons.append({
                "field": "Institution Name",
                "current_value": current_data.get("legal_name"),
                "historical_value": latest_hist.get("legal_name"),
                "status": "MATCH",
                "timestamp": latest_hist.get("academic_year", "Previous Year"),
                "evidence_ref": "hist:master"
            })

        # 2. Compare Campus Address / Geo Location
        curr_addr = (current_data.get("address") or "").strip().lower()
        hist_addr = (latest_hist.get("address") or "").strip().lower()
        curr_pin = (current_data.get("pin_code") or "").strip()
        hist_pin = (latest_hist.get("pin_code") or "").strip()

        if curr_pin and hist_pin and curr_pin != hist_pin:
            comparisons.append({
                "field": "Campus PIN / Location",
                "current_value": f"{current_data.get('pin_code')} ({current_data.get('district')})",
                "historical_value": f"{latest_hist.get('pin_code')} ({latest_hist.get('district')})",
                "status": "LOCATION_SHIFT",
                "timestamp": latest_hist.get("academic_year", "Previous Year"),
                "evidence_ref": f"hist:pin_delta"
            })
            findings.append({
                "rule_id": "HIST_LOCATION_SHIFT",
                "title": "Significant Campus Geographical Shift Detected",
                "explanation": f"Campus postal code shifted from '{hist_pin}' to '{curr_pin}'. Change of campus location requires prior AICTE Regional Committee sanction.",
                "severity": "HIGH",
                "category": "INSTITUTIONAL_HISTORY",
                "evidence_ref": f"hist:geo_shift",
                "confidence": 1.0
            })
        else:
            comparisons.append({
                "field": "Campus PIN / Location",
                "current_value": f"{current_data.get('pin_code')} ({current_data.get('district')})",
                "historical_value": f"{latest_hist.get('pin_code')} ({latest_hist.get('district')})",
                "status": "MATCH",
                "timestamp": latest_hist.get("academic_year", "Previous Year"),
                "evidence_ref": "hist:master"
            })

        # 3. Compare Land Area (Check for unapproved land alienation or reduction)
        curr_land = current_data.get("declared_land_acres") or current_data.get("land_area_acres") or 0.0
        hist_land = latest_hist.get("land_area_acres") or 0.0

        if hist_land > 0 and curr_land > 0:
            if curr_land < (hist_land * 0.90): # More than 10% reduction
                comparisons.append({
                    "field": "Total Land Area (Acres)",
                    "current_value": f"{curr_land} Acres",
                    "historical_value": f"{hist_land} Acres",
                    "status": "REDUCTION",
                    "timestamp": latest_hist.get("academic_year", "Previous Year"),
                    "evidence_ref": "hist:land_delta"
                })
                findings.append({
                    "rule_id": "HIST_LAND_REDUCTION",
                    "title": "Unexplained Land Area Shrinkage from Historical Approval",
                    "explanation": f"Current land of {curr_land} Acres is significantly lower than previously approved {hist_land} Acres. Potential campus land alienation or bifurcation flagged.",
                    "severity": "HIGH",
                    "category": "INSTITUTIONAL_HISTORY",
                    "evidence_ref": "hist:land_record",
                    "confidence": 0.95
                })
            else:
                comparisons.append({
                    "field": "Total Land Area (Acres)",
                    "current_value": f"{curr_land} Acres",
                    "historical_value": f"{hist_land} Acres",
                    "status": "MATCH",
                    "timestamp": latest_hist.get("academic_year", "Previous Year"),
                    "evidence_ref": "hist:master"
                })

        # 4. Compare Built-Up Area
        curr_bua = current_data.get("declared_builtup_sqm") or current_data.get("builtup_area_sqm") or 0.0
        hist_bua = latest_hist.get("builtup_area_sqm") or 0.0
        if hist_bua > 0 and curr_bua > 0:
            comparisons.append({
                "field": "Built-Up Area (Sqm)",
                "current_value": f"{curr_bua} Sqm",
                "historical_value": f"{hist_bua} Sqm",
                "status": "EXPANDED" if curr_bua > hist_bua else ("REDUCED" if curr_bua < hist_bua * 0.95 else "MATCH"),
                "timestamp": latest_hist.get("academic_year", "Previous Year"),
                "evidence_ref": "hist:bua_record"
            })

        summary = {
            "historical_records_found": len(historical_records),
            "discrepancies_count": len(findings),
            "status": "COMPLETED" if len(findings) == 0 else "COMPLETED_WITH_WARNINGS"
        }

        return findings, summary, comparisons

institutional_history_checker = InstitutionalHistoryChecker()
