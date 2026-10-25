import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService, useDataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { KpiCard } from '../../components/common/KpiCard';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import {
  Inbox,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  Layers
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export const AgentHome: React.FC = () => {
  useDataService();
  const { user } = useAuth();
  const navigate = useNavigate();

  const agents = dataService.getAgents();
  // Find current agent ID by user name or fallback to first active agent (Arjun Mehta)
  const currentAgent = React.useMemo(() => {
    if (user?.name) {
      const match = agents.find(a => a.agent_name.toLowerCase().includes(user.name.toLowerCase()) || user.name.toLowerCase().includes(a.agent_name.toLowerCase()));
      if (match) return match;
    }
    return agents[0] || null;
  }, [agents, user]);

  const atRiskTickets = dataService.getAtRiskTickets();
  const metrics = dataService.getSummaryMetrics();

  // Assigned tickets to current agent (or all active backlog for overview)
  const { tickets: myAssignedTickets } = dataService.getTickets({
    agentId: currentAgent ? currentAgent.agent_id : undefined,
    status: 'active backlog',
    limit: 10
  });

  const { tickets: unassignedTickets } = dataService.getTickets({
    status: 'active backlog'
  });
  const unassignedCount = React.useMemo(() => {
    return unassignedTickets.filter(t => t.agent_id === null).length;
  }, [unassignedTickets]);

  const statusDonutData = [
    { name: 'Open', value: metrics.openBreakdown.open, color: '#3B82F6' },
    { name: 'In Progress', value: metrics.openBreakdown.inProgress, color: '#F59E0B' },
    { name: 'Pending', value: metrics.openBreakdown.pending, color: '#8B5CF6' },
    { name: 'Resolved', value: 4882, color: '#0F9F8F' },
    { name: 'Closed', value: 1730, color: '#94A3B8' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Dashboard"
        subtitle={`Operational triage queue, SLA countdowns, and active workload distribution for ${currentAgent?.agent_name || 'Service Desk Specialist'}.`}
        actions={
          <Link
            to="/agent/tickets"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Layers className="w-4 h-4" />
            <span>Open Global Queue</span>
          </Link>
        }
      />

      {/* 4 Agent KPIs matching Mockup Screen 8 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Assigned to Me"
          value={String(myAssignedTickets.length)}
          subtitle={`Active backlog for ${currentAgent?.agent_name?.split(' ')[0] || 'Agent'}`}
          icon={UserCheck}
          variant="brand"
        />
        <KpiCard
          title="Unassigned Queue"
          value={String(unassignedCount)}
          subtitle="Awaiting agent dispatch"
          icon={Inbox}
          variant="neutral"
        />
        <KpiCard
          title="SLA At Risk"
          value={String(atRiskTickets.length)}
          subtitle="Under 4 calendar hours remaining"
          icon={AlertTriangle}
          variant="critical"
        />
        <KpiCard
          title="Global Compliance"
          value={`${metrics.slaCompliancePct}%`}
          subtitle={`${metrics.slaCompliantCount.toLocaleString()} of ${metrics.resolvedTickets.toLocaleString()} resolved met SLA`}
          icon={CheckCircle2}
          variant="healthy"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: My Queue Table (7 cols) */}
        <div className="lg:col-span-7 bg-surface rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-text-primary">My Queue</h3>
              <p className="text-xs text-text-secondary">Assigned tickets requiring active investigation</p>
            </div>
            <Link
              to="/agent/tickets"
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">SLA Left</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {myAssignedTickets.slice(0, 5).map((t) => {
                  const targetHours = t.priority === 'Critical' ? 4 : t.priority === 'High' ? 8 : t.priority === 'Medium' ? 24 : 72;
                  const hoursLeft = Math.max(0.8, Math.round((targetHours * 0.45) * 10) / 10);
                  const isUrgent = hoursLeft < 3 || t.priority === 'Critical';
                  return (
                    <tr key={t.ticket_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-brand-600">
                        <Link to={`/agent/tickets/${t.ticket_id}`} className="hover:underline">
                          {t.ticket_id}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-text-primary font-medium max-w-[180px] truncate">
                        {t.subject || t.issue_type}
                      </td>
                      <td className="py-3 px-3">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isUrgent ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {hoursLeft.toFixed(1)}h
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => navigate(`/agent/tickets/${t.ticket_id}`)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Triage</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {myAssignedTickets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No active tickets assigned to this agent in queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Tickets by Status Donut (5 cols) */}
        <div className="lg:col-span-5 bg-surface rounded-xl border border-border shadow-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-text-primary">Tickets by Status</h3>
              <span className="text-xs text-text-secondary font-medium">8,000 Total</span>
            </div>
            <p className="text-xs text-text-secondary mb-4">Lifecycle breakdown across all service groups</p>

            <div className="h-56 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val.toLocaleString()} tickets`, 'Volume']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-text-primary">8,000</span>
                <span className="text-[10px] text-text-secondary uppercase font-semibold">Tickets</span>
              </div>
            </div>

            {/* Status Legend Pills */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
              {statusDonutData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-1.5 rounded bg-slate-50">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-text-primary">{item.name}</span>
                  </div>
                  <span className="font-semibold text-text-secondary">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
