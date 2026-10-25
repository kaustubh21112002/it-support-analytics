/**
 * URL Filter Synchronization & Validation Utility
 *
 * Provides safe, validated parsing and serialization between application
 * filter states and browser URL search parameters (react-router-dom).
 *
 * Governing Principle: PRESERVE -> DOCUMENT -> FLAG -> GOVERN
 */

import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface FilterState {
  departmentId: string;
  priority: string;
  status: string;
  search: string;
  sla: string;
  dateRange: string;
}

export const VALID_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
export const VALID_STATUSES = [
  'Open',
  'In Progress',
  'Pending',
  'Resolved',
  'Closed',
  'Active Backlog',
  'Resolved Outcomes'
] as const;
export const VALID_SLA_STATES = ['Breached', 'Compliant', 'At Risk'] as const;
export const VALID_DATE_RANGES = [
  'FY 2024 (Full Year)',
  'Q1 2024',
  'Q2 2024',
  'Q3 2024',
  'Q4 2024'
] as const;

/**
 * Validates and normalizes department parameter.
 * Accepts numeric string '1'-'5' or 'All'. Rejects invalid/out-of-range IDs.
 */
export function parseDepartmentParam(raw: string | null | undefined): string {
  if (!raw) return 'All';
  const clean = raw.trim();
  if (clean.toLowerCase() === 'all') return 'All';
  const num = parseInt(clean, 10);
  if (!isNaN(num) && num >= 1 && num <= 5) {
    return String(num);
  }
  return 'All';
}

/**
 * Validates and normalizes priority parameter.
 * Case-insensitive input mapped to canonical PascalCase ('Critical', 'High', 'Medium', 'Low').
 */
export function parsePriorityParam(raw: string | null | undefined): string {
  if (!raw) return 'All';
  const clean = raw.trim().toLowerCase();
  if (clean === 'all') return 'All';
  const match = VALID_PRIORITIES.find(p => p.toLowerCase() === clean);
  return match || 'All';
}

/**
 * Validates and normalizes status parameter.
 * Supports aggregate definitions:
 * - 'Active Backlog' (Open + In Progress + Pending)
 * - 'Resolved Outcomes' (Resolved + Closed)
 * - Exact single stages: 'Open', 'In Progress', 'Pending', 'Resolved', 'Closed'
 */
export function parseStatusParam(raw: string | null | undefined): string {
  if (!raw) return 'All';
  const clean = raw.trim().toLowerCase();
  if (clean === 'all') return 'All';

  if (clean === 'active backlog' || clean === 'active_backlog' || clean === 'backlog' || clean === 'open backlog') {
    return 'Active Backlog';
  }
  if (clean === 'resolved outcomes' || clean === 'resolved_outcomes' || clean === 'resolved,closed' || clean === 'all resolved') {
    return 'Resolved Outcomes';
  }

  const match = VALID_STATUSES.find(s => s.toLowerCase() === clean);
  return match || 'All';
}

/**
 * Validates and normalizes SLA parameter.
 * Values: 'Breached', 'Compliant', 'At Risk'
 */
export function parseSlaParam(raw: string | null | undefined): string {
  if (!raw) return 'All';
  const clean = raw.trim().toLowerCase();
  if (clean === 'all') return 'All';

  if (clean === 'breached' || clean === 'breach' || clean === 'sla_breached') {
    return 'Breached';
  }
  if (clean === 'compliant' || clean === 'met' || clean === 'sla_compliant') {
    return 'Compliant';
  }
  if (clean === 'at risk' || clean === 'at_risk' || clean === 'atrisk') {
    return 'At Risk';
  }

  return 'All';
}

/**
 * Validates and normalizes date range parameter.
 */
export function parseDateRangeParam(raw: string | null | undefined): string {
  if (!raw) return 'FY 2024 (Full Year)';
  const clean = raw.trim();
  const match = VALID_DATE_RANGES.find(r => r.toLowerCase() === clean.toLowerCase());
  return match || 'FY 2024 (Full Year)';
}

/**
 * Sanitizes search query string. Trims and truncates to 100 characters.
 */
export function parseSearchParam(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.trim().slice(0, 100);
}

/**
 * Helper to build query parameters string while preserving unrelated existing parameters.
 */
export function buildFilterQueryString(
  filters: Partial<{
    dept: string | number;
    priority: string;
    status: string;
    sla: string;
    search: string;
    dateRange: string;
  }>,
  currentParams?: URLSearchParams
): string {
  const params = new URLSearchParams(currentParams ? currentParams.toString() : '');

  // Department
  if (filters.dept !== undefined) {
    const parsed = parseDepartmentParam(String(filters.dept));
    if (parsed !== 'All') {
      params.set('dept', parsed);
    } else {
      params.delete('dept');
      params.delete('departmentId');
    }
  }

  // Priority
  if (filters.priority !== undefined) {
    const parsed = parsePriorityParam(filters.priority);
    if (parsed !== 'All') {
      params.set('priority', parsed);
    } else {
      params.delete('priority');
    }
  }

  // Status
  if (filters.status !== undefined) {
    const parsed = parseStatusParam(filters.status);
    if (parsed !== 'All') {
      params.set('status', parsed);
    } else {
      params.delete('status');
    }
  }

  // SLA
  if (filters.sla !== undefined) {
    const parsed = parseSlaParam(filters.sla);
    if (parsed !== 'All') {
      params.set('sla', parsed);
    } else {
      params.delete('sla');
      params.delete('slaStatus');
    }
  }

  // Search
  if (filters.search !== undefined) {
    const parsed = parseSearchParam(filters.search);
    if (parsed) {
      params.set('search', parsed);
    } else {
      params.delete('search');
      params.delete('q');
    }
  }

  // Date Range
  if (filters.dateRange !== undefined) {
    const parsed = parseDateRangeParam(filters.dateRange);
    if (parsed !== 'FY 2024 (Full Year)') {
      params.set('dateRange', parsed);
    } else {
      params.delete('dateRange');
    }
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Custom React Hook: Synchronizes filter state bidirectionally with URL search parameters.
 * - Parses URL search parameters on render.
 * - Exposes validated filter getters and memoized setters.
 * - Updates the URL with { replace: true } to prevent history stack bloat.
 * - Preserves unrelated query parameters.
 */
export function useUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse and validate current query parameters
  const departmentId = useMemo(() => {
    const raw = searchParams.get('dept') || searchParams.get('departmentId');
    return parseDepartmentParam(raw);
  }, [searchParams]);

  const priority = useMemo(() => {
    return parsePriorityParam(searchParams.get('priority'));
  }, [searchParams]);

  const status = useMemo(() => {
    return parseStatusParam(searchParams.get('status'));
  }, [searchParams]);

  const sla = useMemo(() => {
    const raw = searchParams.get('sla') || searchParams.get('slaStatus');
    return parseSlaParam(raw);
  }, [searchParams]);

  const search = useMemo(() => {
    const raw = searchParams.get('search') || searchParams.get('q');
    return parseSearchParam(raw);
  }, [searchParams]);

  const dateRange = useMemo(() => {
    return parseDateRangeParam(searchParams.get('dateRange'));
  }, [searchParams]);

  // Setters that update URL search params with { replace: true }
  const setDepartmentId = useCallback((dept: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const parsed = parseDepartmentParam(dept);
      if (parsed !== 'All') {
        next.set('dept', parsed);
      } else {
        next.delete('dept');
        next.delete('departmentId');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setPriority = useCallback((prio: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const parsed = parsePriorityParam(prio);
      if (parsed !== 'All') {
        next.set('priority', parsed);
      } else {
        next.delete('priority');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setStatus = useCallback((st: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const parsed = parseStatusParam(st);
      if (parsed !== 'All') {
        next.set('status', parsed);
      } else {
        next.delete('status');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setSla = useCallback((slaVal: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const parsed = parseSlaParam(slaVal);
      if (parsed !== 'All') {
        next.set('sla', parsed);
      } else {
        next.delete('sla');
        next.delete('slaStatus');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setSearch = useCallback((query: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const parsed = parseSearchParam(query);
      if (parsed) {
        next.set('search', parsed);
      } else {
        next.delete('search');
        next.delete('q');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setDateRange = useCallback((range: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const parsed = parseDateRangeParam(range);
      if (parsed !== 'FY 2024 (Full Year)') {
        next.set('dateRange', parsed);
      } else {
        next.delete('dateRange');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const resetFilters = useCallback(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('dept');
      next.delete('departmentId');
      next.delete('priority');
      next.delete('status');
      next.delete('sla');
      next.delete('slaStatus');
      next.delete('search');
      next.delete('q');
      next.delete('dateRange');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    departmentId,
    priority,
    status,
    sla,
    search,
    dateRange,
    setDepartmentId,
    setPriority,
    setStatus,
    setSla,
    setSearch,
    setDateRange,
    resetFilters
  };
}
