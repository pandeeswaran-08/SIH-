import React, { useState, useEffect } from 'react';
import {
  Search, Eye, Cpu, FileSpreadsheet,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import type { Application } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface ApplicationQueueProps {
  onSelectApplication: (id: number) => void;
  onNavigateToWorkspace: (id: number) => void;
  onNavigateToReport: (id: number) => void;
}

export const ApplicationQueue: React.FC<ApplicationQueueProps> = ({
  onSelectApplication,
  onNavigateToWorkspace,
  onNavigateToReport
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [attentionOnly, setAttentionOnly] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (riskFilter) params.risk_band = riskFilter;
      if (statusFilter) params.status = statusFilter;
      if (attentionOnly) params.attention_only = true;

      const data = await api.getApplications(params);
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [categoryFilter, riskFilter, statusFilter, attentionOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApps();
  };

  return (
    <div className="space-y-6 animate-fade-in font-serif">
      
      {/* Top Header Card */}
      <div className="gov-card p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Regulatory Queue
            </span>
            <span className="text-xs text-slate-400 font-serif">• AICTE Scrutiny Workflow</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight mt-1.5">
            Institutional Application Scrutiny Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-serif leading-relaxed">
            Real-time regulatory workflow stream for AI scrutiny, cross-verification, and human officer disposition.
          </p>
        </div>
        <button
          onClick={fetchApps}
          className="btn-secondary flex items-center space-x-2 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span className="font-serif text-xs">Refresh Queue</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="gov-card p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by application number, institution name, or AICTE permanent ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-serif pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-serif border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="ENGINEERING_TECH">Engineering & Tech</option>
              <option value="MANAGEMENT">Management</option>
              <option value="PHARMACY">Pharmacy</option>
              <option value="ARCHITECTURE">Architecture</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="text-xs font-serif border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            >
              <option value="">All Risk Bands</option>
              <option value="LOW">Low Risk (0-24)</option>
              <option value="MEDIUM">Medium Risk (25-49)</option>
              <option value="HIGH">High Risk (50-74)</option>
              <option value="CRITICAL">Critical Risk (75-100)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-serif border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="VALIDATING">Validating</option>
              <option value="REQUIRES_ATTENTION">Requires Attention</option>
              <option value="PRELIMINARY_VALIDATION_COMPLETED">Preliminary Completed</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <label className="flex items-center space-x-1.5 text-xs text-rose-700 font-semibold cursor-pointer px-3 py-2 bg-rose-50/70 border border-rose-200/80 rounded-xl hover:bg-rose-100/60 transition">
              <input
                type="checkbox"
                checked={attentionOnly}
                onChange={(e) => setAttentionOnly(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="font-serif">Review Required Only</span>
            </label>
          </div>

        </form>
      </div>

      {/* Applications Table Card */}
      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Application No.</th>
                <th>Institution & Location</th>
                <th>Category</th>
                <th>Declared Land / Area</th>
                <th>Status</th>
                <th>Composite Risk</th>
                <th>Scrutiny Flag</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span className="text-sm font-serif">Loading applications from statutory register...</span>
                  </td>
                </tr>
              ) : applications.length > 0 ? (
                applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <button
                        onClick={() => onSelectApplication(app.id)}
                        className="font-bold text-blue-600 hover:text-blue-800 text-xs font-serif hover:underline transition"
                      >
                        {app.application_number}
                      </button>
                      <div className="text-[11px] text-slate-400 font-serif mt-0.5">
                        {app.academic_year} • {app.application_type.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-900 text-xs">{app.institution?.legal_name || 'Institution'}</div>
                      <div className="text-[11px] text-slate-500 font-serif mt-0.5">
                        PID: {app.institution?.aicte_permanent_id || 'N/A'} • {app.institution?.district}, {app.institution?.state}
                      </div>
                    </td>
                    <td className="font-medium text-slate-700 text-xs">
                      {app.category.replace(/_/g, ' ')}
                    </td>
                    <td className="text-xs text-slate-700 font-serif">
                      <div>{app.declared_land_acres ? `${app.declared_land_acres} Acres` : 'N/A'}</div>
                      <div className="text-[11px] text-slate-400 font-serif">{app.declared_builtup_sqm ? `${app.declared_builtup_sqm} Sqm` : ''}</div>
                    </td>
                    <td>
                      <StatusBadge type="status" value={app.status} />
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <StatusBadge type="risk" value={app.risk_band} />
                        <span className="font-display font-bold text-slate-800 text-xs">{app.overall_risk_score.toFixed(1)}</span>
                      </div>
                    </td>
                    <td>
                      {app.attention_required ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                          Review Required
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-serif italic">Nominal</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onSelectApplication(app.id)}
                          title="View Application Details"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 rounded-lg transition border border-transparent hover:border-blue-200"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigateToWorkspace(app.id)}
                          title="Open 5-Module Scrutiny Workspace"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition border border-transparent hover:border-indigo-200"
                        >
                          <Cpu className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigateToReport(app.id)}
                          title="View Scrutiny Report"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/80 rounded-lg transition border border-transparent hover:border-emerald-200"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs font-serif italic">
                    No applications match the specified criteria in the regulatory queue.
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
