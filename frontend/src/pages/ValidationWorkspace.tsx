import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, RefreshCw, Play, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import type { ValidationRun, ValidationFinding } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface ValidationWorkspaceProps {
  applicationId: number;
  onBack: () => void;
  onNavigateToReport: (id: number) => void;
  onNavigateToRisk: (id: number) => void;
}

export const ValidationWorkspace: React.FC<ValidationWorkspaceProps> = ({
  applicationId,
  onBack,
  onNavigateToReport,
  onNavigateToRisk
}) => {
  const [valRun, setValRun] = useState<ValidationRun | null>(null);
  const [findings, setFindings] = useState<ValidationFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningValidation, setRunningValidation] = useState(false);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const run = await api.getValidationStatus(applicationId);
      setValRun(run);
      if (run) {
        const fList = await api.getFindings(applicationId);
        setFindings(fList);
      }
    } catch (err) {
      console.error('Failed to load validation status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [applicationId]);

  const handleRunValidation = async () => {
    setRunningValidation(true);
    try {
      const res = await api.triggerValidation(applicationId, `manual-${Date.now()}`);
      setValRun(res);
      const fList = await api.getFindings(applicationId);
      setFindings(fList);
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    } finally {
      setRunningValidation(false);
    }
  };

  const handleUpdateDisposition = async (findingId: number, disposition: string) => {
    const notes = prompt(`Enter review justification for disposition '${disposition}':`, 'Verified against physical inspection records.');
    if (notes === null) return;
    try {
      await api.updateFindingDisposition(findingId, disposition, notes);
      const updated = await api.getFindings(applicationId);
      setFindings(updated);
    } catch (err: any) {
      alert(`Failed to update disposition: ${err.message}`);
    }
  };

  if (loading && !valRun) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3 font-serif">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 border border-blue-100">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <span className="text-sm font-medium text-slate-600">Initializing 5-Module Scrutiny Workspace...</span>
        </div>
      </div>
    );
  }

  const moduleDefinitions = [
    {
      key: 'DOCUMENT_COMPLETENESS',
      number: '01',
      name: 'Document OCR & Completeness',
      desc: 'Statutory checklist verification, expiry inspection, duplicate hashes, and scan legibility.'
    },
    {
      key: 'INSTITUTIONAL_HISTORY',
      number: '02',
      name: 'Institutional History Cross-Check',
      desc: 'Comparative audit against historical approvals for unnotified site shifts or land shrinkage.'
    },
    {
      key: 'ANOMALY_FORGERY',
      number: '03',
      name: 'Anomaly & Forgery Screening',
      desc: 'Cross-institutional document hash matching, metadata forensics, and image reuse detection.'
    },
    {
      key: 'ISSUING_AUTHORITY',
      number: '04',
      name: 'Issuing-Authority Verification',
      desc: 'Adapters for Land Records Registry, State University Affiliation, and Fire NOC portals.'
    },
    {
      key: 'INFRASTRUCTURE_CV',
      number: '05',
      name: 'Infrastructure Evidence Analysis',
      desc: 'YOLOv8 & OpenCV computer vision inspection of labs, classrooms, fire safety & facilities.'
    }
  ];

  const filteredFindings = selectedModuleFilter === 'ALL'
    ? findings
    : findings.filter(f => f.module_name === selectedModuleFilter);

  return (
    <div className="space-y-6 font-serif animate-fade-in max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="gov-card p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition border border-slate-200 cursor-pointer"
            title="Return to Application"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                AICTE Scrutiny Engine
              </span>
              <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                5-Module Validation Workspace
              </h1>
              {valRun && <StatusBadge type="status" value={valRun.status} />}
              {valRun && <StatusBadge type="risk" value={valRun.risk_band} />}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-serif leading-relaxed">
              Execution Run #{valRun?.run_number || 1} • Engine Latency: <span className="font-semibold text-slate-700">{valRun?.execution_time_ms || 0} ms</span> • Composite Regulatory Risk: <span className="font-semibold text-slate-800">{valRun?.risk_score.toFixed(1) || 0}/100</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          <button
            onClick={handleRunValidation}
            disabled={runningValidation}
            className="btn-primary flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {runningValidation ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing 5 Modules...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Re-Run All 5 Modules</span>
              </>
            )}
          </button>
          <button
            onClick={() => onNavigateToRisk(applicationId)}
            className="btn-secondary flex items-center space-x-1.5 cursor-pointer text-xs"
          >
            <span>Risk Breakdown →</span>
          </button>
          <button
            onClick={() => onNavigateToReport(applicationId)}
            className="btn-secondary flex items-center space-x-1.5 cursor-pointer text-xs"
          >
            <span>Final Report →</span>
          </button>
        </div>
      </div>

      {/* 5 Parallel Module Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
        {moduleDefinitions.map((mod) => {
          const modRun = valRun?.module_runs?.find(m => m.module_name === mod.key);
          const isSelected = selectedModuleFilter === mod.key;
          const status = modRun?.status || 'QUEUED';
          const findingsCount = findings.filter(f => f.module_name === mod.key).length;

          return (
            <div
              key={mod.key}
              onClick={() => setSelectedModuleFilter(isSelected ? 'ALL' : mod.key)}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white hover:bg-slate-50/90 border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider">
                    MODULE {mod.number}
                  </span>
                  <StatusBadge type="status" value={status} />
                </div>
                <div className="text-xs font-display font-bold text-slate-900 leading-snug">{mod.name}</div>
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{mod.desc}</p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-serif">Latency: {modRun?.execution_time_ms || 0}ms</span>
                <span className={`font-semibold px-2 py-0.5 rounded-lg text-[10px] ${
                  findingsCount > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {findingsCount} {findingsCount === 1 ? 'finding' : 'findings'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Findings Section */}
      <div className="gov-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900">
              Module Findings & Human Review Disposition ({filteredFindings.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-serif">
              Active Module Filter: <span className="font-semibold text-blue-700">{selectedModuleFilter.replace(/_/g, ' ')}</span>.
              AI assists human officials — decisions require affirmative reviewer disposition.
            </p>
          </div>
          {selectedModuleFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedModuleFilter('ALL')}
              className="text-xs text-blue-600 hover:text-blue-800 font-serif underline self-start sm:self-auto cursor-pointer"
            >
              Show All Findings
            </button>
          )}
        </div>

        <div className="space-y-3.5">
          {filteredFindings.length > 0 ? (
            filteredFindings.map((finding) => (
              <div
                key={finding.id}
                className="p-5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all duration-200 space-y-3.5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5 flex-wrap">
                      <StatusBadge type="severity" value={finding.severity} />
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {finding.rule_id}
                      </span>
                      <span className="text-[11px] text-slate-500 font-serif font-medium">• {finding.category}</span>
                    </div>
                    <div className="text-sm font-display font-bold text-slate-900 mt-1">{finding.title}</div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <span className="text-[11px] text-slate-400 font-serif">Official Disposition:</span>
                    <StatusBadge type="disposition" value={finding.reviewer_disposition} />
                  </div>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60 font-serif">
                  {finding.explanation}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="font-mono text-[11px] text-blue-700">
                    Evidence Link: {finding.evidence_ref || 'checklist:statutory_norm'}
                  </div>

                  {/* Human-in-the-loop Disposition Buttons */}
                  <div className="flex items-center space-x-2 self-end sm:self-auto flex-wrap gap-y-1">
                    <button
                      onClick={() => handleUpdateDisposition(finding.id, 'CONFIRMED')}
                      className="px-3 py-1.5 text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer flex items-center space-x-1"
                    >
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>Confirm Issue</span>
                    </button>
                    <button
                      onClick={() => handleUpdateDisposition(finding.id, 'FALSE_POSITIVE')}
                      className="px-3 py-1.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Mark False Positive</span>
                    </button>
                    <button
                      onClick={() => handleUpdateDisposition(finding.id, 'REQUIRES_FURTHER_REVIEW')}
                      className="px-3 py-1.5 text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer flex items-center space-x-1"
                    >
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      <span>Further Review</span>
                    </button>
                  </div>
                </div>

                {finding.reviewer_notes && (
                  <div className="text-xs text-indigo-900 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 font-serif">
                    <b className="font-semibold text-indigo-950">Official Reviewer Note:</b> {finding.reviewer_notes}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs font-serif italic">
              No anomalies or statutory violations detected for this module. All regulatory rules verified cleanly.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
