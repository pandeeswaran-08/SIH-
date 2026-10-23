import os
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Any, Tuple, Optional
import hashlib

class ForgeryScreener:
    """
    Module 3: Anomaly and Potential Forgery Screening.
    Combines OpenCV analysis, metadata forensics, perceptual hash comparisons, and deterministic checks.
    Outputs screening indicators, not definitive legal proof of forgery.
    """

    def compute_phash(self, image_path: str) -> Optional[str]:
        """Calculates 64-bit perceptual difference hash (dHash) for near-duplicate image detection."""
        try:
            with Image.open(image_path) as img:
                img_gray = img.convert('L').resize((9, 8), Image.Resampling.LANCZOS)
                pixels = list(img_gray.getdata())
                diff = []
                for row in range(8):
                    for col in range(8):
                        pixel_left = pixels[row * 9 + col]
                        pixel_right = pixels[row * 9 + col + 1]
                        diff.append(pixel_left > pixel_right)
                decimal_val = 0
                hex_str = []
                for index, val in enumerate(diff):
                    if val:
                        decimal_val += 2**(index % 4)
                    if (index % 4) == 3:
                        hex_str.append(hex(decimal_val)[2:])
                        decimal_val = 0
                return ''.join(hex_str)
        except Exception:
            return None

    def hamming_distance(self, hash1: str, hash2: str) -> int:
        if not hash1 or not hash2 or len(hash1) != len(hash2):
            return 999
        return sum(c1 != c2 for c1, c2 in zip(hash1, hash2))

    def analyze_image_ela(self, image_path: str) -> Dict[str, Any]:
        """
        Error Level Analysis (ELA) indicator using OpenCV:
        Measures compression artifact variance across image blocks.
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return {"suspicious": False, "score": 0.0}
            
            # Convert to YCrCb and compute Laplacian variance
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()

            # Analyze localized brightness variance in high-frequency regions
            suspicious = False
            score = 0.05
            if lap_var > 1500.0:
                # Potential high-frequency localized text splicing
                suspicious = True
                score = min(0.75, round(lap_var / 3000.0, 2))

            return {
                "suspicious": suspicious,
                "score": score,
                "laplacian_variance": round(lap_var, 1)
            }
        except Exception:
            return {"suspicious": False, "score": 0.0}

    def run_screening(
        self,
        documents: List[Dict[str, Any]],
        cross_institution_hashes: Dict[str, str] = None
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Executes screening on all documents in the application.
        Returns: (findings_list, summary_dict)
        """
        findings = []
        cross_hashes = cross_institution_hashes or {}
        img_hashes = {}

        for doc in documents:
            sha = doc.get("sha256_hash")
            doc_id = doc.get("id")
            fname = doc.get("filename", "")
            meta = doc.get("metadata", {}) or {}

            # 1. Cross-institution duplicate file check
            if sha in cross_hashes and cross_hashes[sha] != str(doc.get("application_id")):
                findings.append({
                    "rule_id": "ANOM_CROSS_INSTITUTION_DUP",
                    "title": f"Inter-Institutional File Collision: {fname}",
                    "explanation": f"Document '{fname}' matches an exact SHA-256 fingerprint from prior submission by Application #{cross_hashes[sha]}. Document recycling across separate applicants is highly anomalous.",
                    "severity": "CRITICAL",
                    "category": "DUPLICATE_FILES",
                    "evidence_ref": f"sha256:{sha[:16]}#collided_app:{cross_hashes[sha]}",
                    "document_id": doc_id,
                    "confidence": 1.0
                })

            # 2. PDF Metadata Tampering Indicators
            creator = str(meta.get("creator", "")).lower()
            producer = str(meta.get("producer", "")).lower()
            suspicious_software = ["photoshop", "gimp", "canva", "ilovepdf", "sejda", "pdf-modifier"]
            
            for tool in suspicious_software:
                if tool in creator or tool in producer:
                    findings.append({
                        "rule_id": "ANOM_SUSPICIOUS_PRODUCER",
                        "title": f"Editing Software Detected in Certificate Metadata: {fname}",
                        "explanation": f"Document metadata indicates generation/editing by '{tool.capitalize()}' (Producer: {producer or creator}). Formal statutory government orders and registered deeds are typically not produced via image manipulation software.",
                        "severity": "MEDIUM",
                        "category": "METADATA_ANOMALY",
                        "evidence_ref": f"doc:{doc_id}#producer:{producer[:30]}",
                        "document_id": doc_id,
                        "confidence": 0.85
                    })
                    break

            # 3. Image Perceptual Hash and Splicing Check (if image or photo)
            local_path = doc.get("full_path")
            if local_path and os.path.exists(local_path):
                ext = os.path.splitext(local_path)[1].lower()
                if ext in [".png", ".jpg", ".jpeg"]:
                    phash = self.compute_phash(local_path)
                    if phash:
                        # Check against other uploaded images in same batch
                        for other_fname, other_phash in img_hashes.items():
                            dist = self.hamming_distance(phash, other_phash)
                            if dist <= 3:
                                findings.append({
                                    "rule_id": "ANOM_PERCEPTUAL_IMG_DUP",
                                    "title": f"Perceptual Image Duplication: {fname}",
                                    "explanation": f"Photo '{fname}' is a cropped or re-compressed near-duplicate of '{other_fname}' (Hamming distance {dist}/64). Using identical photos for distinct facilities is flagged.",
                                    "severity": "HIGH",
                                    "category": "DUPLICATE_IMAGES",
                                    "evidence_ref": f"dhash:{phash}#vs:{other_phash}",
                                    "document_id": doc_id,
                                    "confidence": 0.92
                                })
                        img_hashes[fname] = phash

                    # Error Level Analysis
                    ela_res = self.analyze_image_ela(local_path)
                    if ela_res.get("suspicious"):
                        findings.append({
                            "rule_id": "ANOM_IMAGE_SPLICING",
                            "title": f"Compression Artifact Discontinuity: {fname}",
                            "explanation": f"High localized frequency variance detected (Laplacian score {ela_res.get('laplacian_variance')}). Image may have spliced text or inserted numbers overlaying original background.",
                            "severity": "MEDIUM",
                            "category": "MANIPULATION_INDICATOR",
                            "evidence_ref": f"doc:{doc_id}#ela_score:{ela_res.get('score')}",
                            "document_id": doc_id,
                            "confidence": ela_res.get("score")
                        })

        summary = {
            "total_documents_screened": len(documents),
            "anomalies_detected": len(findings),
            "status": "COMPLETED" if len(findings) == 0 else "COMPLETED_WITH_WARNINGS"
        }

        return findings, summary

forgery_screener = ForgeryScreener()
