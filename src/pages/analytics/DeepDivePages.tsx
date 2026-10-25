import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dataService, useDataService } from '../../services/dataService';
import { useUrlFilters, buildFilterQueryString } from '../../lib/urlFilters';
import { PageHeader } from '../../components/common/PageHeader';
import { FilterBar } from '../../components/common/FilterBar';
import { KpiCard } from '../../components/common/KpiCard';
import { ChartCard } from '../../components/common/ChartCard';
import { PriorityBadge } from '../../components/common/Badges';
import {
  TrendingUp,
  Clock,
  Users2,
  Building2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

// 1. TicketTrendsPage
export const TicketTrendsPage: React.FC = () => {
  useDataService();
  const {
    departmentId,
    priority,
    setDepartmentId,
    setPriority,
    resetFilters
  } = useUrlFilters();
  const departments = dataService.getDepartments();
  const monthlyTrend = dataService.getMonthlyTrend(
    departmentId !== 'All' ? Number(departmentId) : undefined,
    priority !== 'All' ? priority : undefined
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ticket Volume Trends"
        subtitle="Longitudinal volume patterns, seasonal peaks, and creation-versus-resolution dynamics across 2024."
        breadcrumbs={[
          { label: 'Analytics', path: '/analytics/overview' },
          { label: 'Volume Trends' }
        ]}
      />

      <FilterBar
        departments={departments}
        selectedDepartment={departmentId}
        onDepartmentChange={setDepartmentId}
        selectedPriority={priority}
        onPriorityChange={setPriority}
        onReset={resetFilters}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Created vs. Resolved Tickets"
          subtitle="Governed Seeded Baseline · Total volume comparison by calendar month (FY2024)"
          takeaway="Consistent resolution throughput observed across quarters, preventing systemic queue ballooning."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                formatter={(val: number) => [`${val} tickets`, '']}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="created" name="Created" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="#0F9F8F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Average Monthly Resolution Time"
          subtitle="Governed Seeded Baseline · Monthly average duration in calendar hours (FY2024)"
          takeaway="Average turnaround stayed between 13.2h and 16.4h, reflecting stable service group capacity."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} unit="h" />
              <Tooltip
                formatter={(val: number) => [`${val} hours`, 'Avg Turnaround']}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="avgResolutionHours"
                name="Avg Resolution Time"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

// 2. ResolutionPerformancePage
export const ResolutionPerformancePage: React.FC = () => {
  useDataService();
  const navigate = useNavigate();
  const {
    departmentId,
    priority,
    setDepartmentId,
    setPriority,
    resetFilters
  } = useUrlFilters();
  const departments = dataService.getDepartments();

  const deptNum = departmentId !== 'All' ? Number(departmentId) : undefined;
  const prioVal = priority !== 'All' ? priority : undefined;

  const metrics = dataService.getSummaryMetrics(deptNum, prioVal);
  const { distribution, sameDayRate, totalResolved } = dataService.getResolutionDistribution(deptNum, prioVal);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resolution Performance"
        subtitle="Distribution of elapsed turnaround duration, median baselines, and delay root analysis."
        breadcrumbs={[
          { label: 'Analytics', path: '/analytics/overview' },
          { label: 'Resolution Performance' }
        ]}
      />

      <FilterBar
        departments={departments}
        selectedDepartment={departmentId}
        onDepartmentChange={setDepartmentId}
        selectedPriority={priority}
        onPriorityChange={setPriority}
        onReset={resetFilters}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Average Resolution Time"
          value={`${metrics.avgResolutionHours} hrs`}
          subtitle="Mean calendar duration"
          icon={Clock}
          variant="brand"
          onClick={() => navigate(`/agent/tickets${buildFilterQueryString({ status: 'Resolved Outcomes', dept: departmentId, priority })}`)}
        />
        <KpiCard
          title="Median Resolution Time"
          value={`${metrics.medianResolutionHours} hrs`}
          subtitle="50th percentile of resolved"
          icon={Clock}
          variant="healthy"
          onClick={() => navigate(`/agent/tickets${buildFilterQueryString({ status: 'Resolved Outcomes', dept: departmentId, priority })}`)}
        />
        <KpiCard
          title="Same-Day Resolution Rate"
          value={`${sameDayRate}%`}
          subtitle={`${(distribution[0].count + distribution[1].count).toLocaleString()} of ${totalResolved.toLocaleString()} tickets`}
          icon={CheckCircle2}
          variant="healthy"
          onClick={() => navigate(`/agent/tickets${buildFilterQueryString({ status: 'Resolved Outcomes', dept: departmentId, priority })}`)}
        />
      </div>

      <ChartCard
        title="Resolution Time Distribution Histogram"
        subtitle="Resolved tickets partitioned into duration buckets"
        takeaway={`${sameDayRate}% of resolved tickets were completed within 8 calendar hours. Multi-day or escalated tickets (> 24h) account for ${Math.round((distribution[3].share + distribution[4].share) * 10) / 10}%.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distribution} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="range" stroke="#64748B" fontSize={11} />
            <YAxis stroke="#64748B" fontSize={11} />
            <Tooltip
              formatter={(val: number) => [`${val.toLocaleString()} tickets`, 'Count']}
              contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
            />
            <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

// 3. TeamPerformancePage
export const TeamPerformancePage: React.FC = () => {
  useDataService();
  const teamBreakdown = dataService.getTeamBreakdown();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team & Agent Performance"
        subtitle="Benchmarking service delivery metrics, resolution velocity, and backlog across support tiers."
        breadcrumbs={[
          { label: 'Analytics', path: '/analytics/overview' },
          { label: 'Team Performance' }
        ]}
      />

      <div className="bg-surface rounded-xl border border-border shadow-card p-5">
        <h3 className="font-bold text-sm text-text-primary mb-3">Support Teams Scorecard</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-slate-500 font-semibold">
                <th className="py-2.5 px-3">Team Name</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Volume</th>
                <th className="py-2.5 px-3">Backlog</th>
                <th className="py-2.5 px-3">Avg Turnaround</th>
                <th className="py-2.5 px-3">SLA Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {teamBreakdown.map((t) => (
                <tr key={t.teamId} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-semibold text-text-primary">{t.teamName}</td>
                  <td className="py-3 px-3 text-text-secondary">{t.departmentName}</td>
                  <td className="py-3 px-3 font-medium text-text-primary">{t.totalTickets}</td>
                  <td className="py-3 px-3 font-bold text-brand-600">{t.openBacklog}</td>
                  <td className="py-3 px-3 text-text-secondary">{t.avgResolutionHours}h</td>
                  <td className="py-3 px-3 font-semibold text-emerald-700">{t.slaCompliancePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 4. DepartmentAnalysisPage
export const DepartmentAnalysisPage: React.FC = () => {
  useDataService();
  const deptBreakdown = dataService.getDepartmentBreakdown();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Demand Analysis"
        subtitle="Ticket origination patterns, turnaround times, and satisfaction scores across corporate divisions."
        breadcrumbs={[
          { label: 'Analytics', path: '/analytics/overview' },
          { label: 'Department Demand' }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Ticket Origination Volume by Department"
          subtitle="Relative demand generated by each business unit"
          takeaway="HR & Workplace and Finance generated the highest volumes (~1,640 tickets each) over 2024."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={deptBreakdown}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" fontSize={11} stroke="#64748B" />
              <YAxis type="category" dataKey="departmentName" fontSize={10} stroke="#64748B" width={140} />
              <Tooltip
                formatter={(val: number) => [`${val} tickets`, 'Volume']}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="ticketCount" fill="#4F46E5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="bg-surface rounded-xl border border-border shadow-card p-5">
          <h3 className="font-bold text-sm text-text-primary mb-3">Department Summary Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Volume</th>
                  <th className="py-2.5 px-3">Avg Turnaround</th>
                  <th className="py-2.5 px-3">Avg CSAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deptBreakdown.map((d) => (
                  <tr key={d.departmentId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-semibold text-text-primary">{d.departmentName}</td>
                    <td className="py-3 px-3 font-medium text-text-primary">{d.ticketCount.toLocaleString()}</td>
                    <td className="py-3 px-3 text-text-secondary">{d.avgResolutionHours}h</td>
                    <td className="py-3 px-3 font-bold text-emerald-600">
                      {d.avgCsat > 0 ? `★ ${d.avgCsat.toFixed(2)} / 5.0` : 'Unrated'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. RecurringIssuesPage
export const RecurringIssuesPage: React.FC = () => {
  useDataService();
  const [departmentId, setDepartmentId] = useState<string>('All');
  const departments = dataService.getDepartments();
  const topIssues = dataService.getTopIssues(departmentId !== 'All' ? Number(departmentId) : undefined);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring Issues Analysis"
        subtitle="Ranked frequency of specific issue types to uncover automation targets and systemic failure points."
        breadcrumbs={[
          { label: 'Analytics', path: '/analytics/overview' },
          { label: 'Recurring Issues' }
        ]}
      />

      <FilterBar
        departments={departments}
        selectedDepartment={departmentId}
        onDepartmentChange={setDepartmentId}
        onReset={() => setDepartmentId('All')}
      />

      <ChartCard
        title="Top Ranked Issue Types by Frequency"
        subtitle="Governed Seeded Baseline · 2024 Pareto recurring issue frequency register"
        takeaway={
          topIssues.length > 0
            ? `Top recurring issue is "${topIssues[0].issue}" (${topIssues[0].frequency} incidents), followed by "${topIssues[1]?.issue || ''}".`
            : 'No recurring incidents recorded for the selected filter.'
        }
        height="h-64"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topIssues} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="issue" stroke="#64748B" fontSize={10} interval={0} angle={-25} textAnchor="end" height={60} />
            <YAxis stroke="#64748B" fontSize={11} />
            <Tooltip
              formatter={(val: number) => [`${val} occurrences`, 'Frequency']}
              contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
            />
            <Bar dataKey="frequency" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="bg-surface rounded-xl border border-border shadow-card p-5">
        <h3 className="font-bold text-sm text-text-primary mb-1">Top 10 Recurring Incident Breakdown</h3>
        <p className="text-xs text-text-secondary mb-3">Longitudinal incident frequency and impact tiering across the dataset</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-slate-500 font-semibold">
                <th className="py-2.5 px-3">Issue Type</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Frequency</th>
                <th className="py-2.5 px-3">Avg Resolution</th>
                <th className="py-2.5 px-3">Breach Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topIssues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No recurring incidents recorded for the selected department.
                  </td>
                </tr>
              ) : (
                topIssues.map((issue, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-semibold text-text-primary">{issue.issue}</td>
                    <td className="py-3 px-3 text-text-secondary">{issue.category}</td>
                    <td className="py-3 px-3 font-bold text-brand-600">{issue.frequency}</td>
                    <td className="py-3 px-3 text-text-secondary">{issue.avgResolutionHours}h</td>
                    <td className="py-3 px-3 font-semibold text-red-600">{issue.breachRatePct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 6. ReportsExportPage
export const ReportsExportPage: React.FC = () => {
  useDataService();
  const {
    status,
    priority,
    setStatus,
    setPriority
  } = useUrlFilters();
  const [reportType, setReportType] = useState('all_tickets');
  const [exported, setExported] = useState(false);

  const { tickets } = dataService.getTickets({ status, priority });

  const handleExport = () => {
    const csv = dataService.exportTicketsToCsv(tickets);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `it_support_analytics_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExported(true);
    setTimeout(() => setExported(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Reports & Data Export Center"
        subtitle="Export governed ticket datasets, KPI snapshots, and SLA compliance audits directly to CSV format."
        breadcrumbs={[
          { label: 'Analytics', path: '/analytics/overview' },
          { label: 'Reports & Export' }
        ]}
      />

      <div className="bg-surface rounded-xl border border-border shadow-card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">Report Scope</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white"
            >
              <option value="all_tickets">Full Ticket Ledger (Fact Table)</option>
              <option value="sla_compliance">SLA Compliance Audit</option>
              <option value="team_scorecard">Team Performance Matrix</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">Filter by Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active Backlog">Active Backlog (Open / In Progress / Pending)</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">Filter by Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical (4h)</option>
              <option value="High">High (8h)</option>
              <option value="Medium">Medium (24h)</option>
              <option value="Low">Low (72h)</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Records to be exported:</span>
            <span className="font-bold text-brand-600">{tickets.length.toLocaleString()} rows</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Export Format:</span>
            <span className="font-semibold text-text-primary">Comma Separated Values (.csv, UTF-8)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Dataset Authenticity:</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                dataService.getDataProvenance().dataSource === 'live'
                  ? 'text-emerald-800 bg-emerald-100'
                  : 'text-amber-800 bg-amber-100'
              }`}
            >
              {dataService.getDataProvenance().dataSource === 'live'
                ? 'Live Governed Dataset (Supabase Hydrated)'
                : 'Synthetic Governed Baseline (Seed 42)'}
            </span>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Download Exported CSV File</span>
        </button>

        {exported && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 text-center font-medium">
            ✓ CSV file generated and downloaded successfully.
          </div>
        )}
      </div>
    </div>
  );
};
