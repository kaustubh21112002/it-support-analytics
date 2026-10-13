import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ShieldCheck } from 'lucide-react';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      {/* Top Banner: Synthetic Data & Demo Environment indicator */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-[11px] flex items-center justify-between border-b border-slate-800 z-40 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white tracking-tight">IT Support Analytics</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-300">
            Demo Environment · Synthetic Benchmark (8,000 Tickets) · 24/7 Calendar-Hour SLA Model
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span className="hidden md:inline">Client-side demo authentication</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700 font-mono">
            Seed: 42
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-shrink-0">
          <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-surface shadow-2xl">
              <Sidebar collapsed={false} onToggleCollapse={() => setMobileNavOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Topbar onToggleMobileNav={() => setMobileNavOpen(true)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>

          <footer className="py-4 px-6 border-t border-border bg-surface text-center text-xs text-text-secondary flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-text-primary">IT Support Ticket Analysis and Service Performance Dashboard</span>
            </div>
            <div className="text-[11px] text-slate-400">
              IT Support Analytics · Governed Operational Reference
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
