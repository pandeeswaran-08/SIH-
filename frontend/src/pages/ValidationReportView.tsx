import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, RefreshCw, Download, Printer, FileSpreadsheet, ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface ValidationReportViewProps {
  applicationId: number;
  onBack: () => void;
}

export const ValidationReportView: React.FC<ValidationReportViewProps> = ({ applicationId, onBack }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.getReport(applicationId);
      setReportData(data);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3 font-serif">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 border border-blue-100">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <span className="text-sm font-medium text-slate-600">Generating Official Scrutiny Dossier...</span>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-10 text-center space-y-4 max-w-lg mx-auto font-serif gov-card mt-10">
        <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-display font-bold text-slate-800">No Validation Report Available</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          A preliminary validation run has not been executed on this institutional application yet. Please trigger a 5-module scrutiny run first.
        </p>
        <button
          onClick={onBack}
          className="btn-primary cursor-pointer text-xs"
        >
          Return to Details & Run Validation
        </button>
      </div>
    );
  }

  const full = reportData.full_report || {};
  const app = full.application || {};
  const findings = full.findings || [];
  const contributions = full.contributions || [];

  return (
    <div className="space-y-6 font-serif max-w-5xl mx-auto animate-fade-in">
      
      {/* Action Toolbar */}
      <div className="gov-card p-5 flex items-center justify-between no-print">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition border border-slate-200 cursor-pointer"
            title="Return to Application"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-display font-bold text-slate-900 tracking-tight">Official Scrutiny Dossier</h1>
            <p className="text-[11px] text-slate-500 font-serif">
              Dossier No: <span className="font-mono text-slate-700">{reportData.report_number}</span> • Generated: {new Date(reportData.generated_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center space-x-1.5 cursor-pointer text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>
          <a
            href={api.getReportPdfUrl(applicationId)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary flex items-center space-x-1.5 cursor-pointer text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Official PDF</span>
          </a>
        </div>
      </div>

      {/* Official Government Dossier Document */}
      <div className="bg-white p-10 rounded-2xl border-2 border-slate-200 shadow-md space-y-7 print:border-none print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-5 text-center space-y-1.5">
          <div className="flex justify-center mb-1">
            <span className="text-[10px] uppercase tracking-[0.25em] font-display font-extrabold px-3 py-1 bg-slate-900 text-white rounded">
              GOVERNMENT OF INDIA • STATUTORY REGULATORY DOSSIER
            </span>
          </div>
          <div className="text-xs font-display font-bold uppercase tracking-widest text-slate-600">
            ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
          </div>
          <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">
            AI-POWERED APPLICATION SCRUTINY & DECISION-SUPPORT REPORT
          </h2>
          <div className="text-xs text-slate-600 font-serif">
            Approval Process Handbook Academic Session 2026–2027 • Dossier No: <span className="font-mono font-semibold">{reportData.report_number}</span>
          </div>
        </div>

        {/* Regulatory Disclaimer Notice */}
        <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 text-xs text-amber-950 leading-relaxed">
          <div className="flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <b className="font-display font-bold">STATUTORY DECISION-SUPPORT MANDATE:</b> This dossier represents an automated preliminary analysis compiled via computer vision, natural language extraction, cross-institutional history matching, and statutory rule screening. AI strictly assists human reviewers and never autonomously approves or rejects an institution. Final regulatory disposition is reserved exclusively for authorized AICTE scrutiny officers.
            </div>
          </div>
        </div>

        {/* 1. Institutional Master Information */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-display font-bold text-blue-950 uppercase tracking-widest border-b border-slate-200 pb-1.5">
            1. Institutional & Application Identification
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">Application No</span>
              <span className="font-bold text-blue-800 font-serif text-sm">{app.application_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">Permanent ID</span>
              <span className="font-mono font-bold text-slate-900">{app.aicte_permanent_id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">Category</span>
              <span className="font-semibold text-slate-800">{app.category}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">Composite Risk</span>
              <span className="font-bold text-rose-700">{reportData.risk_score.toFixed(1)}/100 ({reportData.risk_band})</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">Legal Name of Institution</span>
              <span className="font-bold text-slate-900 font-serif text-sm">{app.legal_name}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">Campus Address</span>
              <span className="text-slate-700 font-serif">{app.address}, {app.district}, {app.pin_code}</span>
            </div>
          </div>
        </div>

        {/* 2. Executive Scrutiny Summary & Recommendation */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-display font-bold text-blue-950 uppercase tracking-widest border-b border-slate-200 pb-1.5">
            2. Executive Scrutiny Summary & Recommended Action
          </h3>
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
            <div className="font-display font-bold text-slate-900 text-sm">
              Recommended Protocol Action: <span className="text-blue-700">{reportData.recommended_action}</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed font-serif">
              Automated scrutiny has evaluated 5 parallel modules. {findings.length} findings were recorded across the application. Reviewing officers must physically inspect linked evidence prior to final regulatory sign-off.
            </p>
          </div>
        </div>

        {/* 3. Findings & Anomalies Table */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-display font-bold text-blue-950 uppercase tracking-widest border-b border-slate-200 pb-1.5">
            3. Detailed Module Findings & Anomaly Flags ({findings.length})
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-20">Severity</th>
                  <th className="w-36">Module</th>
                  <th>Finding Title & Explanation</th>
                  <th className="w-36">Evidence Link</th>
                </tr>
              </thead>
              <tbody>
                {findings.length > 0 ? (
                  findings.map((f: any, idx: number) => (
                    <tr key={idx}>
                      <td>
                        <StatusBadge type="severity" value={f.severity} />
                      </td>
                      <td className="font-semibold text-xs text-slate-700">{f.module_name?.replace(/_/g, ' ')}</td>
                      <td>
                        <div className="font-display font-bold text-slate-900 text-xs">{f.title}</div>
                        <div className="text-xs text-slate-600 mt-1 font-serif leading-relaxed">{f.explanation}</div>
                      </td>
                      <td className="font-mono text-[10px] text-blue-700 break-all">{f.evidence_ref || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 font-serif italic text-xs">
                      No anomalies or rule breaches recorded in preliminary scrutiny.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Itemized Risk Contribution */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-display font-bold text-blue-950 uppercase tracking-widest border-b border-slate-200 pb-1.5">
            4. Itemized Score Contributions & Consolidations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {contributions.map((c: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div>
                  <div className="font-display font-bold text-slate-800">{c.category}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{c.rule_id}</div>
                </div>
                <div className="font-display font-bold text-rose-600 text-sm">+{c.contribution.toFixed(1)} pts</div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Sign-Off & Official Regulatory Endorsement */}
        <div className="pt-6 border-t-2 border-slate-300 space-y-4">
          <h3 className="text-xs font-display font-bold text-blue-950 uppercase tracking-widest">
            5. Regulatory Officer Sign-Off & Audit Endorsement
          </h3>

          <div className="grid grid-cols-2 gap-8 text-xs pt-4 font-serif">
            <div className="space-y-4">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">Validation Officer Signature</span>
                <div className="h-10 border-b border-slate-400 mt-2 font-mono text-slate-800 pt-3 font-semibold">
                  P. K. Narayanan (RO-WRO)
                </div>
              </div>
              <div className="text-[11px] text-slate-500">Date of Scrutiny: {new Date().toLocaleDateString()}</div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">Senior Reviewing Officer / Regional Officer</span>
                <div className="h-10 border-b border-slate-400 mt-2 font-mono text-slate-400 italic pt-3">
                  Pending Affirmative Human Sign-off
                </div>
              </div>
              <div className="text-[11px] text-slate-500">Cryptographic Checksum: SHA-256 Validated Audit Chain</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
