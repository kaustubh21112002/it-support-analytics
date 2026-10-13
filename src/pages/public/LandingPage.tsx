import React from 'react';
import { Link } from 'react-router-dom';
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
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col font-sans selection:bg-brand-500 selection:text-white overflow-x-hidden">
      {/* 1. Header Navigation */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xs sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2" aria-label="Main Navigation">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Headphones className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm sm:text-base lg:text-lg tracking-tight text-text-primary block leading-tight truncate">
                IT Support <span className="text-brand-600">Analytics</span>
              </span>
              <span className="text-[10px] text-text-secondary tracking-wider uppercase font-semibold font-mono hidden sm:block truncate">
                Service Performance Dashboard
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-text-secondary">
            <a href="#overview" className="hover:text-brand-600 transition-colors">Overview</a>
            <a href="#preview" className="hover:text-brand-600 transition-colors">Analytics Preview</a>
            <a href="#workflow" className="hover:text-brand-600 transition-colors">Service Lifecycle</a>
            <a href="#roles" className="hover:text-brand-600 transition-colors">Governed Roles</a>
            <Link to="/portal/knowledge" className="hover:text-brand-600 transition-colors">Runbooks</Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/login"
              className="hidden sm:inline-block px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-xs transition-all flex items-center gap-1 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              <span className="hidden sm:inline">Explore Demo</span>
              <span className="sm:hidden">Demo Access</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 overflow-x-hidden">
        {/* 2. Hero Section: Outcome-led headline, explicit audience & clear CTA hierarchy */}
        <section id="overview" className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 lg:pt-16 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            <div className="lg:col-span-7 space-y-6">
              {/* Context Pill */}
              <div className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-mono font-medium max-w-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                <span>MBA Capstone</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 font-semibold">Synthetic Benchmark (8,000 Tickets)</span>
              </div>

              {/* Outcome-led Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-[1.18] break-words">
                See the service. <br />
                Find the risk. <br />
                <span className="text-brand-600">Improve the outcome.</span>
              </h1>

              {/* Purpose & Audience Narrative */}
              <p className="text-sm sm:text-base lg:text-lg text-text-secondary leading-relaxed max-w-2xl">
                A serious decision-intelligence workspace built for IT leaders to analyze ticket demand, monitor retrospective SLA compliance, pinpoint operational bottlenecks, and explore machine-learning-informed turnaround predictions.
              </p>

              {/* Audience Callout Bar */}
              <div className="p-3.5 bg-white rounded-xl border border-border shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-600" aria-hidden="true" />
                  <span>Target Audience & Decision Stakeholders</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-700">
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md border border-slate-200">IT Directors</span>
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md border border-slate-200">Service-Desk Managers</span>
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md border border-slate-200">Support-Team Leads</span>
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md border border-slate-200">Operations & BI Analysts</span>
                </div>
              </div>

              {/* Dominant Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link
                  to="/login"
                  className="px-6 py-3.5 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  <span>Explore the Interactive Demo</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/analytics/overview"
                  className="px-5 py-3.5 text-sm font-semibold bg-white hover:bg-slate-50 text-text-primary border border-border rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-slate-300"
                >
                  <BarChart3 className="w-4 h-4 text-brand-600" aria-hidden="true" />
                  <span>View Executive Analytics</span>
                </Link>
              </div>

              {/* Baseline Metadata Strip */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>24/7 Calendar-Hour SLA Engine</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-600" aria-hidden="true" />
                  <span>Governed Relational Schema</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  <span>Deterministic Baseline (Seed 42)</span>
                </div>
              </div>
            </div>

            {/* 3. Analytics Preview: Focused on ONE main operational insight */}
            <div id="preview" className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 sm:p-6 space-y-5">
                {/* Header with synthetic demonstration disclosure */}
                <div className="flex items-start justify-between border-b border-border pb-3.5">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 block">
                      Operational Insight Preview
                    </span>
                    <h3 className="text-base font-bold text-text-primary mt-0.5">
                      SLA Compliance & Queue Health
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-mono">
                    Synthetic Demo
                  </span>
                </div>

                {/* KPI Summaries derived directly from the synthetic dataset */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50/90 p-3 rounded-lg border border-slate-200/80">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Total Volume</p>
                    <p className="text-xl font-extrabold text-text-primary mt-0.5 tabular-nums">8,000</p>
                    <p className="text-[10px] text-text-secondary">Calendar Year 2024</p>
                  </div>
                  <div className="bg-slate-50/90 p-3 rounded-lg border border-slate-200/80">
                    <p className="text-[10px] uppercase font-bold text-slate-500">SLA Compliance</p>
                    <p className="text-xl font-extrabold text-emerald-600 mt-0.5 tabular-nums">87.9%</p>
                    <p className="text-[10px] text-emerald-700 font-medium">Target: 85.0%</p>
                  </div>
                  <div className="bg-slate-50/90 p-3 rounded-lg border border-slate-200/80">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Mean Turnaround</p>
                    <p className="text-xl font-extrabold text-brand-600 mt-0.5 tabular-nums">14.9h</p>
                    <p className="text-[10px] text-text-secondary">Median: 7.2h</p>
                  </div>
                </div>

                {/* Primary SLA Distribution Insight Visual */}
                <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-text-primary font-semibold">Resolved Ticket SLA Performance</span>
                    <span className="text-slate-500">6,612 Resolved (82.7%)</span>
                  </div>

                  {/* Proportional SLA Breakdown Bar */}
                  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex" role="progressbar" aria-valuenow={87.9} aria-valuemin={0} aria-valuemax={100} aria-label="SLA Compliance Rate">
                    <div className="bg-emerald-600 h-full" style={{ width: '87.9%' }} title="Met SLA: 5,812 tickets (87.9%)" />
                    <div className="bg-rose-500 h-full" style={{ width: '12.1%' }} title="Breached SLA: 800 tickets (12.1%)" />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden="true" />
                      5,812 Met Target (87.9%)
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-rose-500" aria-hidden="true" />
                      800 Breached (12.1%)
                    </span>
                  </div>

                  {/* Benchmark Target Indicator */}
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Performance vs Governed SLA Benchmark:</span>
                    <span className="font-bold text-emerald-700">+2.9% above 85% SLA Target</span>
                  </div>
                </div>

                {/* Open Ticket Queue & SLA Exposure */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                      Open Backlog SLA Exposure
                    </span>
                    <span className="font-semibold text-amber-950 font-mono">1,388 Active Tickets</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    18 critical and high-priority tickets are currently within 4 hours of target breach threshold, concentrated in identity access and network connectivity.
                  </p>
                </div>

                {/* Operational Takeaway */}
                <div className="p-3 bg-brand-50/70 rounded-xl border border-brand-100 text-xs">
                  <span className="font-bold text-brand-900 block mb-0.5">Operational Takeaway:</span>
                  <p className="text-brand-800 text-[11px] leading-relaxed">
                    Overall resolution throughput remains healthy, but queue stability requires targeted triage capacity in Tier-1 support during peak morning request windows.
                  </p>
                </div>

                {/* Footer preview note */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-slate-500">
                    Values derived from Seed 42 benchmark
                  </span>
                  <Link
                    to="/analytics/sla"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <span>Inspect SLA Center</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Connected Workflow Process Narrative (Replaces repetitive feature cards) */}
        <section id="workflow" className="border-t border-slate-200 bg-white py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 block mb-1">
                Connected Operations
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                The Governed Service Intelligence Lifecycle
              </h2>
              <p className="text-base text-text-secondary mt-2">
                A seamless operational continuum from frontline incident creation to executive retrospective governance.
              </p>
            </div>

            {/* Horizontal on wide screens, vertical on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {/* Step 01 */}
              <div className="bg-canvas p-6 rounded-xl border border-slate-200 hover:border-brand-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-brand-600">01</span>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-0.5 bg-white rounded border border-slate-200">
                      Capture
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">Create & Categorize</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Log requests with automatic ITIL category mapping, SLA entitlement calculation, and conversational self-service assistance.
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-slate-200/80">
                  <Link
                    to="/portal/tickets/new"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                  >
                    <span>Test ticket creation</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Step 02 */}
              <div className="bg-canvas p-6 rounded-xl border border-slate-200 hover:border-brand-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-brand-600">02</span>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-0.5 bg-white rounded border border-slate-200">
                      Resolve
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">Triage & Coordinate</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Assign tickets across support tiers, update workflow statuses, maintain confidential internal notes, and log audit trails.
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-slate-200/80">
                  <Link
                    to="/agent/tickets"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                  >
                    <span>Open agent workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Step 03 */}
              <div className="bg-canvas p-6 rounded-xl border border-slate-200 hover:border-brand-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-brand-600">03</span>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-0.5 bg-white rounded border border-slate-200">
                      Monitor
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">Audit SLA Exposure</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Track calendar-hour turnaround times, monitor real-time queue exposure, and audit compliance against governed thresholds.
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-slate-200/80">
                  <Link
                    to="/analytics/sla"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                  >
                    <span>View SLA monitor</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Step 04 */}
              <div className="bg-canvas p-6 rounded-xl border border-slate-200 hover:border-brand-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-brand-600">04</span>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-0.5 bg-white rounded border border-slate-200">
                      Improve
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">Predict & Govern</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Inspect root-cause recurring incident clusters and test supervised regression predictions with complete model disclosure.
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-slate-200/80">
                  <Link
                    to="/analytics/predictions"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                  >
                    <span>Explore predictions</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Governed Role Access Section */}
        <section id="roles" className="bg-slate-900 text-white py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400 block mb-1">
                Role-Based Access Control
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Experience the Four Governed Personas
              </h2>
              <p className="text-sm text-slate-300 mt-2">
                Test how authorization rules enforce granular permissions, workflow capabilities, and data views across the enterprise.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              <Link
                to="/login"
                className="bg-slate-800 hover:bg-slate-750 p-5 rounded-xl border border-slate-700 transition-all block group focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm">Employee</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-400 transition-colors" aria-hidden="true" />
                </div>
                <p className="text-xs font-medium text-slate-300">Priya Sharma</p>
                <p className="text-[11px] text-slate-400">Senior Financial Analyst</p>
                <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-700/80 pt-2">
                  Submit requests, view ticket status, consult runbooks, interact with conversational assistant.
                </p>
              </Link>

              <Link
                to="/login"
                className="bg-slate-800 hover:bg-slate-750 p-5 rounded-xl border border-slate-700 transition-all block group focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm">Support Agent</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-400 transition-colors" aria-hidden="true" />
                </div>
                <p className="text-xs font-medium text-slate-300">Arjun Mehta</p>
                <p className="text-[11px] text-slate-400">Tier-1 Support Lead</p>
                <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-700/80 pt-2">
                  Operational queue triage, status updates, team reassignment, internal troubleshooting notes.
                </p>
              </Link>

              <Link
                to="/login"
                className="bg-slate-800 hover:bg-slate-750 p-5 rounded-xl border border-slate-700 transition-all block group focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm">Manager / Analyst</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-400 transition-colors" aria-hidden="true" />
                </div>
                <p className="text-xs font-medium text-slate-300">Neha Kapoor</p>
                <p className="text-[11px] text-slate-400">Service Delivery Manager</p>
                <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-700/80 pt-2">
                  Executive analytics, longitudinal volume trends, team scorecards, turnaround predictions.
                </p>
              </Link>

              <Link
                to="/login"
                className="bg-slate-800 hover:bg-slate-750 p-5 rounded-xl border border-slate-700 transition-all block group focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm">Administrator</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-400 transition-colors" aria-hidden="true" />
                </div>
                <p className="text-xs font-medium text-slate-300">Vikram Singh</p>
                <p className="text-[11px] text-slate-400">Governance & Data Architect</p>
                <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-700/80 pt-2">
                  SLA policy configuration, Data Quality Workbench, audit logging, CSV batch ingestion engine.
                </p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Governed Neutral Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-text-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-medium text-text-primary">
              © {currentYear} IT Support Analytics. Built for MBA Business Analytics Evaluation.
            </p>
            <p className="text-[11px] text-slate-500">
              Demonstration application using synthetic data.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
            <span>8,000 Synthetic Transactions</span>
            <span>·</span>
            <span>Deterministic Baseline (Seed 42)</span>
            <span>·</span>
            <Link to="/login" className="text-brand-600 hover:underline font-semibold">
              Demo Access
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
