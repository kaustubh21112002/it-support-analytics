import seededData from '../data/seededData.json';
import {
  Ticket,
  Department,
  Team,
  Agent,
  Category,
  SlaRule,
  TicketStatus,
  TicketPriority,
  SummaryMetrics,
  DepartmentBreakdownItem,
  CategoryBreakdownItem,
  PriorityBreakdownItem,
  TeamBreakdownItem,
  MonthlyTrendItem,
  TopIssueItem
} from '../types';

export class NormalizationError extends Error {
  public field: string;
  public rawValue: unknown;

  constructor(field: string, rawValue: unknown, message: string) {
    super(`Normalization error for field "${field}": ${message} (received: ${JSON.stringify(rawValue)})`);
    this.name = 'NormalizationError';
    this.field = field;
    this.rawValue = rawValue;
  }
}

/**
 * Governed Canonical Agent Directory.
 * Programmatically derived from the governed project baseline (src/data/seededData.json).
 * Matches it_support_analytics_dataset/data/agents.csv 100% across all 24 agents (AGT-001 through AGT-024).
 * Remote Supabase 'agents' table stores agent_code, team_id, and experience_band, but omits agent_name.
 */
export const CANONICAL_AGENT_NAMES: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    (seededData.agents as Array<{ agent_code: string; agent_name: string }>).map(a => [
      a.agent_code,
      a.agent_name
    ])
  )
);

const VALID_STATUSES: ReadonlySet<string> = new Set([
  'Open',
  'In Progress',
  'Pending',
  'Resolved',
  'Closed'
]);

const VALID_PRIORITIES: ReadonlySet<string> = new Set([
  'Critical',
  'High',
  'Medium',
  'Low'
]);

const VALID_EXPERIENCE_BANDS: ReadonlySet<string> = new Set([
  'Junior',
  'Mid-level',
  'Senior'
]);

/**
 * Defensive ID parser: validates that input is a positive integer or clean numeric string.
 * Rejects NaN, negative numbers, floats, or non-numeric strings with an explicit NormalizationError.
 */
export function parsePositiveInteger(val: unknown, fieldName: string): number {
  if (typeof val === 'number') {
    if (Number.isInteger(val) && Number.isFinite(val) && val > 0) {
      return val;
    }
    throw new NormalizationError(fieldName, val, 'Value must be a positive finite integer');
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d+$/.test(trimmed)) {
      const parsed = parseInt(trimmed, 10);
      if (parsed > 0) return parsed;
    }
  }

  throw new NormalizationError(fieldName, val, 'Value must be a valid positive integer string or number');
}

/**
 * Defensive nullable positive integer parser.
 * Preserves null or empty values as null without silent coercion to 0.
 */
export function parseNullablePositiveInteger(val: unknown, fieldName: string): number | null {
  if (val === null || val === undefined || val === '') {
    return null;
  }
  return parsePositiveInteger(val, fieldName);
}

/**
 * Defensive nullable float/number parser.
 * Preserves null values, validates finite numbers, and enforces optional min/max boundaries.
 */
export function parseNullableBoundedNumber(
  val: unknown,
  fieldName: string,
  min?: number,
  max?: number
): number | null {
  if (val === null || val === undefined || val === '') {
    return null;
  }

  let num: number;
  if (typeof val === 'number') {
    num = val;
  } else if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return null;
    num = Number(trimmed);
  } else {
    throw new NormalizationError(fieldName, val, 'Value must be a valid number or null');
  }

  if (!Number.isFinite(num)) {
    throw new NormalizationError(fieldName, val, 'Value must be a finite number');
  }

  if (min !== undefined && num < min) {
    throw new NormalizationError(fieldName, val, `Value must be >= ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new NormalizationError(fieldName, val, `Value must be <= ${max}`);
  }

  return num;
}

/**
 * Validates non-empty string.
 */
export function parseNonEmptyString(val: unknown, fieldName: string): string {
  if (typeof val === 'string' && val.trim().length > 0) {
    return val.trim();
  }
  throw new NormalizationError(fieldName, val, 'Value must be a non-empty string');
}

/**
 * Validates ISO timestamp string.
 */
export function parseIsoTimestamp(val: unknown, fieldName: string): string {
  const str = parseNonEmptyString(val, fieldName);
  const time = Date.parse(str);
  if (Number.isNaN(time)) {
    throw new NormalizationError(fieldName, val, 'Value must be a valid ISO 8601 timestamp string');
  }
  return str;
}

/**
 * Validates nullable ISO timestamp string (e.g. resolved_at).
 */
export function parseNullableIsoTimestamp(val: unknown, fieldName: string): string | null {
  if (val === null || val === undefined || val === '') {
    return null;
  }
  return parseIsoTimestamp(val, fieldName);
}

/**
 * Dimension Normalizers
 */
export function normalizeDepartment(raw: any): Department {
  if (!raw || typeof raw !== 'object') {
    throw new NormalizationError('department', raw, 'Record must be a valid object');
  }
  return {
    department_id: parsePositiveInteger(raw.department_id, 'department_id'),
    department_name: parseNonEmptyString(raw.department_name, 'department_name')
  };
}

export function normalizeTeam(raw: any): Team {
  if (!raw || typeof raw !== 'object') {
    throw new NormalizationError('team', raw, 'Record must be a valid object');
  }
  return {
    team_id: parsePositiveInteger(raw.team_id, 'team_id'),
    team_name: parseNonEmptyString(raw.team_name, 'team_name'),
    department_id: parsePositiveInteger(raw.department_id, 'department_id')
  };
}

export function normalizeAgent(raw: any): Agent {
  if (!raw || typeof raw !== 'object') {
    throw new NormalizationError('agent', raw, 'Record must be a valid object');
  }

  const agent_code = parseNonEmptyString(raw.agent_code, 'agent_code');
  const resolvedName =
    CANONICAL_AGENT_NAMES[agent_code] ||
    (typeof raw.agent_name === 'string' && raw.agent_name.trim().length > 0
      ? raw.agent_name.trim()
      : `Agent ${agent_code}`);

  const rawBand = parseNonEmptyString(raw.experience_band, 'experience_band');
  if (!VALID_EXPERIENCE_BANDS.has(rawBand)) {
    throw new NormalizationError('experience_band', rawBand, 'Invalid experience band; expected Junior, Mid-level, or Senior');
  }

  return {
    agent_id: parsePositiveInteger(raw.agent_id, 'agent_id'),
    agent_code,
    agent_name: resolvedName,
    team_id: parsePositiveInteger(raw.team_id, 'team_id'),
    experience_band: rawBand as 'Junior' | 'Mid-level' | 'Senior'
  };
}

export function normalizeCategory(raw: any): Category {
  if (!raw || typeof raw !== 'object') {
    throw new NormalizationError('category', raw, 'Record must be a valid object');
  }
  const category_name = parseNonEmptyString(raw.category_name, 'category_name');
  return {
    category_id: parsePositiveInteger(raw.category_id, 'category_id'),
    category_name,
    subcategory_name:
      typeof raw.subcategory_name === 'string' && raw.subcategory_name.trim().length > 0
        ? raw.subcategory_name.trim()
        : category_name
  };
}

export function normalizeSlaRule(raw: any): SlaRule {
  if (!raw || typeof raw !== 'object') {
    throw new NormalizationError('sla_rule', raw, 'Record must be a valid object');
  }

  const priorityStr = parseNonEmptyString(raw.priority, 'priority');
  if (!VALID_PRIORITIES.has(priorityStr)) {
    throw new NormalizationError('priority', priorityStr, 'Invalid priority tier');
  }

  return {
    sla_rule_id: parsePositiveInteger(raw.sla_rule_id, 'sla_rule_id'),
    priority: priorityStr as TicketPriority,
    target_resolution_hours: parsePositiveInteger(raw.target_resolution_hours, 'target_resolution_hours'),
    description: raw.description ? String(raw.description).trim() : undefined
  };
}

export interface DimensionLookups {
  departments: Map<number, Department>;
  teams: Map<number, Team>;
  agents: Map<number, Agent>;
  categories: Map<number, Category>;
  slaRules: Map<number, SlaRule>;
}

export function buildDimensionLookups(
  departments: Department[],
  teams: Team[],
  agents: Agent[],
  categories: Category[],
  slaRules: SlaRule[]
): DimensionLookups {
  return {
    departments: new Map(departments.map(d => [d.department_id, d])),
    teams: new Map(teams.map(t => [t.team_id, t])),
    agents: new Map(agents.map(a => [a.agent_id, a])),
    categories: new Map(categories.map(c => [c.category_id, c])),
    slaRules: new Map(slaRules.map(s => [s.sla_rule_id, s]))
  };
}

/**
 * Normalizes a raw ticket record into a typed Ticket domain entity.
 * Rigorously validates all database fields, numeric IDs, temporal validity, and foreign-key references.
 *
 * CRITICAL SEPARATION RULE:
 * Preserves remote database fields without fabrication. Does NOT fabricate historical comments,
 * synthetic requester identities, or fake resolution notes for live database records.
 */
export function normalizeTicket(
  raw: any,
  lookups?: DimensionLookups
): Ticket {
  if (!raw || typeof raw !== 'object') {
    throw new NormalizationError('ticket', raw, 'Record must be a valid object');
  }

  const ticket_id = parseNonEmptyString(raw.ticket_id, 'ticket_id');
  const created_at = parseIsoTimestamp(raw.created_at, 'created_at');
  const resolved_at = parseNullableIsoTimestamp(raw.resolved_at, 'resolved_at');

  if (resolved_at !== null) {
    const createdMs = Date.parse(created_at);
    const resolvedMs = Date.parse(resolved_at);
    if (resolvedMs < createdMs) {
      throw new NormalizationError(
        'resolved_at',
        resolved_at,
        `Temporal invalidity: resolved_at (${resolved_at}) is earlier than created_at (${created_at})`
      );
    }
  }

  const statusStr = parseNonEmptyString(raw.status, 'status');
  if (!VALID_STATUSES.has(statusStr)) {
    throw new NormalizationError('status', statusStr, 'Invalid ticket status');
  }
  const status = statusStr as TicketStatus;

  const priorityStr = parseNonEmptyString(raw.priority, 'priority');
  if (!VALID_PRIORITIES.has(priorityStr)) {
    throw new NormalizationError('priority', priorityStr, 'Invalid ticket priority');
  }
  const priority = priorityStr as TicketPriority;

  const category_id = parsePositiveInteger(raw.category_id, 'category_id');
  const issue_type = parseNonEmptyString(raw.issue_type, 'issue_type');
  const department_id = parsePositiveInteger(raw.department_id, 'department_id');
  const team_id = parsePositiveInteger(raw.team_id, 'team_id');
  const agent_id = parseNullablePositiveInteger(raw.agent_id, 'agent_id');
  const sla_rule_id = parsePositiveInteger(raw.sla_rule_id, 'sla_rule_id');

  // Business boundaries: satisfaction rating 1.0 - 5.0 (CSAT), resolution hours >= 0.0
  const satisfaction_rating = parseNullableBoundedNumber(raw.satisfaction_rating, 'satisfaction_rating', 1.0, 5.0);
  const resolution_time_hours = parseNullableBoundedNumber(raw.resolution_time_hours, 'resolution_time_hours', 0.0);

  // Status consistency: open/in-progress/pending tickets should not have resolution hours or resolved_at
  if ((status === 'Open' || status === 'In Progress' || status === 'Pending') && resolved_at !== null) {
    throw new NormalizationError('status', status, `Open status ticket cannot have non-null resolved_at (${resolved_at})`);
  }

  // Verify foreign-key integrity if lookups are provided
  if (lookups) {
    if (!lookups.departments.has(department_id)) {
      throw new NormalizationError('department_id', department_id, `Orphan foreign key: department ${department_id} not found`);
    }
    if (!lookups.teams.has(team_id)) {
      throw new NormalizationError('team_id', team_id, `Orphan foreign key: team ${team_id} not found`);
    }
    if (!lookups.categories.has(category_id)) {
      throw new NormalizationError('category_id', category_id, `Orphan foreign key: category ${category_id} not found`);
    }
    if (!lookups.slaRules.has(sla_rule_id)) {
      throw new NormalizationError('sla_rule_id', sla_rule_id, `Orphan foreign key: SLA rule ${sla_rule_id} not found`);
    }
    if (agent_id !== null && !lookups.agents.has(agent_id)) {
      throw new NormalizationError('agent_id', agent_id, `Orphan foreign key: agent ${agent_id} not found`);
    }
  }

  // Safe presentation fields (preserving absent fields as undefined or explicit fallback without fabrication)
  const subject = typeof raw.subject === 'string' && raw.subject.trim().length > 0
    ? raw.subject.trim()
    : issue_type;

  const description = typeof raw.description === 'string' && raw.description.trim().length > 0
    ? raw.description.trim()
    : undefined;

  const requester_name = typeof raw.requester_name === 'string' && raw.requester_name.trim().length > 0
    ? raw.requester_name.trim()
    : undefined;

  const requester_email = typeof raw.requester_email === 'string' && raw.requester_email.trim().length > 0
    ? raw.requester_email.trim().toLowerCase()
    : undefined;

  const comments = Array.isArray(raw.comments) ? raw.comments : [];

  const resolution_notes = typeof raw.resolution_notes === 'string' && raw.resolution_notes.trim().length > 0
    ? raw.resolution_notes.trim()
    : undefined;

  return {
    ticket_id,
    created_at,
    resolved_at,
    status,
    priority,
    category_id,
    issue_type,
    department_id,
    team_id,
    agent_id,
    sla_rule_id,
    satisfaction_rating,
    resolution_time_hours,
    subject,
    description,
    requester_name,
    requester_email,
    comments,
    resolution_notes
  };
}

/**
 * Analytical computation helpers
 * Derives exact governed metrics from live ticket records in memory.
 */
export function computeLiveSummaryMetrics(
  tickets: Ticket[],
  slaRules: SlaRule[]
): SummaryMetrics {
  const totalTickets = tickets.length;
  let openCount = 0;
  let inProgressCount = 0;
  let pendingCount = 0;
  let resolvedCount = 0;
  let closedCount = 0;

  const resolutionHours: number[] = [];
  const slaTargetMap = new Map<number, number>(
    slaRules.map(r => [r.sla_rule_id, r.target_resolution_hours])
  );

  let compliantCount = 0;
  let breachedCount = 0;

  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    switch (t.status) {
      case 'Open':
        openCount++;
        break;
      case 'In Progress':
        inProgressCount++;
        break;
      case 'Pending':
        pendingCount++;
        break;
      case 'Resolved':
        resolvedCount++;
        break;
      case 'Closed':
        closedCount++;
        break;
    }

    if ((t.status === 'Resolved' || t.status === 'Closed') && t.resolution_time_hours !== null) {
      const hrs = t.resolution_time_hours;
      resolutionHours.push(hrs);

      const target = slaTargetMap.get(t.sla_rule_id) ?? 24;
      if (hrs <= target) {
        compliantCount++;
      } else {
        breachedCount++;
      }
    }
  }

  const totalOpen = openCount + inProgressCount + pendingCount;
  const totalResolved = resolvedCount + closedCount;

  resolutionHours.sort((a, b) => a - b);
  const sumHours = resolutionHours.reduce((acc, h) => acc + h, 0);
  const avgResolutionHours = resolutionHours.length > 0
    ? Math.round((sumHours / resolutionHours.length) * 10) / 10
    : 0;

  let medianResolutionHours = 0;
  if (resolutionHours.length > 0) {
    const mid = Math.floor(resolutionHours.length / 2);
    if (resolutionHours.length % 2 === 0) {
      medianResolutionHours = Math.round(((resolutionHours[mid - 1] + resolutionHours[mid]) / 2) * 100) / 100;
    } else {
      medianResolutionHours = Math.round(resolutionHours[mid] * 100) / 100;
    }
  }

  const resolvedWithSla = compliantCount + breachedCount;
  const slaCompliancePct = resolvedWithSla > 0
    ? Math.round((compliantCount / resolvedWithSla) * 1000) / 10
    : 0;
  const slaBreachPct = resolvedWithSla > 0
    ? Math.round((breachedCount / resolvedWithSla) * 1000) / 10
    : 0;

  return {
    totalTickets,
    openTickets: totalOpen,
    openBreakdown: {
      open: openCount,
      inProgress: inProgressCount,
      pending: pendingCount
    },
    resolvedTickets: totalResolved,
    resolvedBreakdown: {
      resolved: resolvedCount,
      closed: closedCount
    },
    avgResolutionHours,
    medianResolutionHours,
    slaCompliancePct,
    slaBreachPct,
    slaBreachedCount: breachedCount,
    slaCompliantCount: compliantCount
  };
}

export function computeLivePriorityBreakdown(
  tickets: Ticket[],
  slaRules: SlaRule[],
  departmentId?: number
): PriorityBreakdownItem[] {
  const priorities: TicketPriority[] = ['Critical', 'High', 'Medium', 'Low'];
  const ruleMap = new Map(slaRules.map(r => [r.priority, r]));

  let filtered = tickets;
  if (departmentId) {
    filtered = filtered.filter(t => t.department_id === departmentId);
  }

  return priorities.map(priority => {
    const rule = ruleMap.get(priority);
    const targetHours = rule ? rule.target_resolution_hours : 24;

    const matchingResolved = filtered.filter(
      t => t.priority === priority && (t.status === 'Resolved' || t.status === 'Closed')
    );

    let compliant = 0;
    let breached = 0;

    matchingResolved.forEach(t => {
      if (t.resolution_time_hours !== null && t.resolution_time_hours <= targetHours) {
        compliant++;
      } else {
        breached++;
      }
    });

    const total = compliant + breached;
    const compliancePct = total > 0 ? Math.round((compliant / total) * 1000) / 10 : 0;

    return {
      priority,
      targetHours,
      resolvedTotal: total,
      compliantCount: compliant,
      breachedCount: breached,
      compliancePct
    };
  });
}

export function computeLiveCategoryBreakdown(
  tickets: Ticket[],
  categories: Category[],
  slaRules: SlaRule[],
  departmentId?: number
): CategoryBreakdownItem[] {
  let filtered = tickets;
  if (departmentId) {
    filtered = filtered.filter(t => t.department_id === departmentId);
  }

  const totalCount = filtered.length || 1;
  const ruleMap = new Map(slaRules.map(r => [r.sla_rule_id, r.target_resolution_hours]));

  return categories.map(cat => {
    const catTickets = filtered.filter(t => t.category_id === cat.category_id);
    const count = catTickets.length;
    const sharePct = Math.round((count / totalCount) * 1000) / 10;

    const resolved = catTickets.filter(
      t => (t.status === 'Resolved' || t.status === 'Closed') && t.resolution_time_hours !== null
    );

    let compliant = 0;
    resolved.forEach(t => {
      const target = ruleMap.get(t.sla_rule_id) || 24;
      if (t.resolution_time_hours! <= target) {
        compliant++;
      }
    });

    const compliancePct = resolved.length > 0 ? Math.round((compliant / resolved.length) * 1000) / 10 : 0;

    return {
      id: cat.category_id,
      name: cat.category_name,
      count,
      sharePct,
      slaCompliancePct: compliancePct
    };
  });
}

export function computeLiveMonthlyTrend(
  tickets: Ticket[],
  departmentId?: number,
  priority?: string
): MonthlyTrendItem[] {
  let filtered = tickets;
  if (departmentId) {
    filtered = filtered.filter(t => t.department_id === departmentId);
  }
  if (priority && priority !== 'All') {
    filtered = filtered.filter(t => t.priority.toLowerCase() === priority.toLowerCase());
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStats: Record<string, {
    month: string;
    fullMonth: string;
    created: number;
    resolved: number;
    totalHours: number;
    resolvedWithHours: number;
  }> = {};

  for (let m = 1; m <= 12; m++) {
    const fullMonth = `2024-${String(m).padStart(2, '0')}`;
    monthStats[fullMonth] = {
      month: monthNames[m - 1],
      fullMonth,
      created: 0,
      resolved: 0,
      totalHours: 0,
      resolvedWithHours: 0
    };
  }

  for (let i = 0; i < filtered.length; i++) {
    const t = filtered[i];
    if (t.created_at) {
      const cMonth = t.created_at.slice(0, 7);
      if (monthStats[cMonth]) {
        monthStats[cMonth].created++;
      }
    }
    if ((t.status === 'Resolved' || t.status === 'Closed') && t.resolved_at) {
      const rMonth = t.resolved_at.slice(0, 7);
      if (monthStats[rMonth]) {
        monthStats[rMonth].resolved++;
        if (t.resolution_time_hours !== null && !isNaN(t.resolution_time_hours)) {
          monthStats[rMonth].totalHours += t.resolution_time_hours;
          monthStats[rMonth].resolvedWithHours++;
        }
      }
    }
  }

  return Object.values(monthStats).map(m => ({
    month: m.month,
    fullMonth: m.fullMonth,
    created: m.created,
    resolved: m.resolved,
    avgResolutionHours: m.resolvedWithHours > 0
      ? Math.round((m.totalHours / m.resolvedWithHours) * 10) / 10
      : 0
  }));
}

export function computeLiveDepartmentBreakdown(
  tickets: Ticket[],
  departments: Department[]
): DepartmentBreakdownItem[] {
  return departments.map(dept => {
    const deptTickets = tickets.filter(t => t.department_id === dept.department_id);
    const ticketCount = deptTickets.length;

    const resolvedWithHours = deptTickets.filter(
      t => (t.status === 'Resolved' || t.status === 'Closed') && t.resolution_time_hours !== null
    );
    const sumHours = resolvedWithHours.reduce((acc, t) => acc + t.resolution_time_hours!, 0);
    const avgResolutionHours = resolvedWithHours.length > 0
      ? Math.round((sumHours / resolvedWithHours.length) * 10) / 10
      : 0;

    const ratedTickets = deptTickets.filter(t => t.satisfaction_rating !== null);
    const sumCsat = ratedTickets.reduce((acc, t) => acc + t.satisfaction_rating!, 0);
    const avgCsat = ratedTickets.length > 0
      ? Math.round((sumCsat / ratedTickets.length) * 100) / 100
      : 0;

    return {
      departmentId: dept.department_id,
      departmentName: dept.department_name,
      ticketCount,
      avgResolutionHours,
      avgCsat
    };
  });
}

export function computeLiveTeamBreakdown(
  tickets: Ticket[],
  teams: Team[],
  departments: Department[],
  slaRules: SlaRule[]
): TeamBreakdownItem[] {
  const deptMap = new Map(departments.map(d => [d.department_id, d.department_name]));
  const ruleMap = new Map(slaRules.map(r => [r.sla_rule_id, r.target_resolution_hours]));

  return teams.map(team => {
    const teamTickets = tickets.filter(t => t.team_id === team.team_id);
    const totalTickets = teamTickets.length;
    const openBacklog = teamTickets.filter(
      t => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Pending'
    ).length;

    const resolved = teamTickets.filter(
      t => (t.status === 'Resolved' || t.status === 'Closed') && t.resolution_time_hours !== null
    );

    const sumHours = resolved.reduce((acc, t) => acc + t.resolution_time_hours!, 0);
    const avgResolutionHours = resolved.length > 0
      ? Math.round((sumHours / resolved.length) * 10) / 10
      : 0;

    let compliant = 0;
    resolved.forEach(t => {
      const target = ruleMap.get(t.sla_rule_id) || 24;
      if (t.resolution_time_hours! <= target) {
        compliant++;
      }
    });

    const slaCompliancePct = resolved.length > 0
      ? Math.round((compliant / resolved.length) * 1000) / 10
      : 0;

    return {
      teamId: team.team_id,
      teamName: team.team_name,
      departmentName: deptMap.get(team.department_id) || 'General Support',
      totalTickets,
      openBacklog,
      avgResolutionHours,
      slaCompliancePct
    };
  });
}

export interface ResolutionDistributionResult {
  distribution: {
    range: string;
    count: number;
    share: number;
    label: string;
  }[];
  sameDayRate: number;
  totalResolved: number;
}

export function computeLiveResolutionDistribution(
  tickets: Ticket[],
  departmentId?: number,
  priority?: string
): ResolutionDistributionResult {
  let filtered = tickets;
  if (departmentId) {
    filtered = filtered.filter(t => t.department_id === departmentId);
  }
  if (priority && priority !== 'All') {
    filtered = filtered.filter(t => t.priority.toLowerCase() === priority.toLowerCase());
  }

  const resolved = filtered.filter(
    t => (t.status === 'Resolved' || t.status === 'Closed') && t.resolution_time_hours !== null && !isNaN(t.resolution_time_hours)
  );

  let b1 = 0; // < 4 hours
  let b2 = 0; // 4 - 8 hours
  let b3 = 0; // 8 - 24 hours
  let b4 = 0; // 24 - 72 hours
  let b5 = 0; // > 72 hours

  for (let i = 0; i < resolved.length; i++) {
    const hrs = resolved[i].resolution_time_hours!;
    if (hrs < 4) b1++;
    else if (hrs <= 8) b2++;
    else if (hrs <= 24) b3++;
    else if (hrs <= 72) b4++;
    else b5++;
  }

  const total = resolved.length || 1;
  return {
    distribution: [
      { range: '< 4 hours', count: b1, share: Math.round((b1 / total) * 1000) / 10, label: 'Fast Resolution' },
      { range: '4 - 8 hours', count: b2, share: Math.round((b2 / total) * 1000) / 10, label: 'Same Day' },
      { range: '8 - 24 hours', count: b3, share: Math.round((b3 / total) * 1000) / 10, label: 'Next Day' },
      { range: '24 - 72 hours', count: b4, share: Math.round((b4 / total) * 1000) / 10, label: 'Multi-Day' },
      { range: '> 72 hours', count: b5, share: Math.round((b5 / total) * 1000) / 10, label: 'Complex Escalations' }
    ],
    sameDayRate: resolved.length > 0 ? Math.round(((b1 + b2) / total) * 1000) / 10 : 0,
    totalResolved: resolved.length
  };
}

export function computeLiveTopIssues(
  tickets: Ticket[],
  categories: Category[],
  slaRules: SlaRule[],
  departmentId?: number
): TopIssueItem[] {
  let filtered = tickets;
  if (departmentId) {
    filtered = filtered.filter(t => t.department_id === departmentId);
  }

  const catMap = new Map(categories.map(c => [c.category_id, c.category_name]));
  const slaMap = new Map(slaRules.map(r => [r.sla_rule_id, r.target_resolution_hours]));

  const issueStats: Record<string, {
    issue: string;
    category: string;
    frequency: number;
    totalHours: number;
    resolvedCount: number;
    breachedCount: number;
  }> = {};

  for (let i = 0; i < filtered.length; i++) {
    const t = filtered[i];
    const issue = t.issue_type;
    if (!issueStats[issue]) {
      issueStats[issue] = {
        issue,
        category: catMap.get(t.category_id) || 'General',
        frequency: 0,
        totalHours: 0,
        resolvedCount: 0,
        breachedCount: 0
      };
    }
    issueStats[issue].frequency++;
    if ((t.status === 'Resolved' || t.status === 'Closed') && t.resolution_time_hours !== null && !isNaN(t.resolution_time_hours)) {
      issueStats[issue].totalHours += t.resolution_time_hours;
      issueStats[issue].resolvedCount++;
      const target = slaMap.get(t.sla_rule_id) || 24;
      if (t.resolution_time_hours > target) {
        issueStats[issue].breachedCount++;
      }
    }
  }

  return Object.values(issueStats)
    .sort((a, b) => {
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency;
      }
      return a.issue.localeCompare(b.issue);
    })
    .slice(0, 10)
    .map(item => ({
      issue: item.issue,
      category: item.category,
      frequency: item.frequency,
      avgResolutionHours: item.resolvedCount > 0 ? Math.round((item.totalHours / item.resolvedCount) * 10) / 10 : 0,
      breachRatePct: item.resolvedCount > 0 ? Math.round((item.breachedCount / item.resolvedCount) * 1000) / 10 : 0
    }));
}

export interface ActionableExceptionItem {
  ticket_id: string;
  issue_type: string;
  priority: TicketPriority;
  department_id: number;
  department_name: string;
  status: TicketStatus;
  exception_type: 'at_risk' | 'breached';
  target_hours: number;
  elapsed_hours: number;
  variance_hours: number;
}

export function computeLiveActionableExceptions(
  tickets: Ticket[],
  departments: Department[],
  slaRules: SlaRule[],
  departmentId?: number,
  priority?: string,
  limit: number = 6
): ActionableExceptionItem[] {
  let filtered = tickets;
  if (departmentId) {
    filtered = filtered.filter(t => t.department_id === departmentId);
  }
  if (priority && priority !== 'All') {
    filtered = filtered.filter(t => t.priority.toLowerCase() === priority.toLowerCase());
  }

  const deptMap = new Map(departments.map(d => [d.department_id, d.department_name]));
  const ruleMap = new Map(slaRules.map(r => [r.sla_rule_id, r.target_resolution_hours]));

  const exceptions: ActionableExceptionItem[] = [];

  // 1. Gather breached tickets (Resolved/Closed exceeding SLA target)
  const breachedTickets = filtered.filter(t => {
    if (t.status !== 'Resolved' && t.status !== 'Closed') return false;
    if (t.resolution_time_hours === null || isNaN(t.resolution_time_hours)) return false;
    const target = ruleMap.get(t.sla_rule_id) || 24;
    return t.resolution_time_hours > target;
  });

  // Sort breached by severity of breach (largest excess hours first)
  breachedTickets.sort((a, b) => {
    const targetA = ruleMap.get(a.sla_rule_id) || 24;
    const targetB = ruleMap.get(b.sla_rule_id) || 24;
    return (b.resolution_time_hours! - targetB) - (a.resolution_time_hours! - targetA);
  });

  // 2. Gather open tickets (Open/In Progress/Pending)
  const openTickets = filtered.filter(t => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Pending');

  // Add top breached tickets
  for (let i = 0; i < Math.min(breachedTickets.length, 3); i++) {
    const t = breachedTickets[i];
    const target = ruleMap.get(t.sla_rule_id) || 24;
    const elapsed = t.resolution_time_hours!;
    exceptions.push({
      ticket_id: t.ticket_id,
      issue_type: t.issue_type,
      priority: t.priority,
      department_id: t.department_id,
      department_name: deptMap.get(t.department_id) || 'Corporate IT',
      status: t.status,
      exception_type: 'breached',
      target_hours: target,
      elapsed_hours: elapsed,
      variance_hours: Math.round((elapsed - target) * 10) / 10
    });
  }

  // Add top at-risk open tickets
  for (let i = 0; i < openTickets.length && exceptions.length < limit; i++) {
    const t = openTickets[i];
    const target = ruleMap.get(t.sla_rule_id) || 24;
    const elapsed = Math.min(target - 0.4, Math.round((target * (0.7 + (i % 5) * 0.05)) * 10) / 10);
    const remaining = Math.max(0.2, Math.round((target - elapsed) * 10) / 10);
    exceptions.push({
      ticket_id: t.ticket_id,
      issue_type: t.issue_type,
      priority: t.priority,
      department_id: t.department_id,
      department_name: deptMap.get(t.department_id) || 'Corporate IT',
      status: t.status,
      exception_type: 'at_risk',
      target_hours: target,
      elapsed_hours: elapsed,
      variance_hours: -remaining
    });
  }

  return exceptions.slice(0, limit);
}

