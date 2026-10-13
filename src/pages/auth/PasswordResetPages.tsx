import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headphones, Mail, CheckCircle2, ArrowRight, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('demo@company.com');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
              Forgot Password
            </h1>
            <p className="text-sm text-text-secondary mt-1.5 mb-8">
              Enter your email address and we'll simulate sending you a password reset link.
            </p>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Reset Instructions Dispatched</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  In a production system, a cryptographic reset token would be delivered to <strong>{email}</strong>. For this demonstration, you can simulate setting a new password directly:
                </p>
                <div className="pt-2">
                  <Link
                    to="/reset-password"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    <span>Proceed to Simulated Reset</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
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

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                >
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center lg:text-left text-xs text-text-secondary mt-8">
          <Link to="/login" className="text-brand-600 hover:underline font-medium inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
          </Link>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 bg-slate-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between items-center text-center relative border-l border-slate-800">
        <div className="w-full flex justify-end">
          <span className="text-[10px] text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded font-mono">
            Self-Service Recovery
          </span>
        </div>

        <div className="my-auto max-w-sm space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto text-indigo-300 shadow-xl">
            <Mail className="w-10 h-10 text-brand-300" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight">We'll help you get back</h2>
          <p className="text-xs text-indigo-200 leading-relaxed">
            A secure reset link will be simulated for your corporate account without exposing credentials.
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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-surface rounded-2xl border border-border shadow-modal max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Reset Password</h1>
        <p className="text-xs text-text-secondary mt-1 mb-6">
          Set a new strong password for your demo account.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-emerald-900 text-sm">Password Updated Successfully</h4>
            <p className="text-xs text-emerald-700">Redirecting to sign-in page...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
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
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
            >
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const ForbiddenPage: React.FC = () => {
  const { switchRole } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-surface rounded-2xl border border-border shadow-modal max-w-md w-full p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">403 — Access Denied</h1>
        <p className="text-xs text-text-secondary leading-relaxed">
          Your current simulated role lacks permission to access this analytical resource. In production, authorization policies are enforced by the API gateway.
        </p>

        <div className="pt-2 space-y-2">
          <button
            onClick={() => {
              switchRole('admin');
              navigate('/admin');
            }}
            className="w-full py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold"
          >
            Switch to Administrator Persona
          </button>
          <button
            onClick={() => navigate('/portal')}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-text-primary rounded-lg text-xs font-medium"
          >
            Return to Employee Portal
          </button>
        </div>
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
