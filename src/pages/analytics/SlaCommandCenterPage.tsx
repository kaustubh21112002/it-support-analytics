import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { FilterBar } from '../../components/common/FilterBar';
import { KpiCard } from '../../components/common/KpiCard';
import { PriorityBadge } from '../../components/common/Badges';
import { ChartCard } from '../../components/common/ChartCard';
import { OperationalBriefing } from '../../components/common/OperationalBriefing';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Info,
  Layers,
  ArrowRight,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const SlaCommandCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const [departmentId, setDepartmentId] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  const departments = dataService.getDepartments();
  const priorityBreakdown = dataService.getPriorityBreakdown();
  const atRiskTickets = dataService.getAtRiskTickets();
  const metrics = dataService.getSummaryMetrics();

  // Data formatted for Recharts comparison
  const slaChartData = priorityBreakdown.map((p) => ({
    priority: p.priority,
    Compliant: p.compliantCount,
    Breached: p.breachedCount,
    compliancePct: p.compliancePct,
    target: `${p.targetHours}h`
  }));

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface rounded-lg p-2.5 border border-border shadow-popover text-xs space-y-1">
          <p className="font-bold text-text-primary border-b border-border-subtle pb-1">{label} Priority</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-bar-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-text-primary tabular-nums">
                {entry.value.toLocaleString()} tickets
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
        title="SLA Command Center"
        subtitle="Monitor retrospective SLA compliance, evaluate policy breach distributions, and track at-risk open tickets approaching threshold."
        breadcrumbs={[
          { label: 'Analytics', path: '/analytics/overview' },
          { label: 'SLA Command Center' }
        ]}
      />

      {/* Above-the-fold Operational Briefing */}
      <OperationalBriefing
        whatItIs="Retrospective SLA Performance & Active Queue Breach Forecasting engine."
        whoItIsFor="Incident Commanders, Queue Triage Leads, and SLA Policy Architects."
        whyItMatters="Measures compliance across priority tiers (Critical 4h, High 8h, Medium 24h, Low 72h) strictly on completed tickets (6,612) while projecting at-risk open items (1,388) in 24/7 calendar hours."
        metricsHighlight={{
          label: 'OVERALL COMPLIANCE',
          value: `${metrics.slaCompliancePct}% Met`,
          detail: '5,814 compliant resolutions vs 85.0% governed threshold.'
        }}
        primaryAction={{
          label: 'Triage At-Risk Open Tickets',
          to: '/agent/tickets',
          icon: Clock
        }}
        secondaryAction={{
          label: 'Configure Governed SLA Targets',
          to: '/admin/sla',
          icon: ShieldAlert
        }}
        tertiaryAction={{
          label: 'Download SLA Compliance Audit (CSV)',
          to: '/analytics/reports',
          icon: Download
        }}
      />

      <FilterBar
        departments={departments}
        selectedDepartment={departmentId}
        onDepartmentChange={setDepartmentId}
        selectedPriority={priorityFilter}
        onPriorityChange={setPriorityFilter}
        onReset={() => {
          setDepartmentId('All');
          setPriorityFilter('All');
        }}
      />

      {/* 4 KPIs matching Mockup Screen 12 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Applicable Tickets"
          value={metrics.resolvedTickets.toLocaleString()}
          subtitle="Resolved denominator for compliance"
          icon={Layers}
          variant="brand"
        />
        <KpiCard
          title="SLA Compliant"
          value={metrics.slaCompliantCount.toLocaleString()}
          subtitle="Resolved within target window"
          icon={CheckCircle2}
          variant="healthy"
        />
        <KpiCard
          title="SLA Breached"
          value={metrics.slaBreachedCount.toLocaleString()}
          subtitle="Elapsed time exceeded target"
          icon={AlertTriangle}
          variant="critical"
        />
        <KpiCard
          title="Overall Compliance"
          value={`${metrics.slaCompliancePct}%`}
          subtitle="Across all priority bands (85% target)"
          icon={CheckCircle2}
          variant="healthy"
        />
      </div>

      {/* Governed SLA Methodology Callout */}
      <div className="p-4 rounded-xl bg-surface-subtle border border-border text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="font-bold text-text-primary">Governed Analytical Calculation Rules:</p>
          <p className="text-text-secondary leading-relaxed">
            <strong>Retrospective Compliance:</strong> Calculated strictly over tickets that have reached a final outcome (Resolved or Closed). Unresolved tickets are excluded from retrospective compliance percentages to prevent false denominators.
            <br />
            <strong>Calendar Hours:</strong> Elapsed resolution time is measured in 24/7 calendar hours from ticket creation to resolution timestamp as governed by current project assumptions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SLA Compliance by Priority Bar Chart (Left 7 cols) */}
        <div className="lg:col-span-7">
          <ChartCard
            title="How does SLA compliance compare across priority tiers?"
            subtitle="Compliant versus Breached ticket volumes by priority band"
            takeaway="Medium priority tickets (24h target) achieved the highest compliance at 88.8%, while Critical tickets (4h target) experienced an 87.0% compliance rate."
            height="h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slaChartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="priority" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                <Bar dataKey="Compliant" fill="#0F9F8F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Breached" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* At-Risk Tickets Live Table (Right 5 cols) */}
        <div className="lg:col-span-5 bg-surface rounded-xl border border-border shadow-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-text-primary">At-Risk Open Tickets</h3>
              </div>
              <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                Active Projections
              </span>
            </div>
            <p className="text-xs text-text-secondary mb-4">
              Open tickets approaching calendar-hour breach threshold
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-slate-400 font-semibold">
                    <th className="py-2 px-2">Ticket ID</th>
                    <th className="py-2 px-2">Issue</th>
                    <th className="py-2 px-2">Priority</th>
                    <th className="py-2 px-2">Time Left</th>
                    <th className="py-2 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {atRiskTickets.map((t) => (
                    <tr key={t.ticket_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-2 font-semibold text-brand-600">
                        <Link to={`/agent/tickets/${t.ticket_id}`} className="hover:underline">
                          {t.ticket_id}
                        </Link>
                      </td>
                      <td className="py-2.5 px-2 text-text-primary font-medium max-w-[130px] truncate">
                        {t.subject || t.issue_type}
                      </td>
                      <td className="py-2.5 px-2">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded text-[11px] whitespace-nowrap tabular-nums">
                          {t.hoursRemaining}h
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          onClick={() => navigate(`/agent/tickets/${t.ticket_id}`)}
                          className="p-1.5 rounded-md bg-surface-subtle hover:bg-slate-200 text-slate-700 border border-border"
                          title="View Ticket"
                          aria-label={`View ticket ${t.ticket_id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-text-secondary">Projected risk queue</span>
            <Link to="/agent/tickets" className="text-brand-600 font-semibold hover:underline flex items-center gap-1">
              <span>View full queue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
