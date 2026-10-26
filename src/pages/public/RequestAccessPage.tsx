import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { dataService, useDataService } from '../../services/dataService';
import { UserRole } from '../../types';
import {
  Headphones,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Mail,
  FileText,
  Lock,
  Clock,
  Sparkles
} from 'lucide-react';

export const RequestAccessPage: React.FC = () => {
  useDataService();
  const departments = dataService.getDepartments();

  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [departmentId, setDepartmentId] = useState<number>(
    departments[0]?.department_id || 1
  );
  const [requestedRole, setRequestedRole] = useState<UserRole>('employee');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<{
    id: string;
    notice: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim()) {
      setError('Please provide your full legal or employee directory name.');
      return;
    }
    if (!workEmail.trim() || !workEmail.includes('@') || !workEmail.includes('.')) {
      setError('Please provide a valid corporate work email address.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 15) {
      setError('Please explain your business justification (minimum 15 characters).');
      return;
    }

    setLoading(true);

    try {
      const res = await dataService.submitAccessRequest({
        fullName,
        workEmail,
        departmentId,
        requestedRole,
        reason
      });

      setLoading(false);
      if (res.success && res.request) {
        setSubmittedRequest({
          id: res.request.id,
          notice: res.notice
        });
      } else {
        setError(res.error || 'Failed to record access request. Please contact the service desk directly.');
      }
    } catch {
      setLoading(false);
      setError('An unexpected error occurred while processing your request. Your input has been preserved.');
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* 1. Header Navigation */}
      <header className="border-b border-border bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-xs">
              <Headphones className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-text-primary block leading-tight">
                IT Support <span className="text-brand-600">Analytics</span>
              </span>
              <span className="text-[10px] text-text-secondary tracking-wider uppercase font-semibold font-mono hidden sm:block">
                Identity & Access Management
              </span>
            </div>
          </Link>

          <Link
            to="/login"
            className="text-xs sm:text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="max-w-xl w-full bg-white rounded-2xl border border-border shadow-card p-6 sm:p-8 space-y-6">
          {submittedRequest ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  Access Request Submitted
                </h1>
                <p className="text-xs text-text-secondary mt-1">
                  Reference ID:{' '}
                  <span className="font-mono font-bold text-brand-600">
                    {submittedRequest.id}
                  </span>
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-left text-xs space-y-2 text-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>Governed Verification Policy</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {submittedRequest.notice}
                </p>
                <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                  Target Role: <strong className="uppercase text-slate-700">{requestedRole}</strong> · Review Policy: Triaged by Corporate IT administrators in the Access Management Queue
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Proceed to Sign In / Demo Personas</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedRequest(null);
                    setFullName('');
                    setWorkEmail('');
                    setReason('');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold bg-white hover:bg-slate-50 text-text-secondary border border-border rounded-lg transition-all"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                    Employee Onboarding & Access
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  Request Platform Workspace Access
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
                  Submit a governed request to access enterprise service analytics, support queues, or self-service features.
                </p>
              </div>

              {/* Security Boundary Notice */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
                <div className="leading-snug text-[11px]">
                  <strong>Zero-Trust Governance:</strong> Roles are provisioned strictly via corporate identity approval. Submitting this request logs an audit ticket but does not grant immediate credentials or elevated permissions.
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 mb-1">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rachel Chen"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-surface focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-text-primary"
                    />
                  </div>
                </div>

                {/* Work Email */}
                <div>
                  <label htmlFor="workEmail" className="block text-xs font-bold text-slate-700 mb-1">
                    Corporate Work Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
                    <input
                      id="workEmail"
                      type="email"
                      required
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      placeholder="e.g. rachel.chen@company.com"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-surface focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-text-primary font-mono"
                    />
                  </div>
                </div>

                {/* Department and Requested Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="departmentId" className="block text-xs font-bold text-slate-700 mb-1">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="departmentId"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-surface focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-text-primary"
                    >
                      {departments.map((dept) => (
                        <option key={dept.department_id} value={dept.department_id}>
                          {dept.department_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="requestedRole" className="block text-xs font-bold text-slate-700 mb-1">
                      Requested Role Tier <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="requestedRole"
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-surface focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-text-primary font-medium"
                    >
                      <option value="employee">Employee (Self-Service)</option>
                      <option value="agent">Support Agent (Triage & Queue)</option>
                      <option value="manager">Service Manager (MIS Analytics)</option>
                      <option value="admin">Administrator (Governance)</option>
                    </select>
                  </div>
                </div>

                {/* Justification / Reason */}
                <div>
                  <label htmlFor="reason" className="block text-xs font-bold text-slate-700 mb-1">
                    Business Justification & Project Scope <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="reason"
                    required
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe why your role requires this permission tier and your primary operational responsibilities..."
                    className="w-full p-2.5 text-xs border border-border rounded-lg bg-surface focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-text-primary leading-relaxed"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Minimum 15 characters. Evaluated by Incident Command and Information Security.
                  </span>
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <Link
                    to="/login"
                    className="text-xs font-semibold text-text-secondary hover:text-text-primary hover:underline"
                  >
                    Cancel and Sign In
                  </Link>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Logging Request...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Access Request</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-border py-4 text-center text-[11px] text-text-secondary bg-white">
        <p>IT Support Analytics Platform · Governed Decision-Intelligence & Enterprise ITSM</p>
      </footer>
    </div>
  );
};
