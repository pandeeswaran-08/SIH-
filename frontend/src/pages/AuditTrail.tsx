import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertOctagon, RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import type { AuditEvent } from '../types';

export const AuditTrail: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    is_valid: boolean;
    total_events_checked: number;
    error_explanation?: string;
  } | null>(null);
  const [selectedMeta, setSelectedMeta] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditTrail();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load audit events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyAuditChain();
      setVerificationResult(res);
    } catch (err: any) {
      alert(`Verification check error: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 font-serif max-w-7xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="gov-card p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Forensic Integrity
            </span>
            <span className="text-xs text-slate-400 font-serif">• Cryptographic Ledger</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight mt-1.5">
            Tamper-Evident Cryptographic Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-serif leading-relaxed">
            Append-only SHA-256 hash-chained ledger of statutory submissions, automated scrutinies, and administrative decisions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-md flex items-center space-x-2 disabled:opacity-50"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Traversing Hash Chain...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Cryptographic Chain Integrity</span>
              </>
            )}
          </button>
          <button
            onClick={fetchEvents}
            className="btn-secondary p-2 cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Verification Status Banner if executed */}
      {verificationResult && (
        <div className={`p-5 rounded-2xl border flex items-start space-x-3.5 text-xs leading-relaxed font-serif shadow-sm ${
          verificationResult.is_valid
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
            : 'bg-rose-50/90 border-rose-200 text-rose-950'
        }`}>
          {verificationResult.is_valid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-display font-bold text-sm">
              {verificationResult.is_valid
                ? `Cryptographic Chain Integrity Verified (100% Valid • ${verificationResult.total_events_checked} Blocks)`
                : 'CRITICAL ALERT: Tampering Detected in Cryptographic Audit Chain!'}
            </div>
            <p className="mt-1 text-slate-700 leading-relaxed font-serif">
              {verificationResult.is_valid
                ? 'All block parent-hashes, cryptographic timestamps, canonical JSON serializations, and SHA-256 digital signatures match the mathematical specification exactly.'
                : verificationResult.error_explanation}
            </p>
          </div>
        </div>
      )}

      {/* Events Table Card */}
      <div className="gov-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900">Audit Blocks ({events.length})</h2>
            <p className="text-xs text-slate-500 font-serif mt-0.5">Each block encapsulates SHA-256 hash link to the preceding event</p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            Genesis Hash: 0000000000000000...
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th># Block ID</th>
                <th>Timestamp (UTC)</th>
                <th>Actor & Role</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Previous Hash</th>
                <th>Event Hash (SHA-256)</th>
                <th className="text-right">Payload</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-serif italic text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading cryptographic audit blocks...
                  </td>
                </tr>
              ) : events.length > 0 ? (
                events.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        #{ev.id}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500 font-serif">
                      {new Date(ev.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="font-semibold text-slate-800 text-xs">{ev.actor_id}</span>
                      <span className="block text-[10px] text-slate-400 font-serif">{ev.actor_role}</span>
                    </td>
                    <td className="font-display font-bold text-blue-700 text-xs">
                      {ev.action}
                    </td>
                    <td className="text-xs text-slate-600 font-serif">
                      {ev.entity_type} #{ev.entity_id}
                    </td>
                    <td className="font-mono text-[10px] text-slate-400 truncate max-w-[100px]" title={ev.previous_event_hash}>
                      {ev.previous_event_hash.substring(0, 10)}...
                    </td>
                    <td className="font-mono text-[10px] font-bold text-emerald-700 truncate max-w-[120px]" title={ev.event_hash}>
                      {ev.event_hash.substring(0, 12)}...
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedMeta(ev.metadata_json)}
                        className="btn-secondary text-[10px] py-1 px-2 cursor-pointer font-serif"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-serif italic text-xs">
                    No audit records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Inspector Modal */}
      {selectedMeta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-serif">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-scale-in">
            <h3 className="text-base font-display font-bold text-slate-900">Canonical JSON Metadata Payload</h3>
            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-80 leading-relaxed">
              {JSON.stringify(JSON.parse(selectedMeta), null, 2)}
            </pre>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedMeta(null)}
                className="btn-secondary text-xs cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
