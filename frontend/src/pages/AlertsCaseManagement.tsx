import React, { useState, useEffect } from 'react';
import {
  AlertOctagon, CheckCircle2, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import type { OfficialAlert } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface AlertsProps {
  onSelectApplication: (id: number) => void;
}

export const AlertsCaseManagement: React.FC<AlertsProps> = ({ onSelectApplication }) => {
  const [alerts, setAlerts] = useState<OfficialAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unresolvedOnly, setUnresolvedOnly] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<OfficialAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts(unresolvedOnly);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [unresolvedOnly]);

  const handleResolveAlert = async () => {
    if (!selectedAlert) return;
    if (!resolutionNotes) {
      alert('Please enter formal resolution notes detailing case actions taken.');
      return;
    }
    setActionLoading(true);
    try {
      await api.updateAlert(selectedAlert.id, true, resolutionNotes);
      setSelectedAlert(null);
      setResolutionNotes('');
      fetchAlerts();
      alert('Official attention alert successfully resolved and recorded in audit chain.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-serif max-w-7xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="gov-card p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              Escalations & Routing
            </span>
            <span className="text-xs text-slate-400 font-serif">• Statutory Oversight</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight mt-1.5">
            Attention Routing & Case Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-serif leading-relaxed">
            Escalation management for high-risk applications, critical omissions, and potential document anomalies.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <label className="flex items-center space-x-2 text-xs text-slate-700 font-serif cursor-pointer px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={unresolvedOnly}
              onChange={(e) => setUnresolvedOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Unresolved Cases Only</span>
          </label>

          <button
            onClick={fetchAlerts}
            className="btn-secondary flex items-center space-x-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Alert Title</th>
                <th>Reason / Discrepancy</th>
                <th>Target Role</th>
                <th>Case Status</th>
                <th>Logged At</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-serif italic text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading regulatory alerts and escalation logs...
                  </td>
                </tr>
              ) : alerts.length > 0 ? (
                alerts.map((al) => (
                  <tr key={al.id}>
                    <td>
                      <StatusBadge type="severity" value={al.severity} />
                    </td>
                    <td className="font-display font-bold text-slate-900 text-xs">{al.title}</td>
                    <td className="text-xs text-slate-700 max-w-sm font-serif leading-relaxed">{al.reason}</td>
                    <td>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {al.target_role}
                      </span>
                    </td>
                    <td>
                      {al.is_resolved ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
                          <AlertOctagon className="w-3 h-3 mr-1" />
                          Active Case
                        </span>
                      )}
                    </td>
                    <td className="text-xs text-slate-400 font-serif">
                      {new Date(al.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right space-x-2">
                      <button
                        onClick={() => onSelectApplication(al.application_id)}
                        className="btn-secondary text-[11px] py-1 px-2.5 cursor-pointer inline-flex items-center"
                      >
                        Inspect Application
                      </button>
                      {!al.is_resolved && (
                        <button
                          onClick={() => {
                            setSelectedAlert(al);
                            setResolutionNotes('');
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-[11px] font-semibold transition cursor-pointer shadow-sm"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-serif italic text-xs">
                    No active official alerts currently in queue. All systems nominal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-serif">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-scale-in">
            <h3 className="text-lg font-display font-bold text-slate-900">Resolve Official Scrutiny Alert</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {selectedAlert.title}
            </p>

            <div className="text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-700 leading-relaxed font-serif">
              <b className="font-semibold text-slate-900">Trigger Reason:</b> {selectedAlert.reason}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Justification Notes *</label>
              <textarea
                rows={3}
                placeholder="Explain official resolution actions (e.g. applicant submitted valid missing deed, regional office satisfied)..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full text-xs font-serif p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setSelectedAlert(null)}
                className="btn-secondary text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveAlert}
                disabled={actionLoading}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-md disabled:opacity-50"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
