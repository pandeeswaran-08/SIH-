import React from 'react';
import {
  LayoutDashboard, FilePlus2, ListFilter, FileText,
  ScanEye, Cpu, BarChart3, FileSpreadsheet,
  AlertOctagon, History, BookOpenCheck, Users,
  KeyRound, HardDrive
} from 'lucide-react';

export type NavView =
  | 'dashboard'
  | 'wizard'
  | 'queue'
  | 'details'
  | 'document-viewer'
  | 'workspace'
  | 'risk'
  | 'report'
  | 'alerts'
  | 'history'
  | 'rules'
  | 'users'
  | 'audit'
  | 'system';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  unresolvedAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, unresolvedAlertsCount = 0 }) => {
  const sections = [
    {
      label: 'Executive & Intake',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'wizard', label: 'Application Intake', icon: FilePlus2 },
        { id: 'queue', label: 'Application Queue', icon: ListFilter },
        { id: 'alerts', label: 'Alerts & Case Mgmt', icon: AlertOctagon, badge: unresolvedAlertsCount > 0 ? unresolvedAlertsCount : null },
      ]
    },
    {
      label: 'Validation & Scrutiny',
      items: [
        { id: 'details', label: 'Application Details', icon: FileText },
        { id: 'document-viewer', label: 'Document Viewer & OCR', icon: ScanEye },
        { id: 'workspace', label: 'Validation Modules (5)', icon: Cpu },
        { id: 'risk', label: 'Risk & Evidence Explorer', icon: BarChart3 },
        { id: 'report', label: 'Validation Report', icon: FileSpreadsheet },
        { id: 'history', label: 'Institutional History', icon: History },
      ]
    },
    {
      label: 'Governance & Audit',
      items: [
        { id: 'rules', label: 'Checklist & Rules', icon: BookOpenCheck },
        { id: 'users', label: 'User & Role Admin', icon: Users },
        { id: 'audit', label: 'Tamper-Evident Audit', icon: KeyRound },
        { id: 'system', label: 'System Health & Engine', icon: HardDrive },
      ]
    }
  ];

  return (
    <aside className="w-[260px] flex flex-col flex-shrink-0 min-h-[calc(100vh-68px)] border-r border-slate-800/60"
      style={{
        background: 'linear-gradient(180deg, #0a0f1a 0%, #0f172a 50%, #0a1020 100%)',
      }}
    >
      <div className="p-4 flex-1 space-y-7 overflow-y-auto">
        {sections.map((sec, secIdx) => (
          <div key={secIdx} className="animate-fade-in" style={{ animationDelay: `${secIdx * 80}ms` }}>
            <div className="sidebar-section-title">
              {sec.label}
            </div>
            <nav className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id as NavView)}
                    className={`sidebar-item ${
                      isActive ? 'sidebar-item--active' : 'sidebar-item--inactive'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="font-serif text-[13px]">{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                        isActive ? 'bg-white text-blue-700' : 'bg-rose-500 text-white'
                      }`}
                        style={!isActive ? { boxShadow: '0 2px 8px rgba(244,63,94,0.4)' } : {}}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
      
      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-800/60 text-[11px] font-serif"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(10,15,26,0.8) 100%)',
        }}
      >
        <div className="flex items-center justify-between text-slate-400">
          <span>Engine: CPU-Optimized</span>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 tracking-wide">SHA-256 Audit Chain Active</div>
      </div>
    </aside>
  );
};
