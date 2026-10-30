import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isDemoAuthEnabled } from '../../config/permissions';
import { dataService, useDataService } from '../../services/dataService';
import {
  Headphones,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Clock,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Users,
  Search,
  ExternalLink,
  ChevronDown,
  Lock,
  GitBranch,
  Terminal,
  FileCheck,
  Zap,
  TrendingUp,
  Cpu,
  Target,
  Sparkles,
  Check,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../../components/common/Badges';

export const LandingPage: React.FC = () => {
  useDataService();
  const navigate = useNavigate();
  const metrics = dataService.getSummaryMetrics();
  const resolutionData = dataService.getResolutionDistribution();
  const resolutionDist = resolutionData.distribution;
  const currentYear = new Date().getFullYear();
  const isDemoEnabled = isDemoAuthEnabled();

  // Interactive Live Preview Tab: Backlog vs SLA vs Category
  const [activePreviewTab, setActivePreviewTab] = useState<'kpis' | 'backlog' | 'distribution'>('kpis');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'What operational decisions does this platform guide?',
      a: 'The platform identifies queue bottlenecks before SLAs breach, pinpoints repeat incident drivers across hardware and software categories, benchmarks department-level demand, and balances support specialist workloads using governed metrics.'
    },
    {
      q: 'What is the governed source of truth?',
      a: 'The operational baseline is anchored in a governed dataset of 8,000 enterprise IT tickets (Seed 42), spanning 5 business departments, 6 technical categories, and 24 canonical agents. When connected to Supabase, it syncs live PostgreSQL tables with strict Row Level Security.'
    },
    {
      q: 'How does SLA compliance calculation work?',
      a: 'SLA compliance is calculated strictly on resolved outcomes (5,814 compliant / 6,612 resolved = 87.9%). Turnaround is measured 24/7 in calendar hours from created_at to resolved_at. Unresolved tickets are never mixed into retrospective compliance denominators.'
    },
    {
      q: 'How do users obtain access to the platform?',
      a: 'Visitors can submit a formal access request specifying their legal identity, corporate email, department, requested role, and business justification. Platform Administrators review and decide requests through an authenticated governance queue.'
    },
    {
      q: 'Can engineers inspect the underlying architecture?',
      a: 'Yes. The repository is open on GitHub. It features a React 18 + TypeScript strict architecture, Vite bundling, automated regression suites, Supabase RLS security policies, and an isolated edge function submission barrier.'
    }
  ];

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col font-sans selection:bg-brand-500 selection:text-white overflow-x-hidden">
      {/* Skip to Main Content Link for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-brand-700 focus:font-bold focus:rounded-md focus:shadow-md focus:ring-2 focus:ring-brand-500"
      >
        Skip to main content
      </a>

      {/* 1. Header Navigation */}
      <header className="border-b border-border bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4" aria-label="Main Navigation">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Headphones className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-base tracking-tight text-text-primary block leading-tight truncate">
                IT Support <span className="text-brand-600">Analytics</span>
              </span>
              <span className="text-[10px] text-text-secondary tracking-wider uppercase font-semibold font-mono hidden sm:block">
                Enterprise Service Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isDemoEnabled && (
              <Link
                to="/analytics/overview"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors"
              >
                <span>Live Demo</span>
              </Link>
            )}
            <Link
              to="/request-access"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors"
            >
              <span>Request Access</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-xs transition-colors"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content Landmark */}
      <main id="main-content" className="flex-1">
        {/* 2. Hero Section: Focused, High-Impact Hierarchy */}
        <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-border bg-gradient-to-b from-white via-surface to-canvas">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
            {/* Pill Notice */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/80 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              <span>Production IT Service Management Analytics</span>
            </div>

            {/* Value Proposition Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight leading-[1.12] max-w-4xl mx-auto">
              Transform IT Support Tickets into <span className="text-brand-600">Operational Intelligence</span>.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Explore an analytics platform built around 8,000 IT support tickets. Monitor active backlog, evaluate SLA compliance, understand resolution-time patterns, and explore predictive insights to support better service decisions.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/analytics/overview"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
                <span>Explore Live Dashboard</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <a
                href="https://github.com/kaustubh21112002/it-support-analytics"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface hover:bg-slate-50 text-text-primary font-semibold text-sm border border-border shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <ExternalLink className="w-4 h-4 text-text-secondary" aria-hidden="true" />
                <span>View Project on GitHub</span>
              </a>
            </div>

            {/* Core Verified KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-8 max-w-3xl mx-auto text-left">
              <div className="bg-surface p-4 rounded-xl border border-border shadow-xs hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Total Intake</span>
                  <Database className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-text-primary tabular-nums block">
                  {metrics.totalTickets.toLocaleString()}
                </span>
                <span className="text-[11px] text-text-secondary block mt-0.5">Governed records</span>
              </div>

              <div className="bg-surface p-4 rounded-xl border border-border shadow-xs hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Active Backlog</span>
                  <Activity className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 tabular-nums block">
                  {metrics.openTickets.toLocaleString()}
                </span>
                <span className="text-[11px] text-text-secondary block mt-0.5">Open, in-prog & pending</span>
              </div>

              <div className="bg-surface p-4 rounded-xl border border-border shadow-xs hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider">SLA Compliance</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums block">
                  {metrics.slaCompliancePct}%
                </span>
                <span className="text-[11px] text-text-secondary block mt-0.5">Target: ≥85.0%</span>
              </div>

              <div className="bg-surface p-4 rounded-xl border border-border shadow-xs hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Median Turnaround</span>
                  <Clock className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" />
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-brand-600 tabular-nums block">
                  {metrics.medianResolutionHours}h
                </span>
                <span className="text-[11px] text-text-secondary block mt-0.5">24/7 calendar clock</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Interactive Representative Analytics Preview */}
        <section className="py-12 sm:py-16 bg-canvas border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider font-mono">Live Product Interface</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                An executive dashboard engineered for action
              </h2>
              <p className="text-sm text-text-secondary">
                Designed to answer the 5 critical questions within 10 seconds: What matters? Is it good or bad? What changed? Where to investigate? What to do next?
              </p>
            </div>

            {/* Realistic Application Window Container */}
            <div className="bg-surface rounded-2xl border border-slate-300 shadow-card overflow-hidden">
              {/* Window Header Bar */}
              <div className="px-4 py-3 bg-slate-100/90 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5" aria-hidden="true">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs font-mono text-slate-500 font-semibold ml-2">app.itsupportanalytics.internal / overview</span>
                </div>

                {/* Preview Tabs */}
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-border text-xs w-full sm:w-auto overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('kpis')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded font-semibold transition-all whitespace-nowrap ${
                      activePreviewTab === 'kpis' ? 'bg-brand-50 text-brand-700 shadow-xs' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Core KPIs
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('backlog')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded font-semibold transition-all whitespace-nowrap ${
                      activePreviewTab === 'backlog' ? 'bg-brand-50 text-brand-700 shadow-xs' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Active Backlog
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('distribution')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded font-semibold transition-all whitespace-nowrap ${
                      activePreviewTab === 'distribution' ? 'bg-brand-50 text-brand-700 shadow-xs' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Turnaround Spread
                  </button>
                </div>
              </div>

              {/* Window Body: Representative Components */}
              <div className="p-4 sm:p-6 bg-slate-50/50">
                {activePreviewTab === 'kpis' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="bg-surface p-4 rounded-xl border border-border shadow-xs">
                        <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                          <span className="font-semibold uppercase tracking-wider">Backlog Resolution Rate</span>
                          <span className="font-bold text-emerald-700">82.7% Completed</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: '82.7%' }} />
                        </div>
                        <span className="text-[11px] text-slate-500 mt-2 block">6,612 resolved outcomes of 8,000 total demand</span>
                      </div>

                      <div className="bg-surface p-4 rounded-xl border border-border shadow-xs">
                        <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                          <span className="font-semibold uppercase tracking-wider">SLA Target Buffer</span>
                          <span className="font-bold text-emerald-700">+2.9% Above Baseline</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-brand-600 h-full rounded-full" style={{ width: '87.9%' }} />
                        </div>
                        <span className="text-[11px] text-slate-500 mt-2 block">87.9% compliance vs 85.0% governed threshold</span>
                      </div>

                      <div className="bg-surface p-4 rounded-xl border border-border shadow-xs">
                        <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                          <span className="font-semibold uppercase tracking-wider">Critical Priority SLAs</span>
                          <span className="font-bold text-rose-700">87.0% (4h Window)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: '87.0%' }} />
                        </div>
                        <span className="text-[11px] text-slate-500 mt-2 block">697 compliant of 801 resolved Critical incidents</span>
                      </div>
                    </div>

                    <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                        <span className="font-semibold text-text-primary">Governed Invariants & Zero Hallucination Standard</span>
                      </div>
                      <Link to="/analytics/overview" className="text-brand-600 font-semibold hover:underline flex items-center gap-1 shrink-0">
                        <span>Open Dashboard</span>
                        <ArrowRight className="w-3 h-3" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'backlog' && (
                  <div className="bg-surface rounded-xl border border-border shadow-xs p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-text-primary uppercase tracking-wider">Active Backlog Composition (1,388 Tickets)</span>
                      <span className="text-slate-500">17.3% of Total Intake</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                      <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                        <span className="text-xs text-sky-800 font-semibold block">Open (Awaiting Triage)</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-sky-900 tabular-nums mt-1 block">552</span>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <span className="text-xs text-amber-800 font-semibold block">In Progress (Active)</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-amber-900 tabular-nums mt-1 block">523</span>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                        <span className="text-xs text-purple-800 font-semibold block">Pending (User/Vendor)</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-purple-900 tabular-nums mt-1 block">313</span>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'distribution' && (
                  <div className="bg-surface rounded-xl border border-border shadow-xs p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-text-primary uppercase tracking-wider">Turnaround Spread (6,612 Resolved Incidents)</span>
                      <span className="text-slate-500 font-mono">24/7 Calendar Clock</span>
                    </div>
                    <div className="space-y-2.5">
                      {resolutionDist.map((bucket) => (
                        <div key={bucket.label} className="text-xs">
                          <div className="flex justify-between font-semibold mb-1">
                            <span className="text-text-primary">{bucket.label}</span>
                            <span className="text-text-secondary tabular-nums">{bucket.count.toLocaleString()} tickets ({bucket.share}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-brand-600 h-full rounded-full" style={{ width: `${bucket.share}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Core SaaS Capabilities (3 Focused Pillars) */}
        <section className="py-16 sm:py-20 bg-white border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider font-mono">Platform Capabilities</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                Engineered for enterprise service desk leaders
              </h2>
              <p className="text-sm text-text-secondary">
                Eliminate speculation. Empower managers and lead agents with trustworthy, reproducible analytics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pillar 1 */}
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs hover:shadow-card transition-shadow space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600">
                  <Activity className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-base text-text-primary tracking-tight">Inflow vs. Outflow Dynamics</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Monitor net backlog growth in real time. Compare arrival velocity against resolution throughput to detect seasonal volume surges before queues degrade.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs hover:shadow-card transition-shadow space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-base text-text-primary tracking-tight">SLA Command Center</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Strict calendar-hour compliance auditing. Drill down by priority tier (Critical 4h, High 8h, Medium 24h, Low 72h) and isolate approaching breaches immediately.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs hover:shadow-card transition-shadow space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <TrendingUp className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-base text-text-primary tracking-tight">Predictive Triage Insights</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Evaluate LightGBM regression estimates at ticket intake. Forecast expected turnaround hours based on category, issue type, and department demand.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Enterprise Trust & Governance */}
        <section className="py-16 sm:py-20 bg-slate-50 border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>Zero-Hallucination Data Governance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Governed formulas. Verifiable data. No fabricated metrics.
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed max-w-2xl mx-auto">
              Every card, chart, and drill-down reconciles with the source dataset. Our platform adheres to strict governance principles: PRESERVE → DOCUMENT → FLAG → GOVERN.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4">
              <div className="p-4 bg-surface rounded-xl border border-border shadow-xs flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <h4 className="font-bold text-xs text-text-primary">Strict SLA Denominator</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Compliant / Total Resolved. Unresolved tickets are strictly barred from retrospective compliance percentages.</p>
                </div>
              </div>
              <div className="p-4 bg-surface rounded-xl border border-border shadow-xs flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <h4 className="font-bold text-xs text-text-primary">Row Level Security (RLS)</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Database policies protect sensitive operational records with role-based access control and immutable audit trails.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Frequently Asked Questions (Accordion) */}
        <section className="py-16 sm:py-20 bg-white border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 space-y-2">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider font-mono">Transparency</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="divide-y divide-border border-y border-border">
              {faqs.map((faq, idx) => (
                <div key={idx} className="py-4">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between text-left text-sm font-bold text-text-primary hover:text-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded p-1"
                    aria-expanded={openFaq === idx}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-brand-600' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {openFaq === idx && (
                    <p className="text-xs sm:text-sm text-text-secondary mt-2.5 leading-relaxed pl-1">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Final Call to Action */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-canvas to-surface text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
              Ready to explore enterprise service intelligence?
            </h2>
            <p className="text-base text-text-secondary max-w-xl mx-auto">
              Dive directly into the live executive dashboard or submit an access request to explore role-based service operations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/analytics/overview"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md transition-all focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
                <span>Explore Live Dashboard</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/request-access"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface hover:bg-slate-50 text-text-primary font-semibold text-sm border border-border shadow-xs transition-colors"
              >
                <span>Request Enterprise Access</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 8. Footer */}
      <footer className="border-t border-border bg-white py-8 text-xs text-text-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Headphones className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <span className="font-bold text-text-primary">IT Support Analytics Platform</span>
            <span className="text-slate-400">· © {currentYear}</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/request-access" className="hover:text-text-primary transition-colors">Request Access</Link>
            <Link to="/login" className="hover:text-text-primary transition-colors">Sign In</Link>
            <a
              href="https://github.com/kaustubh21112002/it-support-analytics"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-primary flex items-center gap-1 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
