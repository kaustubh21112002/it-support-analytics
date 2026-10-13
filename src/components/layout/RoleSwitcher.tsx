import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { UserCheck, Shield } from 'lucide-react';

export const RoleSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { user, switchRole } = useAuth();

  const roles: Array<{ role: UserRole; label: string; desc: string }> = [
    { role: 'employee', label: 'Employee', desc: 'Self-service, tickets, AI chat' },
    { role: 'agent', label: 'Support Agent', desc: 'Queue triage & resolution' },
    { role: 'manager', label: 'Manager / Analyst', desc: 'Executive BI & SLAs' },
    { role: 'admin', label: 'Administrator', desc: 'Governance & Workbench' }
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-lg border border-border shadow-xs">
        {roles.map((r) => {
          const isActive = user?.role === r.role;
          return (
            <button
              key={r.role}
              onClick={() => switchRole(r.role)}
              title={r.desc}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                isActive
                  ? 'bg-surface text-brand-700 shadow-xs font-semibold border border-border'
                  : 'text-text-secondary hover:text-text-primary hover:bg-slate-200/50'
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-surface-subtle border border-border rounded-xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
          <Shield className="w-3.5 h-3.5 text-brand-600" />
          <span>Demo Role Switcher</span>
        </div>
        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          Client-Side Simulated
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {roles.map((r) => {
          const isActive = user?.role === r.role;
          return (
            <button
              key={r.role}
              onClick={() => switchRole(r.role)}
              className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                isActive
                  ? 'bg-brand-50 border-brand-300 text-brand-900 font-medium shadow-xs'
                  : 'bg-surface border-border text-text-secondary hover:bg-slate-50 hover:text-text-primary'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary">{r.label}</span>
                {isActive && <UserCheck className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />}
              </div>
              <p className="text-[11px] text-text-secondary truncate mt-0.5">{r.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
