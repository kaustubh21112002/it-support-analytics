import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { KpiCard } from '../../components/common/KpiCard';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import {
  Ticket as TicketIcon,
  Clock,
  CheckCircle2,
  Hourglass,
  PlusCircle,
  Bot,
  BookOpen,
  ArrowRight,
  Eye,
  ExternalLink
} from 'lucide-react';

export const EmployeeHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Retrieve tickets relevant to current employee demo user
  const { tickets } = dataService.getTickets({ limit: 6 });
  const articles = dataService.getKnowledgeArticles().slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name || 'Priya'}!`}
        subtitle="Here's an overview of your IT service requests, support interactions, and runbooks."
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

      {/* 4 KPIs matching Mockup Screen 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Open Tickets"
          value="5"
          subtitle="Active in service queue"
          icon={TicketIcon}
          variant="brand"
        />
        <KpiCard
          title="Awaiting Response"
          value="2"
          subtitle="Agent reply provided"
          icon={Hourglass}
          variant="warning"
        />
        <KpiCard
          title="Resolved Tickets"
          value="12"
          subtitle="Satisfied requests"
          icon={CheckCircle2}
          variant="healthy"
        />
        <KpiCard
          title="Avg. Resolution (hrs)"
          value="4.2h"
          subtitle="Faster than standard SLA"
          icon={Clock}
          variant="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Tickets Table (Left 8 cols) */}
        <div className="lg:col-span-8 bg-surface rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-text-primary">Recent Tickets</h3>
              <p className="text-xs text-text-secondary">Your most recent support tickets</p>
            </div>
            <Link
              to="/portal/tickets"
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
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.slice(0, 5).map((t) => (
                  <tr key={t.ticket_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-brand-600">
                      <Link to={`/portal/tickets/${t.ticket_id}`} className="hover:underline">
                        {t.ticket_id}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-text-primary font-medium max-w-xs truncate">
                      {t.subject || t.issue_type}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3 px-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="py-3 px-3 text-text-secondary whitespace-nowrap">
                      {t.created_at.split(' ')[0]}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => navigate(`/portal/tickets/${t.ticket_id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Cards: AI Assistant Promo + Popular KB Articles (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Support Assistant Panel */}
          <div className="bg-surface rounded-xl p-5 border border-slate-200 shadow-xs text-text-primary">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600 border border-brand-200/80">
                <Bot className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-text-primary">AI Support Assistant</h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              Get instant automated diagnostic steps, find relevant runbooks, or get guidance creating a ticket.
            </p>
            <Link
              to="/portal/assistant"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white hover:bg-brand-700 font-semibold rounded-lg text-xs shadow-sm transition-all"
            >
              <span>Chat with Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Popular Knowledge Articles */}
          <div className="bg-surface rounded-xl border border-border shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-600" />
                <h4 className="font-bold text-sm text-text-primary">Popular Articles</h4>
              </div>
              <Link to="/portal/knowledge" className="text-xs text-brand-600 hover:underline">
                Browse all
              </Link>
            </div>

            <div className="divide-y divide-border">
              {articles.map((art) => (
                <div key={art.id} className="py-2.5 first:pt-0 last:pb-0">
                  <Link
                    to={`/portal/knowledge?article=${art.id}`}
                    className="text-xs font-semibold text-text-primary hover:text-brand-600 line-clamp-1 block"
                  >
                    {art.title}
                  </Link>
                  <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                    {art.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
