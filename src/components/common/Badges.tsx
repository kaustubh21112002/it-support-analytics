import React from 'react';
import { TicketStatus, TicketPriority } from '../../types';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  ArrowDownRight
} from 'lucide-react';

export const StatusBadge: React.FC<{ status: TicketStatus; className?: string }> = ({ status, className = '' }) => {
  switch (status) {
    case 'Open':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Open
        </span>
      );
    case 'In Progress':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 ${className}`}>
          <Clock className="w-3 h-3 text-amber-600" />
          In Progress
        </span>
      );
    case 'Pending':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 ${className}`}>
          <HelpCircle className="w-3 h-3 text-purple-600" />
          Pending
        </span>
      );
    case 'Resolved':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${className}`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Resolved
        </span>
      );
    case 'Closed':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
          <CheckCircle2 className="w-3 h-3 text-slate-400" />
          Closed
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
          {status}
        </span>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: TicketPriority; className?: string }> = ({ priority, className = '' }) => {
  switch (priority) {
    case 'Critical':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200/90 ${className}`}>
          <AlertCircle className="w-3 h-3 text-red-600" />
          Critical (4h)
        </span>
      );
    case 'High':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/90 ${className}`}>
          <ArrowUpRight className="w-3 h-3 text-amber-600" />
          High (8h)
        </span>
      );
    case 'Medium':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200/90 ${className}`}>
          <ArrowRight className="w-3 h-3 text-sky-600" />
          Medium (24h)
        </span>
      );
    case 'Low':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200 ${className}`}>
          <ArrowDownRight className="w-3 h-3 text-slate-400" />
          Low (72h)
        </span>
      );
    default:
      return <span className="text-[11px] font-semibold">{priority}</span>;
  }
};

export const SLAStatusIndicator: React.FC<{
  isCompliant?: boolean;
  hoursRemaining?: number;
  targetHours?: number;
  actualHours?: number;
  isResolved?: boolean;
}> = ({ isCompliant, hoursRemaining, targetHours, actualHours, isResolved }) => {
  if (isResolved) {
    if (isCompliant) {
      return (
        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Compliant ({actualHours}h / {targetHours}h)</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
        <span>Breached ({actualHours}h / {targetHours}h)</span>
      </div>
    );
  }

  // Open ticket SLA remaining
  if (hoursRemaining !== undefined) {
    const isAtRisk = hoursRemaining < 4;
    return (
      <div className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
        isAtRisk 
          ? 'text-red-800 bg-red-50 border-red-200 animate-pulse' 
          : 'text-amber-800 bg-amber-50 border-amber-200'
      }`}>
        <Clock className="w-3.5 h-3.5" />
        <span>{hoursRemaining}h remaining</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
      <Clock className="w-3.5 h-3.5 text-slate-400" />
      <span>SLA Tracked</span>
    </div>
  );
};
