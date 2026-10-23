import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck, RefreshCw, Sliders,
  Layers, AlertTriangle, Scale
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const RulesManagement: React.FC = () => {
  const [rules, setRules] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checklists' | 'categories' | 'anomaly' | 'infrastructure' | 'scoring'>('checklists');

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await api.getAllRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3 font-serif">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 border border-blue-100">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <span className="text-sm font-medium text-slate-600">Loading Versioned Rule Configurations...</span>
        </div>
      </div>
    );
  }

  const checklists = rules?.checklists?.templates || {};
  const categories = rules?.categories?.categories || [];
  const anomalyRules = rules?.anomaly?.rules || [];
  const infraCategories = rules?.infrastructure?.categories || [];
  const scoringConfig = rules?.scoring || {};

  return (
    <div className="space-y-6 font-serif max-w-7xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="gov-card p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Regulatory Engine
            </span>
            <span className="text-xs text-slate-400 font-serif">• APH 2026–2027</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight mt-1.5">
            Checklist & Rules Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-serif leading-relaxed">
            Versioned statutory criteria, deterministic evaluation thresholds, and explainable penalty weights.
          </p>
        </div>
        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <span className="text-xs font-mono bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-200 font-semibold shadow-sm">
            Active Version: 2026.1.0
          </span>
          <button
            onClick={fetchRules}
            className="btn-secondary p-2 cursor-pointer"
            title="Refresh Rules"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="gov-card p-2 flex flex-wrap gap-1.5 text-xs font-serif">
        {[
          { id: 'checklists', label: 'Regulatory Checklists', icon: BookOpenCheck },
          { id: 'categories', label: 'Category Detection Rules', icon: Layers },
          { id: 'anomaly', label: 'Anomaly & Forgery Rules', icon: AlertTriangle },
          { id: 'infrastructure', label: 'Infrastructure CV Norms', icon: Sliders },
          { id: 'scoring', label: 'Scoring Weights & Bands', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2.5 px-4 rounded-xl font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Panes */}
      <div className="gov-card p-6 space-y-4">
        
        {/* Checklists Tab */}
        {activeTab === 'checklists' && (
          <div className="space-y-6">
            {Object.entries(checklists).map(([tmplKey, tmplVal]: [string, any]) => (
              <div key={tmplKey} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-slate-50/80 p-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {tmplKey}
                    </span>
                    <span className="font-display font-bold text-sm text-slate-900">{tmplVal.title}</span>
                  </div>
                  <span className="text-xs font-serif text-slate-500">Category: {tmplVal.category}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs font-serif">
                  {tmplVal.items?.map((item: any, i: number) => (
                    <div key={i} className="p-4 flex items-start justify-between hover:bg-slate-50/60 transition">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-blue-800 text-xs">{item.code}</span>
                          <span className="font-display font-bold text-slate-900 text-xs">{item.title}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                      </div>
                      <div className="flex items-center space-x-2 text-right">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {item.doc_type}
                        </span>
                        {item.is_mandatory && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            MANDATORY
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat: any) => (
              <div key={cat.id} className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-base text-slate-900">{cat.name}</span>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    {cat.code}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-serif">{cat.description}</p>
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-display font-bold uppercase tracking-wider text-slate-400">Deterministic Keywords</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {cat.keywords?.map((kw: string, i: number) => (
                      <span key={i} className="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg font-serif">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Anomaly Rules Tab */}
        {activeTab === 'anomaly' && (
          <div className="space-y-3.5">
            {anomalyRules.map((ar: any) => (
              <div key={ar.id} className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-sm flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2.5">
                    <StatusBadge type="severity" value={ar.severity} />
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{ar.id}</span>
                    <span className="text-sm font-display font-bold text-slate-900">• {ar.name}</span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-2xl font-serif leading-relaxed">{ar.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-display font-semibold text-slate-400">Base Penalty</div>
                  <div className="text-base font-display font-bold text-rose-600">+{ar.default_penalty} pts</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infrastructure CV Norms */}
        {activeTab === 'infrastructure' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {infraCategories.map((ic: any) => (
              <div key={ic.key} className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-sm text-slate-900">{ic.name}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Min Conf: {(ic.min_confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-serif leading-relaxed">
                  <span className="font-semibold text-slate-800">Required Vision Objects: </span>
                  {ic.required_elements?.join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scoring Weights Tab */}
        {activeTab === 'scoring' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 text-xs font-serif">
              {Object.entries(scoringConfig.bands || {}).map(([bandKey, bandVal]: [string, any]) => (
                <div key={bandKey} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm text-center space-y-1.5">
                  <StatusBadge type="risk" value={bandKey} />
                  <div className="font-display font-bold text-slate-900 text-base mt-1">{bandVal.min} - {bandVal.max} pts</div>
                  <p className="text-xs text-slate-500 font-serif leading-relaxed">{bandVal.action}</p>
                </div>
              ))}
            </div>

            <div className="gov-card p-5 text-xs space-y-2 font-serif">
              <span className="font-display font-bold text-slate-900 text-sm">Scoring Consolidation Logic:</span>
              <p className="text-slate-600 leading-relaxed">
                {scoringConfig.normalization || 'Normalized linear contribution cap at 100 with deduction consolidation to prevent duplicate penalties for linked findings.'}
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
