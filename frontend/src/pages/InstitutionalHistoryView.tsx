import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, RefreshCw, Building2
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface HistoryProps {
  applicationId: number;
  onBack: () => void;
}

export const InstitutionalHistoryView: React.FC<HistoryProps> = ({ applicationId, onBack }) => {
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getInstitutionalHistory(applicationId);
      setHistoryData(data);
    } catch (err) {
      console.error('Failed to load institutional history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3 font-serif">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 border border-blue-100">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <span className="text-sm font-medium text-slate-600">Cross-Referencing Institutional Records...</span>
        </div>
      </div>
    );
  }

  const comparisons = historyData?.comparisons || [];
  const timeline = historyData?.timeline || [];
  const inst = historyData?.institution || {};

  return (
    <div className="space-y-6 font-serif max-w-7xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="gov-card p-7 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition border border-slate-200 cursor-pointer"
            title="Return to Application"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Module 02
              </span>
              <span className="text-xs text-slate-400 font-serif">• AICTE Audit Cross-Check</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight mt-1.5">
              Institutional History Cross-Check
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-serif leading-relaxed">
              Comparing current declarations against prior AICTE approvals and historical master records.
            </p>
          </div>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="bg-blue-50/90 border border-blue-200/90 rounded-2xl p-5 text-xs text-blue-950 leading-relaxed flex items-start space-x-3.5 shadow-sm">
        <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-display font-bold text-sm">Historical Variance Scrutiny Norm: </span>
          <span className="text-slate-700 font-serif">
            Distinguish genuine regulatory discrepancies from legitimate institutional restructuring. The absence of previous historical applications is not treated as proof of misconduct.
          </span>
        </div>
      </div>

      {/* Side-by-Side Declarations Delta Table */}
      <div className="gov-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900">Side-by-Side Declaration Cross-Check</h2>
            <p className="text-xs text-slate-500 font-serif mt-0.5">Current submission fields compared with baseline historical records</p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Permanent ID: {inst.aicte_permanent_id || 'N/A'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Institutional Parameter</th>
                <th>Historical Record Value</th>
                <th>Current Declaration</th>
                <th>Delta / Variance Status</th>
                <th>Source Evidence</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.length > 0 ? (
                comparisons.map((c: any, idx: number) => {
                  const isMismatch = c.status !== 'MATCH';
                  return (
                    <tr key={idx} className={isMismatch ? 'bg-amber-50/50' : ''}>
                      <td className="font-semibold text-slate-900 text-xs">{c.field}</td>
                      <td className="text-xs text-slate-600 font-serif">{c.historical_value || 'None'}</td>
                      <td className="font-bold text-slate-900 text-xs">{c.current_value || 'None'}</td>
                      <td>
                        <StatusBadge type="status" value={c.status} />
                      </td>
                      <td className="font-mono text-[11px] text-blue-700">{c.evidence_ref}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-serif italic text-xs">
                    No historical variance delta records found. First-time applicant or identical declarations.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Submissions Timeline */}
      <div className="gov-card p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-display font-bold text-slate-900">Application Timeline History ({timeline.length})</h2>
          <p className="text-xs text-slate-500 font-serif mt-0.5">Chronological record of historical submissions by this institution</p>
        </div>

        <div className="space-y-3">
          {timeline.map((t: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all duration-200 shadow-sm text-xs">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-display font-bold text-sm border border-blue-200">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-display font-bold text-slate-900 text-sm">{t.application_number}</div>
                  <div className="text-[11px] text-slate-500 font-serif mt-0.5">Academic Session: {t.academic_year}</div>
                </div>
              </div>

              <div className="flex items-center space-x-5">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-display font-semibold text-slate-400">Composite Risk</div>
                  <div className="font-display font-bold text-slate-800 text-sm">{t.risk_score?.toFixed(1) || 0}/100</div>
                </div>
                <StatusBadge type="status" value={t.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
