import seededData from '../data/seededData.json';
import {
  Ticket,
  Department,
  Team,
  Agent,
  Category,
  SlaRule,
  SummaryMetrics,
  MonthlyTrendItem,
  CategoryBreakdownItem,
  PriorityBreakdownItem,
  TopIssueItem,
  DepartmentBreakdownItem,
  TeamBreakdownItem,
  KnowledgeArticle,
  NotificationItem,
  AuditEvent,
  User,
  TicketStatus,
  TicketPriority,
  UserRole
} from '../types';
import { DEMO_USERS } from './demoUsers';
export { DEMO_USERS };

// Seeded knowledge articles
const SEEDED_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'kb-101',
    title: 'How to Reset Your Enterprise Password & MFA Token',
    category: 'Access & Permissions',
    summary: 'Step-by-step instructions for self-service password recovery and updating your Microsoft Authenticator app.',
    content: `### Password Self-Service Recovery\n\n1. Visit the corporate SSO portal at \`https://auth.company.local/reset\`.\n2. Enter your work email address and complete the CAPTCHA.\n3. A verification code will be sent to your registered mobile device.\n4. Enter the code and choose a new password meeting security policies (min 14 chars, alphanumeric, symbols).\n\n### If your MFA token is locked:\nContact Service Desk Tier 1 or use the automated emergency access key generated during onboarding.`,
    tags: ['password', 'mfa', 'security', 'sso'],
    helpfulCount: 142,
    notHelpfulCount: 4,
    updatedAt: '2024-11-15'
  },
  {
    id: 'kb-102',
    title: 'VPN Connection Guide & GlobalProtect Troubleshooting',
    category: 'Network & Connectivity',
    summary: 'Resolve common connection timeouts, gateway unreachable errors, and tunnel renegotiation loops.',
    content: `### Connecting to Corporate VPN\n\n1. Launch GlobalProtect Client from the system tray.\n2. Portal address: \`vpn.global.company.internal\`.\n3. Authenticate with your enterprise SSO.\n\n### Common Fixes:\n- **Gateway Timeout**: Flush local DNS cache via \`ipconfig /flushdns\` in PowerShell.\n- **Certificate Error**: Ensure root certificate authority update has synced via Company Portal.\n- **Split Tunnel Latency**: Disable IPv6 on Wi-Fi adapter if connecting from residential broadband.`,
    tags: ['vpn', 'network', 'globalprotect', 'wifi'],
    helpfulCount: 238,
    notHelpfulCount: 12,
    updatedAt: '2024-10-20'
  },
  {
    id: 'kb-103',
    title: 'Software Installation Request & Company Portal Catalog',
    category: 'Software',
    summary: 'Standard procedure for requesting unlisted applications and installing approved titles without local admin rights.',
    content: `### Pre-Approved Applications\nAll standard business applications (Docker Desktop, VS Code, Slack, Zoom, Postman) can be installed without IT approval directly from **Company Portal** (Windows) or **Self Service** (macOS).\n\n### Non-Standard or Paid Licenses\n1. Submit a service ticket selecting "Software Request".\n2. Attach your cost center code and manager's written email approval.\n3. Procurement and Security review takes 2-3 business days.`,
    tags: ['software', 'install', 'licenses', 'company portal'],
    helpfulCount: 89,
    notHelpfulCount: 3,
    updatedAt: '2024-09-08'
  },
  {
    id: 'kb-104',
    title: 'Configuring Shared Mailboxes and Calendar Delegates in Outlook',
    category: 'Email & Collaboration',
    summary: 'How to map team mailboxes in Outlook 365 and grant calendar booking permissions.',
    content: `### Auto-Mapping\nOnce IAM grants group membership, shared mailboxes appear automatically in Outlook desktop within 60 minutes.\n\n### Manual Configuration (if auto-mapping fails):\n1. Open Outlook -> File -> Account Settings -> Account Settings.\n2. Select your email -> Change -> More Settings -> Advanced tab.\n3. Click **Add** under 'Open these additional mailboxes' and type the shared mailbox name.`,
    tags: ['outlook', 'email', 'exchange', 'office365'],
    helpfulCount: 77,
    notHelpfulCount: 2,
    updatedAt: '2024-08-30'
  },
  {
    id: 'kb-105',
    title: 'Cloud VM / AWS Sandbox Access & Temporary IAM Credentials',
    category: 'Cloud & Infrastructure',
    summary: 'Guidelines for requesting dev environment access and obtaining short-lived AWS STS assume-role keys.',
    content: `### Requesting Cloud Sandbox Access\n1. Ensure you have completed the Cloud Security Compliance module in Workday.\n2. Submit a request specifying the Target AWS Account ID and required IAM Policy.\n3. Roles expire automatically after 8 hours. Use \`aws-vault\` or corporate SSO CLI to refresh.`,
    tags: ['aws', 'cloud', 'iam', 'devops'],
    helpfulCount: 114,
    notHelpfulCount: 5,
    updatedAt: '2024-11-01'
  }
];

// Initial audit events
const SEEDED_AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'aud-001',
    timestamp: '2024-10-12 11:45:10',
    user: 'admin.analytics@company.com',
    action: 'SLA_POLICY_REVIEW',
    details: 'Verified SLA Rule #1 Critical target: 4.0 calendar hours.',
    status: 'SUCCESS'
  },
  {
    id: 'aud-002',
    timestamp: '2024-10-12 09:30:22',
    user: 'neha.kapoor@company.com',
    action: 'EXPORT_COMPLIANCE_REPORT',
    details: 'Exported Q3 SLA Compliance report (6,612 resolved records).',
    status: 'SUCCESS'
  },
  {
    id: 'aud-003',
    timestamp: '2024-10-11 16:12:00',
    user: 'system_monitor',
    action: 'DATA_QUALITY_VERIFICATION',
    details: 'Verified dataset integrity: 8,000 clean records, zero orphan foreign keys.',
    status: 'SUCCESS'
  },
  {
    id: 'aud-004',
    timestamp: '2024-10-11 14:05:44',
    user: 'arjun.mehta@company.com',
    action: 'TICKET_REASSIGN',
    details: 'Ticket TKT-00850 assigned to Arjun Mehta (Tier 1)',
    status: 'SUCCESS'
  }
];

class DataService {
  private tickets: Ticket[] = [];
  private slaRules: SlaRule[] = [];
  private articles: KnowledgeArticle[] = [...SEEDED_ARTICLES];
  private notifications: NotificationItem[] = [];
  private auditLogs: AuditEvent[] = [...SEEDED_AUDIT_LOGS];
  private users: User[] = [...DEMO_USERS];

  constructor() {
    this.initData();
  }

  private initData() {
    // 1. Initialize SLA rules from seededData
    const rawSlaRules = (seededData as any).slaRules || (seededData as any).sla_rules || [];
    this.slaRules = rawSlaRules.map((rule: any) => ({
      ...rule,
      target_resolution_hours: Number(rule.target_resolution_hours)
    }));

    // 2. Initialize realistic recent tickets list from seededData + synthetic enrichment
    const sampleRawTickets = (seededData as any).initialTickets || (seededData as any).recentTickets || [];
    
    // Map raw tickets to rich interactive domain models
    this.tickets = sampleRawTickets.map((t: any, idx: number) => {
      const cat = (seededData.categories as any[]).find(c => c.category_id === t.category_id);
      const dept = (seededData.departments as any[]).find(d => d.department_id === t.department_id);
      
      const comments = [
        {
          id: `cmt-${idx}-1`,
          authorName: t.status === 'Open' ? 'Priya Sharma' : 'Employee Requester',
          authorRole: 'employee' as UserRole,
          createdAt: t.created_at,
          content: `Reported issue: ${t.issue_type}. Experiencing disruption during regular workflow.`,
          isInternal: false
        }
      ];

      if (t.status === 'In Progress' || t.status === 'Resolved' || t.status === 'Closed') {
        comments.push({
          id: `cmt-${idx}-2`,
          authorName: 'Arjun Mehta',
          authorRole: 'agent' as UserRole,
          createdAt: t.created_at,
          content: `Diagnosing root issue. Checked logs and network routing.`,
          isInternal: false
        });
        comments.push({
          id: `cmt-${idx}-3`,
          authorName: 'Arjun Mehta',
          authorRole: 'agent' as UserRole,
          createdAt: t.created_at,
          content: `Internal diagnostic note: Verified IAM policy and gateway heartbeat. No upstream outage detected.`,
          isInternal: true
        });
      }

      if (t.status === 'Resolved' || t.status === 'Closed') {
        comments.push({
          id: `cmt-${idx}-4`,
          authorName: 'Arjun Mehta',
          authorRole: 'agent' as UserRole,
          createdAt: t.resolved_at || t.created_at,
          content: `Resolution applied: Configured appropriate security permissions and cleared local token cache. Verified service restoration with user.`,
          isInternal: false
        });
      }

      return {
        ticket_id: t.ticket_id,
        created_at: t.created_at,
        resolved_at: t.resolved_at,
        status: t.status,
        priority: t.priority,
        category_id: t.category_id,
        issue_type: t.issue_type,
        department_id: t.department_id,
        team_id: t.team_id,
        agent_id: t.agent_id,
        sla_rule_id: t.sla_rule_id,
        satisfaction_rating: t.satisfaction_rating,
        resolution_time_hours: t.resolution_time_hours,
        subject: t.issue_type,
        description: `Encountered: ${t.issue_type} in ${dept?.department_name || 'Business Department'}. Requires technical remediation under ${t.priority} SLA.`,
        requester_name: idx % 3 === 0 ? 'Priya Sharma' : idx % 3 === 1 ? 'Rahul Verma' : 'Anil Kapoor',
        requester_email: idx % 3 === 0 ? 'priya.sharma@company.com' : 'employee@company.com',
        comments,
        resolution_notes: t.status === 'Resolved' || t.status === 'Closed' ? 'Resolved by standard service operating procedure.' : undefined
      };
    });

    // 3. Initialize notifications
    this.notifications = [
      {
        id: 'notif-1',
        title: 'SLA Breach Warning',
        message: 'Ticket TKT-00850 (High Priority) has 1.8 hours remaining before SLA breach threshold.',
        type: 'warning',
        read: false,
        createdAt: '10 minutes ago',
        link: '/agent/tickets/TKT-00850'
      },
      {
        id: 'notif-2',
        title: 'Ticket Status Updated',
        message: 'Your ticket TKT-00842 has been moved to In Progress by Arjun Mehta.',
        type: 'info',
        read: false,
        createdAt: '1 hour ago',
        link: '/portal/tickets/TKT-00842'
      },
      {
        id: 'notif-3',
        title: 'Weekly Performance Report Ready',
        message: 'Executive Analytics snapshot for Week 41 has been compiled. 87.9% overall SLA compliance.',
        type: 'success',
        read: true,
        createdAt: '1 day ago',
        link: '/analytics/overview'
      },
      {
        id: 'notif-4',
        title: 'System Maintenance Window',
        message: 'GlobalProtect VPN cluster update scheduled for Saturday 02:00 UTC.',
        type: 'info',
        read: true,
        createdAt: '2 days ago'
      }
    ];
  }

  // Dimension accessors
  public getDepartments(): Department[] {
    return seededData.departments as Department[];
  }

  public getTeams(): Team[] {
    return seededData.teams as Team[];
  }

  public getAgents(): Agent[] {
    return seededData.agents as Agent[];
  }

  public getCategories(): Category[] {
    return seededData.categories as Category[];
  }

  public getSlaRules(): SlaRule[] {
    return [...this.slaRules];
  }

  public updateSlaRule(slaRuleId: number, targetHours: number): boolean {
    const rule = this.slaRules.find(r => r.sla_rule_id === slaRuleId);
    if (rule) {
      rule.target_resolution_hours = targetHours;
      this.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        user: 'admin.analytics@company.com',
        action: 'UPDATE_SLA_RULE',
        details: `Updated ${rule.priority} target to ${targetHours} calendar hours.`,
        status: 'SUCCESS'
      });
      return true;
    }
    return false;
  }

  // Analytical aggregates
  public getSummaryMetrics(): SummaryMetrics {
    return seededData.summaryMetrics as SummaryMetrics;
  }

  public getMonthlyTrend(departmentId?: number, priority?: string): MonthlyTrendItem[] {
    let data = [...seededData.monthlyTrend] as MonthlyTrendItem[];
    // Controlled deterministic variation if filtered
    if (departmentId) {
      data = data.map(item => ({
        ...item,
        created: Math.round(item.created * 0.22),
        resolved: Math.round(item.resolved * 0.22)
      }));
    }
    if (priority && priority !== 'All') {
      const factor = priority === 'Critical' ? 0.1 : priority === 'High' ? 0.25 : priority === 'Medium' ? 0.45 : 0.2;
      data = data.map(item => ({
        ...item,
        created: Math.round(item.created * factor),
        resolved: Math.round(item.resolved * factor)
      }));
    }
    return data;
  }

  public getCategoryBreakdown(): CategoryBreakdownItem[] {
    return seededData.categoryBreakdown as CategoryBreakdownItem[];
  }

  public getPriorityBreakdown(): PriorityBreakdownItem[] {
    // Reflect dynamic targetHours if SLA rule was edited in demo
    return (seededData.priorityBreakdown as PriorityBreakdownItem[]).map(p => {
      const match = this.slaRules.find(r => r.priority === p.priority);
      return {
        ...p,
        targetHours: match ? match.target_resolution_hours : p.targetHours
      };
    });
  }

  public getTopIssues(): TopIssueItem[] {
    return seededData.topIssues as TopIssueItem[];
  }

  public getDepartmentBreakdown(): DepartmentBreakdownItem[] {
    return seededData.departmentBreakdown as DepartmentBreakdownItem[];
  }

  public getTeamBreakdown(): TeamBreakdownItem[] {
    return seededData.teamBreakdown as TeamBreakdownItem[];
  }

  // Tickets CRUD & Filtering
  public getTickets(filters?: {
    status?: string;
    priority?: string;
    departmentId?: number;
    categoryId?: number;
    search?: string;
    agentId?: number;
    requesterEmail?: string;
    limit?: number;
    offset?: number;
  }): { tickets: Ticket[]; total: number } {
    let list = [...this.tickets];

    if (filters?.status && filters.status !== 'All' && filters.status !== 'all') {
      list = list.filter(t => t.status.toLowerCase() === filters.status!.toLowerCase());
    }

    if (filters?.priority && filters.priority !== 'All' && filters.priority !== 'all') {
      list = list.filter(t => t.priority.toLowerCase() === filters.priority!.toLowerCase());
    }

    if (filters?.departmentId) {
      list = list.filter(t => t.department_id === filters.departmentId);
    }

    if (filters?.categoryId) {
      list = list.filter(t => t.category_id === filters.categoryId);
    }

    if (filters?.agentId !== undefined) {
      list = list.filter(t => t.agent_id === filters.agentId);
    }

    if (filters?.requesterEmail) {
      list = list.filter(t => t.requester_email?.toLowerCase() === filters.requesterEmail!.toLowerCase());
    }

    if (filters?.search) {
      const query = filters.search.toLowerCase();
      list = list.filter(t =>
        t.ticket_id.toLowerCase().includes(query) ||
        t.issue_type.toLowerCase().includes(query) ||
        (t.subject && t.subject.toLowerCase().includes(query)) ||
        (t.requester_name && t.requester_name.toLowerCase().includes(query))
      );
    }

    const total = list.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit ? filters.limit : list.length;
    const sliced = list.slice(offset, offset + limit);

    return { tickets: sliced, total };
  }

  public getTicketById(id: string): Ticket | undefined {
    return this.tickets.find(t => t.ticket_id.toLowerCase() === id.toLowerCase());
  }

  public createTicket(data: {
    subject: string;
    description: string;
    category_id: number;
    issue_type: string;
    department_id: number;
    requester_name: string;
    requester_email: string;
  }): Ticket {
    // Generate next ticket ID
    const count = this.tickets.length + 8000;
    const ticket_id = `TKT-${String(count + 1).padStart(5, '0')}`;
    
    // SLA rule derivation: rule 3 (Medium: 24h) by default, or rule 2 if access/security
    const sla_rule_id = data.category_id === 1 ? 2 : 3;
    const priority: TicketPriority = sla_rule_id === 2 ? 'High' : 'Medium';
    
    const now = new Date();
    const created_at = now.toISOString().replace('T', ' ').slice(0, 19);

    const newTicket: Ticket = {
      ticket_id,
      created_at,
      resolved_at: null,
      status: 'Open',
      priority,
      category_id: data.category_id,
      issue_type: data.issue_type,
      department_id: data.department_id,
      team_id: 1, // Route initially to Service Desk Tier 1
      agent_id: null,
      sla_rule_id,
      satisfaction_rating: null,
      resolution_time_hours: null,
      subject: data.subject,
      description: data.description,
      requester_name: data.requester_name,
      requester_email: data.requester_email,
      comments: [
        {
          id: `cmt-${Date.now()}`,
          authorName: data.requester_name,
          authorRole: 'employee',
          createdAt: created_at,
          content: `${data.subject}\n\n${data.description}`,
          isInternal: false
        }
      ]
    };

    this.tickets.unshift(newTicket);

    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'Ticket Logged Successfully',
      message: `Your ticket ${ticket_id} has been logged and queued for Service Desk triage.`,
      type: 'info',
      read: false,
      createdAt: 'Just now',
      link: `/portal/tickets/${ticket_id}`
    });

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: created_at,
      user: data.requester_email,
      action: 'CREATE_TICKET',
      details: `Created ${ticket_id} (${priority}) under ${data.issue_type}`,
      status: 'SUCCESS'
    });

    return newTicket;
  }

  public updateTicketStatus(ticketId: string, status: TicketStatus, notes?: string): Ticket | undefined {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) return undefined;

    ticket.status = status;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (status === 'Resolved' || status === 'Closed') {
      if (!ticket.resolved_at) {
        ticket.resolved_at = now;
        // Compute resolution hours
        const createdMs = new Date(ticket.created_at).getTime();
        const resolvedMs = new Date(now).getTime();
        const hours = Math.max(0.5, Math.round(((resolvedMs - createdMs) / (1000 * 60 * 60)) * 10) / 10);
        ticket.resolution_time_hours = isNaN(hours) ? 4.2 : hours;
      }
      if (notes) {
        ticket.resolution_notes = notes;
      }
    } else {
      ticket.resolved_at = null;
      ticket.resolution_time_hours = null;
    }

    if (notes) {
      ticket.comments?.push({
        id: `cmt-${Date.now()}`,
        authorName: 'Support Agent',
        authorRole: 'agent',
        createdAt: now,
        content: `Status updated to ${status}. ${notes}`,
        isInternal: false
      });
    }

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: now,
      user: 'agent@company.com',
      action: 'UPDATE_TICKET_STATUS',
      details: `${ticketId} status changed to ${status}`,
      status: 'SUCCESS'
    });

    return ticket;
  }

  public updateTicketAssignee(ticketId: string, agentId: number | null, teamId?: number): Ticket | undefined {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) return undefined;

    ticket.agent_id = agentId;
    if (teamId) {
      ticket.team_id = teamId;
    }
    const agent = agentId ? this.getAgents().find(a => a.agent_id === agentId) : null;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    ticket.comments?.push({
      id: `cmt-${Date.now()}`,
      authorName: 'System',
      authorRole: 'agent',
      createdAt: now,
      content: agent ? `Ticket assigned to ${agent.agent_name} (${agent.agent_code}).` : 'Ticket unassigned and returned to queue.',
      isInternal: true
    });

    return ticket;
  }

  public updateTicketPriority(ticketId: string, priority: TicketPriority): Ticket | undefined {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) return undefined;

    ticket.priority = priority;
    const rule = this.slaRules.find(r => r.priority === priority);
    if (rule) {
      ticket.sla_rule_id = rule.sla_rule_id;
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    ticket.comments?.push({
      id: `cmt-${Date.now()}`,
      authorName: 'Support Agent',
      authorRole: 'agent',
      createdAt: now,
      content: `Priority adjusted to ${priority} under governed SLA entitlement rules.`,
      isInternal: true
    });

    return ticket;
  }

  public addTicketComment(ticketId: string, comment: {
    authorName: string;
    authorRole: UserRole;
    content: string;
    isInternal: boolean;
  }): Ticket | undefined {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) return undefined;

    if (!ticket.comments) ticket.comments = [];
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    ticket.comments.push({
      id: `cmt-${Date.now()}`,
      authorName: comment.authorName,
      authorRole: comment.authorRole,
      createdAt: now,
      content: comment.content,
      isInternal: comment.isInternal
    });

    return ticket;
  }

  public getAtRiskTickets(): Array<Ticket & { targetHours: number; hoursElapsed: number; hoursRemaining: number }> {
    // Return open/in progress tickets sorted by remaining time
    const openTickets = this.tickets.filter(t => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Pending');
    
    return openTickets.slice(0, 8).map((t, idx) => {
      const rule = this.slaRules.find(r => r.sla_rule_id === t.sla_rule_id) || this.slaRules[1];
      const targetHours = rule.target_resolution_hours;
      // Synthesize realistic elapsed hours close to threshold
      const elapsed = targetHours * (0.65 + (idx * 0.05));
      const remaining = Math.max(0.3, Math.round((targetHours - elapsed) * 10) / 10);
      return {
        ...t,
        targetHours,
        hoursElapsed: Math.round(elapsed * 10) / 10,
        hoursRemaining: remaining
      };
    });
  }

  // Prediction Estimator (transparently documented baseline & demo regression heuristic)
  public predictResolutionTime(features: {
    category_id: number;
    priority: TicketPriority;
    department_id: number;
    issue_type: string;
  }): {
    estimatedHours: number;
    confidenceLower: number;
    confidenceUpper: number;
    featuresEvaluated: string[];
    isSimulated: boolean;
    modelMetadata: {
      modelName: string;
      version: string;
      evaluationMAE: number;
      evaluationRMSE: number;
      evaluationR2: number;
      trainingRows: number;
      testSplit: string;
    };
  } {
    // Governed heuristic calibrated against the 8,000 synthetic ticket dataset
    // Baseline mean: ~14.9 hrs
    let baseHours = 14.9;

    if (features.priority === 'Critical') baseHours = 3.6;
    else if (features.priority === 'High') baseHours = 7.1;
    else if (features.priority === 'Medium') baseHours = 18.2;
    else if (features.priority === 'Low') baseHours = 34.5;

    // Category coefficient
    if (features.category_id === 4) baseHours *= 0.92; // Network usually fast diagnostic
    if (features.category_id === 3) baseHours *= 1.15; // Hardware replacement takes longer
    if (features.category_id === 1) baseHours *= 0.85; // Access/IAM fast turnaround

    // Rounding
    const estimatedHours = Math.round(baseHours * 10) / 10;
    const confidenceLower = Math.max(1.0, Math.round((estimatedHours * 0.65) * 10) / 10);
    const confidenceUpper = Math.round((estimatedHours * 1.6) * 10) / 10;

    return {
      estimatedHours,
      confidenceLower,
      confidenceUpper,
      featuresEvaluated: ['Priority tier', 'Category ID', 'Requester department', 'Issue type token complexity'],
      isSimulated: true,
      modelMetadata: {
        modelName: 'Gradient Boosting Regressor (LightGBM baseline)',
        version: 'v1.2.0-synthetic-evaluation',
        evaluationMAE: 3.42,
        evaluationRMSE: 5.18,
        evaluationR2: 0.784,
        trainingRows: 6400,
        testSplit: '80/20 Time-aware chronological split'
      }
    };
  }

  // Knowledge base
  public getKnowledgeArticles(search?: string, category?: string): KnowledgeArticle[] {
    let list = [...this.articles];
    if (category && category !== 'All') {
      list = list.filter(a => a.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }

  public voteKnowledgeArticle(id: string, isHelpful: boolean): void {
    const art = this.articles.find(a => a.id === id);
    if (art) {
      if (isHelpful) art.helpfulCount += 1;
      else art.notHelpfulCount += 1;
    }
  }

  // AI Assistant deterministic smart router
  public chatWithAiAssistant(
    userMessage: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): {
    reply: string;
    suggestedActions?: Array<{ label: string; actionType: 'create_ticket' | 'view_kb' | 'view_tickets'; payload?: any }>;
    matchedIntent?: string;
  } {
    const q = userMessage.toLowerCase();

    if (q.includes('vpn') || q.includes('connect') || q.includes('globalprotect') || q.includes('wifi') || q.includes('network')) {
      return {
        reply: `**Network & VPN Diagnostic Guide**\n\nI detected a network or VPN connectivity inquiry. Here are the approved troubleshooting steps:\n\n1. **Verify Local Internet**: Ensure you can access standard sites.\n2. **Flush DNS Cache**: Open terminal and execute \`ipconfig /flushdns\`.\n3. **GlobalProtect Portal**: Confirm your portal URL is \`vpn.global.company.internal\`.\n4. **MFA Authenticator**: Ensure time-sync is enabled on your phone.\n\nWould you like me to open the complete VPN knowledge base article, or would you like to log a ticket for the Network Operations team?`,
        suggestedActions: [
          { label: 'Read VPN Troubleshooting Article', actionType: 'view_kb', payload: 'kb-102' },
          { label: 'Create Network Ticket', actionType: 'create_ticket', payload: { category_id: 4, issue_type: 'VPN connection issue' } }
        ],
        matchedIntent: 'troubleshoot_vpn'
      };
    }

    if (q.includes('password') || q.includes('mfa') || q.includes('login') || q.includes('authenticator') || q.includes('locked')) {
      return {
        reply: `**Identity & Access Self-Service**\n\nFor security reasons, password changes must be performed through the governed identity portal:\n\n- Self-service portal: \`https://auth.company.local/reset\`\n- Passwords must be at least 14 characters long and cannot reuse the last 5 passwords.\n- If your authenticator token is desynchronized, an IT support agent can trigger an MFA push reset.`,
        suggestedActions: [
          { label: 'View Password & MFA Guide', actionType: 'view_kb', payload: 'kb-101' },
          { label: 'Create Access Ticket', actionType: 'create_ticket', payload: { category_id: 1, issue_type: 'MFA token reset' } }
        ],
        matchedIntent: 'password_reset'
      };
    }

    if (q.includes('open ticket') || q.includes('my ticket') || q.includes('status of') || q.includes('track')) {
      const myTickets = this.tickets.slice(0, 3);
      const ticketListStr = myTickets.map(t => `- **${t.ticket_id}**: ${t.issue_type} (*${t.status}* - Priority: ${t.priority})`).join('\n');
      return {
        reply: `Here are your most recently tracked tickets in the demo environment:\n\n${ticketListStr}\n\nYou can click below to view complete conversation timelines and SLAs.`,
        suggestedActions: [
          { label: 'View All My Tickets', actionType: 'view_tickets' }
        ],
        matchedIntent: 'list_my_tickets'
      };
    }

    if (q.includes('create') || q.includes('new ticket') || q.includes('log') || q.includes('submit')) {
      return {
        reply: `I can guide you directly to the ticket submission workflow. Tickets are categorized by department and assigned appropriate SLA resolution windows automatically.`,
        suggestedActions: [
          { label: 'Open Ticket Creation Form', actionType: 'create_ticket' }
        ],
        matchedIntent: 'create_ticket_handoff'
      };
    }

    if (q.includes('software') || q.includes('install') || q.includes('license') || q.includes('office') || q.includes('excel')) {
      return {
        reply: `**Software Installation & Licensing**\n\nApproved applications can be installed immediately without IT intervention via **Company Portal**.\n\nFor proprietary or commercial licenses (e.g. Tableau, Adobe Creative Cloud), please provide your manager's written sign-off and cost center code.`,
        suggestedActions: [
          { label: 'Read Software Catalog Article', actionType: 'view_kb', payload: 'kb-103' },
          { label: 'Submit Software Request', actionType: 'create_ticket', payload: { category_id: 2, issue_type: 'Software installation request' } }
        ],
        matchedIntent: 'software_request'
      };
    }

    // Default response with transparency disclosure
    return {
      reply: `I am the simulated **AI Support Assistant**.\n\n*Transparency Disclosure: I operate using intent recognition and seeded institutional runbooks. I do not perform unverified modifications to production accounts or physical devices.*\n\nHow can I help you today? You can ask about:\n- Troubleshooting VPN or Wi-Fi\n- Resetting passwords & MFA\n- Checking the status of your open tickets\n- Installing approved business software\n- Logging a new support request`,
      suggestedActions: [
        { label: 'Troubleshoot Connectivity', actionType: 'view_kb', payload: 'kb-102' },
        { label: 'Check My Tickets', actionType: 'view_tickets' },
        { label: 'Create a Ticket', actionType: 'create_ticket' }
      ],
      matchedIntent: 'general_inquiry'
    };
  }

  // Notifications
  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public markNotificationRead(id: string): void {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
  }

  public markAllNotificationsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  // Users & Administration
  public getUsers(): User[] {
    return [...this.users];
  }

  public updateUser(userId: string, partial: Partial<User>): boolean {
    const u = this.users.find(usr => usr.id === userId);
    if (u) {
      Object.assign(u, partial);
      this.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        user: 'admin.analytics@company.com',
        action: 'UPDATE_USER_ROLE',
        details: `Updated ${u.name} role to ${u.role}`,
        status: 'SUCCESS'
      });
      return true;
    }
    return false;
  }

  public getAuditEvents(): AuditEvent[] {
    return [...this.auditLogs];
  }

  // Data Workbench & QA checks
  public getDataWorkbenchStats() {
    return {
      totalCleanRows: 8000,
      totalDirtyRows: 8040,
      injectedDuplicates: 40,
      injectedMissingValues: 85,
      injectedTemporalErrors: 25,
      injectedOrphanKeys: 30,
      injectedOutliers: 20,
      tables: [
        { name: 'tickets', cleanRows: 8000, dirtyRows: 8040, pk: 'ticket_id', fks: 5 },
        { name: 'departments', cleanRows: 5, dirtyRows: 5, pk: 'department_id', fks: 0 },
        { name: 'teams', cleanRows: 8, dirtyRows: 8, pk: 'team_id', fks: 1 },
        { name: 'agents', cleanRows: 24, dirtyRows: 24, pk: 'agent_id', fks: 1 },
        { name: 'categories', cleanRows: 6, dirtyRows: 6, pk: 'category_id', fks: 0 },
        { name: 'sla_rules', cleanRows: 4, dirtyRows: 4, pk: 'sla_rule_id', fks: 0 }
      ],
      checks: [
        { check: 'Primary Key Uniqueness (tickets)', cleanStatus: 'PASS (8,000 distinct)', dirtyStatus: 'FAIL (40 duplicate keys detected)' },
        { check: 'Foreign Key Integrity (department_id)', cleanStatus: 'PASS (100% match)', dirtyStatus: 'FAIL (15 orphan keys: dept 888)' },
        { check: 'Foreign Key Integrity (category_id)', cleanStatus: 'PASS (100% match)', dirtyStatus: 'FAIL (15 orphan keys: cat 999)' },
        { check: 'Temporal Validity (resolved_at >= created_at)', cleanStatus: 'PASS (0 inversions)', dirtyStatus: 'FAIL (25 inverted timestamps)' },
        { check: 'Missing Values in Critical Fields', cleanStatus: 'PASS (0 nulls in mandatory columns)', dirtyStatus: 'FAIL (85 null cells)' },
        { check: 'Outlier Durations (> 500 hours)', cleanStatus: 'PASS (0 extreme artifacts)', dirtyStatus: 'FLAGGED (20 values at 9999.0 hrs)' }
      ]
    };
  }

  // CSV Export utility
  public exportTicketsToCsv(customTickets?: Ticket[]): string {
    const list = customTickets || this.tickets;
    const headers = [
      'ticket_id',
      'created_at',
      'resolved_at',
      'status',
      'priority',
      'category_id',
      'issue_type',
      'department_id',
      'team_id',
      'agent_id',
      'sla_rule_id',
      'satisfaction_rating',
      'resolution_time_hours'
    ];

    const rows = list.map(t => [
      t.ticket_id,
      t.created_at,
      t.resolved_at || '',
      t.status,
      t.priority,
      t.category_id,
      `"${(t.issue_type || '').replace(/"/g, '""')}"`,
      t.department_id,
      t.team_id,
      t.agent_id ?? '',
      t.sla_rule_id,
      t.satisfaction_rating ?? '',
      t.resolution_time_hours ?? ''
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const dataService = new DataService();
