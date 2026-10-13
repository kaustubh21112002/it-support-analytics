import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { FilterBar } from '../../components/common/FilterBar';
import { OperationalBriefing } from '../../components/common/OperationalBriefing';
import { ExecutiveMetricLedger } from '../../components/common/ExecutiveMetricLedger';
import { ChartCard } from '../../components/common/ChartCard';
import { PriorityBadge } from '../../components/common/Badges';
import {
  Ticket as TicketIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Download,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AnalyticsOverview: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('FY 2024 (Full Year)');
  const [departmentId, setDepartmentId] = useState<string>('All');
  const [priority, setPriority] = useState<string>('All');

  const departments = dataService.getDepartments();
  const metrics = dataService.getSummaryMetrics();
  const monthlyTrend = dataService.getMonthlyTrend(
    departmentId !== 'All' ? Number(departmentId) : undefined,
    priority
  );
  const categoryBreakdown = dataService.getCategoryBreakdown();
  const priorityBreakdown = dataService.getPriorityBreakdown();

  const categoryColors = ['#4F46E5', '#06B6D4', '#0F9F8F', '#F59E0B', '#8B5CF6', '#EC4899'];

  // Custom polished chart tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface rounded-lg p-2.5 border border-border shadow-popover text-xs space-y-1">
          <p className="font-bold text-text-primary border-b border-border-subtle pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-text-primary tabular-nums">
                {entry.value.toLocaleString()} {entry.unit || 'tickets'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Service Overview"
        subtitle="Operational volume, resolution turnaround velocity, and retrospective SLA compliance across IT support operations."
        showSyntheticDisclaimer={true}
        breadcrumbs={[
          { label: 'Analytics', path: '/analytics/overview' },
          { label: 'Overview' }
        ]}
        actions={
          <Link
            to="/analytics/reports"
            className="inline-flex items-center gap-2 px-4 h-9 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate Executive Report</span>
          </Link>
        }
      />

      {/* Above-the-Fold Operational Briefing */}
      <OperationalBriefing
        whatItIs="Service Intelligence & SLA Decision Engine analyzing 8,000 IT support incident transactions."
        whoItIsFor="IT Operations Directors, Incident Commanders, and Service Desk Leaders."
        whyItMatters="Measures true 24/7 calendar-hour turnaround liabilities (87.9% compliance vs 85% threshold) and identifies active backlogs (1,388 open)."
        metricsHighlight={{
          label: 'OPEN BACKLOG',
          value: `${metrics.openTickets.toLocaleString()} Active`,
          detail: '17.4% of total volume requires resolution investigation.'
        }}
        primaryAction={{
          label: 'Triage Open Backlog Queue',
          to: '/agent/tickets',
          icon: ArrowRight
        }}
        secondaryAction={{
          label: 'Inspect SLA Command Center',
          to: '/analytics/sla',
          icon: Clock
        }}
        tertiaryAction={{
          label: 'Export Full Governed Ledger (CSV)',
          to: '/analytics/reports',
          icon: Download
        }}
      />

      {/* 1. Filter Command Bar */}
      <FilterBar
        departments={departments}
        selectedDepartment={departmentId}
        onDepartmentChange={setDepartmentId}
        selectedPriority={priority}
        onPriorityChange={setPriority}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onReset={() => {
          setDepartmentId('All');
          setPriority('All');
          setDateRange('FY 2024 (Full Year)');
        }}
      />

      {/* 2. Executive Metric Ledger (Contiguous Architectural Panel) */}
      <ExecutiveMetricLedger metrics={metrics} />

      {/* 3 & 4. Primary Hero Trend Chart + Category Composition Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket Volume Trend (7 cols) */}
        <div className="lg:col-span-7">
          <ChartCard
            title="How did ticket creation and resolution throughput trend over 2024?"
            subtitle="Monthly arrival volume versus completed resolutions (24/7 calendar basis)"
            takeaway="Volume peaked in April (720 tickets) and October (703 tickets). Operational resolution pace closely tracked demand throughout all four quarters."
            height="h-72"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="created"
                  name="Tickets Created"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#4F46E5' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Tickets Resolved"
                  stroke="#0F9F8F"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#0F9F8F' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Tickets by Category (5 cols) */}
        <div className="lg:col-span-5">
          <ChartCard
            title="What is the distribution of demand across service categories?"
            subtitle="Relative volume share across the six defined technical domains"
            takeaway="Demands are evenly distributed; Network & Connectivity recorded the largest volume at 17.1% share, closely followed by Hardware."
            height="h-72"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center h-full gap-2">
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`${val.toLocaleString()} tickets`, 'Volume']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px', borderColor: '#E2E8F0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown List */}
              <div className="space-y-1.5 text-[11px] overflow-y-auto max-h-48 pr-1">
                {categoryBreakdown.map((cat, idx) => (
                  <div key={cat.id} className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: categoryColors[idx % categoryColors.length] }}
                      />
                      <span className="font-medium text-text-primary truncate">{cat.name}</span>
                    </div>
                    <span className="font-bold text-text-secondary tabular-nums ml-2">{cat.sharePct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* 5. Operational Table & Evidence-Based Priority Ledger */}
      <div className="bg-surface rounded-xl border border-border shadow-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
          <div>
            <h3 className="font-bold text-sm text-text-primary">
              Operational Priority & SLA Performance Ledger
            </h3>
            <p className="text-xs text-text-secondary">
              Summary of total volume, retrospective compliance, and active backlogs partitioned by governed SLA rule
            </p>
          </div>
          <Link
            to="/analytics/sla"
            className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open SLA Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-subtle border-b border-border text-text-secondary font-semibold">
                <th className="py-2.5 px-3">Priority Tier</th>
                <th className="py-2.5 px-3">Governed SLA Target</th>
                <th className="py-2.5 px-3">Resolved Count</th>
                <th className="py-2.5 px-3">SLA Breached</th>
                <th className="py-2.5 px-3">Compliance Rate</th>
                <th className="py-2.5 px-3 text-right">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {priorityBreakdown.map((row) => (
                <tr key={row.priority} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-semibold text-text-primary">
                    <PriorityBadge priority={row.priority} />
                  </td>
                  <td className="py-3 px-3 text-text-secondary font-medium">
                    {row.targetHours} Calendar Hours
                  </td>
                  <td className="py-3 px-3 text-text-primary font-bold tabular-nums">
                    {row.resolvedTotal.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-red-700 font-bold tabular-nums">
                    {row.breachedCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`font-bold tabular-nums ${row.compliancePct >= 87 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {row.compliancePct}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      85% Target Met
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Navigation Cards to specialized deep dives */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/analytics/sla"
          className="bg-surface rounded-xl p-4 border border-border hover:border-brand-300 shadow-card hover:shadow-card-hover transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold text-xs text-text-primary group-hover:text-brand-600 transition-colors">
              SLA Command Center →
            </h4>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Inspect retrospective breaches and at-risk queues
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            87.9% Compliance
          </span>
        </Link>

        <Link
          to="/analytics/issues"
          className="bg-surface rounded-xl p-4 border border-border hover:border-brand-300 shadow-card hover:shadow-card-hover transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold text-xs text-text-primary group-hover:text-brand-600 transition-colors">
              Recurring Issues Analysis →
            </h4>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Identify top failure modes & repeat requests
            </p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
            Top 10 Ranked
          </span>
        </Link>

        <Link
          to="/analytics/predictions"
          className="bg-surface rounded-xl p-4 border border-border hover:border-brand-300 shadow-card hover:shadow-card-hover transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold text-xs text-text-primary group-hover:text-brand-600 transition-colors">
              ML Resolution Predictions →
            </h4>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Evaluate regression estimates upon ticket creation
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
            R² = 0.784
          </span>
        </Link>
      </div>
    </div>
  );
};
