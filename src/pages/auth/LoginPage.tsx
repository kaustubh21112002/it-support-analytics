import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { DEMO_USERS } from '../../services/demoUsers';
import { Headphones, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, selectDemoUser } = useAuth();
  const [email, setEmail] = useState('priya.sharma@company.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your work email.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate('/verify');
    } else {
      setError(res.error || 'Authentication failed.');
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    selectDemoUser(role);
    navigate('/verify');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface">
      {/* Left Column: Form */}
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
              Welcome Back
            </h1>
            <p className="text-sm text-text-secondary mt-1.5 mb-8">
              Sign in to access your IT service intelligence workspace
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Email address
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

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-text-primary pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
                  <input type="checkbox" defaultChecked className="rounded border-border text-brand-600 focus:ring-brand-500" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-brand-600 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm hover:shadow transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : 'Sign In'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Demo Sign In Section */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-text-primary">
                  Or continue with demo account:
                </span>
                <span className="text-[10px] bg-indigo-50 text-brand-700 px-2 py-0.5 rounded font-medium">
                  One-Click Pass
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleDemoLogin(u.role)}
                    className="p-2.5 text-left border border-border hover:border-brand-400 hover:bg-indigo-50/40 rounded-lg text-xs transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary capitalize">{u.role}</span>
                      <span className="text-[10px] text-brand-600 group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
                    <p className="text-[10px] text-text-secondary truncate mt-0.5">{u.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-[11px] text-text-secondary mt-8">
              This is a demo environment with synthetic data. No actual external credentials are transmitted.
            </p>
          </div>
        </div>

        <div className="text-center lg:text-left text-xs text-text-secondary mt-8">
          <Link to="/" className="text-brand-600 hover:underline font-medium">
            ← Return to Landing Page
          </Link>
        </div>
      </div>

      {/* Right Column: Architectural Telemetry Overview */}
      <div className="w-full lg:w-1/2 bg-slate-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative border-l border-slate-800">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-400" />
            <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold font-mono">
              IT Support Analytics
            </span>
          </div>
          <span className="text-[10px] text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded font-mono">
            Dataset v1.0 · Seed 42
          </span>
        </div>

        <div className="relative z-10 my-auto max-w-lg py-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Service Intelligence for a Smarter Tomorrow
          </h2>
          <p className="text-indigo-200 text-sm mt-4 leading-relaxed">
            Monitor resolution times, audit SLA breaches, discover recurring incident root trends, and forecast service bottlenecks.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-xs text-indigo-100">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>8,000 calendar-hour benchmark records</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-indigo-100">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full Snowflake relational model & SQL DDL</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-indigo-100">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Transparent simulated regression estimators</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-indigo-700/50 flex items-center justify-between text-xs text-indigo-300">
          <span>IT Support Analytics Platform</span>
          <span>MBA Analytics Final</span>
        </div>
      </div>
    </div>
  );
};
