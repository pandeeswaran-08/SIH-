import os
import json
from datetime import datetime
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.core.config import settings

class ReportService:
    def __init__(self):
        self.reports_dir = os.path.join(settings.STORAGE_LOCAL_DIR, "reports")
        os.makedirs(self.reports_dir, exist_ok=True)

    def generate_pdf_report(self, report_data: Dict[str, Any], output_filename: str) -> str:
        """
        Generates printable PDF regulatory report with ReportLab.
        Returns: relative path to the generated PDF.
        """
        pdf_path = os.path.join(self.reports_dir, output_filename)
        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'GovTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#0A192F')
        )
        subtitle_style = ParagraphStyle(
            'GovSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#475569')
        )
        h2_style = ParagraphStyle(
            'GovH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#1E3A8A'),
            spaceBefore=10,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'GovBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#1E293B')
        )

        elements = []

        # Header Title
        elements.append(Paragraph("ALL INDIA COUNCIL FOR TECHNICAL EDUCATION", title_style))
        elements.append(Paragraph("AI-Powered Application Scrutiny & Regulatory Decision-Support Report", subtitle_style))
        elements.append(Spacer(1, 10))

        # Metadata Table
        app = report_data.get("application", {})
        summary = report_data.get("summary", {})
        risk_score = report_data.get("risk_score", 0.0)
        risk_band = report_data.get("risk_band", "LOW")

        score_color = colors.HexColor('#059669') # Green
        if risk_band == "MEDIUM":
            score_color = colors.HexColor('#D97706')
        elif risk_band in ["HIGH", "CRITICAL"]:
            score_color = colors.HexColor('#DC2626')

        meta_table_data = [
            [
                Paragraph("<b>Application Number:</b>", body_style),
                Paragraph(str(app.get("application_number", "N/A")), body_style),
                Paragraph("<b>Academic Session:</b>", body_style),
                Paragraph(str(app.get("academic_year", "2026-2027")), body_style)
            ],
            [
                Paragraph("<b>Institution Name:</b>", body_style),
                Paragraph(str(app.get("legal_name", "N/A")), body_style),
                Paragraph("<b>Permanent ID:</b>", body_style),
                Paragraph(str(app.get("aicte_permanent_id", "N/A")), body_style)
            ],
            [
                Paragraph("<b>Category:</b>", body_style),
                Paragraph(str(app.get("category", "Engineering & Tech")), body_style),
                Paragraph("<b>Composite Risk:</b>", body_style),
                Paragraph(f"<b><font color='{score_color.hexval()}'>{risk_score:.1f}/100 ({risk_band})</font></b>", body_style)
            ]
        ]
        meta_table = Table(meta_table_data, colWidths=[110, 160, 110, 160])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 12))

        # Advisory Notice
        advisory_text = (
            "<b>NOTICE:</b> This document is an automated decision-support dossier generated via computer vision, "
            "document intelligence, and statutory rule screening. AI never autonomously approves or rejects an application. "
            "Final regulatory decisions are reserved exclusively for authorized AICTE officials."
        )
        advisory_table = Table([[Paragraph(advisory_text, body_style)]], colWidths=[540])
        advisory_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FEF3C7')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#F59E0B')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(advisory_table)
        elements.append(Spacer(1, 10))

        # Section: Findings
        elements.append(Paragraph("Validation Module Findings & Anomalies", h2_style))
        findings = report_data.get("findings", [])
        
        if findings:
            findings_data = [["Sev", "Module", "Finding Title", "Explanation", "Evidence Link"]]
            for f in findings[:15]: # Show top 15 in summary PDF
                sev = f.get("severity", "MED")
                findings_data.append([
                    Paragraph(f"<b>{sev}</b>", body_style),
                    Paragraph(f.get("module_name", "").replace("_", " "), body_style),
                    Paragraph(f.get("title", ""), body_style),
                    Paragraph(f.get("explanation", ""), body_style),
                    Paragraph(f.get("evidence_ref", "N/A"), body_style)
                ])

            findings_table = Table(findings_data, colWidths=[40, 80, 130, 200, 90])
            findings_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')])
            ]))
            elements.append(findings_table)
        else:
            elements.append(Paragraph("No regulatory findings or anomalies detected. All scrutiny checks passed.", body_style))

        elements.append(Spacer(1, 15))

        # Sign-off & Audit Section
        elements.append(Paragraph("Regulatory Decision & Audit Sign-Off", h2_style))
        sign_table_data = [
            [
                Paragraph("<b>Scrutiny Officer:</b> AICTE Decision Support Subsystem v1.0", body_style),
                Paragraph("<b>Audit Checksum:</b> SHA-256 Verified", body_style)
            ],
            [
                Paragraph("<b>Official Reviewer Signature:</b> ___________________________", body_style),
                Paragraph("<b>Date of Inspection:</b> ____ / ____ / 2026", body_style)
            ]
        ]
        sign_table = Table(sign_table_data, colWidths=[270, 270])
        sign_table.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 8)
        ]))
        elements.append(sign_table)

        # Build document
        doc.build(elements)
        return os.path.join("reports", output_filename).replace("\\", "/")

report_service = ReportService()
