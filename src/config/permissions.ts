/**
 * STRATOS Centralized Permission Matrix & Route Authorization Configuration
 *
 * GOVERNANCE NOTICE:
 * Client-side route guards and action checks govern UI presentation, navigation,
 * and user experience ONLY. They DO NOT constitute a security boundary.
 * Production authorization MUST be enforced server-side by PostgreSQL Row Level
 * Security (RLS) policies, database triggers, and API Gateway token validation.
 */

import { UserRole } from '../types';

export type RouteCategory = 'public' | 'employee' | 'agent' | 'analytics' | 'admin' | 'shared';

export interface RoutePermission {
  path: string;
  category: RouteCategory;
  allowedRoles?: UserRole[];
  description: string;
}

export type ActionKey =
  | 'ticket:create'
  | 'ticket:view_queue'
  | 'ticket:triage_update'
  | 'ticket:assign_agent'
  | 'analytics:view'
  | 'analytics:export'
  | 'admin:overview'
  | 'admin:workbench'
  | 'admin:data_upload'
  | 'admin:configure_sla'
  | 'admin:manage_users'
  | 'admin:security_settings';

export interface ActionPermission {
  key: ActionKey;
  allowedRoles: UserRole[];
  description: string;
  requiresRemoteAuth?: boolean;
}

/**
 * 1. Auditable Page-Level Route Permissions Matrix
 */
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Public Routes (Accessible without authentication)
  { path: '/', category: 'public', description: 'Platform Public Landing Page' },
  { path: '/request-access', category: 'public', description: 'Employee & Stakeholder Access Request Form' },
  { path: '/login', category: 'public', description: 'Authentication & Demo Role Selection' },
  { path: '/verify', category: 'public', description: 'Two-Factor / Demo OTP Verification' },
  { path: '/forgot-password', category: 'public', description: 'Password Recovery Flow' },
  { path: '/reset-password', category: 'public', description: 'Password Reset Flow' },
  { path: '/403', category: 'public', description: 'Access Denied / Forbidden Screen' },
  { path: '/404', category: 'public', description: 'Resource Not Found Screen' },

  // Shared Authenticated Routes (Any valid user session or demo persona)
  { path: '/notifications', category: 'shared', allowedRoles: ['employee', 'agent', 'manager', 'admin'], description: 'Activity & Alert Notifications' },
  { path: '/profile', category: 'shared', allowedRoles: ['employee', 'agent', 'manager', 'admin'], description: 'Account Profile & Preferences' },

  // Employee Self-Service Portal
  { path: '/portal', category: 'employee', allowedRoles: ['employee', 'manager', 'admin'], description: 'Employee Portal Home' },
  { path: '/portal/tickets', category: 'employee', allowedRoles: ['employee', 'agent', 'manager', 'admin'], description: 'My Submitted Tickets' },
  { path: '/portal/tickets/new', category: 'employee', allowedRoles: ['employee', 'agent', 'manager', 'admin'], description: 'Create New Support Request' },
  { path: '/portal/tickets/:id', category: 'employee', allowedRoles: ['employee', 'agent', 'manager', 'admin'], description: 'Employee Ticket Details' },
  { path: '/portal/assistant', category: 'employee', allowedRoles: ['employee', 'agent', 'manager', 'admin'], description: 'AI Support Assistant' },
  { path: '/portal/knowledge', category: 'employee', allowedRoles: ['employee', 'agent', 'manager', 'admin'], description: 'Knowledge Base & Runbooks' },

  // Support Agent Workspace
  { path: '/agent', category: 'agent', allowedRoles: ['agent', 'manager', 'admin'], description: 'Support Agent Dashboard' },
  { path: '/agent/tickets', category: 'agent', allowedRoles: ['agent', 'manager', 'admin'], description: 'Operational Ticket Queue' },
  { path: '/agent/tickets/:id', category: 'agent', allowedRoles: ['agent', 'manager', 'admin'], description: 'Agent Ticket Triage & Resolution' },
  { path: '/tickets/:id', category: 'agent', allowedRoles: ['agent', 'manager', 'admin'], description: 'Ticket Detail Route Alias' },
  { path: '/agent/workload', category: 'agent', allowedRoles: ['agent', 'manager', 'admin'], description: 'Team Workload Distribution' },

  // Management Analytics (Service Intelligence)
  { path: '/analytics/overview', category: 'analytics', allowedRoles: ['manager', 'admin'], description: 'Executive Service Overview' },
  { path: '/analytics/executive', category: 'analytics', allowedRoles: ['manager', 'admin'], description: 'Executive Dashboard Alias' },
  { path: '/analytics/trends', category: 'analytics', allowedRoles: ['manager', 'admin'], description: 'Ticket Volume & Intake Trends' },
  { path: '/analytics/resolution', category: 'analytics', allowedRoles: ['manager', 'admin'], description: 'Resolution Time Performance' },
  { path: '/analytics/sla', category: 'analytics', allowedRoles: ['manager', 'admin'], description: 'SLA Command Center & Breaches' },
  { path: '/analytics/teams', category: 'analytics', allowedRoles: ['manager', 'admin'], description: 'Support Team Performance' },
  { path: '/analytics/departments', category: 'analytics', allowedRoles: ['manager', 'admin'], description: 'Department Demand Analytics' },
  { path: '/analytics/issues', category: 'analytics', allowedRoles: ['manager', 'admin'], description: 'Recurring Incident Root Causes' },
  { path: '/analytics/predictions', category: 'analytics', allowedRoles: ['manager', 'admin'], description: 'ML Turnaround Predictions' },
  { path: '/analytics/reports', category: 'analytics', allowedRoles: ['manager', 'admin'], description: 'BI Exports & Audit Reports' },

  // Administration & Governance
  { path: '/admin', category: 'admin', allowedRoles: ['admin', 'manager'], description: 'Administration & Governance Overview' },
  { path: '/admin/data', category: 'admin', allowedRoles: ['admin', 'manager'], description: 'Data Workbench & Relational QA' },
  { path: '/admin/upload', category: 'admin', allowedRoles: ['admin'], description: 'Dataset Ingestion & Batch Upload' },
  { path: '/admin/sla', category: 'admin', allowedRoles: ['admin'], description: 'SLA Threshold Policy Configuration' },
  { path: '/admin/users', category: 'admin', allowedRoles: ['admin'], description: 'User & Role Management' },
  { path: '/admin/access-requests', category: 'admin', allowedRoles: ['admin'], description: 'Access Request Queue & Administrator Review' },
  { path: '/admin/security', category: 'admin', allowedRoles: ['admin'], description: 'Security Settings & MFA' }
];

/**
 * 2. Auditable Action-Level Permissions Matrix
 */
export const ACTION_PERMISSIONS: Record<ActionKey, ActionPermission> = {
  'ticket:create': {
    key: 'ticket:create',
    allowedRoles: ['employee', 'agent', 'manager', 'admin'],
    description: 'Submit new support incident or request'
  },
  'ticket:view_queue': {
    key: 'ticket:view_queue',
    allowedRoles: ['agent', 'manager', 'admin'],
    description: 'View unassigned or departmental triage queues'
  },
  'ticket:triage_update': {
    key: 'ticket:triage_update',
    allowedRoles: ['agent', 'manager', 'admin'],
    description: 'Update status, priority, or internal notes for a ticket',
    requiresRemoteAuth: true
  },
  'ticket:assign_agent': {
    key: 'ticket:assign_agent',
    allowedRoles: ['agent', 'manager', 'admin'],
    description: 'Reassign or unassign ticket support personnel'
  },
  'analytics:view': {
    key: 'analytics:view',
    allowedRoles: ['manager', 'admin'],
    description: 'Access executive BI dashboards and SLA reports'
  },
  'analytics:export': {
    key: 'analytics:export',
    allowedRoles: ['manager', 'admin'],
    description: 'Export raw ticket extracts and compliance spreadsheets'
  },
  'admin:overview': {
    key: 'admin:overview',
    allowedRoles: ['admin', 'manager'],
    description: 'View administrative metrics and audit logs'
  },
  'admin:workbench': {
    key: 'admin:workbench',
    allowedRoles: ['admin', 'manager'],
    description: 'Inspect Snowflake schema definitions and relational QA'
  },
  'admin:data_upload': {
    key: 'admin:data_upload',
    allowedRoles: ['admin'],
    description: 'Stage CSV batches and trigger dataset normalizations'
  },
  'admin:configure_sla': {
    key: 'admin:configure_sla',
    allowedRoles: ['admin'],
    description: 'Modify calendar-hour SLA target thresholds'
  },
  'admin:manage_users': {
    key: 'admin:manage_users',
    allowedRoles: ['admin'],
    description: 'Modify user role assignments'
  },
  'admin:security_settings': {
    key: 'admin:security_settings',
    allowedRoles: ['admin'],
    description: 'Configure security hardening and MFA policies'
  }
};

/**
 * Normalizes dynamic path parameters (e.g. /portal/tickets/TKT-00042 -> /portal/tickets/:id)
 * Strips query strings (?) and hash fragments (#) for exact matching.
 */
export function matchRoutePattern(pathname: string): RoutePermission | undefined {
  if (!pathname || typeof pathname !== 'string') return undefined;
  const cleanPath = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';

  // Exact match first
  const exact = ROUTE_PERMISSIONS.find((r) => r.path === cleanPath);
  if (exact) return exact;

  // Pattern matching for parameterized paths
  if (/^\/portal\/tickets\/[^/]+$/.test(cleanPath)) {
    return ROUTE_PERMISSIONS.find((r) => r.path === '/portal/tickets/:id');
  }
  if (/^\/agent\/tickets\/[^/]+$/.test(cleanPath)) {
    return ROUTE_PERMISSIONS.find((r) => r.path === '/agent/tickets/:id');
  }
  if (/^\/tickets\/[^/]+$/.test(cleanPath)) {
    return ROUTE_PERMISSIONS.find((r) => r.path === '/tickets/:id');
  }

  return undefined;
}

/**
 * Evaluates whether a role is authorized for a specific route.
 */
export function canAccessRoute(pathname: string, role: UserRole | undefined): {
  allowed: boolean;
  isPublic: boolean;
  requiredRoles?: UserRole[];
  reason?: string;
} {
  const perm = matchRoutePattern(pathname);

  // If path is not registered in matrix, fallback to public or 404
  if (!perm) {
    return { allowed: true, isPublic: true };
  }

  if (perm.category === 'public') {
    return { allowed: true, isPublic: true };
  }

  if (!role) {
    return {
      allowed: false,
      isPublic: false,
      requiredRoles: perm.allowedRoles,
      reason: 'Authentication required to access this resource.'
    };
  }

  if (!perm.allowedRoles || perm.allowedRoles.includes(role)) {
    return { allowed: true, isPublic: false, requiredRoles: perm.allowedRoles };
  }

  return {
    allowed: false,
    isPublic: false,
    requiredRoles: perm.allowedRoles,
    reason: `Role '${role}' is not authorized to access ${perm.description}.`
  };
}

/**
 * Evaluates action-level capability for a given role.
 */
export function canPerformAction(actionKey: ActionKey, role: UserRole | undefined): {
  allowed: boolean;
  reason?: string;
} {
  const act = ACTION_PERMISSIONS[actionKey];
  if (!act) {
    return { allowed: false, reason: `Unknown action '${actionKey}'.` };
  }

  if (!role) {
    return { allowed: false, reason: 'Authentication required.' };
  }

  if (!act.allowedRoles.includes(role)) {
    return {
      allowed: false,
      reason: `Action '${act.description}' requires one of: ${act.allowedRoles.join(', ')}.`
    };
  }

  return { allowed: true };
}

/**
 * Returns canonical home/landing route for a given role.
 */
export function getDefaultRouteForRole(role: UserRole | undefined): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'manager':
      return '/analytics/overview';
    case 'agent':
      return '/agent';
    case 'employee':
    default:
      return '/portal';
  }
}

/**
 * Evaluates whether simulated demo authentication is enabled for the current runtime.
 *
 * GOVERNANCE RULES:
 * - Local development: Enabled by default unless explicitly disabled (VITE_ENABLE_DEMO_AUTH !== 'false').
 * - Production builds: Disabled by default. Enabled ONLY when explicitly configured (VITE_ENABLE_DEMO_AUTH === 'true').
 * - Supports an optional envOverride parameter for deterministic offline unit testing.
 */
export function isDemoAuthEnabled(envOverride?: {
  enableDemoAuth?: string | boolean;
  isProd?: boolean;
}): boolean {
  if (envOverride) {
    if (typeof envOverride.enableDemoAuth === 'boolean') {
      return envOverride.enableDemoAuth;
    }
    const envVal = typeof envOverride.enableDemoAuth === 'string'
      ? envOverride.enableDemoAuth.trim().toLowerCase()
      : undefined;
    const isProd = envOverride.isProd ?? false;

    if (isProd) {
      return envVal === 'true' || envVal === '1';
    }
    return envVal !== 'false' && envVal !== '0' && envVal !== 'off';
  }

  // Runtime environment detection
  let envVal: string | undefined;
  try {
    const proc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
    const raw = typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_ENABLE_DEMO_AUTH
      : proc?.env?.VITE_ENABLE_DEMO_AUTH;
    envVal = typeof raw === 'string' ? raw.trim().toLowerCase() : undefined;
  } catch {
    envVal = undefined;
  }

  const proc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
  const isProd = Boolean(
    (typeof import.meta !== 'undefined' && (import.meta.env?.PROD || import.meta.env?.MODE === 'production')) ||
    (proc?.env?.NODE_ENV === 'production')
  );

  if (isProd) {
    return envVal === 'true' || envVal === '1';
  }

  // Local development defaults to enabled unless explicitly set to false/0/off
  return envVal !== 'false' && envVal !== '0' && envVal !== 'off';
}

