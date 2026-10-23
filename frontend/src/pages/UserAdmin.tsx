import React from 'react';
import {
  Shield, Check, X
} from 'lucide-react';
import type { User, Role } from '../types';

interface UserAdminProps {
  currentUser: User | null;
  onRoleSwitch: (role: Role) => void;
}

export const UserAdmin: React.FC<UserAdminProps> = ({ currentUser, onRoleSwitch }) => {
  const rolesList: {
    role: Role;
    title: string;
    description: string;
    demoUser: string;
    demoEmail: string;
  }[] = [
    {
      role: 'VALIDATION_OFFICER',
      title: 'Validation Officer',
      description: 'Reviews preliminary AI scrutiny findings, validates document OCR extractions, and inspects evidence.',
      demoUser: 'P. K. Narayanan',
      demoEmail: 'officer@aicte.gov.in'
    },
    {
      role: 'SENIOR_REVIEWING_OFFICER',
      title: 'Senior Reviewing Officer',
      description: 'Records statutory regulatory recommendations (Approval, Rejection, Escalation) and signs dossiers.',
      demoUser: 'Dr. Sunita Deshmukh',
      demoEmail: 'senior.officer@aicte.gov.in'
    },
    {
      role: 'APPLICANT',
      title: 'Applicant (Institution)',
      description: 'Submits new institutional applications, uploads statutory evidence, and reviews deficiency notices.',
      demoUser: 'Dr. Rajesh Sharma',
      demoEmail: 'applicant@institute.edu.in'
    },
    {
      role: 'SYSTEM_ADMINISTRATOR',
      title: 'System Administrator',
      description: 'Manages versioned rules, scoring weights, AI engine hardware telemetry, and worker limits.',
      demoUser: 'IT Cell Administrator',
      demoEmail: 'admin@aicte.gov.in'
    },
    {
      role: 'AUDITOR',
      title: 'Statutory Auditor',
      description: 'Read-only access to tamper-evident cryptographic hash chain, audit events, and compliance reports.',
      demoUser: 'Compliance Auditor',
      demoEmail: 'auditor@aicte.gov.in'
    }
  ];

  const permissionsMatrix = [
    { cap: 'Submit Application & Evidence', applicant: true, officer: false, senior: false, admin: true, auditor: false },
    { cap: 'View Private Documents & OCR Bounding Boxes', applicant: true, officer: true, senior: true, admin: true, auditor: true },
    { cap: 'Execute 5-Module Parallel Scrutiny', applicant: false, officer: true, senior: true, admin: true, auditor: false },
    { cap: 'Correct Category Classification (Audited)', applicant: false, officer: true, senior: true, admin: true, auditor: false },
    { cap: 'Update Finding Reviewer Dispositions', applicant: false, officer: true, senior: true, admin: true, auditor: false },
    { cap: 'Record Regulatory Decision (Approval/Rejection)', applicant: false, officer: false, senior: true, admin: false, auditor: false },
    { cap: 'Modify Versioned Rules & Scoring Weights', applicant: false, officer: false, senior: false, admin: true, auditor: false },
    { cap: 'Verify Cryptographic Audit Hash Chain', applicant: false, officer: true, senior: true, admin: true, auditor: true },
  ];

  return (
    <div className="space-y-6 font-serif max-w-7xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="gov-card p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Security Governance
            </span>
            <span className="text-xs text-slate-400 font-serif">• Access Control</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight mt-1.5">
            Role-Based Access Control (RBAC) Administration
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-serif leading-relaxed">
            Least-privilege authorization matrix, institutional delegations, and user identity switching.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-blue-50 text-blue-700 px-3.5 py-2 rounded-xl border border-blue-200 font-semibold shadow-sm self-start sm:self-auto">
          <Shield className="w-4 h-4 text-blue-600" />
          <span>Active Role: {currentUser?.role || 'VALIDATION_OFFICER'}</span>
        </div>
      </div>

      {/* Roles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
        {rolesList.map((r) => {
          const isActive = currentUser?.role === r.role;
          return (
            <div
              key={r.role}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-200 shadow-sm ${
                isActive
                  ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider">ROLE</span>
                  {isActive && (
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-md">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="text-xs font-display font-bold text-slate-900">{r.title}</div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-serif">{r.description}</p>
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 text-[10px] font-serif text-slate-400">
                  <div className="font-semibold text-slate-700">{r.demoUser}</div>
                  <div className="font-mono text-slate-400">{r.demoEmail}</div>
                </div>
              </div>

              <button
                onClick={() => onRoleSwitch(r.role)}
                disabled={isActive}
                className={`w-full mt-4 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white cursor-default shadow-sm'
                    : 'btn-secondary'
                }`}
              >
                {isActive ? 'Current Identity' : 'Switch to Role'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix Table */}
      <div className="gov-card overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-base font-display font-bold text-slate-900">Statutory RBAC Authorization Matrix</h2>
          <p className="text-xs text-slate-500 font-serif mt-0.5">Resource-level permissions enforced across API endpoints</p>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Security Capability / Endpoint</th>
                <th className="text-center">Applicant</th>
                <th className="text-center">Validation Officer</th>
                <th className="text-center">Senior Officer</th>
                <th className="text-center">Sys Admin</th>
                <th className="text-center">Auditor</th>
              </tr>
            </thead>
            <tbody>
              {permissionsMatrix.map((p, idx) => (
                <tr key={idx}>
                  <td className="font-semibold text-slate-900 text-xs">{p.cap}</td>
                  <td className="text-center">
                    {p.applicant ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="text-center">
                    {p.officer ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="text-center">
                    {p.senior ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="text-center">
                    {p.admin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="text-center">
                    {p.auditor ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
