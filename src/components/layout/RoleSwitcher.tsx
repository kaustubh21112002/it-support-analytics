import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { UserCheck, Shield, ChevronDown } from 'lucide-react';

interface RoleSwitcherProps {
  compact?: boolean;
  variant?: 'dropdown' | 'pills' | 'cards';
  onRoleChange?: (role: UserRole) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  compact = false,
  variant,
  onRoleChange
}) => {
  const { user, switchRole, authMode, isDemoAuthEnabled } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isDemoAuthEnabled) {
    return null;
  }

  const roles: Array<{ role: UserRole; label: string; desc: string }> = [
    { role: 'employee', label: 'Employee', desc: 'Self-service, tickets, AI chat' },
    { role: 'agent', label: 'Support Agent', desc: 'Queue triage & resolution' },
    { role: 'manager', label: 'Manager / Analyst', desc: 'Executive BI & SLAs' },
    { role: 'admin', label: 'Administrator', desc: 'Governance & Workbench' }
  ];

  // Close dropdown on outside click
  useEffect(() => {
    if (variant === 'dropdown' || (!variant && compact)) {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [variant, compact]);

  const handleSelect = (r: UserRole) => {
    switchRole(r);
    setOpen(false);
    onRoleChange?.(r);
  };

  const activeRoleObj = roles.find((r) => r.role === user?.role) || roles[0];
  const effectiveVariant = variant || (compact ? 'dropdown' : 'cards');

  if (effectiveVariant === 'dropdown') {
    return (
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface-subtle hover:bg-slate-100 text-text-primary focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors"
          aria-label="Select simulated demo role"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <Shield className="w-3.5 h-3.5 text-brand-600 shrink-0" aria-hidden="true" />
          <span className="text-[11px] text-text-secondary hidden sm:inline">Role:</span>
          <span className="font-semibold text-text-primary capitalize truncate max-w-[85px] sm:max-w-none">
            {activeRoleObj.role === 'manager' ? 'Manager' : activeRoleObj.role === 'agent' ? 'Support Agent' : activeRoleObj.label}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
        </button>

        {open && (
          <div
            className="absolute right-0 mt-2 w-60 sm:w-64 bg-surface rounded-xl border border-border shadow-popover z-50 p-2 animate-fade-in"
            role="listbox"
            aria-label="Simulated Demo Roles"
          >
            <div className="px-2.5 py-1.5 border-b border-border mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-primary">Simulated Demo Roles</span>
              <span className="text-[9px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                Demo Only
              </span>
            </div>

            {authMode === 'supabase' && (
              <div className="px-2 py-1 text-[10px] bg-slate-100 text-slate-700 rounded mb-1.5 border border-slate-200">
                Note: Selecting a role below switches from your verified account to a simulated persona.
              </div>
            )}

            <div className="space-y-1">
              {roles.map((r) => {
                const isActive = user?.role === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleSelect(r.role)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start justify-between gap-2 ${
                      isActive
                        ? 'bg-brand-50 text-brand-900 font-medium'
                        : 'hover:bg-slate-50 text-text-primary'
                    }`}
                    role="option"
                    aria-selected={isActive}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-text-primary">{r.label}</div>
                      <div className="text-[10px] text-text-secondary truncate">{r.desc}</div>
                    </div>
                    {isActive && (
                      <UserCheck className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-border px-1 text-[10px] text-text-secondary">
              Presentation-only simulated personas for testing.
            </div>
          </div>
        )}
      </div>
    );
  }

  if (effectiveVariant === 'pills') {
    return (
      <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-lg border border-border shadow-xs">
        {roles.map((r) => {
          const isActive = user?.role === r.role;
          return (
            <button
              key={r.role}
              type="button"
              onClick={() => handleSelect(r.role)}
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
          <Shield className="w-3.5 h-3.5 text-brand-600" aria-hidden="true" />
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
              type="button"
              onClick={() => handleSelect(r.role)}
              className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                isActive
                  ? 'bg-brand-50 border-brand-300 text-brand-900 font-medium shadow-xs'
                  : 'bg-surface border-border text-text-secondary hover:bg-slate-50 hover:text-text-primary'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary">{r.label}</span>
                {isActive && <UserCheck className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" aria-hidden="true" />}
              </div>
              <p className="text-[11px] text-text-secondary truncate mt-0.5">{r.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
