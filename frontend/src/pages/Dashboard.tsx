import React, { useEffect, useState } from 'react';
import {
  ShieldAlert, CheckCircle, Clock, FileText,
  TrendingUp, AlertTriangle, Cpu, RefreshCw, Eye
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { api } from '../services/api';
import type { DashboardStats, Application } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface DashboardProps {
  onSelectApplication: (id: number) => void;
  onNavigateToQueue: () => void;
  onNavigateToWizard: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectApplication,
  onNavigateToQueue,
  onNavigateToWizard
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, apps] = await Promise.all([
        api.getDashboardSummary(),
        api.getApplications({ limit: 6 })
      ]);
      setStats(s);
      setRecentApps(apps);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(79,70,229,0.1) 100%)',
              border: '1px solid rgba(37,99,235,0.15)'
            }}
          >
            <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
          </div>
          <span className="text-sm font-serif text-slate-500">Loading AICTE Scrutiny Telemetry...</span>
        </div>
      </div>
    );
  }

  // Charts formatting
  const riskChartData = [
    { name: 'Low (0-24)', count: stats?.risk_distribution?.LOW || 0, fill: '#10B981' },
    { name: 'Medium (25-49)', count: stats?.risk_distribution?.MEDIUM || 0, fill: '#F59E0B' },
    { name: 'High (50-74)', count: stats?.risk_distribution?.HIGH || 0, fill: '#F97316' },
    { name: 'Critical (75-100)', count: stats?.risk_distribution?.CRITICAL || 0, fill: '#EF4444' }
  ];

  const categoryChartData = Object.entries(stats?.category_distribution || {}).map(([key, val]) => ({
    name: key.replace(/_/g, ' '),
    value: val
  }));

  const PIE_COLORS = ['#1E3A8A', '#0D9488', '#2563EB', '#D97706', '#64748B'];

  return (
    <div className="space-y-7 animate-fade-in">
      
      {/* Top Banner */}
      <div className="gov-card p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
            Executive Scrutiny Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 font-serif leading-relaxed">
            Real-time regulatory decision-support monitoring for statutory AICTE approval validation.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="font-serif">Refresh Telemetry</span>
          </button>
          <button
            onClick={onNavigateToWizard}
            className="btn-primary flex items-center space-x-2"
          >
            <span className="font-serif">+ Submit New Application</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="kpi-card kpi-card--blue p-6 flex items-center justify-between group">
          <div>
            <div className="text-xs font-display font-semibold text-slate-500 uppercase tracking-[0.1em]">Total Applications</div>
            <div className="text-3xl font-display font-bold text-slate-900 mt-2">{stats?.total_applications ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1.5 font-serif">Academic Session 2026–2027</div>
          </div>
          <div className="icon-container icon-container--blue w-14 h-14 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="kpi-card kpi-card--sky p-6 flex items-center justify-between group">
          <div>
            <div className="text-xs font-display font-semibold text-slate-500 uppercase tracking-[0.1em]">Validations In Progress</div>
            <div className="text-3xl font-display font-bold text-blue-600 mt-2">{stats?.applications_processing ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1.5 font-serif">5 Parallel Modules Active</div>
          </div>
          <div className="icon-container icon-container--sky w-14 h-14 group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="kpi-card kpi-card--emerald p-6 flex items-center justify-between group">
          <div>
            <div className="text-xs font-display font-semibold text-slate-500 uppercase tracking-[0.1em]">Scrutiny Completed</div>
            <div className="text-3xl font-display font-bold text-emerald-600 mt-2">{stats?.completed_validations ?? 0}</div>
            <div className="text-xs text-emerald-600 font-serif font-medium mt-1.5">Ready for Officer Review</div>
          </div>
          <div className="icon-container icon-container--emerald w-14 h-14 group-hover:scale-110 transition-transform">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="kpi-card kpi-card--rose p-6 flex items-center justify-between group">
          <div>
            <div className="text-xs font-display font-semibold text-rose-700 uppercase tracking-[0.1em]">Attention Required</div>
            <div className="text-3xl font-display font-bold text-rose-600 mt-2">{stats?.attention_required_count ?? 0}</div>
            <div className="text-xs text-rose-600 font-serif font-medium mt-1.5">High Risk or Critical Finding</div>
          </div>
          <div className="icon-container icon-container--rose w-14 h-14 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Distribution Chart */}
        <div className="chart-card">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-bold text-slate-900">Explainable Risk Distribution</h2>
                <p className="text-xs text-slate-500 font-serif mt-1">Calibrated risk score bands across institutional applications</p>
              </div>
              <span className="text-xs font-display font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">0–100 Scale</span>
            </div>
          </div>
          <div className="p-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Times New Roman, serif' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'Times New Roman, serif' }} />
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
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {riskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="chart-card">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-bold text-slate-900">Application Categories</h2>
                <p className="text-xs text-slate-500 font-serif mt-1">Categorization under AICTE Approval Process Handbook</p>
              </div>
              <span className="text-xs font-display font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">Handbook 2026</span>
            </div>
          </div>
          <div className="p-5 h-64 flex items-center justify-center">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={35}
                    label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`pie-cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
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
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-sm text-slate-400 font-serif italic">No application categories seeded yet</span>
            )}
          </div>
        </div>

      </div>

      {/* Operational Telemetry Banner */}
      <div className="telemetry-banner text-white p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center space-x-4 p-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-display font-bold text-slate-400 tracking-[0.1em]">Avg Scrutiny Latency</div>
              <div className="text-lg font-display font-bold text-white mt-0.5">{stats?.avg_processing_latency_ms || 1200} ms</div>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-3 border-t sm:border-t-0 sm:border-l border-slate-700/50">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-display font-bold text-slate-400 tracking-[0.1em]">OCR Extraction Success</div>
              <div className="text-lg font-display font-bold text-emerald-400 mt-0.5">{stats?.ocr_success_rate || 100}%</div>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-3 border-t sm:border-t-0 sm:border-l border-slate-700/50">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-display font-bold text-slate-400 tracking-[0.1em]">Unresolved Official Alerts</div>
              <div className="text-lg font-display font-bold text-amber-400 mt-0.5">{stats?.active_alerts_count || 0} Cases</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications Scrutiny Queue Table */}
      <div className="chart-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900">Recent Applications Queue</h2>
            <p className="text-xs text-slate-500 font-serif mt-1">Live applications undergoing automated validation and risk assessment</p>
          </div>
          <button
            onClick={onNavigateToQueue}
            className="text-sm text-blue-600 hover:text-blue-800 font-display font-semibold transition flex items-center space-x-1"
          >
            <span>View Full Queue</span>
            <span>→</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Application No</th>
                <th>Institution Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Composite Risk</th>
                <th>Attention</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentApps.length > 0 ? (
                recentApps.map((app) => (
                  <tr key={app.id}>
                    <td className="font-semibold text-blue-700 font-serif">{app.application_number}</td>
                    <td>
                      <div className="font-semibold text-slate-900 font-serif">
                        {app.institution?.legal_name || 'Technical Institute'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-serif mt-0.5">
                        PID: {app.institution?.aicte_permanent_id || 'N/A'} • {app.institution?.state || ''}
                      </div>
                    </td>
                    <td className="font-serif text-slate-600">{app.category.replace(/_/g, ' ')}</td>
                    <td>
                      <StatusBadge type="status" value={app.status} />
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <StatusBadge type="risk" value={app.risk_band} />
                        <span className="text-xs font-display font-bold text-slate-700">{app.overall_risk_score.toFixed(1)}/100</span>
                      </div>
                    </td>
                    <td>
                      {app.attention_required ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 mr-1.5" />
                          Review Required
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-serif italic">Routine</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => onSelectApplication(app.id)}
                        className="btn-secondary inline-flex items-center space-x-1.5 !px-3 !py-1.5 !text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="font-serif">Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-serif italic">
                    No applications currently in queue. Click "Submit New Application" to add records.
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
