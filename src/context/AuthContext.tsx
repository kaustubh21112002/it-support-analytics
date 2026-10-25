import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { DEMO_USERS } from '../services/demoUsers';
import { supabase, isSupabaseAvailable } from '../lib/supabase';
import { dataService } from '../services/dataService';
import { isDemoAuthEnabled } from '../config/permissions';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

export type AuthMode = 'unauthenticated' | 'demo' | 'supabase';
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'demo' | 'error';

export interface LoginResult {
  success: boolean;
  requiresOtp?: boolean;
  error?: string;
  user?: User;
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
  user?: User;
}

export interface ResetPasswordResult {
  success: boolean;
  isDemo?: boolean;
  error?: string;
}

export interface UpdatePasswordResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  pendingUser: User | null;
  isAuthenticated: boolean;
  /**
   * Explicit governance indicator: client-side demo authentication is active.
   * Demo roles are presentational and do NOT constitute a server-enforced security boundary.
   */
  isDemoAuth: boolean;
  /**
   * Configuration flag: whether demo authentication and simulated personas are permitted in this environment.
   */
  isDemoAuthEnabled: boolean;
  authMode: AuthMode;
  authStatus: AuthStatus;
  isLoading: boolean;
  error: string | null;
  supabaseUser: SupabaseAuthUser | null;
  login: (email: string, password?: string) => Promise<LoginResult>;
  selectDemoUser: (role: UserRole) => void;
  verifyOtp: (code: string) => Promise<VerifyOtpResult>;
  resetPassword: (email: string) => Promise<ResetPasswordResult>;
  updatePassword: (password: string) => Promise<UpdatePasswordResult>;
  switchRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to map Supabase Auth User to application User model
// CRITICAL SECURITY INVARIANT:
// Role is extracted STRICTLY from trusted, server-controlled `app_metadata.role`.
// Client-editable `user_metadata` (raw_user_meta_data) is explicitly EXCLUDED
// to prevent client role self-escalation via `supabase.auth.updateUser()`.
// Any missing, unknown, or malformed role safely defaults to 'employee'.
export const mapSupabaseUser = (sbUser: SupabaseAuthUser): User => {
  const rawRole = typeof sbUser.app_metadata?.role === 'string'
    ? sbUser.app_metadata.role.trim().toLowerCase()
    : '';

  const validRoles: UserRole[] = ['employee', 'agent', 'manager', 'admin'];
  const role: UserRole = (validRoles as string[]).includes(rawRole)
    ? (rawRole as UserRole)
    : 'employee';

  return {
    id: sbUser.id,
    name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Authenticated User',
    email: sbUser.email || '',
    role,
    departmentId: Number(sbUser.user_metadata?.department_id) || 1,
    departmentName: sbUser.user_metadata?.department_name || 'Corporate IT',
    title: sbUser.user_metadata?.title || 'Team Member',
    agentId: sbUser.user_metadata?.agent_id ? Number(sbUser.user_metadata.agent_id) : undefined
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseAuthUser | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('unauthenticated');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef<boolean>(true);

  const demoEnabled = isDemoAuthEnabled();

  // 1. Session Restoration on Mount
  useEffect(() => {
    mountedRef.current = true;

    async function restoreSession() {
      setIsLoading(true);

      // Priority 1: Check for real Supabase Auth session
      if (isSupabaseAvailable && supabase) {
        try {
          const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
          if (sessionErr) {
            console.warn('[AuthContext] Supabase session retrieval warning:', sessionErr.message);
          } else if (sessionData?.session?.user && mountedRef.current) {
            const mapped = mapSupabaseUser(sessionData.session.user);
            setUser(mapped);
            setSupabaseUser(sessionData.session.user);
            setAuthMode('supabase');
            setIsLoading(false);
            // Trigger operational ticket hydration for verified Supabase session
            dataService.hydrateFromSupabase().catch(err => {
              console.warn('[AuthContext] Session hydration error:', err);
            });
            return;
          }
        } catch (err) {
          console.warn('[AuthContext] Session retrieval failed:', err);
        }
      }

      // Priority 2: Check for explicit saved demo persona in localStorage (gated by demo-auth enablement)
      if (demoEnabled) {
        const savedDemo = localStorage.getItem('itsupport_demo_user');
        if (savedDemo) {
          try {
            const parsed = JSON.parse(savedDemo);
            if (parsed && parsed.role && mountedRef.current) {
              setUser(parsed);
              setAuthMode('demo');
              setIsLoading(false);
              return;
            }
          } catch {
            localStorage.removeItem('itsupport_demo_user');
          }
        }
      } else {
        localStorage.removeItem('itsupport_demo_user');
      }

      // Priority 3: Unauthenticated state
      if (mountedRef.current) {
        setUser(null);
        setAuthMode('unauthenticated');
        setIsLoading(false);
      }
    }

    restoreSession();

    // Priority 4: Supabase Auth state listener with clean unsubscribe
    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseAvailable && supabase) {
      try {
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (!mountedRef.current) return;

          if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session?.user) {
            const mapped = mapSupabaseUser(session.user);
            setUser(mapped);
            setSupabaseUser(session.user);
            setAuthMode('supabase');
            localStorage.removeItem('itsupport_demo_user');
            // Trigger operational ticket hydration for verified sign-in
            dataService.hydrateFromSupabase().catch(err => {
              console.warn('[AuthContext] Sign-in hydration error:', err);
            });
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setSupabaseUser(null);
            setAuthMode('unauthenticated');
            localStorage.removeItem('itsupport_demo_user');
            dataService.cancelHydration('User signed out');
            dataService.resetToSeededDemo();
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            setSupabaseUser(session.user);
          }
        });
        subscription = authListener.subscription;
      } catch (err) {
        console.warn('[AuthContext] Failed to bind auth state change listener:', err);
      }
    }

    return () => {
      mountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, [demoEnabled]);

  const selectDemoUser = (role: UserRole) => {
    if (!demoEnabled) {
      console.warn('[AuthContext] Demo authentication is disabled in this environment.');
      return;
    }
    const matched = DEMO_USERS.find((u) => u.role === role) || DEMO_USERS[0];
    setPendingUser(matched);
    setError(null);
  };

  const login = async (email: string, password?: string): Promise<LoginResult> => {
    setError(null);
    const cleanEmail = email.trim();

    // Check if the email matches a seeded demo persona
    const matchedDemo = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === cleanEmail.toLowerCase()
    );

    // Case 1: Real Supabase Auth sign-in
    // If Supabase is available, password is provided, and either not a demo account or demo is disabled
    if (isSupabaseAvailable && supabase && password && (!matchedDemo || !demoEnabled)) {
      try {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (sbError) {
          setError(sbError.message);
          return { success: false, error: sbError.message };
        }

        if (data?.user) {
          const mapped = mapSupabaseUser(data.user);
          setUser(mapped);
          setSupabaseUser(data.user);
          setAuthMode('supabase');
          localStorage.removeItem('itsupport_demo_user');
          return { success: true, requiresOtp: false, user: mapped };
        }
      } catch (err: any) {
        const msg = err?.message || 'Authentication failed. Please verify credentials.';
        setError(msg);
        return { success: false, error: msg };
      }
    }

    // Guard: Demo auth disabled
    if (!demoEnabled) {
      const err = !password
        ? 'Password is required to sign in. Demo authentication is disabled in this environment.'
        : 'Authentication failed. Please verify credentials.';
      setError(err);
      return { success: false, error: err };
    }

    // Guard: Non-demo corporate email requires password when Supabase is available in demo-enabled environments
    if (!matchedDemo && !password && isSupabaseAvailable) {
      const err = 'Password is required to sign in with a verified corporate account. For evaluation without credentials, choose a demo persona below.';
      setError(err);
      return { success: false, error: err };
    }

    // Case 2: Demo persona simulation (only when demoEnabled)
    const demoUser = matchedDemo || {
      id: `usr-demo-${Date.now()}`,
      name: cleanEmail.split('@')[0] || 'Demo User',
      email: cleanEmail,
      role: 'employee' as UserRole,
      departmentId: 1,
      departmentName: 'Corporate IT',
      title: 'Business User (Simulated Demo)'
    };

    setPendingUser(demoUser);
    return { success: true, requiresOtp: true, user: demoUser };
  };

  const verifyOtp = async (code: string): Promise<VerifyOtpResult> => {
    setError(null);

    if (!demoEnabled) {
      const err = 'Demo verification is disabled in this environment.';
      setError(err);
      return { success: false, error: err };
    }

    // Governed deterministic demo code: 123456
    if (code === '123456') {
      if (pendingUser) {
        const confirmed = pendingUser;
        setUser(confirmed);
        setAuthMode('demo');
        setPendingUser(null);
        localStorage.setItem('itsupport_demo_user', JSON.stringify(confirmed));
        return { success: true, user: confirmed };
      }
      return { success: false, error: 'No authentication session found. Please sign in again.' };
    }
    return { success: false, error: 'Invalid verification code. Please enter 123456 for the demo environment.' };
  };

  const resetPassword = async (email: string): Promise<ResetPasswordResult> => {
    setError(null);
    const cleanEmail = email.trim();

    // Check if user is asking for a demo account
    const matchedDemo = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === cleanEmail.toLowerCase()
    );

    if (matchedDemo) {
      return {
        success: false,
        isDemo: true,
        error: 'Demo personas are synthetic test profiles and do not receive external email. For evaluation, use the standard demo sign-in with test code 123456.'
      };
    }

    if (!isSupabaseAvailable || !supabase) {
      return {
        success: false,
        error: 'Supabase authentication service is currently unconfigured or offline. Password recovery cannot be processed.'
      };
    }

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (resetErr) {
        setError(resetErr.message);
        return { success: false, error: resetErr.message };
      }

      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Password recovery request failed.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const updatePassword = async (newPassword: string): Promise<UpdatePasswordResult> => {
    setError(null);

    if (!isSupabaseAvailable || !supabase) {
      return {
        success: false,
        error: 'Supabase authentication service is currently unconfigured or offline. Password cannot be updated.'
      };
    }

    // Verify an active recovery session exists
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return {
        success: false,
        error: 'No active password recovery session detected. In production, password reset requires opening the secure link delivered to your corporate email.'
      };
    }

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateErr) {
        setError(updateErr.message);
        return { success: false, error: updateErr.message };
      }

      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to update password.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const switchRole = (role: UserRole) => {
    // Only permitted in demo mode when demo authentication is enabled
    if (!demoEnabled) {
      console.warn('[AuthContext] Demo role switching is blocked because demo authentication is disabled.');
      return;
    }
    const matched = DEMO_USERS.find((u) => u.role === role) || {
      ...DEMO_USERS[0],
      role
    };
    setUser(matched);
    setAuthMode('demo');
    localStorage.setItem('itsupport_demo_user', JSON.stringify(matched));
  };

  const logout = async () => {
    setUser(null);
    setPendingUser(null);
    setSupabaseUser(null);
    setAuthMode('unauthenticated');
    setError(null);
    localStorage.removeItem('itsupport_demo_user');
    dataService.cancelHydration('User logged out');
    dataService.resetToSeededDemo();

    if (isSupabaseAvailable && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[AuthContext] Supabase sign out warning:', err);
      }
    }
  };

  const hasRole = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const clearError = () => setError(null);

  const authStatus: AuthStatus = isLoading
    ? 'loading'
    : error
    ? 'error'
    : authMode === 'supabase'
    ? 'authenticated'
    : authMode === 'demo'
    ? 'demo'
    : 'unauthenticated';

  return (
    <AuthContext.Provider
      value={{
        user,
        pendingUser,
        isAuthenticated: !!user,
        isDemoAuth: authMode === 'demo',
        isDemoAuthEnabled: demoEnabled,
        authMode,
        authStatus,
        isLoading,
        error,
        supabaseUser,
        login,
        selectDemoUser,
        verifyOtp,
        resetPassword,
        updatePassword,
        switchRole,
        logout,
        hasRole,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
