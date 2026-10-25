import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { DashboardSkeleton } from '../common/Skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * RouteLoadingSkeleton
 * Displayed while session restoration is resolving from Supabase or localStorage.
 * Prevents flashing protected content or premature redirects.
 */
const RouteLoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <div className="h-14 sm:h-16 bg-surface border-b border-border px-4 flex items-center justify-between">
      <div className="h-6 w-36 bg-slate-200 animate-pulse rounded" />
      <div className="flex items-center gap-3">
        <div className="h-8 w-24 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-8 w-8 bg-slate-200 animate-pulse rounded-full" />
      </div>
    </div>
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
      <div className="mb-4">
        <div className="h-4 w-48 bg-slate-200 animate-pulse rounded mb-2" />
        <div className="h-3 w-72 bg-slate-100 animate-pulse rounded" />
      </div>
      <DashboardSkeleton pageTitle="Session" />
    </div>
  </div>
);

/**
 * ProtectedRoute
 *
 * Enforces client-side route authorization:
 * 1. Suspends rendering until session restoration resolves (prevents flashing).
 * 2. Redirects unauthenticated requests to /login, preserving target URL in location.state.from.
 * 3. Enforces role-based permissions against allowedRoles, redirecting to /403 on denial.
 * 4. Prevents redirect loops by sanitizing preserved destinations.
 *
 * GOVERNANCE NOTICE:
 * Client-side route guards are for navigation flow control only.
 * They DO NOT constitute a security boundary. Production access control
 * is governed by PostgreSQL Row Level Security (RLS) policies.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. While session restoration is active, show loading skeleton
  if (isLoading) {
    return <RouteLoadingSkeleton />;
  }

  // 2. Unauthenticated user: redirect to /login with target return path
  if (!isAuthenticated || !user) {
    const isUnsafe = ['/login', '/verify', '/403', '/404'].includes(location.pathname);
    const returnUrl = isUnsafe ? undefined : location.pathname + location.search;
    return <Navigate to="/login" state={{ from: returnUrl }} replace />;
  }

  // 3. Role authorization check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/403"
        state={{
          from: location.pathname + location.search,
          attemptedRole: user.role,
          requiredRoles: allowedRoles
        }}
        replace
      />
    );
  }

  // 4. Authorized: render child components
  return <>{children}</>;
};

export default ProtectedRoute;
