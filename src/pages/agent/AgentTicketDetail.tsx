import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService, useDataSync, MutationCapability } from '../../services/dataService';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { TicketDetailSkeleton } from '../../components/common/Skeleton';
import { TicketStatus, TicketPriority } from '../../types';
import {
  ArrowLeft,
  Clock,
  Send,
  User,
  UserCheck,
  Paperclip,
  CheckCircle2,
  Lock,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  Shield,
  FileText,
  Check,
  Copy,
  ExternalLink,
  Briefcase,
  Folder,
  Tag,
  Layers,
  Calendar,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';

export const AgentTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Reactive subscription to live hydration & state mutations
  const { hydrationStatus, ticketCount, isLive } = useDataSync();

  const [mutationCap, setMutationCap] = useState<MutationCapability>({
    canPersistRemotely: false,
    authMode: 'demo_session',
    reason: 'Checking mutation capabilities...'
  });

  useEffect(() => {
    let isMounted = true;
    dataService.getMutationCapability().then((cap) => {
      if (isMounted) setMutationCap(cap);
    });
    return () => {
      isMounted = false;
    };
  }, [isLive]);

  const [activeTab, setActiveTab] = useState<'timeline' | 'public' | 'internal'>('timeline');
  const [replyText, setReplyText] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Retrieve ticket entity through robust service lookup
  const ticket = dataService.getTicketById(id || '');

  // Originating route detection (Requirement 5)
  const locationState = location.state as { from?: string; fromLabel?: string } | null;
  const backRoute = locationState?.from || '/agent/tickets';
  const backLabel =
    locationState?.fromLabel ||
    (backRoute.includes('analytics') ? 'Executive Dashboard' : 'Ticket Queue');

  const handleCopyId = () => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.ticket_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // 1. Loading State (Requirement 6)
  if (!ticket && hydrationStatus === 'hydrating') {
    return <TicketDetailSkeleton ticketId={id} />;
  }

  // 2. Unknown / Not Found State (Requirement 6)
  if (!ticket) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 space-y-6">
        <div className="bg-surface rounded-xl border border-red-200 shadow-card p-6 sm:p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-600 border border-red-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold text-red-700 bg-red-50 rounded-full border border-red-200 uppercase tracking-wider mb-2">
              Record Not Found
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary">
              Ticket "{id}" Does Not Exist
            </h2>
            <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
              No matching ticket record was found across the {ticketCount.toLocaleString()} records evaluated in the current {isLive ? 'live Supabase' : 'governed seeded'} store.
            </p>
          </div>

          <div className="bg-slate-50 border border-border rounded-lg p-3 text-left text-xs text-slate-600 space-y-1">
            <span className="font-semibold block text-text-primary">Ticket ID Convention:</span>
            <p className="text-[11px] text-slate-500">
              Standard format is <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-brand-700 font-semibold">TKT-XXXXX</code> (e.g. <span className="font-mono">TKT-07751</span> or numeric <span className="font-mono">7751</span>).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/agent/tickets"
              className="w-full sm:w-auto px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Return to Ticket Queue
            </Link>
            <Link
              to="/analytics/overview"
              className="w-full sm:w-auto px-4 py-2.5 bg-surface hover:bg-slate-50 text-text-secondary hover:text-text-primary rounded-lg text-xs font-semibold border border-border transition-colors"
            >
              Go to Executive Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Lookup dimension entities with governed fallbacks
  const agents = dataService.getAgents();
  const departments = dataService.getDepartments();
  const categories = dataService.getCategories();
  const teams = dataService.getTeams();
  const slaRules = dataService.getSlaRules();

  const assignedAgent = ticket.agent_id ? agents.find(a => a.agent_id === ticket.agent_id) : null;
  const currentCategory = categories.find(c => c.category_id === ticket.category_id);
  const currentDept = departments.find(d => d.department_id === ticket.department_id);
  const currentTeam = teams.find(t => t.team_id === ticket.team_id);
  const currentSlaRule = slaRules.find(r => r.sla_rule_id === ticket.sla_rule_id);

  // SLA Calculation parameters (derived strictly from governed rules)
  const targetResolutionHours =
    currentSlaRule?.target_resolution_hours ||
    (ticket.priority === 'Critical' ? 4 : ticket.priority === 'High' ? 8 : ticket.priority === 'Medium' ? 24 : 72);

  const isResolved = ticket.status === 'Resolved' || ticket.status === 'Closed';
  const hasResolutionTime = ticket.resolution_time_hours !== null && !isNaN(ticket.resolution_time_hours);
  const isSlaCompliant = hasResolutionTime ? ticket.resolution_time_hours! <= targetResolutionHours : true;
  const varianceHours = hasResolutionTime
    ? Math.round((ticket.resolution_time_hours! - targetResolutionHours) * 10) / 10
    : null;

  // Operational triage action handlers (with role-aware capability handling & rollback)
  const handleMarkResolved = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await dataService.updateTicketTriage(ticket.ticket_id, {
        status: 'Resolved',
        resolutionNotes: 'Marked resolved during operational triage session.'
      });
      if (res.success) {
        setFeedbackMsg(
          res.isPersisted
            ? '✓ Resolved status successfully persisted to Supabase database.'
            : '✓ Ticket marked as Resolved in demo session (Remote DB writes disabled for unauthenticated demo role).'
        );
        setTimeout(() => setFeedbackMsg(''), 4500);
      } else {
        setSaveError(res.error || 'Failed to update ticket status.');
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await dataService.updateTicketTriage(ticket.ticket_id, { status: newStatus });
      if (res.success) {
        setFeedbackMsg(
          res.isPersisted
            ? `✓ Status "${newStatus}" persisted to Supabase database.`
            : `✓ Status updated to "${newStatus}" in demo session (Remote DB writes disabled for unauthenticated demo role).`
        );
        setTimeout(() => setFeedbackMsg(''), 4500);
      } else {
        setSaveError(res.error || 'Failed to update status.');
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssigneeChange = async (newAgentIdStr: string) => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const agtId = newAgentIdStr ? Number(newAgentIdStr) : null;
      const res = await dataService.updateTicketTriage(ticket.ticket_id, { agentId: agtId });
      if (res.success) {
        setFeedbackMsg(
          res.isPersisted
            ? agtId
              ? '✓ Specialist assignment persisted to Supabase database.'
              : '✓ Unassigned state persisted to Supabase database.'
            : agtId
              ? '✓ Specialist assigned in demo session (Remote DB writes disabled for unauthenticated demo role).'
              : '✓ Ticket unassigned in demo session (Remote DB writes disabled for unauthenticated demo role).'
        );
        setTimeout(() => setFeedbackMsg(''), 4500);
      } else {
        setSaveError(res.error || 'Failed to update assignee.');
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await dataService.updateTicketTriage(ticket.ticket_id, { priority: newPriority });
      if (res.success) {
        setFeedbackMsg(
          res.isPersisted
            ? `✓ Priority "${newPriority}" and SLA target persisted to Supabase database.`
            : `✓ Governed SLA priority updated to "${newPriority}" in demo session (Remote DB writes disabled for unauthenticated demo role).`
        );
        setTimeout(() => setFeedbackMsg(''), 4500);
      } else {
        setSaveError(res.error || 'Failed to update priority.');
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendPublicReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSaving) return;

    dataService.addTicketComment(ticket.ticket_id, {
      authorName: user?.name || assignedAgent?.agent_name || 'Support Specialist',
      authorRole: 'agent',
      content: replyText.trim(),
      isInternal: false
    });

    setReplyText('');
    setFeedbackMsg('Public reply recorded in session timeline.');
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  const handleSaveInternalNote = () => {
    if (!internalNoteText.trim() || isSaving) return;

    dataService.addTicketComment(ticket.ticket_id, {
      authorName: user?.name || assignedAgent?.agent_name || 'Support Specialist',
      authorRole: 'agent',
      content: internalNoteText.trim(),
      isInternal: true
    });

    setInternalNoteText('');
    setFeedbackMsg('Internal note recorded in session memory.');
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  const comments = ticket.comments || [];
  const filteredComments =
    activeTab === 'internal'
      ? comments.filter(c => c.isInternal)
      : activeTab === 'public'
      ? comments.filter(c => !c.isInternal)
      : comments;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Navigation & Originating Breadcrumb (Requirement 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border p-3.5 sm:p-4 rounded-xl shadow-card">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Link
            to={backRoute}
            className="inline-flex items-center gap-1.5 font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {backLabel}</span>
          </Link>

          <span className="text-slate-300 hidden sm:inline">|</span>

          <div className="hidden sm:flex items-center gap-1.5 text-text-secondary text-[11px]">
            <span>Alternative routes:</span>
            <Link to="/analytics/overview" className="text-slate-600 hover:text-brand-600 font-medium hover:underline">
              Executive Overview
            </Link>
            <span>•</span>
            <Link to="/agent/tickets" className="text-slate-600 hover:text-brand-600 font-medium hover:underline">
              All Queue Tickets
            </Link>
            <span>•</span>
            <Link to="/analytics/sla" className="text-slate-600 hover:text-brand-600 font-medium hover:underline">
              SLA Command Center
            </Link>
          </div>
        </div>

        {feedbackMsg && (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full animate-fade-in self-start sm:self-auto">
            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {isSaving && (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-800 bg-brand-50 border border-brand-200 px-3 py-1 rounded-full animate-pulse self-start sm:self-auto">
            <div className="w-3 h-3 rounded-full border-2 border-brand-300 border-t-brand-700 animate-spin" />
            <span>Saving changes to database...</span>
          </div>
        )}
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="font-semibold">{saveError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="text-[11px] font-bold text-red-700 hover:text-red-900 underline flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Executive Ticket Banner (Requirements 2, 3 & 4) */}
      <div className="bg-surface rounded-xl border border-border shadow-card p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-lg sm:text-2xl font-black text-brand-600 tracking-tight">
                {ticket.ticket_id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy Ticket ID"
                className="p-1 rounded text-slate-400 hover:text-text-primary hover:bg-slate-100 transition-colors"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                SLA Rule #{ticket.sla_rule_id}
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-text-primary break-words">
              {ticket.subject || ticket.issue_type}
            </h1>

            {ticket.description && ticket.description !== ticket.subject && (
              <p className="text-xs text-text-secondary leading-relaxed pt-1">
                {ticket.description}
              </p>
            )}
          </div>

          {/* SLA Performance & Quick Resolution Button */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
            {/* SLA Indicator Card */}
            <div className="text-left lg:text-right">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                Governed SLA Target
              </span>
              {isResolved ? (
                isSlaCompliant ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>SLA Met ({ticket.resolution_time_hours}h / {targetResolutionHours}h)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>SLA Breached (+{varianceHours}h over {targetResolutionHours}h)</span>
                  </div>
                )
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Target Window: {targetResolutionHours}h Target</span>
                </div>
              )}
            </div>

            {!isResolved && (
              <button
                type="button"
                onClick={handleMarkResolved}
                disabled={isSaving}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                {isSaving ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Saving...' : 'Mark Resolved'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Detailed Available Fields Ledger (Requirement 3) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 pt-2 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 block text-[11px] font-medium flex items-center gap-1">
              <Folder className="w-3 h-3 text-slate-400" /> Department
            </span>
            <span className="text-text-primary font-bold truncate block" title={currentDept?.department_name}>
              {currentDept?.department_name || 'Unspecified Department'}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 block text-[11px] font-medium flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" /> Category
            </span>
            <span className="text-text-primary font-bold truncate block" title={currentCategory?.category_name}>
              {currentCategory?.category_name || 'Unspecified Category'}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 block text-[11px] font-medium flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-slate-400" /> Assigned Specialist
            </span>
            <span className="text-text-primary font-bold truncate block" title={assignedAgent?.agent_name}>
              {assignedAgent ? `${assignedAgent.agent_name} (${assignedAgent.experience_band})` : 'Unassigned Queue'}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 block text-[11px] font-medium flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-slate-400" /> Support Team
            </span>
            <span className="text-text-primary font-bold truncate block">
              {currentTeam?.team_name || 'Unspecified Team'}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 block text-[11px] font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" /> Created At
            </span>
            <span className="text-text-primary font-semibold tabular-nums block">
              {ticket.created_at}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 block text-[11px] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" /> Turnaround Duration
            </span>
            <span className="text-text-primary font-bold tabular-nums block">
              {ticket.resolution_time_hours !== null ? `${ticket.resolution_time_hours} hours` : 'In Progress'}
            </span>
          </div>
        </div>

        {/* Secondary Details Row (Resolved timestamp, CSAT, Requester attribution) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs bg-slate-50/60 p-3 rounded-lg">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Requester Identity:</span>
            <span className="font-semibold text-text-primary">
              {ticket.requester_name || 'Unspecified Requester'}
            </span>
            {ticket.requester_email && (
              <span className="block text-[11px] text-slate-500 font-mono truncate">
                {ticket.requester_email}
              </span>
            )}
          </div>

          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Resolved Timestamp:</span>
            <span className="font-semibold text-text-primary tabular-nums">
              {ticket.resolved_at || 'Pending resolution'}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Customer Satisfaction (CSAT):</span>
            <span className="font-semibold text-text-primary">
              {ticket.satisfaction_rating !== null ? (
                <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                  ★ {ticket.satisfaction_rating} / 5.0
                </span>
              ) : (
                <span className="text-slate-400">No rating recorded</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Split Workspace: Governed Timeline & Investigation (Left 8) vs Operational Triage Actions (Right 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Timeline & Conversation History (Requirement 4) */}
        <div className="lg:col-span-8 bg-surface rounded-xl border border-border shadow-card p-4 sm:p-6 flex flex-col justify-between space-y-6">
          <div>
            {/* Conversation Tabs */}
            <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
              <div className="flex items-center gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className={`pb-1 transition-all ${
                    activeTab === 'timeline'
                      ? 'border-b-2 border-brand-600 text-brand-600'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Ticket Activity Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('public')}
                  className={`pb-1 transition-all ${
                    activeTab === 'public'
                      ? 'border-b-2 border-brand-600 text-brand-600'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Public Notes ({comments.filter(c => !c.isInternal).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('internal')}
                  className={`pb-1 transition-all flex items-center gap-1 ${
                    activeTab === 'internal'
                      ? 'border-b-2 border-amber-600 text-amber-700'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>Internal Notes ({comments.filter(c => c.isInternal).length})</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Strict data provenance (zero simulated events)
              </span>
            </div>

            {/* Governed Ticket Timeline: Real Events Only */}
            {activeTab === 'timeline' && (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Event 1: Creation */}
                <div className="relative">
                  <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-brand-100 border-2 border-brand-600 flex items-center justify-center">
                    <FileText className="w-2.5 h-2.5 text-brand-700" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary">Incident Created & Logged</span>
                      <span className="text-[11px] text-slate-400 tabular-nums">{ticket.created_at}</span>
                    </div>
                    <p className="text-text-secondary">
                      Service request registered under <strong className="text-text-primary">{currentDept?.department_name || 'Corporate'}</strong> for issue category <strong className="text-text-primary">{currentCategory?.category_name}</strong>.
                    </p>
                    <div className="text-[11px] text-slate-500 pt-1">
                      Target resolution window established at <strong>{targetResolutionHours} calendar hours</strong> ({ticket.priority} priority).
                    </div>
                  </div>
                </div>

                {/* Event 2: Assignment */}
                {assignedAgent && (
                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-indigo-100 border-2 border-indigo-600 flex items-center justify-center">
                      <UserCheck className="w-2.5 h-2.5 text-indigo-700" />
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary">Assigned to Queue Specialist</span>
                        <span className="text-[11px] text-slate-400">Agent {assignedAgent.agent_code}</span>
                      </div>
                      <p className="text-text-secondary">
                        Assigned to <strong className="text-text-primary">{assignedAgent.agent_name}</strong> ({assignedAgent.experience_band} Specialist) within <strong className="text-text-primary">{currentTeam?.team_name || 'Support Team'}</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Event 3: Existing Logged Comments */}
                {comments.map((c) => (
                  <div key={c.id} className="relative">
                    <div className={`absolute -left-6 top-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      c.isInternal
                        ? 'bg-amber-100 border-amber-600 text-amber-700'
                        : 'bg-brand-100 border-brand-600 text-brand-700'
                    }`}>
                      {c.isInternal ? <Lock className="w-2.5 h-2.5" /> : <MessageSquare className="w-2.5 h-2.5" />}
                    </div>
                    <div className={`rounded-lg border p-3 text-xs space-y-1.5 ${
                      c.isInternal ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-text-primary">{c.authorName}</span>
                          <span className="text-[10px] uppercase font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                            {c.authorRole}
                          </span>
                          {c.isInternal && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                              Internal
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 tabular-nums">{c.createdAt}</span>
                      </div>
                      <p className="text-text-secondary whitespace-pre-line leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Event 4: Resolution (if resolved in dataset) */}
                {isResolved && ticket.resolved_at && (
                  <div className="relative">
                    <div className={`absolute -left-6 top-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSlaCompliant
                        ? 'bg-emerald-100 border-emerald-600 text-emerald-700'
                        : 'bg-red-100 border-red-600 text-red-700'
                    }`}>
                      {isSlaCompliant ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                    </div>
                    <div className={`rounded-lg border p-3 text-xs space-y-1 ${
                      isSlaCompliant ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary">
                          Ticket {ticket.status}
                        </span>
                        <span className="text-[11px] text-slate-500 tabular-nums">{ticket.resolved_at}</span>
                      </div>
                      <p className="text-text-secondary">
                        Recorded turnaround: <strong className="text-text-primary">{ticket.resolution_time_hours} hours</strong> ({isSlaCompliant ? 'Met SLA benchmark' : `Exceeded target by ${varianceHours}h`}).
                      </p>
                      {ticket.resolution_notes && (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 mt-1 italic">
                          "{ticket.resolution_notes}"
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Public or Internal Filtered Views */}
            {activeTab !== 'timeline' && (
              <div className="space-y-3">
                {filteredComments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-border rounded-xl">
                    No {activeTab} notes logged for this ticket yet.
                  </div>
                ) : (
                  filteredComments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        c.isInternal
                          ? 'bg-amber-50/60 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-primary">{c.authorName}</span>
                          <span className="text-[10px] uppercase font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                            {c.authorRole}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{c.createdAt}</span>
                      </div>
                      <p className="text-text-secondary whitespace-pre-line leading-relaxed pl-2">
                        {c.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Reply Form at Bottom of Left Column */}
          <form onSubmit={handleSendPublicReply} className="pt-4 border-t border-border space-y-3">
            <label className="block text-xs font-semibold text-text-primary">
              Send Reply to Requester
            </label>
            <textarea
              rows={3}
              value={replyText}
              disabled={isSaving}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Post a response or status update to the requester..."
              className="w-full px-3.5 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Visible to employee and audit ledger
              </span>
              <button
                type="submit"
                disabled={!replyText.trim() || isSaving}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Reply</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Operational Triage Actions (Requirement 2 & 8) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5">
          {/* Triage Decision Card */}
          <div className="bg-surface rounded-xl border border-border shadow-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-brand-600" />
                <span>Operational Triage</span>
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isSaving
                  ? 'text-brand-700 bg-brand-50 border border-brand-200 animate-pulse'
                  : mutationCap.canPersistRemotely
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  : 'text-amber-800 bg-amber-50 border border-amber-200'
              }`}>
                {isSaving
                  ? 'Saving...'
                  : mutationCap.canPersistRemotely
                  ? 'Verified DB Persistence'
                  : 'Demo Mode (Session Storage)'}
              </span>
            </div>

            {!mutationCap.canPersistRemotely && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 text-[11px] text-amber-800 flex items-start gap-2">
                <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <span className="font-semibold">Demo Session:</span> Triage changes update in-memory metrics and timeline. Persistent database writes require a server-verified Supabase session with Row Level Security.
                </div>
              </div>
            )}

            {/* Change Status */}
            <div>
              <label htmlFor="triage-status-select" className="block text-xs font-semibold text-text-primary mb-1">
                Queue Status
              </label>
              <select
                id="triage-status-select"
                value={ticket.status}
                disabled={isSaving}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-text-primary disabled:opacity-50"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Assignee Selection */}
            <div>
              <label htmlFor="triage-agent-select" className="block text-xs font-semibold text-text-primary mb-1">
                Assigned Specialist
              </label>
              <select
                id="triage-agent-select"
                value={ticket.agent_id ? String(ticket.agent_id) : ''}
                disabled={isSaving}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-text-primary disabled:opacity-50"
              >
                <option value="">Unassigned Queue</option>
                {agents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>
                    {a.agent_name} ({a.experience_band})
                  </option>
                ))}
              </select>
            </div>

            {/* Change Governed Priority */}
            <div>
              <label htmlFor="triage-priority-select" className="block text-xs font-semibold text-text-primary mb-1">
                SLA Priority Level
              </label>
              <select
                id="triage-priority-select"
                value={ticket.priority}
                disabled={isSaving}
                onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-text-primary disabled:opacity-50"
              >
                <option value="Critical">Critical (4h Target)</option>
                <option value="High">High (8h Target)</option>
                <option value="Medium">Medium (24h Target)</option>
                <option value="Low">Low (72h Target)</option>
              </select>
            </div>
          </div>

          {/* Internal Notes Card */}
          <div className="bg-amber-50/50 rounded-xl border border-amber-200 shadow-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Internal Investigation Note</span>
              </div>
              <span className="text-[10px] text-amber-700 font-semibold bg-amber-100/70 px-1.5 py-0.5 rounded">
                Session Storage
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              Internal notes are preserved in active session memory. Remote commentary table is not provisioned in the database schema.
            </p>
            <textarea
              rows={3}
              value={internalNoteText}
              onChange={(e) => setInternalNoteText(e.target.value)}
              placeholder="e.g. Diagnostic verified. Routing ticket to Tier 2 network engineer..."
              className="w-full px-3 py-2 text-xs border border-amber-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-text-primary"
            />
            <button
              type="button"
              onClick={handleSaveInternalNote}
              disabled={!internalNoteText.trim() || isSaving}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
            >
              Save Internal Note
            </button>
          </div>

          {/* Governed Data Provenance Badge */}
          <div className="bg-surface rounded-xl border border-border p-3.5 text-xs text-text-secondary space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-text-primary">
              <Database className="w-3.5 h-3.5 text-brand-600" />
              <span>Data Provenance & Security Boundary</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Analytical records are hydrated from the governed 8,000-ticket dataset. UI role switching is client-side for presentation. Direct remote database mutations are restricted to authenticated Supabase sessions with least-privilege Row Level Security policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentTicketDetail;
