export type UserRole = 'employee' | 'agent' | 'manager' | 'admin';

export type TicketStatus = 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';

export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  departmentId: number;
  departmentName: string;
  title: string;
  agentId?: number;
}

export interface Department {
  department_id: number;
  department_name: string;
}

export interface Team {
  team_id: number;
  team_name: string;
  department_id: number;
}

export interface Agent {
  agent_id: number;
  agent_code: string;
  agent_name: string;
  team_id: number;
  experience_band: 'Junior' | 'Mid-level' | 'Senior';
}

export interface Category {
  category_id: number;
  category_name: string;
  subcategory_name: string;
}

export interface SlaRule {
  sla_rule_id: number;
  priority: TicketPriority;
  target_resolution_hours: number;
  description?: string;
}

export interface TicketComment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
  content: string;
  isInternal: boolean;
}

export interface Ticket {
  ticket_id: string;
  created_at: string;
  resolved_at: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  category_id: number;
  issue_type: string;
  department_id: number;
  team_id: number;
  agent_id: number | null;
  sla_rule_id: number;
  satisfaction_rating: number | null;
  resolution_time_hours: number | null;
  
  // Enriched presentation fields
  subject?: string;
  description?: string;
  requester_name?: string;
  requester_email?: string;
  comments?: TicketComment[];
  resolution_notes?: string;
}

export interface MonthlyTrendItem {
  month: string;
  fullMonth: string;
  created: number;
  resolved: number;
  avgResolutionHours: number;
}

export interface CategoryBreakdownItem {
  id: number;
  name: string;
  count: number;
  sharePct: number;
  slaCompliancePct: number;
}

export interface PriorityBreakdownItem {
  priority: TicketPriority;
  targetHours: number;
  resolvedTotal: number;
  compliantCount: number;
  breachedCount: number;
  compliancePct: number;
}

export interface TopIssueItem {
  issue: string;
  category: string;
  frequency: number;
  avgResolutionHours: number;
  breachRatePct: number;
}

export interface DepartmentBreakdownItem {
  departmentId: number;
  departmentName: string;
  ticketCount: number;
  avgResolutionHours: number;
  avgCsat: number;
}

export interface TeamBreakdownItem {
  teamId: number;
  teamName: string;
  departmentName: string;
  totalTickets: number;
  openBacklog: number;
  avgResolutionHours: number;
  slaCompliancePct: number;
}

export interface SummaryMetrics {
  totalTickets: number;
  openTickets: number;
  openBreakdown: {
    open: number;
    inProgress: number;
    pending: number;
  };
  resolvedTickets: number;
  resolvedBreakdown: {
    resolved: number;
    closed: number;
  };
  avgResolutionHours: number;
  medianResolutionHours: number;
  slaCompliancePct: number;
  slaBreachPct: number;
  slaBreachedCount: number;
  slaCompliantCount: number;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
  helpfulCount: number;
  notHelpfulCount: number;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}
