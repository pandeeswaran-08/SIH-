import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, RefreshCw, AlertOctagon, Info
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface RiskExplorerProps {
  applicationId: number;
  onBack: () => void;
  onNavigateToReport: (id: number) => void;
}

export const RiskExplorer: React.FC<RiskExplorerProps> = ({
  applicationId,
  onBack,
  onNavigateToReport
}) => {
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const data = await api.getEvidence(applicationId);
      setEvidenceData(data);
    } catch (err) {
      console.error('Failed to load risk evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [applicationId]);

  if (loading || !evidenceData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3 font-serif">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 border border-blue-100">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <span className="text-sm font-medium text-slate-600">Synthesizing Explainable Risk Contributions...</span>
        </div>
      </div>
    );
  }

  const contributions = evidenceData.risk_contributions || [];

  const totalScore = Math.min(100.0, contributions.reduce((acc: number, c: any) => acc + (c.contribution || 0), 0));
  let band = 'LOW';
  let bandAction = 'Routine Documentation Verification';
  if (totalScore >= 75) {
    band = 'CRITICAL';
    bandAction = 'Immediate Inspection Committee Escalation';
  } else if (totalScore >= 50) {
    band = 'HIGH';
    bandAction = 'Senior Officer Physical Scrutiny Required';
  } else if (totalScore >= 25) {
    band = 'MEDIUM';
    bandAction = 'Document Scrutiny with Clarification Notice';
  }

  // Aggregate by Category
  const catMap: Record<string, number> = {};
  contributions.forEach((c: any) => {
    catMap[c.category] = (catMap[c.category] || 0) + c.contribution;
  });
  const catChartData = Object.entries(catMap).map(([k, v]) => ({
    name: k.replace(/_/g, ' '),
    score: Number(v.toFixed(1))
  }));

  return (
    <div className="space-y-6 font-serif animate-fade-in max-w-7xl mx-auto">
      
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
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Mathematical Model
              </span>
              <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                Explainable Risk-Scoring Engine
              </h1>
              <StatusBadge type="risk" value={band} />
            </div>
            <p className="text-xs text-slate-500 mt-1 font-serif leading-relaxed">
              Deterministic 0–100 score matrix • Single-root consolidation to prevent cascading duplicate penalization.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateToReport(applicationId)}
          className="btn-primary flex items-center space-x-2 cursor-pointer text-xs"
        >
          <span>View Structured Report →</span>
        </button>
      </div>

      {/* Top Cards: Composite Gauge + Recommended Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Score Gauge */}
        <div className="gov-card p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-widest">
              Composite Risk Index
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-4xl font-display font-bold text-slate-900">{totalScore.toFixed(1)}</span>
              <span className="text-sm text-slate-400 font-serif">/ 100</span>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  band === 'CRITICAL' ? 'bg-gradient-to-r from-rose-500 to-red-600' :
                  band === 'HIGH' ? 'bg-gradient-to-r from-orange-400 to-rose-500' :
                  band === 'MEDIUM' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                  'bg-gradient-to-r from-emerald-400 to-teal-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(8, totalScore))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-serif">
              <span>Low (0–24)</span>
              <span>Medium (25–49)</span>
              <span>High (50–74)</span>
              <span>Critical (75+)</span>
            </div>
          </div>
        </div>

        {/* Recommended Regulatory Action */}
        <div className="md:col-span-2 gov-card p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-display font-bold text-slate-900 border-b border-slate-100 pb-3">
            <AlertOctagon className="w-4 h-4 text-blue-600" />
            <span className="uppercase tracking-wider">Recommended Regulatory Action Protocol</span>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div className="font-display font-bold text-slate-900 text-sm">{bandAction}</div>
            <p className="text-slate-600 mt-1.5 leading-relaxed font-serif">
              Based on calibrated AICTE Approval Process Handbook scrutiny norms, applications evaluated within the <b>{band}</b> tier require {bandAction.toLowerCase()}.
            </p>
          </div>

          <div className="text-xs text-slate-500 flex items-start space-x-2 pt-1 font-serif leading-relaxed">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              <b className="text-slate-700">Statutory Guardrail:</b> This score represents an automated preliminary scrutiny index, NOT a final disposition or autonomous legal rejection. Regulatory approval remains the sole prerogative of authorized AICTE scrutiny officers.
            </span>
          </div>
        </div>

      </div>

      {/* Category Breakdown Chart */}
      <div className="chart-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900">Risk Deduction Breakdown by Finding Category</h2>
            <p className="text-xs text-slate-500 font-serif mt-0.5">Penalization distribution across statutory evaluation pillars</p>
          </div>
          <span className="text-xs font-serif text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {catChartData.length} active penalty categories
          </span>
        </div>

        <div className="h-60">
          {catChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catChartData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <XAxis type="number" domain={[0, 'dataMax + 5']} tick={{ fontSize: 11, fontFamily: 'Times New Roman, serif' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontFamily: 'Times New Roman, serif' }} width={160} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    color: '#f8fafc',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontFamily: 'Times New Roman, serif',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                  }}
                />
                <Bar dataKey="score" fill="#2563eb" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400 font-serif italic">
              No penalty deductions applied. Application scored in pristine 0.0 band.
            </div>
          )}
        </div>
      </div>

      {/* Itemized Contributions Table */}
      <div className="gov-card overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-base font-display font-bold text-slate-900">Itemized Score Contributions & Evidence Links</h2>
          <p className="text-xs text-slate-500 font-serif mt-0.5">Transparent mathematical derivation with direct links to supporting evidence</p>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Category</th>
                <th>Base Weight</th>
                <th>Contribution</th>
                <th>Supporting Explanation</th>
                <th>Evidence Reference</th>
              </tr>
            </thead>
            <tbody>
              {contributions.length > 0 ? (
                contributions.map((c: any, idx: number) => (
                  <tr key={idx}>
                    <td>
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {c.rule_id}
                      </span>
                    </td>
                    <td className="font-medium text-slate-700 text-xs">{c.category}</td>
                    <td className="text-xs text-slate-600 font-serif">{c.weight.toFixed(1)}</td>
                    <td>
                      <span className="font-display font-bold text-rose-600 text-xs">+{c.contribution.toFixed(1)}</span>
                    </td>
                    <td className="text-xs text-slate-800 max-w-sm font-serif leading-relaxed">{c.explanation}</td>
                    <td className="font-mono text-[11px] text-blue-600 truncate max-w-[150px]">
                      {c.evidence_ref || 'checklist:statutory_norm'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-serif italic text-xs">
                    No risk score contributions recorded. Zero penalty baseline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
