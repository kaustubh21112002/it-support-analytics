import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { FilterBar } from '../../components/common/FilterBar';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge, PriorityBadge, SLAStatusIndicator } from '../../components/common/Badges';
import { Ticket, TicketStatus } from '../../types';
import { Download, Eye, RefreshCw } from 'lucide-react';

export const TicketQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [departmentId, setDepartmentId] = useState<string>('All');

  const departments = dataService.getDepartments();
  const categories = dataService.getCategories();
  const agents = dataService.getAgents();
  const slaRules = dataService.getSlaRules();

  const { tickets } = dataService.getTickets({
    search,
    status,
    priority,
    departmentId: departmentId !== 'All' ? Number(departmentId) : undefined
  });

  const handleExportCsv = () => {
    const csv = dataService.exportTicketsToCsv(tickets);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `agent_ticket_queue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<Ticket>[] = [
    {
      key: 'ticket_id',
      header: 'Ticket ID',
      sortable: true,
      className: 'w-28 font-semibold text-brand-600',
      render: (t) => (
        <Link to={`/agent/tickets/${t.ticket_id}`} className="hover:underline">
          {t.ticket_id}
        </Link>
      )
    },
    {
      key: 'subject',
      header: 'Subject & Requester',
      sortable: true,
      render: (t) => (
        <div>
          <span className="font-semibold text-text-primary block">{t.subject || t.issue_type}</span>
          <span className="text-[11px] text-text-secondary">
            Req: {t.requester_name || 'Business User'}
          </span>
        </div>
      )
    },
    {
      key: 'category_id',
      header: 'Category',
      sortable: true,
      render: (t) => {
        const cat = categories.find((c) => c.category_id === t.category_id);
        return <span>{cat?.category_name || 'IT Systems'}</span>;
      }
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (t) => <PriorityBadge priority={t.priority} />
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (t) => <StatusBadge status={t.status} />
    },
    {
      key: 'agent_id',
      header: 'Assignee',
      sortable: true,
      render: (t) => {
        const agt = agents.find((a) => a.agent_id === t.agent_id);
        return (
          <span className={agt ? 'font-medium text-text-primary' : 'text-slate-400 italic'}>
            {agt ? agt.agent_name : 'Unassigned'}
          </span>
        );
      }
    },
    {
      key: 'sla_rule_id',
      header: 'SLA State',
      sortable: false,
      render: (t) => {
        const rule = slaRules.find((r) => r.sla_rule_id === t.sla_rule_id);
        const isResolved = t.status === 'Resolved' || t.status === 'Closed';
        const targetHours = rule?.target_resolution_hours || 24;
        const isCompliant = t.resolution_time_hours !== null ? t.resolution_time_hours <= targetHours : true;
        return (
          <SLAStatusIndicator
            isResolved={isResolved}
            isCompliant={isCompliant}
            targetHours={targetHours}
            actualHours={t.resolution_time_hours || undefined}
            hoursRemaining={!isResolved ? Math.max(1.0, Math.round((targetHours * 0.4) * 10) / 10) : undefined}
          />
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right w-20',
      render: (t) => (
        <button
          onClick={() => navigate(`/agent/tickets/${t.ticket_id}`)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded transition-colors"
        >
          <Eye className="w-3 h-3" />
          <span>Triage</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Ticket Queue"
        subtitle="Full operational dispatch queue across all business departments and support tiers."
        breadcrumbs={[
          { label: 'Agent Workspace', path: '/agent' },
          { label: 'Ticket Queue' }
        ]}
        actions={
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface hover:bg-slate-50 text-text-primary border border-border rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Filtered CSV</span>
          </button>
        }
      />

      <FilterBar
        departments={departments}
        selectedDepartment={departmentId}
        onDepartmentChange={setDepartmentId}
        selectedStatus={status}
        onStatusChange={setStatus}
        selectedPriority={priority}
        onPriorityChange={setPriority}
        searchQuery={search}
        onSearchChange={setSearch}
        onReset={() => {
          setSearch('');
          setStatus('All');
          setPriority('All');
          setDepartmentId('All');
        }}
      />

      <DataTable
        columns={columns}
        data={tickets}
        keyField="ticket_id"
        pageSize={10}
        onRowClick={(t) => navigate(`/agent/tickets/${t.ticket_id}`)}
      />
    </div>
  );
};
