import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDefaultRouteForRole, canAccessRoute } from '../../config/permissions';
import { Headphones, Shield, ArrowRight, RotateCw, CheckCircle2 } from 'lucide-react';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingUser, verifyOtp, isDemoAuthEnabled } = useAuth();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(28);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Extract and sanitize destination to prevent redirect loops
  const rawFrom = (location.state as any)?.from;
  const isSafeFrom =
    rawFrom &&
    typeof rawFrom === 'string' &&
    !['/login', '/verify', '/403', '/404'].includes(rawFrom.split('?')[0]);
  const safeReturn = isSafeFrom ? rawFrom : null;

  useEffect(() => {
    if (!isDemoAuthEnabled) {
      navigate('/login', { replace: true });
      return;
    }

    // Focus first input on mount
    inputRefs.current[0]?.focus();

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isDemoAuthEnabled, navigate]);

  const handleChange = (index: number, value: string) => {
    // Handle single character or paste
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((char, idx) => {
        if (index + idx < 6) newDigits[index + idx] = char;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(5, index + pasted.length);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const cleanChar = value.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    setDigits(newDigits);

    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    setError('');
    const res = await verifyOtp(code);
    setLoading(false);

    if (res.success) {
      // Determine destination: prioritize safe return target if authorized for role, else default
      const role = res.user?.role || pendingUser?.role || 'employee';
      const destination =
        safeReturn && canAccessRoute(safeReturn, role).allowed
          ? safeReturn
          : getDefaultRouteForRole(role);
      navigate(destination, { replace: true });
    } else {
      setError(res.error || 'Invalid code.');
    }
  };

  const fillDemoCode = () => {
    const demoCode = ['1', '2', '3', '4', '5', '6'];
    setDigits(demoCode);
    handleVerify('123456');
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
              Demo Persona Verification
            </h1>
            <p className="text-sm text-text-secondary mt-1.5 mb-2">
              Enter the simulated verification code for demo persona:
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-text-primary bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                {pendingUser?.email || 'demo@company.com'} ({pendingUser?.role || 'employee'} role)
              </span>
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                Simulated Persona
              </span>
            </div>

            <div className="mb-6 p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-800 flex items-start gap-2">
              <Shield className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="leading-relaxed text-[11px]">
                <strong>Governance Notice:</strong> This deterministic verification step (test code: <code className="font-mono font-bold bg-indigo-100 px-1 py-0.5 rounded text-brand-700">123456</code>) validates navigation for simulated demo personas only. It does not authenticate or grant privileges to a production Supabase account.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* 6 Digit Inputs */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-6">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold border-2 border-border rounded-xl focus:border-brand-600 focus:outline-none bg-slate-50 focus:bg-white text-text-primary transition-all shadow-sm"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-text-secondary mb-6">
              <span>
                {countdown > 0 ? (
                  `Resend code in 00:${String(countdown).padStart(2, '0')}`
                ) : (
                  <button
                    onClick={() => setCountdown(30)}
                    className="text-brand-600 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" /> Resend code now
                  </button>
                )}
              </span>
              <button
                type="button"
                onClick={fillDemoCode}
                className="text-brand-600 font-semibold hover:underline bg-indigo-50 px-2 py-0.5 rounded text-[11px]"
              >
                Use demo code: 123456
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="text-center lg:text-left text-xs text-text-secondary mt-8">
          <Link to="/login" className="text-brand-600 hover:underline font-medium">
            ← Back to login
          </Link>
        </div>
      </div>

      {/* Right Column: Graphic matching mockup screen 3 */}
      <div className="w-full lg:w-1/2 bg-slate-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between items-center text-center relative border-l border-slate-800">
        <div className="w-full flex justify-end">
          <span className="text-[10px] text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded font-mono">
            Simulated 2FA Sandbox
          </span>
        </div>

        <div className="my-auto max-w-sm space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto text-indigo-300 shadow-xl">
            <Shield className="w-10 h-10 text-brand-300" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Your Security Matters</h2>
          <p className="text-xs text-indigo-200 leading-relaxed">
            We use multi-factor authentication to ensure governed access control across employee and administrative environments.
          </p>

          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>Deterministic Demo Code: 123456</span>
          </div>
        </div>

        <div className="text-xs text-indigo-300">
          IT Support Analytics · Identity Governance
        </div>
      </div>
    </div>
  );
};
