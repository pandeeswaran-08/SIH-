import re
from typing import Dict, Any, List, Optional
from datetime import datetime

class FieldExtractor:
    """
    Regex and heuristic field extractor for regulatory documents.
    Extracts institution identifiers, names, land measurements, registration numbers, and dates.
    """

    PATTERNS = {
        "aicte_id": [
            r"(?:AICTE\s*(?:Permanent\s*)?ID|Permanent\s*ID|PID)[:\s]*([0-9\-\/A-Z]{4,20})",
            r"(?:1-\d{8,12})"
        ],
        "registration_no": [
            r"(?:Registration\s*(?:No|Number)|Reg\.\s*No|Order\s*No|Certificate\s*No)[:\s]*([A-Z0-9\-\/\_]{4,30})",
            r"(?:NOC\s*No)[:\s]*([A-Z0-9\-\/\_]{4,30})"
        ],
        "land_area": [
            r"(?:Total\s*Land\s*Area|Land\s*Area|Area\s*of\s*Land)[:\s]*([0-9\.]+)\s*(?:Acres?|Ac\.?)",
            r"([0-9\.]+)\s*(?:Acres?|Ac\.?)\s*(?:of\s*land)",
            r"(?:Area)[:\s]*([0-9\.]+)\s*(?:Hectares?|Hect\.?)"
        ],
        "builtup_area": [
            r"(?:Built[\-\s]*up\s*Area|Carpet\s*Area|Total\s*Floor\s*Area)[:\s]*([0-9\.\,]+)\s*(?:Sq\.?\s*Mtrs?|Sqm|Sq\.?\s*Metres?)",
            r"([0-9\.\,]+)\s*(?:Sq\.?\s*Mtrs?|Sqm)\s*(?:built[\-\s]*up)"
        ],
        "survey_numbers": [
            r"(?:Survey\s*Nos?|Sy\.\s*No|Khasra\s*No|Plot\s*No)[:\s]*([0-9\/\,\s\-\&]+)"
        ],
        "issue_date": [
            r"(?:Date\s*of\s*Issue|Dated|Issue\s*Date|Issued\s*on)[:\s]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})",
            r"(?:Date)[:\s]*([0-9]{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\,]+[0-9]{4})"
        ],
        "expiry_date": [
            r"(?:Valid\s*upto|Valid\s*until|Expiry\s*Date|Valid\s*through)[:\s]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})",
            r"(?:Valid\s*for\s*Academic\s*Year)[:\s]*([0-9]{4}\s*[\-\/]\s*[0-9]{2,4})"
        ]
    }

    def extract_fields(self, ocr_result: Dict[str, Any], doc_type: str) -> List[Dict[str, Any]]:
        extracted = []
        pages = ocr_result.get("pages", [])
        full_text = ocr_result.get("text", "")

        for field_name, regex_list in self.PATTERNS.items():
            found = False
            for page in pages:
                p_text = page.get("text", "")
                p_num = page.get("page_number", 1)
                
                for pattern in regex_list:
                    match = re.search(pattern, p_text, re.IGNORECASE)
                    if match:
                        val = match.group(1).strip()
                        # Locate approximate block bbox if available
                        bbox = None
                        for block in page.get("blocks", []):
                            if val in block.get("text", ""):
                                bbox = block.get("bbox")
                                break
                        if not bbox:
                            bbox = [50.0, 100.0, 500.0, 130.0]

                        extracted.append({
                            "field_name": field_name,
                            "extracted_value": val,
                            "confidence": 0.92,
                            "source_page": p_num,
                            "bbox": bbox,
                            "evidence_ref": f"p{p_num}#bbox:{bbox}"
                        })
                        found = True
                        break
                if found:
                    break

        # Check for institution name in top headers of page 1
        if pages:
            p1_text = pages[0].get("text", "")
            lines = [l.strip() for l in p1_text.splitlines() if len(l.strip()) > 8]
            if lines:
                # Top candidate line
                candidate = lines[0]
                extracted.append({
                    "field_name": "institution_name",
                    "extracted_value": candidate,
                    "confidence": 0.85,
                    "source_page": 1,
                    "bbox": [50.0, 40.0, 550.0, 80.0],
                    "evidence_ref": "p1#bbox:[50.0,40.0,550.0,80.0]"
                })

        return extracted

field_extractor = FieldExtractor()
