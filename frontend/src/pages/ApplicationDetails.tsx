import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle, AlertTriangle, Cpu, FileSpreadsheet,
  ScanEye, History, Edit3, ArrowLeft, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import type { Application, ApplicationDocument } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface ApplicationDetailsProps {
  applicationId: number;
  onBack: () => void;
  onNavigateToWorkspace: (id: number) => void;
  onNavigateToReport: (id: number) => void;
  onNavigateToDocViewer: (id: number) => void;
  onNavigateToHistory: (id: number) => void;
}

export const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({
  applicationId,
  onBack,
  onNavigateToWorkspace,
  onNavigateToReport,
  onNavigateToDocViewer,
  onNavigateToHistory
}) => {
  const [app, setApp] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [overrideJustification, setOverrideJustification] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Decision Modal
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState('APPROVAL_RECOMMENDED');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [officialSig, setOfficialSig] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [appData, docs, chk] = await Promise.all([
        api.getApplication(applicationId),
        api.getDocuments(applicationId),
        api.getApplicationChecklist(applicationId).catch(() => null)
      ]);
      setApp(appData);
      setDocuments(docs);
      setChecklist(chk);
      setNewCategory(appData.category);
    } catch (err) {
      console.error('Failed to load application details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [applicationId]);

  const handleCategoryOverride = async () => {
    if (!overrideJustification) {
      alert('Official justification is required to modify category');
      return;
    }
    setActionLoading(true);
    try {
      const updated = await api.overrideCategory(applicationId, newCategory, overrideJustification);
      setApp(updated);
      setShowOverrideModal(false);
      setOverrideJustification('');
      alert('Category classification corrected and recorded in tamper-evident audit history.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordDecision = async () => {
    if (!officialSig || !decisionNotes) {
      alert('Please provide official signature and review findings justification notes');
      return;
    }
    setActionLoading(true);
    try {
      await api.recordDecision(applicationId, {
        decision_type: decisionType,
        notes: decisionNotes,
        official_signature: officialSig
      });
      setShowDecisionModal(false);
      alert('Official regulatory recommendation recorded successfully!');
      fetchDetails();
    } catch (err: any) {
      alert(`Failed to record decision: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !app) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3 font-serif">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 border border-blue-100">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <span className="text-sm font-medium text-slate-600">Retrieving Application Master Record...</span>
        </div>
      </div>
    );
  }

  const inst = app.institution;

  return (
    <div className="space-y-6 font-serif max-w-7xl mx-auto animate-fade-in">
      
      {/* Top Header & Actions */}
      <div className="gov-card p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition border border-slate-200 cursor-pointer"
            title="Return to Queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Institutional File
              </span>
              <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                {app.application_number}
              </h1>
              <StatusBadge type="status" value={app.status} />
              <StatusBadge type="risk" value={app.risk_band} />
            </div>
            <p className="text-xs text-slate-500 mt-1 font-serif leading-relaxed">
              {inst?.legal_name} • Permanent ID: <span className="font-mono font-semibold text-slate-700">{inst?.aicte_permanent_id || 'N/A'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateToWorkspace(app.id)}
            className="btn-primary flex items-center space-x-1.5 cursor-pointer text-xs"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>5-Module Scrutiny</span>
          </button>
          <button
            onClick={() => onNavigateToDocViewer(app.id)}
            className="btn-secondary flex items-center space-x-1.5 cursor-pointer text-xs"
          >
            <ScanEye className="w-3.5 h-3.5" />
            <span>OCR Viewer</span>
          </button>
          <button
            onClick={() => onNavigateToReport(app.id)}
            className="btn-secondary flex items-center space-x-1.5 cursor-pointer text-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Scrutiny Report</span>
          </button>
          <button
            onClick={() => setShowDecisionModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold rounded-xl text-xs transition-all duration-200 flex items-center space-x-1.5 cursor-pointer shadow-md"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Record Official Decision</span>
          </button>
        </div>
      </div>

      {/* Attention Required Banner if flagged */}
      {app.attention_required && (
        <div className="bg-rose-50/90 border border-rose-200/90 rounded-2xl p-5 flex items-start space-x-3.5 text-rose-900 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs font-serif leading-relaxed">
            <span className="font-display font-bold text-sm">Official Scrutiny Attention Required: </span>
            <span className="text-rose-800">{app.attention_reasons || 'High composite risk score or critical regulatory discrepancies detected during automated checks.'}</span>
            <div className="mt-1.5 text-[11px] text-rose-700 font-medium">
              Review findings in the Scrutiny Workspace before recording institutional regulatory recommendation.
            </div>
          </div>
        </div>
      )}

      {/* Grid: Institution Profile & Declarations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Institutional Profile */}
        <div className="md:col-span-2 gov-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-display font-bold text-slate-900">Institutional Master Profile</h2>
              <p className="text-xs text-slate-500 font-serif">Verified statutory registration details</p>
            </div>
            <button
              onClick={() => setShowOverrideModal(true)}
              className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-medium font-serif underline cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Correct Category</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-serif">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">Legal Name</span>
              <span className="font-semibold text-slate-900 text-sm">{inst?.legal_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">AICTE Permanent ID</span>
              <span className="font-mono font-bold text-blue-700 text-sm">{inst?.aicte_permanent_id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">Assigned Category</span>
              <span className="font-semibold text-slate-800 text-xs">{app.category.replace(/_/g, ' ')}</span>
              {app.category_overridden && (
                <span className="ml-2 text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold border border-amber-200">MANUAL OVERRIDE</span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">Classification Method</span>
              <span className="text-slate-700">{app.category_classification_method} ({(app.category_confidence * 100).toFixed(0)}%)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">Location / Jurisdiction</span>
              <span className="text-slate-700">{inst?.district}, {inst?.state} - {inst?.pin_code}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">Year Established</span>
              <span className="text-slate-700">{inst?.establishment_year}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold">Campus Address</span>
              <span className="text-slate-700">{inst?.address}</span>
            </div>
          </div>
        </div>

        {/* Declarations vs Norms */}
        <div className="gov-card p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-display font-bold text-slate-900">Statutory Declarations</h2>
              <p className="text-xs text-slate-500 font-serif">Applicant declared metrics</p>
            </div>

            <div className="space-y-2.5 text-xs font-serif mt-3">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Declared Land:</span>
                <span className="font-bold text-slate-900">{app.declared_land_acres || 'N/A'} Acres</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Built-Up Area:</span>
                <span className="font-bold text-slate-900">{app.declared_builtup_sqm || 'N/A'} Sqm</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Core Faculty:</span>
                <span className="font-bold text-slate-900">{app.declared_faculty_count || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Student Intake:</span>
                <span className="font-bold text-slate-900">{app.declared_student_intake || 'N/A'} Seats</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Composite Risk:</span>
                <span className="font-display font-bold text-blue-700">{app.overall_risk_score.toFixed(1)}/100 ({app.risk_band})</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToHistory(app.id)}
            className="w-full mt-4 flex items-center justify-center space-x-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-serif border border-slate-200 transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>Compare with Historical Record</span>
          </button>
        </div>

      </div>

      {/* Regulatory Checklist Snapshot Table */}
      <div className="gov-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900">Regulatory Requirement Checklist Snapshot</h2>
            <p className="text-xs text-slate-500 font-serif mt-0.5">Mandatory statutory clearance items under AICTE Approval Process Handbook</p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Rule Version: {checklist?.rule_version || '2026.1.0'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Requirement Code</th>
                <th>Statutory Clearance Item</th>
                <th>Document Type</th>
                <th>Mandatory</th>
                <th>Checklist Status</th>
              </tr>
            </thead>
            <tbody>
              {checklist?.items && checklist.items.length > 0 ? (
                checklist.items.map((it: any, idx: number) => (
                  <tr key={idx}>
                    <td>
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {it.code}
                      </span>
                    </td>
                    <td className="font-medium text-slate-900 text-xs">{it.title}</td>
                    <td className="text-xs text-slate-600 font-serif">{it.doc_type}</td>
                    <td>
                      {it.is_mandatory ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">MANDATORY</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-serif italic">Optional</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge type="status" value={it.status || 'PENDING'} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-serif italic text-xs">
                    Checklist snapshot loading or not attached.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attached Document Evidence */}
      <div className="gov-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900">Uploaded Document Evidence ({documents.length})</h2>
            <p className="text-xs text-slate-500 font-serif mt-0.5">Cryptographic SHA-256 fingerprinting & optical extraction</p>
          </div>
          <button
            onClick={() => onNavigateToDocViewer(app.id)}
            className="text-xs text-blue-600 hover:text-blue-800 font-serif underline cursor-pointer"
          >
            Launch Interactive Document Viewer →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {documents.map((doc) => (
            <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all duration-200 space-y-2.5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="font-semibold text-xs text-slate-900 truncate max-w-[170px]" title={doc.original_filename}>
                    {doc.original_filename}
                  </div>
                </div>
                <StatusBadge type="status" value={doc.status} />
              </div>
              
              <div className="text-[10px] font-mono text-slate-400 truncate bg-slate-50 px-2 py-1 rounded" title={`SHA-256: ${doc.sha256_hash}`}>
                SHA: {doc.sha256_hash.substring(0, 16)}...
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-serif">
                <span>{(doc.file_size_bytes / 1024).toFixed(0)} KB • {doc.page_count} p.</span>
                <a
                  href={api.getDocumentFileUrl(doc.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-semibold text-[11px]"
                >
                  View File
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Correction Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-serif">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-scale-in">
            <h3 className="text-lg font-display font-bold text-slate-900">Correct Institutional Category</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Only authorized officers may correct category classifications. This alteration is audited in the tamper-evident log.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Category *</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full text-xs font-serif px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
              >
                <option value="ENGINEERING_TECH">Engineering & Technology</option>
                <option value="MANAGEMENT">Management Studies</option>
                <option value="PHARMACY">Pharmacy Education</option>
                <option value="ARCHITECTURE">Architecture & Planning</option>
                <option value="APPLIED_ARTS_CRAFTS">Applied Arts & Crafts</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Justification *</label>
              <textarea
                rows={3}
                placeholder="Document official reason for correcting category (e.g., trust amended charter to technical polytechnic)..."
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
                className="w-full text-xs font-serif p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="btn-secondary text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCategoryOverride}
                disabled={actionLoading}
                className="btn-primary text-xs cursor-pointer disabled:opacity-50"
              >
                Save & Audit Correction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regulatory Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-serif">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-scale-in">
            <h3 className="text-lg font-display font-bold text-slate-900">Record Regulatory Scrutiny Decision</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              AICTE regulatory mandate: AI provides explainable risk scrutiny. Human authorized officials record legal approvals or rejections.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Regulatory Disposition Recommendation *</label>
              <select
                value={decisionType}
                onChange={(e) => setDecisionType(e.target.value)}
                className="w-full text-xs font-serif px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
              >
                <option value="APPROVAL_RECOMMENDED">Approval Recommended (Full Compliance)</option>
                <option value="CLARIFICATION_REQUESTED">Clarification Requested (Deficiencies Noted)</option>
                <option value="ESCALATED_TO_COMMITTEE">Escalate to Senior Inspection Committee</option>
                <option value="REJECTION_RECOMMENDED">Rejection Recommended (Statutory Violation)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Review Notes & Findings *</label>
              <textarea
                rows={4}
                placeholder="State statutory basis, document scrutiny summary, and reasons for disposition..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="w-full text-xs font-serif p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Officer Digital Signature / Name *</label>
              <input
                type="text"
                placeholder="e.g. P. K. Narayanan (Validation Officer, RO-WRO)"
                value={officialSig}
                onChange={(e) => setOfficialSig(e.target.value)}
                className="w-full text-xs font-serif px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setShowDecisionModal(false)}
                className="btn-secondary text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordDecision}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold rounded-xl text-xs transition-all duration-200 cursor-pointer shadow-md disabled:opacity-50"
              >
                Record Statutory Disposition
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
