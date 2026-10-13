import React from 'react';
import { dataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { KpiCard } from '../../components/common/KpiCard';
import { ChartCard } from '../../components/common/ChartCard';
import {
  Users2,
  Clock,
  Layers,
  AlertTriangle,
  Award,
  CheckCircle2
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

export const WorkloadPage: React.FC = () => {
  const teamBreakdown = dataService.getTeamBreakdown();
  const agents = dataService.getAgents();

  // Synthetic workload aggregation by experience band
  const experienceData = [
    { band: 'Senior', count: 8, avgHours: 12.4, compliance: 89.4, openBacklog: 310 },
    { band: 'Mid-level', count: 9, avgHours: 14.8, compliance: 87.8, openBacklog: 540 },
    { band: 'Junior', count: 7, avgHours: 17.6, compliance: 85.1, openBacklog: 538 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Workload & Capacity"
        subtitle="Distribution of open backlog tickets, capacity balance, and turnaround performance across teams."
        breadcrumbs={[
          { label: 'Agent Workspace', path: '/agent' },
          { label: 'Team Workload' }
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Support Agents"
          value="24"
          subtitle="Across 8 specialized teams"
          icon={Users2}
          variant="brand"
        />
        <KpiCard
          title="Total Open Backlog"
          value="1,388"
          subtitle="In flight or in progress"
          icon={Layers}
          variant="neutral"
        />
        <KpiCard
          title="Avg. Agent Ticket Load"
          value="57.8"
          subtitle="Tickets per specialist"
          icon={Clock}
          variant="warning"
        />
        <KpiCard
          title="Workload Balance"
          value="Normal"
          subtitle="No team over 25% backlog"
          icon={CheckCircle2}
          variant="healthy"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart: Open Backlog by Team */}
        <ChartCard
          title="Open Ticket Backlog by Team"
          subtitle="Comparison of unresolved tickets in queue"
          takeaway="Enterprise Business Apps and ERP support carry highest backlog volumes due to multi-system integration tickets."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={teamBreakdown}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" fontSize={11} stroke="#64748B" />
              <YAxis
                type="category"
                dataKey="teamName"
                fontSize={10}
                stroke="#64748B"
                width={120}
              />
              <Tooltip
                formatter={(val: number) => [`${val} tickets`, 'Open Backlog']}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="openBacklog" fill="#4F46E5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart: Performance by Experience Band */}
        <ChartCard
          title="Resolution Performance by Experience Band"
          subtitle="Average resolution hours vs. target across seniority cohorts"
          takeaway="Senior specialists resolve complex tickets ~5.2 hours faster on average than junior specialists."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={experienceData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="band" fontSize={11} stroke="#64748B" />
              <YAxis fontSize={11} stroke="#64748B" unit="h" />
              <Tooltip
                formatter={(val: number, name: string) => [
                  name === 'avgHours' ? `${val} hours` : `${val}%`,
                  name === 'avgHours' ? 'Avg Resolution Time' : 'SLA Compliance'
                ]}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="avgHours" name="Avg Resolution Time (hrs)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Team Workload Table */}
      <div className="bg-surface rounded-xl border border-border shadow-card p-5">
        <h3 className="font-bold text-sm text-text-primary mb-3">
          Support Team Workload & SLA Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-slate-500 font-semibold">
                <th className="py-2.5 px-3">Team Name</th>
                <th className="py-2.5 px-3">Parent Department</th>
                <th className="py-2.5 px-3">Total Tickets</th>
                <th className="py-2.5 px-3">Active Backlog</th>
                <th className="py-2.5 px-3">Avg Resolution</th>
                <th className="py-2.5 px-3">SLA Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {teamBreakdown.map((t) => (
                <tr key={t.teamId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-semibold text-text-primary">{t.teamName}</td>
                  <td className="py-3 px-3 text-text-secondary">{t.departmentName}</td>
                  <td className="py-3 px-3 font-medium text-text-primary">{t.totalTickets.toLocaleString()}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {t.openBacklog}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-text-secondary">{t.avgResolutionHours}h</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {t.slaCompliancePct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
