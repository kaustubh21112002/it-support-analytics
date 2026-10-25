import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ShieldCheck } from 'lucide-react';
import { useDataSync } from '../../services/dataService';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { dataSource, isLive, hydrationStatus, ticketCount } = useDataSync();
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Keyboard Escape listener & focus management for mobile drawer
  useEffect(() => {
    if (mobileNavOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setMobileNavOpen(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
      if (triggerRef.current) {
        triggerRef.current.focus();
        triggerRef.current = null;
      }
    }
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      {/* Skip to Main Content Link for Keyboard & Screen Reader Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-brand-700 focus:font-semibold focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-brand-500"
      >
        Skip to main content
      </a>

      {/* Governed Operational Provenance Header Strip */}
      <div className="bg-slate-950 text-slate-300 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs flex items-center justify-between border-b border-slate-800/90 z-40 select-none overflow-hidden w-full">
        {/* Left: Product Identity & Governed Analytical Context */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLive && hydrationStatus === 'hydrated'
                  ? 'bg-emerald-400'
                  : hydrationStatus === 'denied' || hydrationStatus === 'error'
                  ? 'bg-rose-400'
                  : 'bg-sky-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isLive && hydrationStatus === 'hydrated'
                  ? 'bg-emerald-500'
                  : hydrationStatus === 'denied' || hydrationStatus === 'error'
                  ? 'bg-rose-500'
                  : 'bg-sky-500'
              }`}
            />
          </span>
          <span className="font-bold text-white text-[11px] sm:text-xs tracking-tight shrink-0">
            IT Support Analytics
          </span>
          <span className="text-slate-600 shrink-0 font-normal hidden xs:inline" aria-hidden="true">|</span>
          <div className="flex items-center gap-1.5 min-w-0 text-[10px] sm:text-[11px] text-slate-300">
            {isLive && hydrationStatus === 'hydrated' ? (
              <>
                <span className="hidden sm:inline font-medium text-emerald-300 truncate">
                  Live Operational Dataset ({ticketCount.toLocaleString()} Records)
                </span>
                <span className="sm:hidden font-medium text-emerald-300 truncate">
                  Live ({ticketCount.toLocaleString()})
                </span>
              </>
            ) : hydrationStatus === 'denied' ? (
              <>
                <span className="hidden sm:inline font-medium text-rose-300 truncate">
                  Access Denied — Role Unauthorized ({ticketCount.toLocaleString()} Demo Records Shown)
                </span>
                <span className="sm:hidden font-medium text-rose-300 truncate">
                  Access Denied ({ticketCount.toLocaleString()})
                </span>
              </>
            ) : hydrationStatus === 'error' ? (
              <>
                <span className="hidden sm:inline font-medium text-rose-300 truncate">
                  Sync Failure — Offline ({ticketCount.toLocaleString()} Demo Records Shown)
                </span>
                <span className="sm:hidden font-medium text-rose-300 truncate">
                  Sync Error ({ticketCount.toLocaleString()})
                </span>
              </>
            ) : hydrationStatus === 'auth_required' ? (
              <>
                <span className="hidden sm:inline font-medium text-amber-300 truncate">
                  Authentication Required ({ticketCount.toLocaleString()} Demo Records Shown)
                </span>
                <span className="sm:hidden font-medium text-amber-300 truncate">
                  Demo ({ticketCount.toLocaleString()})
                </span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline font-medium text-slate-300 truncate">
                  Synthetic Demo Benchmark ({ticketCount.toLocaleString()} Records)
                </span>
                <span className="sm:hidden font-medium text-slate-300 truncate">
                  Demo ({ticketCount.toLocaleString()})
                </span>
              </>
            )}
            <span className="text-slate-600 shrink-0 hidden md:inline" aria-hidden="true">·</span>
            <span className="text-slate-400 shrink-0 hidden md:inline">
              24/7 Calendar-Hour SLA Model
            </span>
          </div>
        </div>

        {/* Right: Compact, Aligned Runtime Environment Indicator */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="hidden lg:inline-block text-[10px] text-slate-400 font-medium">
            Governed Operational Provenance
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 font-semibold shadow-xs shrink-0">
            {isLive && hydrationStatus === 'hydrated' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" aria-hidden="true" />
                <span className="text-emerald-300 font-sans font-normal text-[9px]">Live Supabase</span>
              </>
            ) : hydrationStatus === 'denied' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" aria-hidden="true" />
                <span className="text-rose-300 font-sans font-normal text-[9px]">Access Denied</span>
              </>
            ) : hydrationStatus === 'error' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" aria-hidden="true" />
                <span className="text-rose-300 font-sans font-normal text-[9px]">Sync Error</span>
              </>
            ) : hydrationStatus === 'auth_required' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
                <span className="text-amber-300 font-sans font-normal text-[9px]">Auth Required</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" aria-hidden="true" />
                <span className="text-sky-300 font-sans font-normal text-[9px]">Demo Baseline</span>
              </>
            )}
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
          <div
            id="mobile-navigation-drawer"
            className="fixed inset-0 z-50 flex md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
          >
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={drawerRef}
              className="relative flex-1 flex flex-col max-w-xs w-full bg-surface shadow-2xl z-10"
            >
              <Sidebar
                collapsed={false}
                onToggleCollapse={() => setMobileNavOpen(false)}
                onNavigate={() => setMobileNavOpen(false)}
                isMobileDrawer={true}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Topbar
            onToggleMobileNav={() => setMobileNavOpen(true)}
            isMobileNavOpen={mobileNavOpen}
          />

          <main id="main-content" className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6">
            {children}
          </main>

          <footer className="py-4 px-6 border-t border-border bg-surface text-center text-xs text-text-secondary flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium text-text-primary text-left">
                IT Support Ticket Analysis and Service Performance Dashboard
              </span>
            </div>
            <div className="text-[11px] text-slate-600 whitespace-nowrap">
              IT Support Analytics · Governed Operational Reference
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

