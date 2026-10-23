import { Shield, Bell, CheckCircle2, UserCheck } from 'lucide-react';
import type { User, Role } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onRoleSwitch: (role: Role) => void;
  unresolvedAlertsCount: number;
  onNavigateToAlerts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleSwitch,
  unresolvedAlertsCount,
  onNavigateToAlerts
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80" style={{
      background: 'linear-gradient(135deg, #0a0f1a 0%, #0f172a 40%, #131c2e 100%)',
      boxShadow: '0 4px 24px -4px rgba(0,0,0,0.4)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between">
        
        {/* Left: Branding */}
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center border border-blue-400/20"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)',
              boxShadow: '0 4px 16px -2px rgba(37, 99, 235, 0.5), inset 0 1px 0 rgba(255,255,255,0.15)'
            }}
          >
            <Shield className="w-6 h-6 text-white drop-shadow-sm" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-display font-bold text-xl tracking-tight text-white">AICTE</span>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/30"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(79,70,229,0.15) 100%)',
                  color: '#93c5fd'
                }}
              >
                DECISION-SUPPORT v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-serif mt-0.5 tracking-wide">
              AI-Powered Application Validation & Scrutiny Platform
            </p>
          </div>
        </div>

        {/* Center: Advisory Tag */}
        <div className="hidden lg:flex items-center px-4 py-1.5 rounded-full border border-slate-700/60 text-xs text-slate-300"
          style={{
            background: 'linear-gradient(135deg, rgba(30,41,59,0.6) 0%, rgba(15,23,42,0.6) 100%)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-2" />
          <span className="font-serif">Statutory Decision-Support: AI assists human officers; never approves/rejects autonomously</span>
        </div>

        {/* Right: Actions, Alerts & Role Switcher */}
        <div className="flex items-center space-x-3">
          
          {/* Attention Alerts Counter */}
          <button
            onClick={onNavigateToAlerts}
            className="relative p-2.5 text-slate-300 hover:text-white rounded-xl transition-all duration-200 hover:bg-slate-800/60"
            title="Official Attention Alerts"
          >
            <Bell className="w-5 h-5" />
            {unresolvedAlertsCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-slate-900"
                style={{
                  background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                  boxShadow: '0 2px 8px rgba(244,63,94,0.5)',
                  width: '18px', height: '18px'
                }}
              >
                {unresolvedAlertsCount}
              </span>
            )}
          </button>

          {/* Role Switcher */}
          <div className="flex items-center space-x-2.5 px-3.5 py-2 rounded-xl border border-slate-700/60"
            style={{
              background: 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.7) 100%)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <UserCheck className="w-4 h-4 text-blue-400" />
            <div className="text-left">
              <div className="text-slate-400 text-[9px] uppercase tracking-[0.12em] font-bold font-display">Active Role</div>
              <select
                value={currentUser?.role || 'VALIDATION_OFFICER'}
                onChange={(e) => onRoleSwitch(e.target.value as Role)}
                className="bg-transparent font-serif font-medium text-white border-none focus:outline-none cursor-pointer text-xs"
              >
                <option value="VALIDATION_OFFICER" className="bg-slate-800 text-white">Validation Officer</option>
                <option value="SENIOR_REVIEWING_OFFICER" className="bg-slate-800 text-white">Senior Reviewing Officer</option>
                <option value="APPLICANT" className="bg-slate-800 text-white">Applicant (Institute)</option>
                <option value="SYSTEM_ADMINISTRATOR" className="bg-slate-800 text-white">System Administrator</option>
                <option value="AUDITOR" className="bg-slate-800 text-white">Auditor</option>
              </select>
            </div>
          </div>

          {/* User profile capsule */}
          <div className="hidden sm:block text-right pl-2 border-l border-slate-800">
            <div className="text-xs font-semibold text-white font-serif">{currentUser?.full_name || 'Officer'}</div>
            <div className="text-[10px] text-slate-500 font-serif">{currentUser?.email || 'officer@aicte.gov.in'}</div>
          </div>

        </div>

      </div>
    </header>
  );
};
