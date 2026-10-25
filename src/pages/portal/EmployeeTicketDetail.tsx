import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService, useDataSync } from '../../services/dataService';
import { StatusBadge, PriorityBadge, SLAStatusIndicator } from '../../components/common/Badges';
import { PageHeader } from '../../components/common/PageHeader';
import { TicketDetailSkeleton } from '../../components/common/Skeleton';
import {
  ArrowLeft,
  Clock,
  Send,
  User,
  Paperclip,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const EmployeeTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [replyText, setReplyText] = useState('');

  // Subscribe reactively to Supabase live hydration
  const { hydrationStatus, ticketCount, isLive } = useDataSync();

  const ticket = dataService.getTicketById(id || '');

  if (!ticket && hydrationStatus === 'hydrating') {
    return <TicketDetailSkeleton ticketId={id} />;
  }

  if (!ticket) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-600 border border-red-100">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Ticket Not Found</h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          No service request matching "{id}" exists in the current ticket store.
        </p>
        <Link
          to="/portal/tickets"
          className="inline-block px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors"
        >
          Return to My Tickets
        </Link>
      </div>
    );
  }

  const categories = dataService.getCategories();
  const category = categories.find((c) => c.category_id === ticket.category_id);
  const slaRules = dataService.getSlaRules();
  const slaRule = slaRules.find((r) => r.sla_rule_id === ticket.sla_rule_id);

  // Governed rule: Employees only see public comments!
  const publicComments = (ticket.comments || []).filter((c) => !c.isInternal);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    dataService.addTicketComment(ticket.ticket_id, {
      authorName: user?.name || 'Priya Sharma',
      authorRole: 'employee',
      content: replyText.trim(),
      isInternal: false
    });

    setReplyText('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/portal/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Tickets</span>
        </Link>
        <span className="text-xs text-slate-400">
          Created on {ticket.created_at}
        </span>
      </div>

      {/* Ticket Header Card */}
      <div className="bg-surface rounded-xl border border-border shadow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-brand-600">{ticket.ticket_id}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="text-xl font-bold text-text-primary mt-1.5">
              {ticket.subject || ticket.issue_type}
            </h1>
          </div>

          <div className="text-right">
            <span className="text-xs text-text-secondary block">Resolution SLA</span>
            <SLAStatusIndicator
              isResolved={ticket.status === 'Resolved' || ticket.status === 'Closed'}
              isCompliant={
                ticket.resolution_time_hours !== null && slaRule
                  ? ticket.resolution_time_hours <= slaRule.target_resolution_hours
                  : true
              }
              targetHours={slaRule?.target_resolution_hours || 24}
              actualHours={ticket.resolution_time_hours || undefined}
              hoursRemaining={ticket.status === 'Open' || ticket.status === 'In Progress' ? 4.5 : undefined}
            />
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Service Category</span>
            <span className="text-text-primary font-semibold">
              {category?.category_name || 'Enterprise Systems'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Issue Classification</span>
            <span className="text-text-primary font-semibold">{ticket.issue_type}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Requester</span>
            <span className="text-text-primary font-semibold">{ticket.requester_name || user?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Target Turnaround</span>
            <span className="text-text-primary font-semibold">
              {slaRule?.target_resolution_hours} Calendar Hours
            </span>
          </div>
        </div>
      </div>

      {/* Conversation timeline */}
      <div className="bg-surface rounded-xl border border-border shadow-card p-6 space-y-6">
        <div className="border-b border-border pb-3">
          <h3 className="font-bold text-sm text-text-primary">Conversation Timeline</h3>
          <p className="text-xs text-text-secondary">Official messages between you and the IT support team</p>
        </div>

        <div className="space-y-4">
          {publicComments.map((c) => {
            const isEmployee = c.authorRole === 'employee';
            return (
              <div
                key={c.id}
                className={`p-4 rounded-xl border ${
                  isEmployee
                    ? 'bg-brand-50/40 border-brand-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isEmployee ? 'bg-brand-600 text-white' : 'bg-slate-700 text-white'
                    }`}>
                      {c.authorName[0]}
                    </div>
                    <span className="text-xs font-bold text-text-primary">{c.authorName}</span>
                    <span className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-border text-slate-600 capitalize">
                      {c.authorRole}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{c.createdAt}</span>
                </div>
                <p className="text-xs text-text-primary whitespace-pre-line leading-relaxed pl-8">
                  {c.content}
                </p>
              </div>
            );
          })}
        </div>

        {/* Reply form */}
        {ticket.status !== 'Closed' ? (
          <form onSubmit={handleSendReply} className="pt-4 border-t border-border space-y-3">
            <label htmlFor="employee-reply-input" className="block text-xs font-semibold text-text-primary">
              Add a Reply / Additional Information
            </label>
            <textarea
              id="employee-reply-input"
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Provide more context or reply to the support specialist..."
              className="w-full px-3.5 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Reply</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 text-center">
            This ticket is closed. If you require further assistance, please submit a new service request.
          </div>
        )}
      </div>
    </div>
  );
};
