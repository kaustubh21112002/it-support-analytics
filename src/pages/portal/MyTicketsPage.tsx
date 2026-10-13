import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { FilterBar } from '../../components/common/FilterBar';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { Ticket } from '../../types';
import { PlusCircle, Eye } from 'lucide-react';

export const MyTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');

  const { tickets } = dataService.getTickets({
    search,
    status,
    priority,
    // For employee portal view, show user tickets
  });

  const categories = dataService.getCategories();

  const columns: Column<Ticket>[] = [
    {
      key: 'ticket_id',
      header: 'Ticket ID',
      sortable: true,
      className: 'w-28 font-semibold text-brand-600',
      render: (t) => (
        <Link to={`/portal/tickets/${t.ticket_id}`} className="hover:underline">
          {t.ticket_id}
        </Link>
      )
    },
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      render: (t) => (
        <div>
          <span className="font-semibold text-text-primary block">{t.subject || t.issue_type}</span>
          <span className="text-[11px] text-text-secondary">{t.issue_type}</span>
        </div>
      )
    },
    {
      key: 'category_id',
      header: 'Category',
      sortable: true,
      render: (t) => {
        const cat = categories.find((c) => c.category_id === t.category_id);
        return <span>{cat?.category_name || 'General IT'}</span>;
      }
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (t) => <StatusBadge status={t.status} />
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (t) => <PriorityBadge priority={t.priority} />
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      className: 'whitespace-nowrap text-text-secondary',
      render: (t) => <span>{t.created_at.split(' ')[0]}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right w-20',
      render: (t) => (
        <button
          onClick={() => navigate(`/portal/tickets/${t.ticket_id}`)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
        >
          <Eye className="w-3 h-3" />
          <span>View</span>
        </button>
      )
    }
  ];

  const handleReset = () => {
    setSearch('');
    setStatus('All');
    setPriority('All');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tickets"
        subtitle="Track, update, and manage your active and resolved IT support tickets."
        breadcrumbs={[
          { label: 'Portal', path: '/portal' },
          { label: 'My Tickets' }
        ]}
        actions={
          <Link
            to="/portal/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Ticket</span>
          </Link>
        }
      />

      <FilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        selectedStatus={status}
        onStatusChange={setStatus}
        selectedPriority={priority}
        onPriorityChange={setPriority}
        onReset={handleReset}
      />

      <DataTable
        columns={columns}
        data={tickets}
        keyField="ticket_id"
        pageSize={8}
        onRowClick={(row) => navigate(`/portal/tickets/${row.ticket_id}`)}
      />
    </div>
  );
};
