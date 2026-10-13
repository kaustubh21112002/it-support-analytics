import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { StatusBadge, PriorityBadge, SLAStatusIndicator } from '../../components/common/Badges';
import { TicketStatus, TicketPriority } from '../../types';
import {
  ArrowLeft,
  Clock,
  Send,
  User,
  Paperclip,
  CheckCircle2,
  Lock,
  MessageSquare,
  AlertCircle,
  Shield,
  FileText
} from 'lucide-react';

export const AgentTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'timeline' | 'public' | 'internal' | 'details'>('timeline');
  const [replyText, setReplyText] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [actionStatus, setActionStatus] = useState<TicketStatus>('In Progress');
  const [actionAssignee, setActionAssignee] = useState<string>('1');
  const [actionPriority, setActionPriority] = useState<TicketPriority>('High');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const ticket = dataService.getTicketById(id || '');

  if (!ticket) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-text-primary">Ticket Not Found</h2>
        <p className="text-xs text-text-secondary">
          No ticket matching "{id}" exists in the queue.
        </p>
        <Link
          to="/agent/tickets"
          className="inline-block px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold"
        >
          Return to Queue
        </Link>
      </div>
    );
  }

  const agents = dataService.getAgents();
  const departments = dataService.getDepartments();
  const categories = dataService.getCategories();
  const slaRules = dataService.getSlaRules();

  const currentCategory = categories.find((c) => c.category_id === ticket.category_id);
  const currentDept = departments.find((d) => d.department_id === ticket.department_id);
  const currentSlaRule = slaRules.find((r) => r.sla_rule_id === ticket.sla_rule_id);

  const handleMarkResolved = () => {
    dataService.updateTicketStatus(ticket.ticket_id, 'Resolved', 'Marked resolved directly by support specialist.');
    setFeedbackMsg('Ticket marked as Resolved.');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleSendPublicReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    dataService.addTicketComment(ticket.ticket_id, {
      authorName: user?.name || 'Arjun Mehta',
      authorRole: 'agent',
      content: replyText.trim(),
      isInternal: false
    });

    setReplyText('');
    setFeedbackMsg('Public reply published to requester.');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleSaveInternalNote = () => {
    if (!internalNoteText.trim()) return;

    dataService.addTicketComment(ticket.ticket_id, {
      authorName: user?.name || 'Arjun Mehta',
      authorRole: 'agent',
      content: internalNoteText.trim(),
      isInternal: true
    });

    setInternalNoteText('');
    setFeedbackMsg('Internal note saved (hidden from requester).');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    setActionStatus(newStatus);
    dataService.updateTicketStatus(ticket.ticket_id, newStatus);
    setFeedbackMsg(`Status updated to ${newStatus}`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleAssigneeChange = (newAgentIdStr: string) => {
    setActionAssignee(newAgentIdStr);
    const agtId = newAgentIdStr ? Number(newAgentIdStr) : null;
    dataService.updateTicketAssignee(ticket.ticket_id, agtId);
    setFeedbackMsg('Assignee updated.');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handlePriorityChange = (newPriority: TicketPriority) => {
    setActionPriority(newPriority);
    dataService.updateTicketPriority(ticket.ticket_id, newPriority);
    setFeedbackMsg(`Governed Priority changed to ${newPriority}`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const allComments = ticket.comments || [];
  const filteredComments =
    activeTab === 'internal'
      ? allComments.filter((c) => c.isInternal)
      : activeTab === 'public'
      ? allComments.filter((c) => !c.isInternal)
      : allComments;

  return (
    <div className="space-y-6">
      {/* Top breadcrumb & Quick Resolution bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/agent/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Queue</span>
        </Link>

        {feedbackMsg && (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full animate-fade-in">
            ✓ {feedbackMsg}
          </span>
        )}
      </div>

      {/* Main Ticket Banner matching Mockup Screen 9 */}
      <div className="bg-surface rounded-xl border border-border shadow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-extrabold text-brand-600">{ticket.ticket_id}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="text-xl font-bold text-text-primary mt-1.5">
              {ticket.subject || ticket.issue_type}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                SLA Status
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                <Clock className="w-3.5 h-3.5" />
                2.1h remaining
              </span>
            </div>

            {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
              <button
                onClick={handleMarkResolved}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Resolved</span>
              </button>
            )}
          </div>
        </div>

        {/* Metadata row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Requester</span>
            <span className="text-text-primary font-semibold">
              {ticket.requester_name || 'Rahul Verma'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Department</span>
            <span className="text-text-primary font-semibold">
              {currentDept?.department_name || 'Finance & Administration'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Service Category</span>
            <span className="text-text-primary font-semibold">
              {currentCategory?.category_name || 'Network Access'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Created Date</span>
            <span className="text-text-primary font-semibold">{ticket.created_at}</span>
          </div>
        </div>
      </div>

      {/* Split Workspace: Conversation & Investigation (Left 8) vs Actions (Right 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-surface rounded-xl border border-border shadow-card p-6 flex flex-col justify-between">
          <div>
            {/* Tabs matching mockup */}
            <div className="flex items-center gap-4 border-b border-border pb-3 mb-5 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`pb-1 transition-all ${
                  activeTab === 'timeline'
                    ? 'border-b-2 border-brand-600 text-brand-600'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Timeline ({allComments.length})
              </button>
              <button
                onClick={() => setActiveTab('public')}
                className={`pb-1 transition-all ${
                  activeTab === 'public'
                    ? 'border-b-2 border-brand-600 text-brand-600'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Public Reply
              </button>
              <button
                onClick={() => setActiveTab('internal')}
                className={`pb-1 transition-all flex items-center gap-1 ${
                  activeTab === 'internal'
                    ? 'border-b-2 border-amber-600 text-amber-700'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Lock className="w-3 h-3 text-amber-500" />
                <span>Internal Notes</span>
              </button>
            </div>

            {/* Comments Feed */}
            <div className="space-y-4 mb-6">
              {filteredComments.map((c) => (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border ${
                    c.isInternal
                      ? 'bg-amber-50/50 border-amber-200'
                      : c.authorRole === 'employee'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-indigo-50/40 border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                        c.isInternal ? 'bg-amber-600' : c.authorRole === 'employee' ? 'bg-slate-700' : 'bg-brand-600'
                      }`}>
                        {c.authorName[0]}
                      </div>
                      <span className="text-xs font-bold text-text-primary">{c.authorName}</span>
                      <span className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-border text-slate-600 capitalize">
                        {c.authorRole}
                      </span>
                      {c.isInternal && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                          <Lock className="w-2.5 h-2.5" />
                          Internal Note (Hidden from Requester)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{c.createdAt}</span>
                  </div>
                  <p className="text-xs text-text-primary whitespace-pre-line leading-relaxed pl-8">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Public Reply composer at bottom */}
          <form onSubmit={handleSendPublicReply} className="pt-4 border-t border-border space-y-3">
            <label className="block text-xs font-semibold text-text-primary">
              Send Public Reply to Requester
            </label>
            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your message to the employee..."
              className="w-full px-3.5 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 hover:text-text-primary bg-slate-100 rounded-lg"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Add File</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Reply</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Sidebar: Agent Operational Controls (4 cols) matching Mockup Screen 9 */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-surface rounded-xl border border-border shadow-card p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border pb-2">
              Triage Actions
            </h4>

            {/* Change Status */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Change Status
              </label>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Assign To */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Assign To
              </label>
              <select
                value={ticket.agent_id ? String(ticket.agent_id) : ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="">Unassigned Queue</option>
                {agents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>
                    {a.agent_name} ({a.experience_band})
                  </option>
                ))}
              </select>
            </div>

            {/* Change Priority */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Governed Priority
              </label>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="Critical">Critical (4h Target)</option>
                <option value="High">High (8h Target)</option>
                <option value="Medium">Medium (24h Target)</option>
                <option value="Low">Low (72h Target)</option>
              </select>
            </div>
          </div>

          {/* Add Internal Note Card */}
          <div className="bg-amber-50/40 rounded-xl border border-amber-200 shadow-card p-5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Add Internal Note</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              Internal notes are only visible to support specialists and managers.
            </p>
            <textarea
              rows={4}
              value={internalNoteText}
              onChange={(e) => setInternalNoteText(e.target.value)}
              placeholder="e.g. Verified VPN server gateway logs. No auth timeout detected on RADIUS server..."
              className="w-full px-3 py-2 text-xs border border-amber-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={handleSaveInternalNote}
              disabled={!internalNoteText.trim()}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
            >
              Save Internal Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
