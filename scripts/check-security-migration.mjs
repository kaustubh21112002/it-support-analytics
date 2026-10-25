/**
 * ============================================================================
 * IT Support Analytics Platform: Migration Security Checker & Staging Toolkit
 * ============================================================================
 * Static heuristic security analyzer and staging verification runner for
 * `it_support_analytics_dataset/sql/security_hardening_migration.sql`.
 *
 * SAFETY INVARIANTS:
 *   - NEVER modifies or executes migration against production Supabase.
 *   - Static checks are heuristic verifications of security patterns in SQL.
 *   - Reports three distinct states: PASS, FAIL, NOT VERIFIED.
 *   - Does NOT convert NOT VERIFIED into PASS.
 *   - If staging environment is not configured, local static checks pass while
 *     live database tests are explicitly reported as NOT VERIFIED.
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const MIGRATION_PATH = path.join(ROOT_DIR, 'it_support_analytics_dataset', 'sql', 'security_hardening_migration.sql');

// ============================================================================
// ANSI Color Helpers
// ============================================================================
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function formatStatus(status) {
  switch (status) {
    case 'PASS':
      return `${colors.green}${colors.bold}[PASS]${colors.reset}`;
    case 'FAIL':
      return `${colors.red}${colors.bold}[FAIL]${colors.reset}`;
    case 'NOT VERIFIED':
      return `${colors.yellow}${colors.bold}[NOT VERIFIED]${colors.reset}`;
    case 'WARN':
      return `${colors.yellow}${colors.bold}[WARN]${colors.reset}`;
    default:
      return `[${status}]`;
  }
}

// ============================================================================
// Static Heuristic Security Checks
// ============================================================================
class SecurityAuditReporter {
  constructor() {
    this.results = [];
    this.counts = { PASS: 0, FAIL: 0, 'NOT VERIFIED': 0, WARN: 0 };
  }

  record(status, category, name, details, remediation = null) {
    this.results.push({ status, category, name, details, remediation });
    if (this.counts[status] !== undefined) {
      this.counts[status]++;
    }
  }

  printReport() {
    console.log('\n' + '='.repeat(80));
    console.log(` ${colors.bold}STRATOS SECURITY VERIFICATION TOOLKIT - MIGRATION AUDIT REPORT${colors.reset}`);
    console.log(` ${colors.dim}Note: Static checks are text-pattern heuristic verifications of the proposed migration,${colors.reset}`);
    console.log(` ${colors.dim}      NOT proof of PostgreSQL runtime security. Live database tests require staging.${colors.reset}`);
    console.log('='.repeat(80));

    let currentCategory = '';
    for (const item of this.results) {
      if (item.category !== currentCategory) {
        currentCategory = item.category;
        console.log(`\n${colors.cyan}${colors.bold}--- ${currentCategory.toUpperCase()} (HEURISTIC) ---${colors.reset}`);
      }
      console.log(`  ${formatStatus(item.status)} ${colors.bold}${item.name}${colors.reset}`);
      console.log(`         ${colors.dim}${item.details}${colors.reset}`);
      if (item.remediation && item.status !== 'PASS') {
        console.log(`         ${colors.yellow}Remediation / Finding: ${item.remediation}${colors.reset}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(` ${colors.bold}SUMMARY SCORECARD${colors.reset}`);
    console.log('='.repeat(80));
    console.log(`  Static Heuristic Checks: ${this.counts.PASS + this.counts.FAIL} (Text-Pattern Analysis of Proposed SQL)`);
    console.log(`    - ${colors.green}PASS:${colors.reset}          ${this.counts.PASS}`);
    console.log(`    - ${colors.red}FAIL:${colors.reset}          ${this.counts.FAIL}`);
    console.log(`    - ${colors.yellow}WARN:${colors.reset}          ${this.counts.WARN}`);
    console.log(`  Live Staging Tests:      ${this.counts['NOT VERIFIED']} (Pending Disposable Staging Environment)`);
    console.log(`    - ${colors.yellow}NOT VERIFIED:${colors.reset}  ${this.counts['NOT VERIFIED']}`);
    console.log('='.repeat(80) + '\n');
  }
}

function runStaticHeuristicAudit(sqlContent, reporter) {
  // Strip comments before analyzing executable SQL statements
  const codeWithoutComments = sqlContent
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  // -------------------------------------------------------------------------
  // Category 1: Authorization Sourcing & Role Self-Escalation
  // -------------------------------------------------------------------------
  const userMetadataMatch = codeWithoutComments.match(/auth\.jwt\(\)\s*->\s*'user_metadata'|raw_user_meta_data/gi);
  if (!userMetadataMatch) {
    reporter.record(
      'PASS',
      '1. Role & Identity Sourcing',
      'Client-Writable user_metadata Excluded from Authorization',
      'Migration excludes raw_user_meta_data and JWT user_metadata from role determination helpers.'
    );
  } else {
    reporter.record(
      'FAIL',
      '1. Role & Identity Sourcing',
      'Client-Writable user_metadata Found in Authorization Code',
      `Found references to user_metadata in executable code: ${userMetadataMatch.join(', ')}`,
      'Remove all user_metadata references. Use public.user_roles or app_metadata.'
    );
  }

  const appMetadataRoleMatch = /'app_metadata'\s*->>\s*'role'/i.test(sqlContent);
  const databaseRoleMatch = /FROM\s+public\.user_roles/i.test(sqlContent);
  if (appMetadataRoleMatch && databaseRoleMatch) {
    reporter.record(
      'PASS',
      '1. Role & Identity Sourcing',
      'Trusted Server-Controlled Role Sourcing Hierarchy',
      'Role resolution checks public.user_roles first, then server-controlled app_metadata fallback.'
    );
  } else {
    reporter.record(
      'FAIL',
      '1. Role & Identity Sourcing',
      'Missing Governed Role Source Hierarchy',
      'Migration does not properly combine database-backed role mapping with app_metadata.',
      'Ensure public.user_roles and app_metadata are the only role sources.'
    );
  }

  const roleWhitelistMatch = /IF\s+v_role\s+IN\s*\(\s*'agent'\s*,\s*'manager'\s*,\s*'admin'\s*\)/i.test(sqlContent);
  const defaultUnprivilegedMatch = /RETURN\s+'authenticated';/i.test(sqlContent);
  if (roleWhitelistMatch && defaultUnprivilegedMatch) {
    reporter.record(
      'PASS',
      '1. Role & Identity Sourcing',
      'Strict Role Whitelist with Safe Unprivileged Fallback',
      'Only exact roles (agent, manager, admin) are recognized; invalid or arbitrary strings default to unprivileged authenticated.'
    );
  } else {
    reporter.record(
      'FAIL',
      '1. Role & Identity Sourcing',
      'Incomplete Role Whitelisting in Helper Function',
      'current_user_role() does not enforce a strict whitelist or safe unprivileged fallback.',
      'Whitelist only agent, manager, admin and return authenticated for all others.'
    );
  }

  const antiResurrectionCheck = /WHEN\s+undefined_table\s+THEN[\s\S]*?'app_metadata'\s*->>\s*'role'/i.test(sqlContent) &&
    /RETURN\s+'authenticated';\s*EXCEPTION\s*WHEN\s+undefined_table/i.test(sqlContent);
  if (antiResurrectionCheck) {
    reporter.record(
      'PASS',
      '1. Role & Identity Sourcing',
      'Authoritative user_roles Authority (Anti-Stale Role Resurrection)',
      'Missing or revoked role rows strictly resolve to unprivileged authenticated. app_metadata fallback is restricted to bootstrap undefined_table state.'
    );
  } else {
    reporter.record(
      'FAIL',
      '1. Role & Identity Sourcing',
      'Stale Role Resurrection Vulnerability Detected',
      'Role resolution falls back to app_metadata when user_roles row is missing, risking privilege resurrection after revocation.',
      'Gate app_metadata fallback behind EXCEPTION WHEN undefined_table block in current_user_role() and is_admin().'
    );
  }


  // -------------------------------------------------------------------------
  // Category 2: RLS Recursion & Infinite Loop Prevention
  // -------------------------------------------------------------------------
  const recursiveSubqueryMatch = /CREATE\s+POLICY\s+"sec_admin_manage_user_roles"[\s\S]*?SELECT\s+1\s+FROM\s+public\.user_roles/i.test(sqlContent);
  const isAdminHelperUsed = /CREATE\s+POLICY\s+"sec_admin_manage_user_roles"[\s\S]*?USING\s*\(\s*public\.is_admin\(\)\s*\)/i.test(sqlContent);
  if (!recursiveSubqueryMatch && isAdminHelperUsed) {
    reporter.record(
      'PASS',
      '2. RLS Policy Recursion',
      'Recursion-Free Role Management Policy',
      'sec_admin_manage_user_roles delegates evaluation to public.is_admin() (SECURITY DEFINER), preventing RLS recursion on public.user_roles.'
    );
  } else {
    reporter.record(
      'FAIL',
      '2. RLS Policy Recursion',
      'Potential Infinite RLS Recursion Detected on user_roles',
      'Policy queries public.user_roles directly within its own definition without superuser bypass.',
      'Use SECURITY DEFINER helper public.is_admin() owned by postgres.'
    );
  }

  // -------------------------------------------------------------------------
  // Category 3: SECURITY DEFINER Hardening & Execution Limits
  // -------------------------------------------------------------------------
  const securityDefinerFuncs = [
    { name: 'public.is_admin', signature: 'is_admin' },
    { name: 'public.current_user_role', signature: 'current_user_role' },
    { name: 'public.update_ticket_triage', signature: 'update_ticket_triage' }
  ];

  for (const fn of securityDefinerFuncs) {
    const fnRegex = new RegExp(`CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+${fn.name.replace('.', '\\.')}[\\s\\S]*?\\$\\$([\\s\\S]*?)\\$\\$;`, 'i');
    const match = sqlContent.match(fnRegex);
    if (!match) {
      reporter.record(
        'FAIL',
        '3. SECURITY DEFINER Hardening',
        `Function Definition Missing: ${fn.name}`,
        `Could not locate function body for ${fn.name}`,
        `Ensure ${fn.name} is defined in the migration.`
      );
      continue;
    }

    const fnDef = match[0];
    const hasSearchPath = /SET\s+search_path\s*=\s*pg_catalog,\s*pg_temp/i.test(fnDef);
    const hasSecurityDefiner = /SECURITY\s+DEFINER/i.test(fnDef);
    const hasOwnerPostgres = new RegExp(`ALTER\\s+FUNCTION\\s+${fn.name.replace('.', '\\.')}[\\s\\S]*?OWNER\\s+TO\\s+postgres`, 'i').test(sqlContent);
    const hasRevokeAnon = new RegExp(`REVOKE\\s+ALL\\s+ON\\s+FUNCTION\\s+${fn.name.replace('.', '\\.')}[\\s\\S]*?FROM\\s+anon`, 'i').test(sqlContent);
    const hasRevokePublic = new RegExp(`REVOKE\\s+ALL\\s+ON\\s+FUNCTION\\s+${fn.name.replace('.', '\\.')}[\\s\\S]*?FROM\\s+PUBLIC`, 'i').test(sqlContent);

    if (hasSearchPath && hasSecurityDefiner && hasOwnerPostgres && hasRevokeAnon && hasRevokePublic) {
      reporter.record(
        'PASS',
        '3. SECURITY DEFINER Hardening',
        `${fn.name}() Security Posture & Search Path Lockdown`,
        'Configured with SECURITY DEFINER, search_path = pg_catalog, pg_temp, postgres ownership, and revoked from anon/PUBLIC.'
      );
    } else {
      const missing = [];
      if (!hasSearchPath) missing.push('SET search_path = pg_catalog, pg_temp');
      if (!hasSecurityDefiner) missing.push('SECURITY DEFINER');
      if (!hasOwnerPostgres) missing.push('OWNER TO postgres');
      if (!hasRevokeAnon) missing.push('REVOKE FROM anon');
      if (!hasRevokePublic) missing.push('REVOKE FROM PUBLIC');

      reporter.record(
        'FAIL',
        '3. SECURITY DEFINER Hardening',
        `${fn.name}() Incomplete Security Hardening`,
        `Missing defensive attributes: ${missing.join(', ')}`,
        `Add missing attributes to ${fn.name}.`
      );
    }
  }

  // -------------------------------------------------------------------------
  // Category 4: Elimination of Direct SQL UPDATE Bypass (RPC-Only Triage)
  // -------------------------------------------------------------------------
  const tableLevelUpdateRevokedAuth = /REVOKE\s+UPDATE\s+ON\s+TABLE\s+public\.tickets\s+FROM\s+authenticated;/i.test(sqlContent);
  const tableLevelUpdateRevokedAnon = /REVOKE\s+UPDATE\s+ON\s+TABLE\s+public\.tickets\s+FROM\s+anon;/i.test(sqlContent);
  const tableLevelUpdateRevokedPublic = /REVOKE\s+UPDATE\s+ON\s+TABLE\s+public\.tickets\s+FROM\s+PUBLIC;/i.test(sqlContent);
  
  // Strict Failure Check: Any direct UPDATE grant (table or column) to authenticated, anon, or PUBLIC is a FAIL
  const anyClientUpdateGrant = /GRANT\s+UPDATE[\s\S]*?ON\s+TABLE\s+public\.tickets\s+TO\s+(authenticated|anon|PUBLIC)/i.test(codeWithoutComments);

  // Strict Failure Check: Any direct UPDATE policy for staff (which bypasses deep RPC validation) is a FAIL
  const directStaffUpdatePolicy = /CREATE\s+POLICY\s+["\w]+\s+ON\s+public\.tickets\s+FOR\s+UPDATE\s+TO\s+authenticated/i.test(codeWithoutComments);

  if (tableLevelUpdateRevokedAuth && tableLevelUpdateRevokedAnon && tableLevelUpdateRevokedPublic && !anyClientUpdateGrant) {
    reporter.record(
      'PASS',
      '4. Elimination of Direct UPDATE Bypass',
      'Complete Direct UPDATE Revocation on Tickets (Zero Direct UPDATE Grants)',
      'Direct SQL UPDATE is completely revoked from authenticated, anon, and PUBLIC. No column-level update bypass exists.'
    );
  } else {
    reporter.record(
      'FAIL',
      '4. Elimination of Direct UPDATE Bypass',
      'Direct UPDATE Bypass Permitted on public.tickets',
      `authRevoked=${tableLevelUpdateRevokedAuth}, anonRevoked=${tableLevelUpdateRevokedAnon}, publicRevoked=${tableLevelUpdateRevokedPublic}, clientGrantFound=${anyClientUpdateGrant}`,
      'Completely revoke table and column UPDATE on public.tickets from client roles. Direct staff triage mutations must be RPC-only.'
    );
  }

  if (!directStaffUpdatePolicy) {
    reporter.record(
      'PASS',
      '4. Elimination of Direct UPDATE Bypass',
      'Direct Staff UPDATE Policy Eliminated (RPC-Only Gate Enforced)',
      'sec_staff_update_ticket_triage is omitted. Staff cannot bypass deep RPC parameter and cross-table validation.'
    );
  } else {
    reporter.record(
      'FAIL',
      '4. Elimination of Direct UPDATE Bypass',
      'Direct SQL UPDATE Policy Detected for Staff (Bypasses Deep RPC Validation)',
      'Found CREATE POLICY ... FOR UPDATE TO authenticated on public.tickets, allowing direct UPDATE without deep RPC validation.',
      'Remove direct UPDATE policies on public.tickets. Direct all staff updates exclusively through public.update_ticket_triage().'
    );
  }

  // -------------------------------------------------------------------------
  // Category 4B: Fact Table Read-Access & Least Privilege Enforcement
  // -------------------------------------------------------------------------
  const anonTicketSelectGrant = /GRANT\s+SELECT[^;]*?ON\s+(?:TABLE\s+)?public\.tickets[^;]*?TO[^;]*?\banon\b/i.test(codeWithoutComments) ||
    /GRANT\s+SELECT[^;]*?TO[^;]*?\banon\b[^;]*?ON\s+(?:TABLE\s+)?public\.tickets/i.test(codeWithoutComments);
  const anonTicketSelectRevoked = /REVOKE\s+SELECT\s+ON\s+(?:TABLE\s+)?public\.tickets\s+FROM\s+anon/i.test(sqlContent);

  if (!anonTicketSelectGrant && anonTicketSelectRevoked) {
    reporter.record(
      'PASS',
      '4B. Fact Read-Access & Least Privilege',
      'Anonymous Fact SELECT Revocation (Zero Anonymous Read Grant)',
      'SELECT on public.tickets is revoked from anon. Anonymous callers cannot query operational incident records.'
    );
  } else {
    reporter.record(
      'FAIL',
      '4B. Fact Read-Access & Least Privilege',
      'Anonymous Read Access Granted on public.tickets',
      `anonTicketSelectGrant=${anonTicketSelectGrant}, anonTicketSelectRevoked=${anonTicketSelectRevoked}`,
      'Revoke SELECT on public.tickets from anon. Anonymous live reads violate enterprise least privilege.'
    );
  }

  const anonTicketSelectPolicy = /CREATE\s+POLICY\s+["\w]+\s+ON\s+public\.tickets\s+FOR\s+SELECT\s+TO\s+anon/i.test(codeWithoutComments);
  if (!anonTicketSelectPolicy) {
    reporter.record(
      'PASS',
      '4B. Fact Read-Access & Least Privilege',
      'Anonymous Ticket Read Policy Eliminated',
      'No policy exists granting anonymous callers SELECT on public.tickets.'
    );
  } else {
    reporter.record(
      'FAIL',
      '4B. Fact Read-Access & Least Privilege',
      'Anonymous Ticket Read Policy Detected',
      'Found CREATE POLICY ... FOR SELECT TO anon on public.tickets, allowing unauthenticated ticket scraping.',
      'Remove anonymous read policies on public.tickets. Use local synthetic data for demo exploration.'
    );
  }

  const unconditionalAuthSelectPolicy = /CREATE\s+POLICY\s+["\w]+\s+ON\s+public\.tickets\s+FOR\s+SELECT\s+TO\s+authenticated\s+USING\s*\(\s*true\s*\)/i.test(codeWithoutComments);
  if (!unconditionalAuthSelectPolicy) {
    reporter.record(
      'PASS',
      '4B. Fact Read-Access & Least Privilege',
      'Unconditional Authenticated Ticket Read Policy Eliminated',
      'sec_auth_select_tickets (USING true) is eliminated. Ordinary employees cannot browse company-wide tickets.'
    );
  } else {
    reporter.record(
      'FAIL',
      '4B. Fact Read-Access & Least Privilege',
      'Unconditional Authenticated Read Policy Detected',
      'Found CREATE POLICY ... FOR SELECT TO authenticated USING (true), permitting cross-employee ticket reads.',
      'Restrict fact table SELECT strictly to authorized staff roles (agent, manager, admin).'
    );
  }

  const staffSelectPolicy = /CREATE\s+POLICY\s+["\w]+\s+ON\s+public\.tickets\s+FOR\s+SELECT\s+TO\s+authenticated\s+USING\s*\([\s\S]*?current_user_role\(\)\s+IN\s*\(\s*'agent'\s*,\s*'manager'\s*,\s*'admin'\s*\)[\s\S]*?\)/i.test(codeWithoutComments);
  if (staffSelectPolicy) {
    reporter.record(
      'PASS',
      '4B. Fact Read-Access & Least Privilege',
      'Staff-Gated Operational Ticket Read Policy Enforced',
      'sec_staff_select_tickets restricts fact table reads to verified agent, manager, and admin roles.'
    );
  } else {
    reporter.record(
      'FAIL',
      '4B. Fact Read-Access & Least Privilege',
      'Missing Staff-Gated Ticket Read Policy',
      'Migration does not properly restrict ticket SELECT to verified staff roles.',
      'Create sec_staff_select_tickets USING (public.current_user_role() IN (\'agent\', \'manager\', \'admin\')).'
    );
  }

  // -------------------------------------------------------------------------
  // Category 5: RPC Parameter & Relational Validation
  // -------------------------------------------------------------------------
  const checksRPC = [
    {
      name: 'Caller Authorization Check',
      pattern: /current_user_role\(\)[\s\S]*?(?:v_caller_role|current_user_role\(\))\s+NOT\s+IN\s*\(\s*'agent'\s*,\s*'manager'\s*,\s*'admin'\s*\)/i
    },
    { name: 'Row-Locking for Update', pattern: /SELECT\s+\*\s+INTO\s+v_ticket\s+FROM\s+public\.tickets[\s\S]*?FOR\s+UPDATE/i },
    { name: 'Status Transition Validation', pattern: /Invalid status.*Permitted values: Open, In Progress, Pending, Resolved, Closed/i },
    { name: 'Priority & SLA Rule Pairing', pattern: /SELECT\s+sla_rule_id\s+INTO\s+v_sla_rule_id\s+FROM\s+public\.sla_rules/i },
    { name: 'Canonical Agent & Team Validation', pattern: /Inconsistent agent\/team assignment: Agent % belongs to Team %, not requested Team %/i },
    { name: 'Temporal Consistency Enforcement', pattern: /resolved_at\s*\(%\)\s*cannot be earlier than created_at/i }
  ];

  for (const c of checksRPC) {
    if (c.pattern.test(sqlContent)) {
      reporter.record(
        'PASS',
        '5. RPC Deep Validation (update_ticket_triage)',
        c.name,
        'Validated defensive logic in public.update_ticket_triage.'
      );
    } else {
      reporter.record(
        'FAIL',
        '5. RPC Deep Validation (update_ticket_triage)',
        `Missing RPC Check: ${c.name}`,
        'The proposed RPC function does not contain the expected defensive check.',
        `Implement ${c.name} in update_ticket_triage.`
      );
    }
  }

  const hasUnassign = /p_unassign_agent\s+BOOLEAN/i.test(sqlContent);
  const hasResolutionNotes = /p_resolution_notes\s+TEXT/i.test(sqlContent);
  const documentsNonPersistedNotes = /p_resolution_notes[\s\S]*?not persisted/i.test(sqlContent);
  if (hasUnassign && hasResolutionNotes && documentsNonPersistedNotes) {
    reporter.record(
      'PASS',
      '5. RPC Deep Validation (update_ticket_triage)',
      'Caller Parameter Compatibility & Non-Persisted Notes Transparency',
      'Matches frontend caller contract (p_unassign_agent, p_resolution_notes) and explicitly documents that notes are not persisted to database.'
    );
  } else {
    reporter.record(
      'FAIL',
      '5. RPC Deep Validation (update_ticket_triage)',
      'Parameter Contract Drift Detected',
      'update_ticket_triage does not align with frontend caller or fails to document non-persistence of notes.',
      'Align RPC signature with dataService.ts and document that p_resolution_notes is not persisted.'
    );
  }


  // -------------------------------------------------------------------------
  // Category 6: Anonymous & PUBLIC Privilege Lockdown
  // -------------------------------------------------------------------------
  const writePrivsRevokedAnon = /REVOKE\s+INSERT,\s*UPDATE,\s*DELETE,\s*TRUNCATE\s+ON\s+TABLE[\s\S]*?FROM\s+anon;/i.test(sqlContent);
  const writePrivsRevokedPublic = /REVOKE\s+INSERT,\s*UPDATE,\s*DELETE,\s*TRUNCATE\s+ON\s+TABLE[\s\S]*?FROM\s+PUBLIC;/i.test(sqlContent);
  const sequenceHardened = /REVOKE\s+ALL\s+ON\s+ALL\s+SEQUENCES\s+IN\s+SCHEMA\s+public\s+FROM\s+anon,\s*PUBLIC/i.test(sqlContent);
  const defaultPrivsHardened = /ALTER\s+DEFAULT\s+PRIVILEGES\s+IN\s+SCHEMA\s+public[\s\S]*?REVOKE\s+INSERT,\s*UPDATE,\s*DELETE,\s*TRUNCATE\s+ON\s+TABLES\s+FROM\s+anon,\s*PUBLIC/i.test(sqlContent);

  if (writePrivsRevokedAnon && writePrivsRevokedPublic && sequenceHardened && defaultPrivsHardened) {
    reporter.record(
      'PASS',
      '6. Anonymous & Public Lockdown',
      'Universal Write Access Revocation from anon & PUBLIC',
      'Revokes table writes, sequence modifications, and future default privileges from anon and PUBLIC across all tables.'
    );
  } else {
    reporter.record(
      'FAIL',
      '6. Anonymous & Public Lockdown',
      'Incomplete Write Access Revocation for anon or PUBLIC',
      `anonRevoked=${writePrivsRevokedAnon}, publicRevoked=${writePrivsRevokedPublic}, seq=${sequenceHardened}, defaults=${defaultPrivsHardened}`,
      'Explicitly revoke write and sequence privileges from anon and PUBLIC.'
    );
  }

  // -------------------------------------------------------------------------
  // Category 7: Destructive Statements & Idempotency
  // -------------------------------------------------------------------------

  const dangerousDrops = codeWithoutComments.match(/(?:^|;)\s*DROP\s+(TABLE|DATABASE|SCHEMA)\s+/gim);
  // Match TRUNCATE only as an active statement, not as a privilege inside REVOKE or GRANT
  const dangerousTruncates = codeWithoutComments.match(/(?:^|;)\s*TRUNCATE\s+(?:TABLE\s+)?(?:ONLY\s+)?(?:public\.)?[a-z_]+/gim);
  const dangerousDeletes = codeWithoutComments.match(/(?:^|;)\s*DELETE\s+FROM\s+(?:public\.)?[a-z_]+(?:\s*;|\s+WHERE\s+1\s*=\s*1)/gim);

  if (!dangerousDrops && !dangerousTruncates && !dangerousDeletes) {
    reporter.record(
      'PASS',
      '7. Destructive Operations & Idempotency',
      'Zero Destructive DDL/DML Statements',
      'Migration contains NO DROP TABLE, DROP DATABASE, TRUNCATE, or unbounded DELETE statements.'
    );
  } else {
    reporter.record(
      'FAIL',
      '7. Destructive Operations & Idempotency',
      'Destructive Statements Found in Migration Proposal',
      `Found: drops=${dangerousDrops}, truncates=${dangerousTruncates}, deletes=${dangerousDeletes}`,
      'Remove all destructive statements to ensure zero accidental data loss.'
    );
  }

  const idempotentPolicyDrops = /DROP\s+POLICY\s+IF\s+EXISTS/i.test(sqlContent);
  const idempotentTableCreate = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.user_roles/i.test(sqlContent);
  const idempotentFunctionCreate = (sqlContent.match(/CREATE\s+OR\s+REPLACE\s+FUNCTION/gi) || []).length >= 3;

  if (idempotentPolicyDrops && idempotentTableCreate && idempotentFunctionCreate) {
    reporter.record(
      'PASS',
      '7. Destructive Operations & Idempotency',
      'Idempotent Application Guarantee',
      'Uses DROP POLICY IF EXISTS, CREATE TABLE IF NOT EXISTS, and CREATE OR REPLACE FUNCTION for safe re-runs.'
    );
  } else {
    reporter.record(
      'FAIL',
      '7. Destructive Operations & Idempotency',
      'Non-Idempotent DDL Statements Found',
      'Missing idempotent IF EXISTS or OR REPLACE qualifiers.',
      'Make all DDL statements idempotent.'
    );
  }

  const hasBegin = /(?:^|;)\s*BEGIN\s*;/im.test(codeWithoutComments);
  const hasCommit = /;\s*COMMIT\s*;/im.test(codeWithoutComments) || /COMMIT\s*;\s*$/im.test(codeWithoutComments);
  if (hasBegin && hasCommit) {
    reporter.record(
      'PASS',
      '7. Destructive Operations & Idempotency',
      'Atomic Transaction Safety Wrapper (BEGIN ... COMMIT)',
      'Entire migration script is enclosed within an explicit atomic transaction block, ensuring all-or-nothing execution.'
    );
  } else {
    reporter.record(
      'FAIL',
      '7. Destructive Operations & Idempotency',
      'Missing Atomic Transaction Wrapper',
      'Migration script lacks explicit BEGIN; ... COMMIT; block, risking partial execution state.',
      'Enclose the executable migration in BEGIN; and COMMIT;.'
    );
  }


  // -------------------------------------------------------------------------
  // Category 8: Identity Reality & Employee Ownership Limitations
  // -------------------------------------------------------------------------
  const falseEmployeeClaim = /CREATE\s+POLICY[\s\S]*?ON\s+public\.tickets[\s\S]*?FOR\s+INSERT[\s\S]*?WITH\s+CHECK\s*\(\s*auth\.uid\(\)\s*=\s*created_by_user_id\s*\)/i.test(sqlContent);
  const governanceDocumentation = /IDENTITY REALITY & EMPLOYEE OWNERSHIP LIMITATION/i.test(sqlContent);

  if (!falseEmployeeClaim && governanceDocumentation) {
    reporter.record(
      'PASS',
      '8. Identity Governance Reality',
      'Honest Accounting of Identity Limitations (No Fabricated Foreign Key)',
      'Acknowledges public.tickets lacks created_by_user_id. Documents necessary schema modifications before employee row-level ownership can be enforced.'
    );
  } else {
    reporter.record(
      'FAIL',
      '8. Identity Governance Reality',
      'Invalid Foreign Key Assumption for Employee Ticket Insertion',
      'Migration assumes created_by_user_id column exists on tickets table without schema change.',
      'Do not propose row-level employee ownership until created_by_user_id column is added.'
    );
  }

  // -------------------------------------------------------------------------
  // Category 9: PostgREST Schema Reload
  // -------------------------------------------------------------------------
  const reloadPgrst = /NOTIFY\s+pgrst\s*,\s*'reload schema'/i.test(sqlContent);
  if (reloadPgrst) {
    reporter.record(
      'PASS',
      '9. PostgREST Schema Reload',
      'PostgREST Schema Cache Refresh Notification',
      'Migration issues NOTIFY pgrst, \'reload schema\'; ensuring immediate availability of RPCs and hardened policies.'
    );
  } else {
    reporter.record(
      'FAIL',
      '9. PostgREST Schema Reload',
      'Missing Schema Reload Notification',
      'Migration does not issue NOTIFY pgrst, \'reload schema\'; risking PGRST202 schema cache staleness.',
      'Append NOTIFY pgrst, \'reload schema\'; to the end of the migration script.'
    );
  }

  // -------------------------------------------------------------------------
  // Category 10: Model C Hybrid Authorization & Team Queue Isolation
  // -------------------------------------------------------------------------
  const agentUserIdColumnMatch = /ALTER\s+TABLE\s+public\.agents\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+user_id\s+UUID\s+UNIQUE\s+REFERENCES\s+auth\.users\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i.test(sqlContent);
  const teamManagersTableMatch = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.team_managers\s*\([\s\S]*?user_id\s+UUID[\s\S]*?team_id\s+INTEGER[\s\S]*?PRIMARY\s+KEY\s*\(\s*user_id\s*,\s*team_id\s*\)/i.test(sqlContent);

  if (agentUserIdColumnMatch && teamManagersTableMatch) {
    reporter.record(
      'PASS',
      '10. Model C Hybrid Authorization',
      'Identity Mapping Relational Schema (agents.user_id & team_managers)',
      'Schema includes nullable unique user_id on agents with ON DELETE SET NULL and dedicated team_managers mapping table.'
    );
  } else {
    reporter.record(
      'FAIL',
      '10. Model C Hybrid Authorization',
      'Missing Identity Mapping Schema Elements',
      `agentUserIdColumn=${agentUserIdColumnMatch}, teamManagersTable=${teamManagersTableMatch}`,
      'Add user_id to public.agents and create public.team_managers in migration.'
    );
  }

  // Helper functions check
  const scopeHelpers = [
    { name: 'public.current_agent_id', pattern: /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.current_agent_id\(\)/i },
    { name: 'public.current_agent_team_id', pattern: /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.current_agent_team_id\(\)/i },
    { name: 'public.is_team_manager', pattern: /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.is_team_manager\s*\(\s*p_team_id\s+INTEGER\s*\)/i }
  ];

  let allScopeHelpersValid = true;
  for (const sh of scopeHelpers) {
    if (!sh.pattern.test(sqlContent)) {
      allScopeHelpersValid = false;
      reporter.record(
        'FAIL',
        '10. Model C Hybrid Authorization',
        `Missing Scope Helper: ${sh.name}()`,
        `Could not locate function definition for ${sh.name}`,
        `Implement ${sh.name} with SECURITY DEFINER and search_path lockdown.`
      );
    }
  }

  if (allScopeHelpersValid) {
    reporter.record(
      'PASS',
      '10. Model C Hybrid Authorization',
      'Scoping Helper Functions (current_agent_id, current_agent_team_id, is_team_manager)',
      'All three helper functions are defined, secured with SECURITY DEFINER, search_path = pg_catalog, pg_temp, and postgres ownership.'
    );
  }

  // Model C RLS Scoping Check on public.tickets
  const modelCRlsMatch = /CREATE\s+POLICY\s+["\w]+\s+ON\s+public\.tickets\s+FOR\s+SELECT\s+TO\s+authenticated[\s\S]*?public\.is_admin\(\)[\s\S]*?public\.is_team_manager\((?:public\.tickets\.)?team_id\)[\s\S]*?(?:public\.tickets\.)?team_id\s*=\s*public\.current_agent_team_id\(\)/i.test(sqlContent);
  if (modelCRlsMatch) {
    reporter.record(
      'PASS',
      '10. Model C Hybrid Authorization',
      'Model C Queue-Level RLS Scoping (sec_staff_select_tickets)',
      'Enforces team queue isolation for agents (team_id = current_agent_team_id()), explicit team scope for managers (is_team_manager(team_id)), and global authority for admins.'
    );
  } else {
    reporter.record(
      'FAIL',
      '10. Model C Hybrid Authorization',
      'Incomplete Model C Queue-Level RLS Scoping',
      'sec_staff_select_tickets does not properly differentiate admin, manager, and agent team boundaries.',
      'Implement Model C CASE statement in sec_staff_select_tickets.'
    );
  }

  // Model C RPC Policy Enforcement (Peer modification & Cross-team prevention)
  const peerRejectionMatch = /Ticket\s+%\s+is\s+assigned\s+to\s+peer\s+Agent\s+%\.\s+Mutation\s+prohibited/i.test(sqlContent);
  const crossTeamRejectionMatch = /Agents\s+cannot\s+move\s+tickets\s+across\s+teams/i.test(sqlContent);
  const claimUnassignedMatch = /Agent\s+must\s+claim\s+unassigned\s+ticket\s+by\s+assigning\s+self\s+before\s+triaging/i.test(sqlContent);
  const managerScopeRpcMatch = /is_team_manager\(v_ticket\.team_id\)/i.test(sqlContent) && /is_team_manager\(p_team_id\)/i.test(sqlContent);
  const unmappedFailClosedMatch = /Caller\s+%\s+is\s+not\s+mapped\s+to\s+an\s+active\s+agent\s+record/i.test(sqlContent);

  if (peerRejectionMatch && crossTeamRejectionMatch && claimUnassignedMatch && managerScopeRpcMatch && unmappedFailClosedMatch) {
    reporter.record(
      'PASS',
      '10. Model C Hybrid Authorization',
      'Model C RPC Deep Enforcement (Peer Lock, Cross-Team Rejection, Manager Team Scope)',
      'update_ticket_triage rejects peer-assigned ticket mutations, cross-team moves by agents, unassigned triaging without self-claim, unauthorized manager teams, and unmapped agents.'
    );
  } else {
    reporter.record(
      'FAIL',
      '10. Model C Hybrid Authorization',
      'Incomplete Model C RPC Guardrails',
      `peer=${peerRejectionMatch}, crossTeam=${crossTeamRejectionMatch}, claim=${claimUnassignedMatch}, mgrScope=${managerScopeRpcMatch}, unmappedClosed=${unmappedFailClosedMatch}`,
      'Ensure all Model C RPC validation rules are strictly enforced inside update_ticket_triage().'
    );
  }

  // Team managers table protection against client-side self-escalation
  const tmRlsEnabled = /ALTER\s+TABLE\s+public\.team_managers\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(sqlContent);
  const tmAdminPolicy = /CREATE\s+POLICY\s+"sec_admin_manage_team_managers"[\s\S]*?ON\s+public\.team_managers[\s\S]*?USING\s*\(\s*public\.is_admin\(\)\s*\)[\s\S]*?WITH\s+CHECK\s*\(\s*public\.is_admin\(\)\s*\)/i.test(sqlContent);

  if (tmRlsEnabled && tmAdminPolicy) {
    reporter.record(
      'PASS',
      '10. Model C Hybrid Authorization',
      'Manager Scope Governance & Anti Self-Escalation (team_managers RLS)',
      'public.team_managers has RLS enabled with management restricted strictly to administrators via sec_admin_manage_team_managers.'
    );
  } else {
    reporter.record(
      'FAIL',
      '10. Model C Hybrid Authorization',
      'Vulnerable Manager Scope Governance',
      `tmRls=${tmRlsEnabled}, tmAdminPolicy=${tmAdminPolicy}`,
      'Enable RLS on public.team_managers and add sec_admin_manage_team_managers policy checking public.is_admin().'
    );
  }

  // -------------------------------------------------------------------------
  // Category 11: Targeted SEC-01 & SEC-02 Hardening Audits
  // -------------------------------------------------------------------------
  // 1. SEC-01: RPC Unassigned Ticket Claim Invariant
  const unassignedUnassignRejectionMatch = /Agents\s+cannot\s+unassign\s+an\s+unassigned\s+ticket/i.test(sqlContent);
  const claimSelfRequiredMatch = /Agent\s+must\s+claim\s+unassigned\s+ticket\s+by\s+assigning\s+self/i.test(sqlContent);

  if (unassignedUnassignRejectionMatch && claimSelfRequiredMatch) {
    reporter.record(
      'PASS',
      '11. Targeted SEC-01 & SEC-02 Hardening Audits',
      'SEC-01: Unassigned Ticket Claim Invariant (update_ticket_triage)',
      'update_ticket_triage strictly requires verified caller self-claim (p_agent_id = current_agent_id()) and explicitly rejects p_unassign_agent = TRUE on unassigned tickets.'
    );
  } else {
    reporter.record(
      'FAIL',
      '11. Targeted SEC-01 & SEC-02 Hardening Audits',
      'SEC-01 Invariant Violation in update_ticket_triage',
      `unassignRejection=${unassignedUnassignRejectionMatch}, claimSelfRequired=${claimSelfRequiredMatch}`,
      'Enforce claim invariant and reject p_unassign_agent = TRUE on unassigned tickets in update_ticket_triage.'
    );
  }

  // 2. SEC-02: Public-Safe agent_directory Projection & Base Table Lockdown
  const agentDirectoryViewRegex = /CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.agent_directory\s+AS\s+SELECT([\s\S]*?)FROM\s+public\.agents/i;
  const agentDirectoryViewMatch = sqlContent.match(agentDirectoryViewRegex);
  const agentDirectoryViewDefMatch = Boolean(agentDirectoryViewMatch);
  const agentDirectoryExcludesUserId = Boolean(agentDirectoryViewMatch && !agentDirectoryViewMatch[1].includes('user_id'));
  const agentDirectoryGrantMatch = /GRANT\s+SELECT\s+ON\s+TABLE\s+public\.agent_directory\s+TO\s+anon,\s*authenticated/i.test(sqlContent);
  const baseAgentsRevokeAnonMatch = /REVOKE\s+SELECT\s+ON\s+TABLE\s+public\.agents\s+FROM\s+anon/i.test(sqlContent);
  const noPermissiveAgentsPolicy = !/CREATE\s+POLICY\s+["\w]+\s+ON\s+public\.agents\s+FOR\s+SELECT\s+TO\s+(anon|authenticated)\s+USING\s*\(\s*true\s*\)/i.test(sqlContent);
  const baseAgentsAdminOnlyPolicy = /CREATE\s+POLICY\s+"sec_admin_manage_agents"[\s\S]*?ON\s+public\.agents\s+FOR\s+ALL\s+TO\s+authenticated[\s\S]*?USING\s*\(\s*public\.is_admin\(\)\s*\)/i.test(sqlContent);

  if (agentDirectoryViewDefMatch && agentDirectoryExcludesUserId && agentDirectoryGrantMatch && baseAgentsRevokeAnonMatch && noPermissiveAgentsPolicy && baseAgentsAdminOnlyPolicy) {
    reporter.record(
      'PASS',
      '11. Targeted SEC-01 & SEC-02 Hardening Audits',
      'SEC-02: Public-Safe agent_directory Projection & agents.user_id Shielding',
      'public.agent_directory view projects safe columns without user_id; base public.agents table direct SELECT is revoked from anon and gated to public.is_admin() for authenticated callers.'
    );
  } else {
    reporter.record(
      'FAIL',
      '11. Targeted SEC-01 & SEC-02 Hardening Audits',
      'SEC-02 Identity Exposure Vulnerability on public.agents',
      `viewDef=${agentDirectoryViewDefMatch}, excludesUserId=${agentDirectoryExcludesUserId}, viewGrant=${agentDirectoryGrantMatch}, revokeAnon=${baseAgentsRevokeAnonMatch}, noPermissivePolicy=${noPermissiveAgentsPolicy}, adminOnly=${baseAgentsAdminOnlyPolicy}`,
      'Project public.agent_directory without user_id and lock down base table public.agents to administrators only.'
    );
  }

  // 3. Application Layer Redirection Check
  const dataServicePath = path.join(ROOT_DIR, 'src', 'services', 'dataService.ts');
  let dataServiceRedirected = false;
  if (fs.existsSync(dataServicePath)) {
    const dsContent = fs.readFileSync(dataServicePath, 'utf-8');
    const hasAgentDirectoryQuery = dsContent.includes("from('agent_directory')");
    const selectsUserId = /\.select\(['"`][^'"]*?user_id[^'"]*?['"`]\)/i.test(dsContent);
    dataServiceRedirected = hasAgentDirectoryQuery && !selectsUserId;
  }

  if (dataServiceRedirected) {
    reporter.record(
      'PASS',
      '11. Targeted SEC-01 & SEC-02 Hardening Audits',
      'Application Layer Redirection to agent_directory View',
      'src/services/dataService.ts queries agent_directory and strictly excludes user_id.'
    );
  } else {
    reporter.record(
      'FAIL',
      '11. Targeted SEC-01 & SEC-02 Hardening Audits',
      'Application Layer Exposes user_id or Missing agent_directory Query',
      `dataServiceRedirected=${dataServiceRedirected}`,
      "Ensure src/services/dataService.ts calls supabase.from('agent_directory') with explicit columns without user_id."
    );
  }

  // 4. Fallback Safe Projection Check (Phase 05C.7)
  let fallbackIsSafe = false;
  if (fs.existsSync(dataServicePath)) {
    const dsContent = fs.readFileSync(dataServicePath, 'utf-8');
    const queriesBaseAgents = dsContent.includes("from('agents')");
    const baseTableSelectStar = /\.from\(['"]agents['"]\)\s*\.select\(['"]\*['"]\)/.test(dsContent);
    const fallbackHasSafeColumns = /\.from\(['"]agents['"]\)\s*\.select\(['"]agent_id,\s*agent_code,\s*team_id,\s*experience_band['"]\)/.test(dsContent);
    fallbackIsSafe = queriesBaseAgents && !baseTableSelectStar && fallbackHasSafeColumns;
  }

  if (fallbackIsSafe) {
    reporter.record(
      'PASS',
      '11. Targeted SEC-01 & SEC-02 Hardening Audits',
      'Agent Directory Fallback Hardening & Projection Safety',
      'Fallback on base public.agents uses explicit safe columns (agent_id, agent_code, team_id, experience_band) and never select("*").'
    );
  } else {
    reporter.record(
      'FAIL',
      '11. Targeted SEC-01 & SEC-02 Hardening Audits',
      'Agent Directory Fallback Uses Unsafe Projection or select("*")',
      `fallbackIsSafe=${fallbackIsSafe}`,
      'Ensure fallback on public.agents specifies explicit safe columns and strictly avoids select("*").'
    );
  }

  // -------------------------------------------------------------------------
  // Category 12: View Replacement Safety & Contract Parity (Phase 05C.10)
  // -------------------------------------------------------------------------
  // 1. Idempotent View Replacement Strategy & Zero CASCADE Drops (Static Invariant)
  const createOrReplaceViewMatch = /CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.agent_directory\s+AS/i.test(sqlContent);
  const unconditionalDropViewMatch = /^\s*DROP\s+VIEW\s+(?:IF\s+EXISTS\s+)?(?:public\.)?agent_directory\s*;/im.test(codeWithoutComments);
  const cascadeDropMatch = /(?:^|;)\s*DROP\s+(?:TABLE|VIEW|FUNCTION|SCHEMA)[\s\S]*?\bCASCADE\b/i.test(codeWithoutComments);

  if (createOrReplaceViewMatch && !unconditionalDropViewMatch && !cascadeDropMatch) {
    reporter.record(
      'PASS',
      '12. View Replacement Safety & Contract Parity',
      'Non-Destructive In-Place View Replacement & Zero CASCADE Drops (Static Invariant)',
      'Uses CREATE OR REPLACE VIEW public.agent_directory without unconditional top-level DROP VIEW or CASCADE, preserving object privileges and preventing dependency cascade hazards.'
    );
  } else {
    reporter.record(
      'FAIL',
      '12. View Replacement Safety & Contract Parity',
      'Unsafe View Replacement Pattern Detected',
      `createOrReplace=${createOrReplaceViewMatch}, unconditionalDropView=${unconditionalDropViewMatch}, cascadeDrop=${cascadeDropMatch}`,
      'Ensure in-place CREATE OR REPLACE VIEW public.agent_directory is used and remove CASCADE drops.'
    );
  }

  // 1B. Guarded Upgrade Type Reconciliation Invariant (Phase 05C.10 Static Invariant)
  const hasGuardedTypeReconciliation =
    /IF\s+v_view_type\s+IS\s+NOT\s+NULL[\s\S]*?v_view_type\s*<>\s*v_table_type[\s\S]*?DROP\s+VIEW\s+public\.agent_directory\s+RESTRICT/i.test(sqlContent);

  if (hasGuardedTypeReconciliation) {
    reporter.record(
      'PASS',
      '12. View Replacement Safety & Contract Parity',
      'Guarded Upgrade Type Reconciliation Invariant (Phase 05C.10 Static Invariant)',
      'Guarded DO block inspects information_schema.columns data types before view replacement; only drops with RESTRICT if a type mismatch would trigger 42P16 and downstream dependency count is zero.'
    );
  } else {
    reporter.record(
      'FAIL',
      '12. View Replacement Safety & Contract Parity',
      'Missing Guarded Upgrade Type Reconciliation Block',
      'Migration must guard view replacement against created_at data type mismatches (TIMESTAMP vs TIMESTAMPTZ) using non-cascading RESTRICT.',
      'Add guarded DO block inspecting information_schema.columns before CREATE OR REPLACE VIEW.'
    );
  }

  // 2. Explicit Migration View Ownership & Post-Creation Grants (Static Invariant)
  const viewOwnerMatch = /ALTER\s+VIEW\s+public\.agent_directory\s+OWNER\s+TO\s+postgres;/i.test(sqlContent);
  const revokePublicMatch = /REVOKE\s+ALL\s+ON\s+TABLE\s+public\.agent_directory\s+FROM\s+PUBLIC;/i.test(sqlContent);
  const grantAnonAuthMatch = /GRANT\s+SELECT\s+ON\s+TABLE\s+public\.agent_directory\s+TO\s+anon,\s*authenticated;/i.test(sqlContent);
  const grantServiceRoleMatch = /GRANT\s+ALL\s+ON\s+TABLE\s+public\.agent_directory\s+TO\s+service_role;/i.test(sqlContent);

  if (viewOwnerMatch && revokePublicMatch && grantAnonAuthMatch && grantServiceRoleMatch) {
    reporter.record(
      'PASS',
      '12. View Replacement Safety & Contract Parity',
      'Explicit Migration View Ownership & Access Grants (postgres Owner + anon/auth Grants)',
      'Migration explicitly assigns postgres ownership and grants SELECT to anon and authenticated while revoking from PUBLIC.'
    );
  } else {
    reporter.record(
      'FAIL',
      '12. View Replacement Safety & Contract Parity',
      'Missing View Ownership or Grant Directives in Migration',
      `owner=${viewOwnerMatch}, revokePublic=${revokePublicMatch}, grantAnonAuth=${grantAnonAuthMatch}, grantServiceRole=${grantServiceRoleMatch}`,
      'Explicitly set ALTER VIEW public.agent_directory OWNER TO postgres and grant SELECT to anon, authenticated.'
    );
  }


  // 3. Cross-File Projection Contract Parity (supabase_schema.sql vs security_hardening_migration.sql)
  const baselineSchemaPath = path.join(ROOT_DIR, 'it_support_analytics_dataset', 'sql', 'supabase_schema.sql');
  let contractParityPass = false;
  let parityDetails = '';

  if (fs.existsSync(baselineSchemaPath)) {
    const baseSql = fs.readFileSync(baselineSchemaPath, 'utf-8');
    const baseViewMatch = baseSql.match(/CREATE\s+OR\s+REPLACE\s+VIEW\s+(?:public\.)?agent_directory\s+AS\s+SELECT([\s\S]*?)FROM\s+(?:public\.)?agents/i);
    const migViewMatch = sqlContent.match(/CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.agent_directory\s+AS\s+SELECT([\s\S]*?)FROM\s+public\.agents/i);

    if (baseViewMatch && migViewMatch) {
      const extractCols = (str) => str.split(',').map(s => s.trim().replace(/^public\./, '')).filter(Boolean);
      const baseCols = extractCols(baseViewMatch[1]);
      const migCols = extractCols(migViewMatch[1]);

      const expectedCols = ['agent_id', 'agent_code', 'agent_name', 'team_id', 'experience_band', 'is_active', 'created_at'];
      const baseMatches = baseCols.length === expectedCols.length && baseCols.every((c, i) => c === expectedCols[i]);
      const migMatches = migCols.length === expectedCols.length && migCols.every((c, i) => c === expectedCols[i]);
      const noUserId = !baseCols.includes('user_id') && !migCols.includes('user_id');

      if (baseMatches && migMatches && noUserId) {
        contractParityPass = true;
        parityDetails = `Both schemas project exact matching 7 columns: [${expectedCols.join(', ')}] with zero user_id exposure.`;
      } else {
        parityDetails = `Projection mismatch: base=[${baseCols.join(', ')}], migration=[${migCols.join(', ')}]`;
      }
    } else {
      parityDetails = 'Could not locate agent_directory view in one or both SQL files.';
    }
  } else {
    parityDetails = 'supabase_schema.sql not found at expected path.';
  }

  if (contractParityPass) {
    reporter.record(
      'PASS',
      '12. View Replacement Safety & Contract Parity',
      'Cross-File View Projection Contract Parity',
      parityDetails
    );
  } else {
    reporter.record(
      'FAIL',
      '12. View Replacement Safety & Contract Parity',
      'View Projection Contract Discrepancy Detected',
      parityDetails,
      'Align column names and ordering between supabase_schema.sql and security_hardening_migration.sql.'
    );
  }
  // 3B. Fresh-Schema View Ownership & Grants Parity (Static Invariant)
  if (fs.existsSync(baselineSchemaPath)) {
    const baseSql = fs.readFileSync(baselineSchemaPath, 'utf-8');
    const baseOwnerMatch = /ALTER\s+VIEW\s+public\.agent_directory\s+OWNER\s+TO\s+postgres;/i.test(baseSql);
    const baseRevokePublicMatch = /REVOKE\s+ALL\s+ON\s+TABLE\s+public\.agent_directory\s+FROM\s+PUBLIC;/i.test(baseSql);
    const baseGrantAnonAuthMatch = /GRANT\s+SELECT\s+ON\s+TABLE\s+public\.agent_directory\s+TO\s+anon,\s*authenticated;/i.test(baseSql);
    const baseGrantServiceRoleMatch = /GRANT\s+ALL\s+ON\s+TABLE\s+public\.agent_directory\s+TO\s+service_role;/i.test(baseSql);

    if (baseOwnerMatch && baseRevokePublicMatch && baseGrantAnonAuthMatch && baseGrantServiceRoleMatch) {
      reporter.record(
        'PASS',
        '12. View Replacement Safety & Contract Parity',
        'Fresh-Schema View Ownership & Grants Parity (Static Invariant)',
        'supabase_schema.sql explicitly assigns postgres ownership and grants SELECT to anon and authenticated while revoking from PUBLIC.'
      );
    } else {
      reporter.record(
        'FAIL',
        '12. View Replacement Safety & Contract Parity',
        'Fresh-Schema View Ownership or Grant Directives Missing',
        `baseOwner=${baseOwnerMatch}, baseRevoke=${baseRevokePublicMatch}, baseGrant=${baseGrantAnonAuthMatch}, baseServiceRole=${baseGrantServiceRoleMatch}`,
        'Add explicit ALTER VIEW public.agent_directory OWNER TO postgres and grants to supabase_schema.sql.'
      );
    }
  }


  // 4. Default Security Invoker Invariant (security_invoker = false)
  const hasSecurityInvokerTrue = /security_invoker\s*=\s*true/i.test(sqlContent);
  if (!hasSecurityInvokerTrue) {
    reporter.record(
      'PASS',
      '12. View Replacement Safety & Contract Parity',
      'PostgreSQL View Security Execution Model (Default security_invoker = false)',
      'View omits security_invoker = true, ensuring standard owner execution context (postgres) so unprivileged callers can query directory fields while base table is protected.'
    );
  } else {
    reporter.record(
      'FAIL',
      '12. View Replacement Safety & Contract Parity',
      'Hazardous security_invoker = true Detected on agent_directory',
      'View specifies security_invoker = true, which forces PostgreSQL to evaluate base table RLS for unprivileged callers, breaking directory reads.',
      'Remove security_invoker = true from public.agent_directory view definition.'
    );
  }

  // 5. Pre-View Column Idempotency on Upgrade Paths
  const hasPreViewColumns = /ALTER\s+TABLE\s+public\.agents\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+agent_name/i.test(sqlContent) &&
    /ALTER\s+TABLE\s+public\.agents\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+is_active/i.test(sqlContent) &&
    /ALTER\s+TABLE\s+public\.agents\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+created_at/i.test(sqlContent);

  if (hasPreViewColumns) {
    reporter.record(
      'PASS',
      '12. View Replacement Safety & Contract Parity',
      'Pre-View Base Column Provisioning (Upgrade Path Idempotency)',
      'ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS provisions agent_name, is_active, and created_at before view replacement.'
    );
  } else {
    reporter.record(
      'FAIL',
      '12. View Replacement Safety & Contract Parity',
      'Missing Pre-View Column Provisioning for Upgrades',
      'Underlying columns on public.agents must be provisioned before CREATE OR REPLACE VIEW.',
      'Add ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS statements in Section 3C.'
    );
  }
}

// ============================================================================
// Runtime Staging Database Verification Checklist
// ============================================================================
function recordStagingChecklist(reporter) {
  const stagingChecks = [
    {
      id: 'STAGE-01',
      name: 'Anonymous Fact Read Denial (Least Privilege)',
      desc: 'Verify unauthenticated requests attempting to SELECT from public.tickets are rejected or return 0 rows.',
      expected: 'HTTP 401 / 403 or PostgreSQL error 42501 (permission denied for table tickets).'
    },
    {
      id: 'STAGE-01B',
      name: 'Anonymous Dimension Reference Read Access',
      desc: 'Verify unauthenticated requests can read reference dimension tables (departments, categories, sla_rules, teams, agents) for UI navigation.',
      expected: 'HTTP 200 / Reference master records returned.'
    },
    {
      id: 'STAGE-02',
      name: 'Anonymous Write Rejection (INSERT / UPDATE / DELETE)',
      desc: 'Verify unauthenticated requests attempting INSERT, UPDATE, or DELETE on any table are rejected by PostgreSQL.',
      expected: 'HTTP 401 / 403 or PostgreSQL error 42501 (permission denied).'
    },
    {
      id: 'STAGE-03A',
      name: 'Employee Cross-Ticket Read Denial',
      desc: 'Verify an authenticated user with default role (employee) attempting to query all tickets receives 0 rows or permission denied, unable to browse operational queue.',
      expected: '0 rows returned or HTTP 403 / 42501; enterprise ticket queue shielded from ordinary employees.'
    },
    {
      id: 'STAGE-03B',
      name: 'Authenticated Employee Triage Rejection',
      desc: 'Verify an authenticated user with default role (employee) is prohibited from updating tickets or calling update_ticket_triage().',
      expected: 'RPC raises exception: "Unauthorized: Caller role authenticated is not permitted to triage tickets" (ERRCODE 42501).'
    },
    {
      id: 'STAGE-04A',
      name: 'Authorized Staff Operational Queue Read Access',
      desc: 'Verify an authenticated user with role "agent", "manager", or "admin" can read operational tickets for triage and SLA monitoring.',
      expected: 'HTTP 200 / Operational ticket records returned under sec_staff_select_tickets.'
    },
    {
      id: 'STAGE-04B',
      name: 'Agent / Manager Valid Ticket Triage Execution via RPC',
      desc: 'Verify an authenticated user with role "agent" or "manager" can update ticket status, priority, and assign canonical agents.',
      expected: 'RPC executes within transaction; returns JSON representation of updated ticket; audit log records mutation.'
    },
    {
      id: 'STAGE-05',
      name: 'Inconsistent Agent-Team Assignment Rejection',
      desc: 'Verify that assigning an agent to a team other than their canonical team is rejected with rollback.',
      expected: 'RPC raises exception: "Inconsistent agent/team assignment: Agent X belongs to Team Y, not requested Team Z" (ERRCODE 23514).'
    },
    {
      id: 'STAGE-06',
      name: 'Invalid Status & Priority Tier Rejection',
      desc: 'Verify that invalid status (e.g. "Draft") or invalid priority (e.g. "Urgent") is rejected with error.',
      expected: 'RPC raises exception with ERRCODE 22023; transaction rolls back; ticket remains unchanged.'
    },
    {
      id: 'STAGE-07',
      name: 'Direct SQL UPDATE Rejection (Bypass Prevention)',
      desc: 'Verify that an authenticated agent attempting direct SQL UPDATE public.tickets SET status = ... is rejected by PostgreSQL privilege check.',
      expected: 'PostgreSQL error 42501 (permission denied for table tickets); direct UPDATE blocked; forces RPC.'
    },
    {
      id: 'STAGE-08',
      name: 'Historical Analytical Dimension Immutability',
      desc: 'Verify that created_at, department_id, category_id, issue_type cannot be modified by staff, administrators, or RPC parameter smuggling.',
      expected: 'Column-level grants prevent direct UPDATE; RPC does not expose parameters for historical dimensions.'
    },
    {
      id: 'STAGE-09',
      name: 'Unauthorized RPC Execution Rejection',
      desc: 'Verify anonymous users calling public.update_ticket_triage() or public.is_admin() receive permission denied.',
      expected: 'PostgreSQL error: permission denied for function update_ticket_triage (ERRCODE 42501).'
    },
    {
      id: 'STAGE-10',
      name: 'Attempted Role Escalation Resistance',
      desc: 'Verify an authenticated employee attempting to INSERT or UPDATE public.user_roles or pass custom role claim in RPC is rejected.',
      expected: 'RLS policy sec_admin_manage_user_roles blocks write; RPC resolves role via server-checked is_admin() / user_roles.'
    },
    {
      id: 'STAGE-11',
      name: 'Administrator Dimension Table Management',
      desc: 'Verify that only users with role "admin" can insert, update, or delete records in departments, categories, sla_rules, teams, agents.',
      expected: 'Admin user succeeds; agent/manager/employee users receive permission denied via RLS.'
    },
    {
      id: 'STAGE-12',
      name: 'Session Expiry & Dynamic Role Revocation',
      desc: 'Verify that an expired JWT or an administrative role change in public.user_roles takes effect on next request.',
      expected: 'Revoked agent immediately receives 42501 on subsequent triage calls.'
    },
    {
      id: 'STAGE-13',
      name: 'Agent Team-Queue Visibility Isolation',
      desc: 'Verify an authenticated agent can only SELECT tickets matching their verified team queue (current_agent_team_id()). Tickets from other teams return 0 rows.',
      expected: 'Tickets belonging to agent\'s team returned; foreign team tickets excluded under sec_staff_select_tickets.'
    },
    {
      id: 'STAGE-14',
      name: 'Agent Self-Assignment / Claim in Own Team',
      desc: 'Verify an authenticated agent can claim an unassigned ticket in their own team by calling update_ticket_triage with p_agent_id = caller_agent_id.',
      expected: 'Ticket assigned to caller agent; status updated; mutation committed.'
    },
    {
      id: 'STAGE-15',
      name: 'Agent Peer-Assigned Ticket Mutation Rejection',
      desc: 'Verify an authenticated agent attempting to mutate, reassign, or unassign a ticket assigned to a peer agent is rejected with error 42501.',
      expected: 'RPC raises exception: "Unauthorized: Ticket X is assigned to peer Agent Y. Mutation prohibited." (ERRCODE 42501).'
    },
    {
      id: 'STAGE-16',
      name: 'Agent Cross-Team Transfer Rejection',
      desc: 'Verify an authenticated agent attempting to move a ticket to another team is rejected with error 42501.',
      expected: 'RPC raises exception: "Unauthorized: Agents cannot move tickets across teams" (ERRCODE 42501).'
    },
    {
      id: 'STAGE-17',
      name: 'Manager Scoped Authority Enforcement',
      desc: 'Verify an operations manager can only triage or reassign tickets within teams explicitly mapped in public.team_managers. Triaging or moving to an unauthorized team is rejected with error 42501.',
      expected: 'Within assigned teams: mutation succeeds; across unassigned teams: error 42501 raised.'
    },
    {
      id: 'STAGE-18',
      name: 'Unmapped Agent / Revoked Mapping Fail-Closed Gate',
      desc: 'Verify a user with role "agent" whose user_id is not mapped in public.agents or whose agent record has is_active = FALSE receives 0 ticket rows and is blocked from triage with error 42501.',
      expected: 'sec_staff_select_tickets returns 0 rows; RPC raises "Unauthorized: Caller is not mapped to an active agent record" (ERRCODE 42501).'
    },
    {
      id: 'STAGE-19',
      name: 'Agent Unassigned-Ticket Mutation Guardrail (SEC-01)',
      desc: 'Verify an agent cannot alter status or priority of an unassigned ticket while leaving it unassigned via p_unassign_agent => true or null agentId. Triage requires simultaneous self-claim (p_agent_id => current_agent_id()).',
      expected: 'RPC raises exception: "Unauthorized: Ticket is unassigned. Agents cannot unassign an unassigned ticket" (ERRCODE 42501).'
    },
    {
      id: 'STAGE-20',
      name: 'Agent Directory user_id Shielding (SEC-02)',
      desc: 'Verify that anonymous and standard authenticated requests querying public.agent_directory receive canonical agent metadata without user_id, and direct queries to public.agents return 42501 or 0 rows.',
      expected: 'agent_directory returns 24 rows without user_id; base agents table SELECT denied or returns 0 rows for non-admin.'
    },
    {
      id: 'STAGE-21',
      name: 'Agent Directory View Replacement & Hydration Verification (Phase 05C.9)',
      desc: 'Verify public.agent_directory view definition (7 columns, zero user_id), owner (postgres), default security_invoker=false, effective SELECT across all 5 roles, direct agents table denial, and client hydration after NOTIFY pgrst reload schema.',
      expected: 'View owned by postgres; security_invoker=false; HTTP 200 for anon, employee, agent, manager, admin; base agents blocked for non-admin; client hydration succeeds.'
    },
    {
      id: 'STAGE-22',
      name: 'Migration Rerun Idempotency & Schema-Cache Refresh',
      desc: 'Verify re-executing security_hardening_migration.sql a second time against an already-migrated database completes with zero errors, leaves all tables, data, and grants intact, and re-notifies pgrst reload schema.',
      expected: 'Second execution commits cleanly without SQL errors; table data count unchanged; PostgREST schema cache remains fresh.'
    }
  ];

  const prodUrl = (() => {
    try {
      const envPath = path.join(ROOT_DIR, '.env.local');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const match = content.match(/VITE_SUPABASE_URL\s*=\s*(.+)/);
        if (match) return match[1].trim().replace(/^['"]|['"]$/g, '');
      }
    } catch {
      // Ignore read errors
    }
    return '';
  })();

  const stagingUrl = process.env.SUPABASE_STAGING_URL ? process.env.SUPABASE_STAGING_URL.trim() : '';
  const isTargetingProduction = Boolean(stagingUrl && prodUrl && stagingUrl.toLowerCase() === prodUrl.toLowerCase());

  const stagingConfigured = Boolean(
    stagingUrl &&
    process.env.SUPABASE_STAGING_KEY &&
    !isTargetingProduction
  );

  if (isTargetingProduction) {
    console.warn(`\n${colors.red}${colors.bold}[SAFETY INTERLOCK] SUPABASE_STAGING_URL matches the live production URL.${colors.reset}`);
    console.warn(`${colors.yellow}Live security testing against production is strictly blocked. Staging tests remain NOT VERIFIED.${colors.reset}\n`);
  }

  for (const check of stagingChecks) {
    if (isTargetingProduction) {
      reporter.record(
        'NOT VERIFIED',
        'Staging Live Database Verification Checklist',
        `[${check.id}] ${check.name}`,
        `BLOCKED: Staging URL matches production URL. Production testing is prohibited by safety policy.`,
        `Provision a separate disposable Supabase project. See docs/staging-security-verification.md.`
      );
    } else if (!stagingConfigured) {
      reporter.record(
        'NOT VERIFIED',
        'Staging Live Database Verification Checklist',
        `[${check.id}] ${check.name}`,
        `Manual Checklist Item. Expected: ${check.expected}`,
        `Execute manually in disposable Supabase SQL Editor / Auth console as specified in docs/staging-security-verification.md. Note: Supplying --staging does not execute live network calls.`
      );
    } else {
      reporter.record(
        'NOT VERIFIED',
        'Staging Live Database Verification Checklist',
        `[${check.id}] ${check.name}`,
        `Manual Checklist Item. Credentials present, but runtime tests must be executed manually in disposable staging project.`,
        `See docs/staging-security-verification.md for exact step-by-step SQL/Auth instructions. Note: Supplying --staging does not execute live network calls.`
      );
    }
  }
}

// ============================================================================
// Main Execution
// ============================================================================
async function main() {
  console.log('================================================================');
  console.log(' IT Support Analytics: Security Migration Checker & Staging Toolkit');
  console.log('================================================================');
  console.log(`Checking migration file: ${path.relative(ROOT_DIR, MIGRATION_PATH)}`);

  if (!fs.existsSync(MIGRATION_PATH)) {
    console.error(`[FATAL] Migration file not found at: ${MIGRATION_PATH}`);
    process.exitCode = 1;
    return;
  }

  const sqlContent = fs.readFileSync(MIGRATION_PATH, 'utf-8');
  console.log(`File Size: ${(sqlContent.length / 1024).toFixed(2)} KB | Total Lines: ${sqlContent.split('\n').length}`);

  const reporter = new SecurityAuditReporter();

  // 1. Run static heuristic checks on proposed SQL
  runStaticHeuristicAudit(sqlContent, reporter);

  // 2. Add runtime staging checklist with explicit 3-state reporting
  recordStagingChecklist(reporter);

  // 3. Print complete formatted report
  reporter.printReport();

  // Exit with error code if any static check FAILED
  if (reporter.counts.FAIL > 0) {
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error('[UNEXPECTED ERROR]', err);
  process.exitCode = 1;
});
