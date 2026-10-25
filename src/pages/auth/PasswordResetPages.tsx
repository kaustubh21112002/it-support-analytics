import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Headphones, Mail, CheckCircle2, ArrowRight, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { getDefaultRouteForRole } from '../../config/permissions';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemoNotice, setIsDemoNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your work email address.');
      return;
    }
    setLoading(true);
    setError('');
    setIsDemoNotice(false);

    try {
      const res = await resetPassword(email.trim());
      setLoading(false);
      if (res.success) {
        setSubmitted(true);
      } else {
        if (res.isDemo) {
          setIsDemoNotice(true);
        }
        setError(res.error || 'Password recovery request failed.');
      }
    } catch {
      setLoading(false);
      setError('An unexpected error occurred during password recovery.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface">
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16">
        <div>
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm">
              <Headphones className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-tight text-text-primary">
              IT Support <span className="text-brand-600">Analytics</span>
            </span>
          </Link>

          <div className="max-w-md mx-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Password Recovery
            </h1>
            <p className="text-sm text-text-secondary mt-1.5 mb-6">
              Enter your corporate work email to receive a secure Supabase Auth reset link.
            </p>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className={`mb-5 p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                  isDemoNotice
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <span className="font-semibold block">{isDemoNotice ? 'Demo Persona Notice:' : 'Recovery Request Status:'}</span>
                  <span className="leading-relaxed block">{error}</span>
                </div>
              </div>
            )}

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Recovery Instructions Dispatched</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  A cryptographic reset link has been dispatched via Supabase Auth to <strong>{email}</strong>. Open the secure link in your corporate inbox to reset your password.
                </p>
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    <span>Return to Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Corporate Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@company.com"
                    className="w-full px-3.5 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-text-primary"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Dispatching...' : 'Send Recovery Link'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center lg:text-left text-xs text-text-secondary mt-8">
          <Link to="/login" className="text-brand-600 hover:underline font-medium inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 bg-slate-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between items-center text-center relative border-l border-slate-800">
        <div className="w-full flex justify-end">
          <span className="text-[10px] text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded font-mono">
            Identity Governance
          </span>
        </div>

        <div className="my-auto max-w-sm space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto text-indigo-300 shadow-xl">
            <Mail className="w-10 h-10 text-brand-300" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Verified Credential Recovery</h2>
          <p className="text-xs text-indigo-200 leading-relaxed">
            Production account passwords are governed through Supabase Auth token exchanges. Passwords and recovery tokens are never logged or stored client-side.
          </p>
        </div>

        <div className="text-xs text-indigo-300">
          IT Support Analytics · Identity Governance
        </div>
      </div>
    </div>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword, supabaseUser, authMode } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const hasActiveSession = !!supabaseUser && authMode === 'supabase';

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await updatePassword(password);
      setLoading(false);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(res.error || 'Password update failed.');
      }
    } catch {
      setLoading(false);
      setError('An unexpected error occurred while updating password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-surface rounded-2xl border border-border shadow-modal max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Reset Password</h1>
        <p className="text-xs text-text-secondary mt-1 mb-6">
          Set a new strong password for your verified Supabase user account.
        </p>

        {!hasActiveSession && (
          <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
            <span className="font-semibold block">No Active Recovery Session</span>
            <p className="text-[11px] leading-relaxed text-amber-700">
              Password updates require an active recovery token. In production, please open the secure reset link sent to your email. Simulated demo personas cannot be updated remotely.
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-emerald-900 text-sm">Password Updated Successfully</h4>
            <p className="text-xs text-emerald-700">Redirecting to sign-in page...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-3.5 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-text-secondary mt-6 pt-4 border-t border-border">
          <Link to="/login" className="text-brand-600 hover:underline font-medium">
            ← Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export const ForbiddenPage: React.FC = () => {
  const { user, switchRole, isDemoAuth, authMode, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    from?: string;
    attemptedRole?: UserRole;
    requiredRoles?: UserRole[];
  } | null;

  const attemptedRole = state?.attemptedRole || user?.role;
  const requiredRoles = state?.requiredRoles || [];
  const returnPath = state?.from;

  const handleSwitchAndGo = (targetRole: UserRole) => {
    switchRole(targetRole);
    if (returnPath) {
      navigate(returnPath, { replace: true });
    } else {
      navigate(getDefaultRouteForRole(targetRole), { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <div className="bg-surface rounded-2xl border border-border shadow-modal max-w-lg w-full p-6 sm:p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>

        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight mt-2">
            Access Denied
          </h1>
          <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto leading-relaxed">
            Your current account or simulated persona does not have the permissions required to view this resource.
          </p>
        </div>

        {/* Diagnostic Metadata Card */}
        <div className="bg-surface-subtle border border-border rounded-xl p-3.5 text-left text-xs space-y-2">
          {returnPath && (
            <div className="flex items-center justify-between">
              <span className="text-text-secondary font-medium">Attempted Path:</span>
              <code className="font-mono text-[11px] bg-slate-200/70 px-1.5 py-0.5 rounded text-text-primary">
                {returnPath}
              </code>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary font-medium">Current Role:</span>
            <span className="font-semibold text-text-primary capitalize">
              {attemptedRole || 'Unauthenticated'}
            </span>
          </div>
          {requiredRoles.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-text-secondary font-medium">Required Role(s):</span>
              <div className="flex items-center gap-1">
                {requiredRoles.map((r) => (
                  <span
                    key={r}
                    className="font-mono text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-semibold capitalize"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 border-t border-border/60">
            <span className="text-text-secondary font-medium">Session Mode:</span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                authMode === 'supabase'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : isDemoAuth
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {authMode === 'supabase'
                ? 'Verified Supabase Account'
                : isDemoAuth
                ? 'Simulated Demo Persona'
                : 'Unauthenticated'}
            </span>
          </div>
        </div>

        {/* Action Buttons based on Auth Mode */}
        <div className="pt-2 space-y-2">
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={() => navigate('/login', { state: { from: returnPath } })}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              Sign In to Access
            </button>
          ) : isDemoAuth ? (
            <>
              {requiredRoles.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-text-secondary font-medium">
                    Switch to an authorized demo persona for evaluation:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {requiredRoles.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleSwitchAndGo(r)}
                        className="py-1.5 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all capitalize"
                      >
                        Switch to {r === 'manager' ? 'Manager' : r === 'agent' ? 'Support Agent' : r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate(getDefaultRouteForRole(user?.role))}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-text-primary rounded-lg text-xs font-medium transition-colors"
              >
                Return to My Dashboard
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-text-secondary">
                Your verified user account does not have sufficient permissions assigned on the server. Contact your IT administrator.
              </p>
              <button
                type="button"
                onClick={() => navigate(getDefaultRouteForRole(user?.role))}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                Return to My Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Governance Notice */}
        <p className="text-[10px] text-slate-400 border-t border-border pt-3 leading-relaxed">
          Governance Notice: Client-side route authorization controls presentation and navigation only. Server security is enforced by PostgreSQL Row Level Security (RLS).
        </p>
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-surface rounded-2xl border border-border shadow-modal max-w-md w-full p-8 text-center space-y-4">
        <span className="text-5xl font-black text-slate-300">404</span>
        <h1 className="text-xl font-bold text-text-primary">Resource Not Found</h1>
        <p className="text-xs text-text-secondary leading-relaxed">
          The view or route you requested is unavailable or has been relocated.
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold"
          >
            Return to Platform Home
          </button>
        </div>
      </div>
    </div>
  );
};
