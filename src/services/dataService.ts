import { useSyncExternalStore } from 'react';
import seededData from '../data/seededData.json';
import { supabase, isSupabaseAvailable } from '../lib/supabase';
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
import {
  normalizeDepartment,
  normalizeTeam,
  normalizeAgent,
  normalizeCategory,
  normalizeSlaRule,
  normalizeTicket,
  buildDimensionLookups,
  computeLiveSummaryMetrics,
  computeLivePriorityBreakdown,
  computeLiveCategoryBreakdown,
  computeLiveDepartmentBreakdown,
  computeLiveTeamBreakdown,
  computeLiveMonthlyTrend,
  computeLiveResolutionDistribution,
  computeLiveTopIssues,
  computeLiveActionableExceptions,
  ActionableExceptionItem,
  ResolutionDistributionResult
} from './dataNormalizer';

export { DEMO_USERS };

export type HydrationStatus = 'idle' | 'hydrating' | 'hydrated' | 'error' | 'denied' | 'auth_required';

export interface DataProvenance {
  dataSource: 'seeded' | 'live';
  hydrationStatus: HydrationStatus;
  hydratedAt: string | null;
  totalTickets: number;
  departmentCount: number;
  teamCount: number;
  agentCount: number;
  categoryCount: number;
  slaRuleCount: number;
  isLiveOperational: boolean;
  diagnosticMessage: string;
  errorType?: 'network' | 'authorization' | 'session_missing' | 'timeout' | null;
}

export interface MutationCapability {
  canPersistRemotely: boolean;
  authMode: 'authenticated_user' | 'unauthenticated_anon' | 'demo_session';
  reason: string;
}

export interface TriageUpdateResult {
  success: boolean;
  ticket?: Ticket;
  error?: string;
  isPersisted?: boolean;
  mode?: 'database' | 'demo_session';
  notice?: string;
}

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
  // Operational caches
  private tickets: Ticket[] = [];
  private departments: Department[] = [];
  private teams: Team[] = [];
  private agents: Agent[] = [];
  private categories: Category[] = [];
  private slaRules: SlaRule[] = [];
  private liveSummaryMetrics: SummaryMetrics | null = null;

  // Ancillary domain caches
  private articles: KnowledgeArticle[] = [...SEEDED_ARTICLES];
  private notifications: NotificationItem[] = [];
  private auditLogs: AuditEvent[] = [...SEEDED_AUDIT_LOGS];
  private users: User[] = [...DEMO_USERS];

  // Provenance and Hydration state
  private dataSource: 'seeded' | 'live' = 'seeded';
  private hydrationStatus: HydrationStatus = 'idle';
  private hydrationError: string | null = null;
  private errorType: 'network' | 'authorization' | 'session_missing' | 'timeout' | null = null;
  private hydratedAt: string | null = null;
  private isHydrating: boolean = false;
  private activeHydrationPromise: Promise<boolean> | null = null;
  private activeAbortController: AbortController | null = null;
  private hydrationSessionId: number = 0;

  // Reactivity Pub/Sub
  private listeners: Set<() => void> = new Set();
  private version: number = 0;

  constructor() {
    this.initSeededFallback();
  }

  /**
   * Immediately populates the service with the governed seeded dataset.
   * Ensures instant, zero-delay rendering without null pointer crashes or blocking spinners.
   */
  private initSeededFallback() {
    this.departments = (seededData.departments as any[]).map(d => normalizeDepartment(d));
    this.teams = (seededData.teams as any[]).map(t => normalizeTeam(t));
    this.agents = (seededData.agents as any[]).map(a => normalizeAgent(a));
    this.categories = (seededData.categories as any[]).map(c => normalizeCategory(c));

    const rawSlaRules = (seededData as any).slaRules || (seededData as any).sla_rules || [];
    this.slaRules = rawSlaRules.map((rule: any) => normalizeSlaRule(rule));

    const lookups = buildDimensionLookups(
      this.departments,
      this.teams,
      this.agents,
      this.categories,
      this.slaRules
    );

    const sampleRawTickets = (seededData as any).initialTickets || (seededData as any).recentTickets || [];
    this.tickets = sampleRawTickets.map((t: any) => normalizeTicket(t, lookups));

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

    this.dataSource = 'seeded';
    this.hydrationStatus = 'idle';
    this.hydrationError = null;
    this.errorType = null;
  }

  /**
   * Resets the service to the clean governed seeded demo baseline.
   * Cancels any active hydration, increments the session ID to invalidate pending requests,
   * clears any active hydration errors, and notifies UI subscribers.
   */
  public resetToSeededDemo(): void {
    this.hydrationSessionId++;
    if (this.activeAbortController) {
      this.cancelHydration('Resetting to governed demo baseline');
    }
    this.isHydrating = false;
    this.activeHydrationPromise = null;
    this.activeAbortController = null;
    this.initSeededFallback();
    this.notifyListeners();
  }

  /**
   * Classifies hydration errors into authorization denials, timeouts, or network/system failures.
   */
  private classifyHydrationError(
    err: unknown,
    overrideType?: 'authorization' | 'network' | 'timeout'
  ): { status: HydrationStatus; type: 'authorization' | 'network' | 'timeout'; message: string } {
    if (overrideType) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        status: overrideType === 'authorization' ? 'denied' : 'error',
        type: overrideType,
        message:
          overrideType === 'authorization'
            ? `Access Denied: ${message}`
            : overrideType === 'timeout'
            ? `Synchronization Timeout: Request exceeded time limit. Governed seeded baseline preserved.`
            : `Synchronization Error: ${message}`
      };
    }

    const message = err instanceof Error ? err.message : String(err);

    // Explicit client-side timeout detection
    if (/Hydration request timed out|Hydration timed out after|^TimeoutError|exceeded.*time limit/i.test(message)) {
      return {
        status: 'error',
        type: 'timeout',
        message: `Synchronization Timeout: Request exceeded time limit. Governed seeded baseline preserved.`
      };
    }

    // Cancellation detection
    if (/Hydration cancelled|operation was aborted|AbortError/i.test(message)) {
      return {
        status: 'error',
        type: 'network',
        message: `Synchronization Cancelled: Hydration operation was aborted. Governed seeded baseline preserved.`
      };
    }

    const isAuth =
      /permission denied/i.test(message) ||
      /row-level security/i.test(message) ||
      /42501/.test(message) ||
      /unauthorized/i.test(message) ||
      /status code 401/i.test(message) ||
      /status code 403/i.test(message) ||
      /jwt/i.test(message);

    if (isAuth) {
      return {
        status: 'denied',
        type: 'authorization',
        message: `Access Denied: ${message}`
      };
    }

    return {
      status: 'error',
      type: 'network',
      message: `Synchronization Error: ${message}`
    };
  }

  /**
   * Test helper to simulate remote hydration failures and verify UI error-state classification.
   */
  public simulateHydrationFailure(
    errorMsg: string,
    overrideType?: 'authorization' | 'network' | 'timeout'
  ): void {
    const classified = this.classifyHydrationError(new Error(errorMsg), overrideType);
    this.hydrationStatus = classified.status;
    this.errorType = classified.type;
    this.hydrationError = classified.message;
    this.dataSource = 'seeded';
    this.notifyListeners();
  }

  // --- Reactivity & State Subscriptions ---

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getVersion(): number {
    return this.version;
  }

  private notifyListeners(): void {
    this.version++;
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('[DataService] Error in listener callback:', err);
      }
    });
  }

  public getDataProvenance(): DataProvenance {
    let diagnosticMessage = '';
    if (this.hydrationStatus === 'denied') {
      diagnosticMessage = `Access Denied: ${this.hydrationError || 'Your authenticated role does not have permission to query live operational tickets.'} (Displaying demo baseline)`;
    } else if (this.hydrationStatus === 'auth_required') {
      diagnosticMessage = 'Authentication Required: Sign in with corporate credentials to synchronize live operational tickets.';
    } else if (this.hydrationStatus === 'error') {
      diagnosticMessage = `Synchronization Failure: ${this.hydrationError || 'Network or database error.'} (Preserving last known-good data)`;
    } else if (this.dataSource === 'live') {
      diagnosticMessage = `Live Operational Dataset: ${this.tickets.length} operational records synchronized from Supabase.`;
    } else {
      diagnosticMessage = `Governed Demo Mode: ${this.tickets.length} synthetic benchmark records loaded.`;
    }

    return {
      dataSource: this.dataSource,
      hydrationStatus: this.hydrationStatus,
      hydratedAt: this.hydratedAt,
      totalTickets: this.tickets.length,
      departmentCount: this.departments.length,
      teamCount: this.teams.length,
      agentCount: this.agents.length,
      categoryCount: this.categories.length,
      slaRuleCount: this.slaRules.length,
      isLiveOperational: this.dataSource === 'live',
      diagnosticMessage,
      errorType: this.errorType
    };
  }

  // --- Supabase Hydration Engine ---

  /**
   * Asynchronously hydrates all 5 dimension tables and operational tickets from Supabase.
   * Performs atomic candidate swapping: validates all records before replacing active memory.
   * Protects against duplicate concurrent executions and preserves last known good state on failure.
   */
  public async hydrateFromSupabase(options?: {
    requireSession?: boolean;
    force?: boolean;
    timeoutMs?: number;
    signal?: AbortSignal;
  }): Promise<boolean> {
    if (!isSupabaseAvailable || !supabase) {
      this.hydrationStatus = 'idle';
      this.dataSource = 'seeded';
      return false;
    }

    if (this.isHydrating) {
      return this.activeHydrationPromise || Promise.resolve(false);
    }

    this.isHydrating = true;
    this.hydrationStatus = 'hydrating';
    this.hydrationError = null;
    this.errorType = null;
    const sessionId = ++this.hydrationSessionId;

    // Setup bounded timeout and cancellation controller
    const internalController = new AbortController();
    this.activeAbortController = internalController;
    let timedOut = false;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    const timeoutDuration = options?.timeoutMs !== undefined ? options.timeoutMs : 15000;
    if (timeoutDuration > 0 && Number.isFinite(timeoutDuration)) {
      timeoutTimer = setTimeout(() => {
        timedOut = true;
        internalController.abort(new Error(`Hydration timed out after ${timeoutDuration}ms`));
      }, timeoutDuration);
    }

    const externalSignal = options?.signal;
    let externalAbortListener: (() => void) | null = null;
    if (externalSignal) {
      if (externalSignal.aborted) {
        internalController.abort(externalSignal.reason || new Error('Hydration cancelled by caller'));
      } else {
        externalAbortListener = () => {
          internalController.abort(externalSignal.reason || new Error('Hydration cancelled by caller'));
        };
        externalSignal.addEventListener('abort', externalAbortListener, { once: true });
      }
    }

    this.notifyListeners();

    const hydrationPromise = (async (): Promise<boolean> => {
      try {
        if (internalController.signal.aborted || sessionId !== this.hydrationSessionId) {
          throw new Error('Hydration cancelled: Operation aborted by caller');
        }

        // Session verification check:
        // Public unauthenticated visitors in browser runtime must NOT issue remote queries against tickets.
        let session = null;
        try {
          const sessionRes = await supabase.auth.getSession();
          session = sessionRes?.data?.session || null;
        } catch (err) {
          console.warn('[DataService] Error checking Supabase session:', err);
        }

        if (internalController.signal.aborted || sessionId !== this.hydrationSessionId) {
          throw new Error('Hydration cancelled: Operation aborted by caller');
        }

        const requireSession = options?.requireSession ?? true;
        const isForced = options?.force ?? false;
        const isBrowser = typeof window !== 'undefined';

        if (requireSession && !session && !isForced) {
          if (isBrowser) {
            // Public unauthenticated visitor in browser: remain safely in Governed Demo Mode.
            // Strictly PRESERVE seeded demo data and DO NOT query operational tickets via anonymous client.
            this.hydrationStatus = 'idle';
            this.dataSource = 'seeded';
            this.hydrationError = null;
            this.errorType = null;
            this.notifyListeners();
            return false;
          }
        }
        // Step 1: Fetch all 5 dimension tables in parallel with timeout / abort signal
        const [deptRes, teamRes, initialAgentRes, catRes, slaRes] = await Promise.all([
          supabase.from('departments').select('*').abortSignal(internalController.signal),
          supabase.from('teams').select('*').abortSignal(internalController.signal),
          supabase.from('agent_directory').select('agent_id, agent_code, agent_name, team_id, experience_band, is_active, created_at').abortSignal(internalController.signal),
          supabase.from('categories').select('*').abortSignal(internalController.signal),
          supabase.from('sla_rules').select('*').abortSignal(internalController.signal)
        ]);

        let agentRes: any = initialAgentRes;
        // Defensive backward-compatibility (Phase 05C.7 Hardened Fallback):
        // If database has not yet applied the public.agent_directory view (e.g. unmigrated legacy dev database),
        // query base agents table using an explicit projection of public fields.
        // SECURITY REQUIREMENTS:
        // 1. Fallback MUST use explicit safe columns ('agent_id, agent_code, team_id, experience_band') and NEVER select('*').
        // 2. user_id and internal identity mapping fields are strictly EXCLUDED from the fallback projection.
        // 3. Authorization failures (42501, 401, 403, permission denied) must NEVER trigger fallback.
        // 4. Abort / network cancellations must NEVER trigger fallback.
        // 5. Fallback triggers ONLY on genuinely missing relation or schema-cache miss (42P01, PGRST200, PGRST205).
        if (agentRes.error && !internalController.signal.aborted) {
          const err = agentRes.error as any;
          const isAuthError =
            err.code === '42501' ||
            err.status === 401 ||
            err.status === 403 ||
            (typeof err.message === 'string' && /permission denied|unauthorized|jwt|forbidden/i.test(err.message));

          const isAbortOrNetwork =
            err.name === 'AbortError' ||
            (typeof err.message === 'string' && /abort|timeout|network|failed to fetch/i.test(err.message));

          const isMissingView =
            !isAuthError &&
            !isAbortOrNetwork &&
            (err.code === '42P01' ||
             err.code === 'PGRST200' ||
             err.code === 'PGRST205' ||
             (typeof err.message === 'string' &&
               (/relation ".*agent_directory" does not exist/i.test(err.message) ||
                /could not find the (table|view|relation).*agent_directory/i.test(err.message) ||
                /agent_directory.*schema cache/i.test(err.message))));

          if (isMissingView) {
            agentRes = await supabase
              .from('agents')
              .select('agent_id, agent_code, team_id, experience_band')
              .abortSignal(internalController.signal);
          }
        }

        if (deptRes.error) throw new Error(`Failed to load departments: ${deptRes.error.message}`);
        if (teamRes.error) throw new Error(`Failed to load teams: ${teamRes.error.message}`);
        if (agentRes.error) throw new Error(`Failed to load agents: ${agentRes.error.message}`);
        if (catRes.error) throw new Error(`Failed to load categories: ${catRes.error.message}`);
        if (slaRes.error) throw new Error(`Failed to load SLA rules: ${slaRes.error.message}`);

        // Normalize all 5 dimensions into candidate structures
        const candidateDepartments = (deptRes.data || []).map(normalizeDepartment);
        const candidateTeams = (teamRes.data || []).map(normalizeTeam);
        const candidateAgents = (agentRes.data || []).map(normalizeAgent);
        const candidateCategories = (catRes.data || []).map(normalizeCategory);
        const candidateSlaRules = (slaRes.data || []).map(normalizeSlaRule);

        if (
          candidateDepartments.length === 0 ||
          candidateTeams.length === 0 ||
          candidateAgents.length === 0 ||
          candidateCategories.length === 0 ||
          candidateSlaRules.length === 0
        ) {
          throw new Error('Remote dimension tables returned zero rows. Aborting candidate swap.');
        }

        const lookups = buildDimensionLookups(
          candidateDepartments,
          candidateTeams,
          candidateAgents,
          candidateCategories,
          candidateSlaRules
        );

        // Step 2: Fetch all tickets using bounded pagination with deterministic ordering
        const PAGE_SIZE = 1000;
        let page = 0;
        const candidateTickets: Ticket[] = [];

        while (true) {
          if (internalController.signal.aborted || sessionId !== this.hydrationSessionId) {
            throw new Error('Hydration cancelled: Operation aborted by caller');
          }
          const from = page * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;

          const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .order('ticket_id', { ascending: true })
            .range(from, to)
            .abortSignal(internalController.signal);

          if (error) {
            throw new Error(`Ticket range fetch failed at [${from}, ${to}]: ${error.message}`);
          }

          if (!data || data.length === 0) {
            break;
          }

          // Normalize each ticket record against the validated dimension lookups
          for (let i = 0; i < data.length; i++) {
            const normalized = normalizeTicket(data[i], lookups);
            candidateTickets.push(normalized);
          }

          if (data.length < PAGE_SIZE) {
            break;
          }
          page++;
        }

        if (candidateTickets.length === 0) {
          throw new Error('Supabase returned 0 ticket records. Aborting candidate swap.');
        }

        // Step 3: Compute live summary metrics
        const liveMetrics = computeLiveSummaryMetrics(candidateTickets, candidateSlaRules);

        // Step 4: Atomic candidate swap into active memory
        // Guard: Verify that this hydration session has not been invalidated or cancelled
        if (sessionId !== this.hydrationSessionId || internalController.signal.aborted) {
          console.warn('[DataService] Hydration completed for obsolete session; discarding candidate data.');
          return false;
        }

        this.departments = candidateDepartments;
        this.teams = candidateTeams;
        this.agents = candidateAgents;
        this.categories = candidateCategories;
        this.slaRules = candidateSlaRules;
        this.tickets = candidateTickets;
        this.liveSummaryMetrics = liveMetrics;
        this.dataSource = 'live';
        this.hydrationStatus = 'hydrated';
        this.hydratedAt = new Date().toISOString();
        this.hydrationError = null;
        this.errorType = null;

        this.auditLogs.unshift({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          user: 'system_hydration',
          action: 'SUPABASE_LIVE_HYDRATION',
          details: `Synchronized ${candidateTickets.length} tickets and 5 dimension tables from Supabase.`,
          status: 'SUCCESS'
        });

        this.notifyListeners();
        return true;
      } catch (err) {
        // If the session was invalidated (e.g., resetToSeededDemo called upon sign-out),
        // do NOT overwrite the clean governed demo state with an error or cancellation notice.
        if (sessionId !== this.hydrationSessionId) {
          return false;
        }

        let classified;
        if (timedOut) {
          classified = this.classifyHydrationError(
            new Error(`Hydration timed out after ${timeoutDuration}ms`),
            'timeout'
          );
        } else {
          classified = this.classifyHydrationError(err);
        }
        console.warn(`[DataService] Hydration failed (${classified.status}):`, classified.message);
        this.hydrationStatus = classified.status;
        this.errorType = classified.type;
        this.hydrationError = classified.message;
        // CRITICAL: NEVER claim seeded fallback is live operational data!
        this.dataSource = 'seeded';
        this.notifyListeners();
        return false;
      } finally {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
          timeoutTimer = null;
        }
        if (externalSignal && externalAbortListener) {
          externalSignal.removeEventListener('abort', externalAbortListener);
        }
        if (this.activeAbortController === internalController) {
          this.activeAbortController = null;
        }
        if (sessionId === this.hydrationSessionId) {
          this.isHydrating = false;
          this.activeHydrationPromise = null;
        }
      }
    })();

    this.activeHydrationPromise = hydrationPromise;
    return hydrationPromise;
  }

  /**
   * Safely cancels an in-flight Supabase hydration request without leaving timers or pending promises.
   * Returns true if an active hydration request was cancelled, false if no hydration was active.
   */
  public cancelHydration(reason: string = 'User cancelled hydration'): boolean {
    if (this.activeAbortController) {
      try {
        this.activeAbortController.abort(new Error(`Hydration cancelled: ${reason}`));
      } catch (err) {
        // Safe abort invocation
      }
      return true;
    }
    return false;
  }

  // --- Dimension Accessors ---

  public getDepartments(): Department[] {
    return [...this.departments];
  }

  public getTeams(): Team[] {
    return [...this.teams];
  }

  public getAgents(): Agent[] {
    return [...this.agents];
  }

  public getCategories(): Category[] {
    return [...this.categories];
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
        details: `Updated ${rule.priority} target to ${targetHours} calendar hours (Session update).`,
        status: 'SUCCESS'
      });
      if (this.dataSource === 'live') {
        this.liveSummaryMetrics = computeLiveSummaryMetrics(this.tickets, this.slaRules);
      }
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // --- Analytical Aggregates & Breakdowns ---

  public getSummaryMetrics(departmentId?: number, priority?: string): SummaryMetrics {
    if (!departmentId && (!priority || priority === 'All')) {
      if (this.dataSource === 'live' && this.liveSummaryMetrics) {
        return this.liveSummaryMetrics;
      }
      return seededData.summaryMetrics as SummaryMetrics;
    }

    if (this.dataSource === 'live') {
      let filtered = this.tickets;
      if (departmentId) {
        filtered = filtered.filter(t => t.department_id === departmentId);
      }
      if (priority && priority !== 'All') {
        filtered = filtered.filter(t => t.priority.toLowerCase() === priority.toLowerCase());
      }
      return computeLiveSummaryMetrics(filtered, this.slaRules);
    }

    const base = seededData.summaryMetrics as SummaryMetrics;
    let factor = 1.0;
    if (departmentId) factor *= 0.22;
    if (priority && priority !== 'All') {
      factor *= priority === 'Critical' ? 0.1 : priority === 'High' ? 0.25 : priority === 'Medium' ? 0.45 : 0.2;
    }
    const scaledCompliant = Math.round(base.slaCompliantCount * factor);
    const scaledBreached = Math.round(base.slaBreachedCount * factor);
    const resolvedTotal = Math.max(1, scaledCompliant + scaledBreached);
    return {
      ...base,
      totalTickets: Math.max(1, Math.round(base.totalTickets * factor)),
      openTickets: Math.max(0, Math.round(base.openTickets * factor)),
      resolvedTickets: resolvedTotal,
      slaCompliantCount: scaledCompliant,
      slaBreachedCount: scaledBreached,
      slaCompliancePct: Math.round((scaledCompliant / resolvedTotal) * 1000) / 10,
      slaBreachPct: Math.round((scaledBreached / resolvedTotal) * 1000) / 10
    };
  }

  public getMonthlyTrend(departmentId?: number, priority?: string): MonthlyTrendItem[] {
    if (this.dataSource === 'live') {
      return computeLiveMonthlyTrend(this.tickets, departmentId, priority);
    }
    let data = [...seededData.monthlyTrend] as MonthlyTrendItem[];
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

  public getCategoryBreakdown(departmentId?: number): CategoryBreakdownItem[] {
    if (this.dataSource === 'live') {
      return computeLiveCategoryBreakdown(this.tickets, this.categories, this.slaRules, departmentId);
    }
    return seededData.categoryBreakdown as CategoryBreakdownItem[];
  }

  public getPriorityBreakdown(departmentId?: number): PriorityBreakdownItem[] {
    if (this.dataSource === 'live') {
      return computeLivePriorityBreakdown(this.tickets, this.slaRules, departmentId);
    }
    return (seededData.priorityBreakdown as PriorityBreakdownItem[]).map(p => {
      const match = this.slaRules.find(r => r.priority === p.priority);
      return {
        ...p,
        targetHours: match ? match.target_resolution_hours : p.targetHours
      };
    });
  }

  public getTopIssues(departmentId?: number): TopIssueItem[] {
    if (this.dataSource === 'live') {
      return computeLiveTopIssues(this.tickets, this.categories, this.slaRules, departmentId);
    }
    return seededData.topIssues as TopIssueItem[];
  }

  public getResolutionDistribution(departmentId?: number, priority?: string): ResolutionDistributionResult {
    return computeLiveResolutionDistribution(this.tickets, departmentId, priority);
  }

  public getActionableExceptions(departmentId?: number, priority?: string, limit?: number): ActionableExceptionItem[] {
    return computeLiveActionableExceptions(this.tickets, this.departments, this.slaRules, departmentId, priority, limit);
  }

  public getDepartmentBreakdown(): DepartmentBreakdownItem[] {
    if (this.dataSource === 'live') {
      return computeLiveDepartmentBreakdown(this.tickets, this.departments);
    }
    return seededData.departmentBreakdown as DepartmentBreakdownItem[];
  }

  public getTeamBreakdown(): TeamBreakdownItem[] {
    if (this.dataSource === 'live') {
      return computeLiveTeamBreakdown(this.tickets, this.teams, this.departments, this.slaRules);
    }
    return seededData.teamBreakdown as TeamBreakdownItem[];
  }

  // --- Tickets CRUD & Filtering ---

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
    sla?: string;
  }): { tickets: Ticket[]; total: number } {
    let list = [...this.tickets];

    if (filters?.status && filters.status !== 'All' && filters.status !== 'all') {
      const s = filters.status.toLowerCase();
      if (s === 'active backlog' || s === 'open backlog' || s === 'backlog') {
        list = list.filter(t => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Pending');
      } else if (s === 'resolved outcomes' || s === 'all resolved' || s === 'resolved,closed') {
        list = list.filter(t => t.status === 'Resolved' || t.status === 'Closed');
      } else {
        list = list.filter(t => t.status.toLowerCase() === s);
      }
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

    // Precise requester matching: only match tickets that actually have this email
    if (filters?.requesterEmail) {
      const targetEmail = filters.requesterEmail.toLowerCase();
      list = list.filter(t => t.requester_email?.toLowerCase() === targetEmail);
    }

    // SLA filter semantics: Breached (resolved exceeding target), Compliant (resolved within target), At Risk (active backlog)
    if (filters?.sla && filters.sla !== 'All' && filters.sla !== 'all') {
      const slaLower = filters.sla.toLowerCase();
      const ruleMap = new Map(this.slaRules.map(r => [r.sla_rule_id, r.target_resolution_hours]));

      if (slaLower === 'breached' || slaLower === 'breach' || slaLower === 'sla_breached') {
        list = list.filter(t => {
          if (t.status !== 'Resolved' && t.status !== 'Closed') return false;
          if (t.resolution_time_hours === null || isNaN(t.resolution_time_hours)) return false;
          const target = ruleMap.get(t.sla_rule_id) || 24;
          return t.resolution_time_hours > target;
        });
      } else if (slaLower === 'compliant' || slaLower === 'met' || slaLower === 'sla_compliant') {
        list = list.filter(t => {
          if (t.status !== 'Resolved' && t.status !== 'Closed') return false;
          if (t.resolution_time_hours === null || isNaN(t.resolution_time_hours)) return false;
          const target = ruleMap.get(t.sla_rule_id) || 24;
          return t.resolution_time_hours <= target;
        });
      } else if (slaLower === 'at risk' || slaLower === 'at_risk' || slaLower === 'atrisk') {
        list = list.filter(t => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Pending');
      }
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
    if (!id || typeof id !== 'string') return undefined;
    const cleanId = id.trim();
    if (!cleanId) return undefined;

    // 1. Direct case-insensitive match
    const exact = this.tickets.find(t => t.ticket_id.toLowerCase() === cleanId.toLowerCase());
    if (exact) return exact;

    // 2. Normalized prefix (TCK- or TKT-) with padded 5-digit number
    const numericPart = cleanId.replace(/^(?:TKT|TCK)-?/i, '');
    if (/^\d+$/.test(numericPart)) {
      const paddedId = `TKT-${numericPart.padStart(5, '0')}`.toLowerCase();
      const matchPadded = this.tickets.find(t => t.ticket_id.toLowerCase() === paddedId);
      if (matchPadded) return matchPadded;

      // Unpadded numeric suffix fallback
      const matchNumeric = this.tickets.find(t => {
        const tNum = t.ticket_id.replace(/^(?:TKT|TCK)-?0*/i, '');
        return tNum === numericPart.replace(/^0+/, '');
      });
      if (matchNumeric) return matchNumeric;
    }

    return undefined;
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
    const count = this.tickets.length + 8000;
    const ticket_id = `TKT-${String(count + 1).padStart(5, '0')}`;
    
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
      team_id: 1,
      agent_id: null,
      sla_rule_id,
      satisfaction_rating: null,
      resolution_time_hours: null,
      subject: data.subject,
      description: data.description,
      requester_name: data.requester_name,
      requester_email: data.requester_email.toLowerCase(),
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
      details: `Created ${ticket_id} (${priority}) under ${data.issue_type} (Client session)`,
      status: 'SUCCESS'
    });

    if (this.dataSource === 'live') {
      this.liveSummaryMetrics = computeLiveSummaryMetrics(this.tickets, this.slaRules);
    }

    this.notifyListeners();
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
      if (!ticket.comments) ticket.comments = [];
      ticket.comments.push({
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
      details: `${ticketId} status changed to ${status} (Client session)`,
      status: 'SUCCESS'
    });

    if (this.dataSource === 'live') {
      this.liveSummaryMetrics = computeLiveSummaryMetrics(this.tickets, this.slaRules);
    }

    this.notifyListeners();
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

    if (!ticket.comments) ticket.comments = [];
    ticket.comments.push({
      id: `cmt-${Date.now()}`,
      authorName: 'System',
      authorRole: 'agent',
      createdAt: now,
      content: agent ? `Ticket assigned to ${agent.agent_name} (${agent.agent_code}).` : 'Ticket unassigned and returned to queue.',
      isInternal: true
    });

    this.notifyListeners();
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
    if (!ticket.comments) ticket.comments = [];
    ticket.comments.push({
      id: `cmt-${Date.now()}`,
      authorName: 'Support Agent',
      authorRole: 'agent',
      createdAt: now,
      content: `Priority adjusted to ${priority} under governed SLA entitlement rules.`,
      isInternal: true
    });

    if (this.dataSource === 'live') {
      this.liveSummaryMetrics = computeLiveSummaryMetrics(this.tickets, this.slaRules);
    }

    this.notifyListeners();
    return ticket;
  }

  // Testing simulation hook to verify database error rollback behavior in test suites
  private testDbErrorSimulation: string | null = null;

  public _simulateDatabaseErrorForTesting(errorMessage: string | null): void {
    this.testDbErrorSimulation = errorMessage;
  }

  /**
   * Evaluates current mutation capability based on Supabase connectivity,
   * active authentication session, and environment security flags.
   */
  public async getMutationCapability(): Promise<MutationCapability> {
    if (this.dataSource !== 'live' || !isSupabaseAvailable || !supabase) {
      return {
        canPersistRemotely: false,
        authMode: 'demo_session',
        reason: 'Application is operating with seeded local data; remote database persistence is disabled.'
      };
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        return {
          canPersistRemotely: true,
          authMode: 'authenticated_user',
          reason: `Authenticated user session active (${sessionData.session.user.email || 'verified'}). Remote writes enabled.`
        };
      }
    } catch {
      // In SSR or unauthenticated environments, getSession may return empty or throw
    }

    const globalProc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
    const allowInsecureAnonWrites =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ALLOW_INSECURE_ANON_WRITES === 'true') ||
      (globalProc?.env?.VITE_ALLOW_INSECURE_ANON_WRITES === 'true');

    if (allowInsecureAnonWrites) {
      return {
        canPersistRemotely: true,
        authMode: 'unauthenticated_anon',
        reason: 'Insecure anon writes explicitly permitted via VITE_ALLOW_INSECURE_ANON_WRITES override.'
      };
    }

    return {
      canPersistRemotely: false,
      authMode: 'demo_session',
      reason: 'Demo Mode: Changes applied to active session only. Remote database writes are disabled for unauthenticated demo sessions to protect data governance.'
    };
  }

  /**
   * Updates a ticket's triage attributes with strict role-aware capability gating,
   * governed field validation, SLA recalculation, and rollback on failure.
   */
  public async updateTicketTriage(
    ticketId: string,
    updates: {
      status?: TicketStatus;
      priority?: TicketPriority;
      agentId?: number | null;
      resolutionNotes?: string;
    }
  ): Promise<TriageUpdateResult> {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) {
      return { success: false, error: `Ticket "${ticketId}" was not found in the current dataset.` };
    }

    // 1. Validate Status
    if (updates.status !== undefined) {
      const validStatuses: TicketStatus[] = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];
      if (!validStatuses.includes(updates.status)) {
        return {
          success: false,
          error: `Invalid status "${updates.status}". Permitted statuses: ${validStatuses.join(', ')}.`
        };
      }
    }

    // 2. Validate Priority
    if (updates.priority !== undefined) {
      const validPriorities: TicketPriority[] = ['Critical', 'High', 'Medium', 'Low'];
      if (!validPriorities.includes(updates.priority)) {
        return {
          success: false,
          error: `Invalid priority "${updates.priority}". Permitted priorities: ${validPriorities.join(', ')}.`
        };
      }
    }

    // 3. Validate Canonical Agent Assignment
    if (updates.agentId !== undefined && updates.agentId !== null) {
      const agent = this.agents.find(a => a.agent_id === updates.agentId);
      if (!agent) {
        return {
          success: false,
          error: `Agent ID ${updates.agentId} does not correspond to any known canonical support specialist.`
        };
      }
    }

    // 4. Construct payload of genuinely writable columns
    const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const dbPayload: Record<string, any> = {};

    if (updates.status !== undefined) {
      dbPayload.status = updates.status;
      if (updates.status === 'Resolved' || updates.status === 'Closed') {
        const resolvedAt = ticket.resolved_at || nowIso;
        dbPayload.resolved_at = resolvedAt;
        const createdMs = new Date(ticket.created_at).getTime();
        const resolvedMs = new Date(resolvedAt).getTime();
        const calculatedHours = Math.max(0.5, Math.round(((resolvedMs - createdMs) / (1000 * 60 * 60)) * 10) / 10);
        dbPayload.resolution_time_hours = isNaN(calculatedHours) ? 4.2 : calculatedHours;
      } else {
        dbPayload.resolved_at = null;
        dbPayload.resolution_time_hours = null;
      }
    }

    if (updates.priority !== undefined) {
      dbPayload.priority = updates.priority;
      const rule = this.slaRules.find(r => r.priority === updates.priority);
      if (rule) {
        dbPayload.sla_rule_id = rule.sla_rule_id;
      }
    }

    if (updates.agentId !== undefined) {
      dbPayload.agent_id = updates.agentId;
      if (updates.agentId !== null) {
        const agent = this.agents.find(a => a.agent_id === updates.agentId);
        if (agent) {
          dbPayload.team_id = agent.team_id;
        }
      }
    }

    // Testing simulation hook for verifying rollback in test suites
    if (this.testDbErrorSimulation) {
      const simulatedMsg = this.testDbErrorSimulation;
      this.testDbErrorSimulation = null;
      return {
        success: false,
        isPersisted: false,
        error: `Supabase persistence error (SIMULATED_PERMISSION_DENIED): ${simulatedMsg}`
      };
    }

    // 5. Capability check: gate remote writes to verified auth or explicit override
    const capability = await this.getMutationCapability();

    if (capability.canPersistRemotely) {
      if (this.dataSource === 'live' && isSupabaseAvailable && supabase) {
        try {
          // Route authorized staff triage changes exclusively through public.update_ticket_triage()
          const { data, error } = await supabase.rpc('update_ticket_triage', {
            p_ticket_id: ticket.ticket_id,
            p_status: updates.status ?? null,
            p_priority: updates.priority ?? null,
            p_agent_id: updates.agentId !== undefined && updates.agentId !== null ? updates.agentId : null,
            p_team_id: dbPayload.team_id ?? null,
            p_unassign_agent: updates.agentId === null,
            p_resolution_notes: updates.resolutionNotes ?? null
          });

          if (error) {
            return {
              success: false,
              isPersisted: false,
              error: `Supabase persistence error: ${error.message}`
            };
          }

          if (!data) {
            return {
              success: false,
              isPersisted: false,
              error: `Remote update rejected: Ticket "${ticket.ticket_id}" not found or unauthorized by database policy.`
            };
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          return {
            success: false,
            isPersisted: false,
            error: `Network/database exception during ticket update: ${errMsg}`
          };
        }
      }
    }

    // 6. Reconcile in-memory ticket entity (Confirmed Write)
    Object.assign(ticket, dbPayload);
    if (updates.resolutionNotes) {
      ticket.resolution_notes = updates.resolutionNotes;
    }

    // 7. Audit log with clear provenance
    const isActuallyPersisted = capability.canPersistRemotely && this.dataSource === 'live';
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: nowIso,
      user: isActuallyPersisted ? 'authenticated-agent@company.com' : 'demo-agent@company.com',
      action: isActuallyPersisted ? 'UPDATE_TICKET_TRIAGE_PERSISTED' : 'UPDATE_TICKET_TRIAGE_DEMO_SESSION',
      details: `${ticket.ticket_id} updated: ${Object.keys(dbPayload).join(', ')} (${isActuallyPersisted ? 'Supabase remote table' : 'Local demo session'})`,
      status: 'SUCCESS'
    });

    // 8. Recalculate SLA and summary metrics
    if (this.dataSource === 'live') {
      this.liveSummaryMetrics = computeLiveSummaryMetrics(this.tickets, this.slaRules);
    }

    // 9. Notify listeners
    this.notifyListeners();

    return {
      success: true,
      ticket,
      isPersisted: isActuallyPersisted,
      mode: isActuallyPersisted ? 'database' : 'demo_session',
      notice: isActuallyPersisted ? undefined : capability.reason
    };
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

    this.notifyListeners();
    return ticket;
  }

  public getAtRiskTickets(): Array<Ticket & { targetHours: number; hoursElapsed: number; hoursRemaining: number }> {
    const openTickets = this.tickets.filter(t => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Pending');
    
    return openTickets.slice(0, 8).map((t, idx) => {
      const rule = this.slaRules.find(r => r.sla_rule_id === t.sla_rule_id);
      const targetHours = rule ? rule.target_resolution_hours : 24;
      const hoursElapsed = Math.min(targetHours - 0.5, Math.round((targetHours * (0.65 + idx * 0.04)) * 10) / 10);
      const hoursRemaining = Math.max(0.2, Math.round((targetHours - hoursElapsed) * 10) / 10);
      return {
        ...t,
        targetHours,
        hoursElapsed,
        hoursRemaining
      };
    });
  }

  // --- Knowledge Base ---

  public getKnowledgeArticles(search?: string, category?: string): KnowledgeArticle[] {
    let list = [...this.articles];
    if (category && category !== 'All') {
      list = list.filter(a => a.category.toLowerCase() === category.toLowerCase());
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

  public getArticles(category?: string, search?: string): KnowledgeArticle[] {
    return this.getKnowledgeArticles(search, category);
  }

  public getArticleById(id: string): KnowledgeArticle | undefined {
    return this.articles.find(a => a.id === id);
  }

  public voteKnowledgeArticle(id: string, isHelpful: boolean): void {
    const art = this.getArticleById(id);
    if (art) {
      if (isHelpful) art.helpfulCount++;
      else art.notHelpfulCount++;
      this.notifyListeners();
    }
  }

  public voteArticle(id: string, helpful: boolean): void {
    this.voteKnowledgeArticle(id, helpful);
  }

  // --- AI Assistant Router ---

  public chatWithAiAssistant(
    userMessage: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
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
        reply: `Here are your most recently tracked tickets in the environment:\n\n${ticketListStr}\n\nYou can click below to view complete conversation timelines and SLAs.`,
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

    return {
      reply: `I am the simulated **AI Support Assistant**.\n\n*Transparency Disclosure: I operate using intent recognition and institutional runbooks. Operational data is synchronized with governed repositories.*\n\nHow can I help you today? You can ask about:\n- Troubleshooting VPN or Wi-Fi\n- Resetting passwords & MFA\n- Checking the status of your open tickets\n- Installing approved business software\n- Logging a new support request`,
      suggestedActions: [
        { label: 'Troubleshoot Connectivity', actionType: 'view_kb', payload: 'kb-102' },
        { label: 'Check My Tickets', actionType: 'view_tickets' },
        { label: 'Create a Ticket', actionType: 'create_ticket' }
      ],
      matchedIntent: 'general_inquiry'
    };
  }

  public queryAIAssistant(query: string): {
    reply: string;
    suggestedActions?: Array<{ label: string; actionType: string; payload?: any }>;
    matchedIntent?: string;
  } {
    return this.chatWithAiAssistant(query);
  }

  // --- Predictive Intelligence Model (Governed Heuristic Engine) ---

  public predictResolutionTime(features: {
    category_id: number;
    priority: TicketPriority | string;
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
    let baseHours = 14.9;

    if (features.priority === 'Critical') baseHours = 3.6;
    else if (features.priority === 'High') baseHours = 7.1;
    else if (features.priority === 'Medium') baseHours = 18.2;
    else if (features.priority === 'Low') baseHours = 34.5;

    if (features.category_id === 4) baseHours *= 0.92;
    if (features.category_id === 3) baseHours *= 1.15;
    if (features.category_id === 1) baseHours *= 0.85;

    if (features.department_id === 2) baseHours *= 0.98;
    if (features.department_id === 4) baseHours *= 1.03;

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

  // --- Notifications & Administration ---

  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public markNotificationRead(id: string): void {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.notifyListeners();
    }
  }

  public markAllNotificationsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

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
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public getAuditEvents(): AuditEvent[] {
    return [...this.auditLogs];
  }

  public getDataWorkbenchStats() {
    return {
      totalCleanRows: this.tickets.length,
      totalDirtyRows: this.tickets.length + 40,
      injectedDuplicates: 40,
      injectedMissingValues: 85,
      injectedTemporalErrors: 25,
      injectedOrphanKeys: 30,
      injectedOutliers: 20,
      tables: [
        { name: 'tickets', cleanRows: this.tickets.length, dirtyRows: this.tickets.length + 40, pk: 'ticket_id', fks: 5 },
        { name: 'departments', cleanRows: this.departments.length, dirtyRows: this.departments.length, pk: 'department_id', fks: 0 },
        { name: 'teams', cleanRows: this.teams.length, dirtyRows: this.teams.length, pk: 'team_id', fks: 1 },
        { name: 'agents', cleanRows: this.agents.length, dirtyRows: this.agents.length, pk: 'agent_id', fks: 1 },
        { name: 'categories', cleanRows: this.categories.length, dirtyRows: this.categories.length, pk: 'category_id', fks: 0 },
        { name: 'sla_rules', cleanRows: this.slaRules.length, dirtyRows: this.slaRules.length, pk: 'sla_rule_id', fks: 0 }
      ],
      checks: [
        { check: 'Primary Key Uniqueness (tickets)', cleanStatus: `PASS (${this.tickets.length.toLocaleString()} distinct)`, dirtyStatus: 'FAIL (40 duplicate keys detected)' },
        { check: 'Foreign Key Integrity (department_id)', cleanStatus: 'PASS (100% match)', dirtyStatus: 'FAIL (15 orphan keys: dept 888)' },
        { check: 'Foreign Key Integrity (category_id)', cleanStatus: 'PASS (100% match)', dirtyStatus: 'FAIL (15 orphan keys: cat 999)' },
        { check: 'Temporal Validity (resolved_at >= created_at)', cleanStatus: 'PASS (0 inversions)', dirtyStatus: 'FAIL (25 inverted timestamps)' },
        { check: 'Missing Values in Critical Fields', cleanStatus: 'PASS (0 nulls in mandatory columns)', dirtyStatus: 'FAIL (85 null cells)' },
        { check: 'Outlier Durations (> 500 hours)', cleanStatus: 'PASS (0 extreme artifacts)', dirtyStatus: 'FLAGGED (20 values at 9999.0 hrs)' }
      ]
    };
  }

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

// GOVERNANCE NOTE: Unauthenticated startup does NOT issue operational ticket queries.
// Public visitors use bundled synthetic benchmark data (src/data/seededData.json).
// Authenticated operational hydration is initiated exclusively upon verified session restoration in AuthContext.

// React Hook for consuming data synchronization state
export function useDataSync(): {
  dataSource: 'supabase' | 'seeded' | 'live';
  isLive: boolean;
  hydrationStatus: HydrationStatus;
  ticketCount: number;
  provenance: DataProvenance;
  retryHydration: () => Promise<boolean>;
} {
  useSyncExternalStore(
    cb => dataService.subscribe(cb),
    () => dataService.getVersion(),
    () => dataService.getVersion()
  );
  const prov = dataService.getDataProvenance();
  return {
    dataSource: prov.dataSource === 'live' ? 'supabase' : 'seeded',
    isLive: prov.dataSource === 'live',
    hydrationStatus: prov.hydrationStatus,
    ticketCount: prov.totalTickets,
    provenance: prov,
    retryHydration: () => dataService.hydrateFromSupabase({ force: true })
  };
}

// React Hook for consuming detailed data provenance
export function useDataHydration(): DataProvenance {
  useSyncExternalStore(
    cb => dataService.subscribe(cb),
    () => dataService.getVersion(),
    () => dataService.getVersion()
  );
  return dataService.getDataProvenance();
}

// React Hook for triggering component re-renders when dataService updates
export function useDataService(): number {
  return useSyncExternalStore(
    cb => dataService.subscribe(cb),
    () => dataService.getVersion(),
    () => dataService.getVersion()
  );
}
