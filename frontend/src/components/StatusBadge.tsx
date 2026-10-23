import React from 'react';

interface StatusBadgeProps {
  type?: 'risk' | 'status' | 'severity' | 'disposition';
  value: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type = 'status', value, className = '' }) => {
  const val = (value || '').toUpperCase();

  let colorClasses = 'bg-slate-50 text-slate-700 border-slate-200';

  if (type === 'risk') {
    switch (val) {
      case 'LOW':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'MEDIUM':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'HIGH':
        colorClasses = 'bg-orange-50 text-orange-700 border-orange-200';
        break;
      case 'CRITICAL':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
        break;
    }
  } else if (type === 'severity') {
    switch (val) {
      case 'CRITICAL':
        colorClasses = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
        break;
      case 'HIGH':
        colorClasses = 'bg-orange-100 text-orange-800 border-orange-300';
        break;
      case 'MEDIUM':
        colorClasses = 'bg-amber-100 text-amber-800 border-amber-300';
        break;
      case 'LOW':
        colorClasses = 'bg-blue-100 text-blue-800 border-blue-300';
        break;
    }
  } else if (type === 'disposition') {
    switch (val) {
      case 'CONFIRMED':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'FALSE_POSITIVE':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'REQUIRES_FURTHER_REVIEW':
        colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      default:
        colorClasses = 'bg-slate-50 text-slate-700 border-slate-200';
    }
  } else {
    // General Status
    switch (val) {
      case 'APPROVED':
      case 'VERIFIED':
      case 'COMPLETED':
      case 'PRESENT':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'REJECTED':
      case 'FAILED':
      case 'MISSING':
      case 'NOT_VERIFIED':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'REQUIRES_ATTENTION':
      case 'COMPLETED_WITH_WARNINGS':
      case 'EXPIRED':
      case 'WARNING':
        colorClasses = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
        break;
      case 'VALIDATING':
      case 'RUNNING':
      case 'PROCESSING':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse';
        break;
      case 'SUBMITTED':
      case 'PENDING':
        colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
      default:
        colorClasses = 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[11px] border font-semibold font-display tracking-wide ${colorClasses} ${className}`}>
      {val.replace(/_/g, ' ')}
    </span>
  );
};
