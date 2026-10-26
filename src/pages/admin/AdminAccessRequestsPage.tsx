import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService, useDataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { KpiCard } from '../../components/common/KpiCard';
import { AccessRequest, UserRole } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  AlertTriangle,
  User,
  Building2,
  Mail,
  FileText,
  Trash2,
  Eye,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export const AdminAccessRequestsPage: React.FC = () => {
  const { user } = useAuth();
  useDataService();

  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [loading, setLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [isAuthoritativeStore, setIsAuthoritativeStore] = useState<boolean>(true);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);

  // Review modal state
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setQueueError(null);
    const result = await dataService.getAccessRequestsAsync();
    setRequests(result.requests);
    setIsAuthoritativeStore(result.isAuthoritative);
    if (result.error) {
      setQueueError(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.workEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.departmentName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesRole = roleFilter === 'all' || req.requestedRole === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending_review').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const handleOpenReview = (req: AccessRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(req);
    setReviewAction(action);
    setReviewReason('');
    setActionFeedback(null);
  };

  const handleConfirmReview = async () => {
    if (!selectedRequest || !reviewAction || !user) return;

    if (user.role !== 'admin') {
      setActionFeedback({
        type: 'error',
        message: 'Security Boundary: Only authenticated administrators can review access requests.'
      });
      return;
    }

    setReviewing(true);
    const result = await dataService.reviewAccessRequest({
      requestId: selectedRequest.id,
      action: reviewAction,
      reviewerId: user.id,
      reviewerName: user.name,
      reviewerRole: user.role,
      reviewReason
    });

    setReviewing(false);

    if (result.success && result.request) {
      setActionFeedback({
        type: 'success',
        message: `Request ${selectedRequest.id} successfully marked as ${result.request.status}. Review decision logged in governance audit journal.`
      });
      // Refresh list
      await loadRequests();
      setReviewAction(null);
      setSelectedRequest(result.request);
      setTimeout(() => setActionFeedback(null), 4000);
    } else {
      setActionFeedback({
        type: 'error',
        message: result.error || 'Failed to record review decision.'
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!user || user.role !== 'admin') return;
    if (window.confirm(`Permanently remove demo access request record ${id}?`)) {
      dataService.deleteDemoAccessRequest(id, user.role);
      loadRequests();
      if (selectedRequest?.id === id) {
        setSelectedRequest(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Request Queue"
        subtitle="Review, audit, and approve corporate access requests submitted via the public onboarding portal."
        breadcrumbs={[
          { label: 'Administration', path: '/admin' },
          { label: 'Access Requests' }
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Pending Review"
          value={pendingCount}
          subtitle="Awaiting administrative decision"
          icon={Clock}
          variant={pendingCount > 0 ? 'warning' : 'neutral'}
        />
        <KpiCard
          title="Approved Requests"
          value={approvedCount}
          subtitle="Provisioning authorized"
          icon={CheckCircle2}
          variant="healthy"
        />
        <KpiCard
          title="Rejected Requests"
          value={rejectedCount}
          subtitle="Declined / policy mismatch"
          icon={XCircle}
          variant="neutral"
        />
        <KpiCard
          title="Total Lifetime Requests"
          value={requests.length}
          subtitle="Durable audit records"
          icon={ShieldCheck}
          variant="brand"
        />
      </div>

      {/* Authoritative Database Storage Status Banner */}
      {queueError && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Production Database Configuration Required</span>
            </div>
            <button
              onClick={loadRequests}
              className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-amber-300 hover:bg-amber-100 rounded-md text-amber-900 transition-colors"
            >
              Retry Connection
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            {queueError}
          </p>
          <p className="text-[10px] text-amber-700 italic border-t border-amber-200/80 pt-1">
            Governance Notice: To ensure zero data loss and shared administrative consensus, access requests must be persisted in Supabase PostgreSQL (table public.access_requests). Apply staged migration <code className="font-mono bg-amber-100/80 px-1 py-0.5 rounded">access_requests_migration.sql</code> in the Supabase SQL editor.
          </p>
        </div>
      )}

      {actionFeedback && (
        <div
          role="alert"
          className={`p-3.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-xl border border-border shadow-xs p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, ID, or department..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-border rounded-lg text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold text-[11px]">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-border rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-border rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Roles</option>
            <option value="employee">Employee</option>
            <option value="agent">Support Agent</option>
            <option value="manager">Service Desk Manager</option>
            <option value="admin">Administrator</option>
          </select>

          <button
            onClick={loadRequests}
            title="Refresh queue"
            disabled={loading}
            className="p-2 border border-border rounded-lg text-slate-500 hover:text-text-primary hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Access Requests ({filteredRequests.length})
            </h3>
            <span className="text-[10px] text-slate-500">
              Zero-Trust Enforcement: No automated privilege grant
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3">Tracking ID</th>
                  <th className="py-2.5 px-3">Applicant</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-secondary text-xs">
                      No access requests matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        selectedRequest?.id === req.id ? 'bg-brand-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        {req.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-text-primary">{req.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.workEmail}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {req.departmentName}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {req.requestedRole}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            req.status === 'pending_review'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : req.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              req.status === 'pending_review'
                                ? 'bg-amber-500'
                                : req.status === 'approved'
                                ? 'bg-emerald-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          {req.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {req.status === 'pending_review' && (
                            <>
                              <button
                                onClick={() => handleOpenReview(req, 'approve')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold tracking-wide"
                                title="Approve Request"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenReview(req, 'reject')}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold tracking-wide"
                                title="Reject Request"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-surface rounded-xl border border-border shadow-xs p-5 space-y-5">
          {selectedRequest ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Request Details
                  </span>
                  <h4 className="font-mono font-extrabold text-sm text-text-primary">
                    {selectedRequest.id}
                  </h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedRequest.status === 'pending_review'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : selectedRequest.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {selectedRequest.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Applicant Name</span>
                  <span className="font-semibold text-text-primary">{selectedRequest.fullName}</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">Work Email</span>
                  <span className="font-mono font-medium text-text-primary">
                    {selectedRequest.workEmail}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Department</span>
                    <span className="font-medium text-text-primary">
                      {selectedRequest.departmentName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Requested Role</span>
                    <span className="font-bold text-brand-600 uppercase">
                      {selectedRequest.requestedRole}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">Submission Timestamp</span>
                  <span className="text-slate-600 font-mono text-[11px]">
                    {new Date(selectedRequest.submittedAt).toLocaleString()}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Business Justification
                  </span>
                  <p className="text-text-primary leading-relaxed text-[11px] whitespace-pre-wrap">
                    {selectedRequest.reason}
                  </p>
                </div>

                {selectedRequest.status !== 'pending_review' && (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1 text-[11px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Review Audit Record
                    </span>
                    <div>Reviewer: <strong>{selectedRequest.reviewedByName || selectedRequest.reviewedBy}</strong></div>
                    <div>Decision Date: {selectedRequest.reviewedAt ? new Date(selectedRequest.reviewedAt).toLocaleString() : 'N/A'}</div>
                    {selectedRequest.reviewReason && (
                      <div className="mt-1 text-slate-600">Note: {selectedRequest.reviewReason}</div>
                    )}
                  </div>
                )}
              </div>

              {selectedRequest.status === 'pending_review' && (
                <div className="pt-3 border-t border-border flex items-center gap-2">
                  <button
                    onClick={() => handleOpenReview(selectedRequest, 'approve')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    Approve Request
                  </button>
                  <button
                    onClick={() => handleOpenReview(selectedRequest, 'reject')}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    Reject Request
                  </button>
                </div>
              )}

              <div className="pt-2 text-right">
                <button
                  onClick={() => handleDelete(selectedRequest.id)}
                  className="text-[10px] text-slate-400 hover:text-rose-600 flex items-center gap-1 ml-auto transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Record</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">Select an access request from the list to view its complete audit details and justification.</p>
            </div>
          )}
        </div>
      </div>

      {/* Review Confirmation Modal */}
      {reviewAction && selectedRequest && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-border p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${
                  reviewAction === 'approve' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {reviewAction === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-text-primary">
                  Confirm Access Request {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
                </h3>
                <p className="text-xs text-text-secondary">
                  Target: {selectedRequest.fullName} ({selectedRequest.id})
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 text-slate-700">
              <div>Requested Role: <strong className="uppercase text-brand-600">{selectedRequest.requestedRole}</strong></div>
              <div>Department: <strong>{selectedRequest.departmentName}</strong></div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                {reviewAction === 'approve'
                  ? 'Approving records administrator authorization in the audit journal. Operational accounts are provisioned via governed identity providers.'
                  : 'Rejecting notifies the applicant and records reasons in the immutable security journal.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Administrative Notes / Reason (Optional)
              </label>
              <textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                rows={3}
                placeholder={
                  reviewAction === 'approve'
                    ? 'e.g. Identity verified via Corporate Directory, approved for Service Desk triage.'
                    : 'e.g. Requested role tier exceeds departmental operational scope; resubmit as Employee.'
                }
                className="w-full p-2.5 text-xs bg-slate-50 border border-border rounded-lg text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setReviewAction(null)}
                disabled={reviewing}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                disabled={reviewing}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-all flex items-center gap-1.5 ${
                  reviewAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {reviewing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
