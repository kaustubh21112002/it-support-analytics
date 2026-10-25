import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { DEMO_USERS } from '../../services/demoUsers';
import { getDefaultRouteForRole, canAccessRoute } from '../../config/permissions';
import { Headphones, Eye, EyeOff, ShieldCheck, ArrowRight, Shield, UserCheck, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, selectDemoUser, user, isDemoAuthEnabled } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract and sanitize destination to prevent redirect loops
  const rawFrom = (location.state as any)?.from;
  const isSafeFrom =
    rawFrom &&
    typeof rawFrom === 'string' &&
    !['/login', '/verify', '/403', '/404'].includes(rawFrom.split('?')[0]);
  const safeReturn = isSafeFrom ? rawFrom : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your work email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await login(email.trim(), password);
      setLoading(false);
      if (res.success) {
        if (res.requiresOtp === false) {
          // Real Supabase Auth: bypass OTP, go directly to target or default home
          const role = res.user?.role || user?.role;
          const destination =
            safeReturn && canAccessRoute(safeReturn, role).allowed
              ? safeReturn
              : getDefaultRouteForRole(role);
          navigate(destination, { replace: true });
        } else {
          navigate('/verify', { state: { from: safeReturn } });
        }
      } else {
        setError(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch {
      setLoading(false);
      setError('An unexpected error occurred during sign in.');
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    if (!isDemoAuthEnabled) return;
    selectDemoUser(role);
    navigate('/verify', { state: { from: safeReturn } });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface">
      {/* Left Column: Form & Access */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14">
        <div>
          {/* Brand Heading */}
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 mb-8 focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
            aria-label="IT Support Analytics Home"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-xs">
              <Headphones className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-bold text-base tracking-tight text-text-primary">
              IT Support <span className="text-brand-600">Analytics</span>
            </span>
          </Link>

          <div className="max-w-md mx-auto">
            {/* Title & Subtitle */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                Sign In
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                {isDemoAuthEnabled
                  ? 'Access your IT service intelligence workspace or choose a demo persona below.'
                  : 'Access your IT service intelligence workspace with your verified credentials.'}
              </p>
            </div>

            {/* Authentication Required Notice if redirected */}
            {safeReturn && !error && (
              <div
                role="status"
                aria-live="polite"
                className="mb-5 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 flex items-start gap-2"
              >
                <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-semibold">Authentication Required:</span>{' '}
                  {isDemoAuthEnabled
                    ? 'Please sign in or choose a demo persona to access '
                    : 'Please sign in with your corporate credentials to access '}
                  <code className="font-mono text-[11px] bg-indigo-100 px-1 py-0.5 rounded">{safeReturn}</code>.
                </div>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Sign-In Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-text-primary mb-1.5"
                >
                  Work Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-text-primary transition-colors"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-text-primary"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-brand-600 hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-text-primary pr-10 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded focus-visible:ring-2 focus-visible:ring-brand-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Visually Dominant Sign-In Button */}
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white font-semibold rounded-lg text-xs shadow-sm hover:shadow transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {/* Clear Separation: Demo Personas (Gated by isDemoAuthEnabled) */}
            {isDemoAuthEnabled && (
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-brand-600" aria-hidden="true" />
                    <span className="text-xs font-bold text-text-primary">
                      Simulated Demo Roles
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium border border-slate-200">
                    Client-side Demo
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary mb-3 leading-relaxed">
                  Select a simulated persona to evaluate role-specific navigation, permissions, and triage workflows without credentials:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEMO_USERS.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleDemoLogin(u.role)}
                      className="p-2.5 text-left border border-border hover:border-brand-400 hover:bg-indigo-50/40 rounded-lg text-xs transition-all group focus-visible:ring-2 focus-visible:ring-brand-500 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-text-primary capitalize flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3 text-brand-600 opacity-80" aria-hidden="true" />
                          {u.role === 'manager' ? 'Manager / Analyst' : u.role === 'agent' ? 'Support Agent' : u.role}
                        </span>
                        <span className="text-[10px] text-brand-600 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">→</span>
                      </div>
                      <p className="text-[11px] text-text-secondary truncate mt-1">{u.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{u.title}</p>
                    </button>
                  ))}
                </div>

                <p className="text-center text-[11px] text-text-secondary mt-6">
                  Synthetic benchmark data environment. Selecting a demo persona does not authenticate a production user.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Link */}
        <div className="text-center lg:text-left text-xs text-text-secondary mt-8 pt-4 border-t border-slate-100">
          <Link
            to="/"
            className="text-brand-600 hover:underline font-medium inline-flex items-center gap-1"
          >
            ← Return to Landing Page
          </Link>
        </div>
      </div>

      {/* Right Column: Architectural Telemetry Overview */}
      <div className="w-full lg:w-1/2 bg-slate-950 text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative border-l border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold font-mono">
              IT Support Analytics
            </span>
          </div>
          <span className="text-[10px] text-slate-300 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded font-mono">
            Benchmark v1.0 · Seed 42
          </span>
        </div>

        <div className="my-auto max-w-lg py-8 sm:py-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Decision Intelligence for IT Support Operations
          </h2>
          <p className="text-indigo-200 text-xs sm:text-sm mt-3 leading-relaxed">
            Monitor resolution velocity, audit calendar-hour SLA compliance, discover recurring incident patterns, and predict service bottlenecks.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-xs text-indigo-100">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>8,000 calendar-hour synthetic ticket records</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-indigo-100">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Snowflake relational schema & governed metric ledger</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-indigo-100">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Live Supabase hydration with governed offline fallback</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Enterprise Service Performance</span>
          <span className="font-mono text-[11px]">Governed Analytics</span>
        </div>
      </div>
    </div>
  );
};
