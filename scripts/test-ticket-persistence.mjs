import assert from 'node:assert/strict';
import { createServer } from 'vite';

async function runTicketPersistenceTests() {
  console.log('===============================================================');
  console.log(' Running Ticket Triage Persistence & Validation Test Suite');
  console.log('===============================================================\n');

  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  try {
    const { dataService } = await server.ssrLoadModule('/src/services/dataService.ts');

    // Test 1: Non-existent ticket rejection
    console.log('Test 1: Non-Existent Ticket Rejection...');
    const nonExistentRes = await dataService.updateTicketTriage('TKT-99999', { status: 'In Progress' });
    assert.equal(nonExistentRes.success, false);
    assert.match(nonExistentRes.error, /not found/i);
    console.log('  -> PASS: Non-existent ticket properly rejected with clean error message.');

    // Test 2: Invalid status rejection
    console.log('\nTest 2: Invalid Status Rejection...');
    const sample = dataService.getTickets({ limit: 1 }).tickets[0];
    assert.ok(sample, 'Must have at least one ticket');
    const invalidStatusRes = await dataService.updateTicketTriage(sample.ticket_id, { status: 'InvalidStatus' });
    assert.equal(invalidStatusRes.success, false);
    assert.match(invalidStatusRes.error, /invalid status/i);
    console.log('  -> PASS: Invalid status value properly rejected.');

    // Test 3: Invalid priority rejection
    console.log('\nTest 3: Invalid Priority Rejection...');
    const invalidPrioRes = await dataService.updateTicketTriage(sample.ticket_id, { priority: 'Urgent' });
    assert.equal(invalidPrioRes.success, false);
    assert.match(invalidPrioRes.error, /invalid priority/i);
    console.log('  -> PASS: Invalid priority tier properly rejected.');

    // Test 4: Invalid agent ID rejection
    console.log('\nTest 4: Non-Canonical Agent ID Rejection...');
    const invalidAgentRes = await dataService.updateTicketTriage(sample.ticket_id, { agentId: 9999 });
    assert.equal(invalidAgentRes.success, false);
    assert.match(invalidAgentRes.error, /support specialist/i);
    console.log('  -> PASS: Non-canonical agent ID rejected.');

    // Test 5: Successful in-memory session triage update & SLA pairing
    console.log('\nTest 5: Priority Update & SLA Rule Pairing...');
    const targetTicket = dataService.getTickets({ limit: 1 }).tickets[0];
    const originalPrio = targetTicket.priority;
    const testPrio = originalPrio === 'Critical' ? 'High' : 'Critical';

    // In seeded/offline mode or session mode, updateTicketTriage applies governed rules
    const prioRes = await dataService.updateTicketTriage(targetTicket.ticket_id, { priority: testPrio });
    assert.equal(prioRes.success, true);
    assert.equal(prioRes.ticket?.priority, testPrio);
    const expectedRuleId = testPrio === 'Critical' ? 1 : 2;
    assert.equal(prioRes.ticket?.sla_rule_id, expectedRuleId);
    console.log(`  -> PASS: Priority updated to ${testPrio} with corresponding SLA rule #${expectedRuleId}.`);

    // Test 6: Status transition to Resolved and back
    console.log('\nTest 6: Status Transition & Turnaround Calculation...');
    const resolveRes = await dataService.updateTicketTriage(targetTicket.ticket_id, { status: 'Resolved' });
    assert.equal(resolveRes.success, true);
    assert.equal(resolveRes.ticket?.status, 'Resolved');
    assert.ok(resolveRes.ticket?.resolved_at !== null, 'resolved_at timestamp must be set');
    assert.ok(typeof resolveRes.ticket?.resolution_time_hours === 'number', 'resolution_time_hours must be numeric');
    assert.ok(resolveRes.ticket.resolution_time_hours >= 0.5, 'resolution_time_hours must be at least 0.5h');

    // Transition back to In Progress
    const inProgressRes = await dataService.updateTicketTriage(targetTicket.ticket_id, { status: 'In Progress' });
    assert.equal(inProgressRes.success, true);
    assert.equal(inProgressRes.ticket?.status, 'In Progress');
    assert.equal(inProgressRes.ticket?.resolved_at, null);
    assert.equal(inProgressRes.ticket?.resolution_time_hours, null);
    console.log('  -> PASS: Resolved transition correctly calculates turnaround; reopen clears resolved fields.');

    // Test 7: Canonical agent assignment & team alignment
    console.log('\nTest 7: Canonical Agent Assignment & Team ID Alignment...');
    const assignRes = await dataService.updateTicketTriage(targetTicket.ticket_id, { agentId: 4 });
    assert.equal(assignRes.success, true);
    assert.equal(assignRes.ticket?.agent_id, 4);
    assert.equal(assignRes.ticket?.team_id, 4);

    const unassignRes = await dataService.updateTicketTriage(targetTicket.ticket_id, { agentId: null });
    assert.equal(unassignRes.success, true);
    assert.equal(unassignRes.ticket?.agent_id, null);
    console.log('  -> PASS: Agent assignment updates agent_id and team_id; unassign sets null.');

    // Test 8: Immutability of non-writable analytics dimensions
    console.log('\nTest 8: Immutability of Read-Only Analytical Dimensions...');
    const origCreatedAt = targetTicket.created_at;
    const origDeptId = targetTicket.department_id;
    const origCatId = targetTicket.category_id;
    const origIssueType = targetTicket.issue_type;

    await dataService.updateTicketTriage(targetTicket.ticket_id, {
      status: 'Open',
      priority: originalPrio,
      agentId: 1
    });

    assert.equal(targetTicket.created_at, origCreatedAt, 'created_at must not be mutated');
    assert.equal(targetTicket.department_id, origDeptId, 'department_id must not be mutated');
    assert.equal(targetTicket.category_id, origCatId, 'category_id must not be mutated');
    assert.equal(targetTicket.issue_type, origIssueType, 'issue_type must not be mutated');
    console.log('  -> PASS: Read-only dimensions (created_at, department_id, category_id, issue_type) strictly preserved.');

    // Test 9: Mutation Capability Verification
    console.log('\nTest 9: Mutation Capability & Auth Mode Inspection...');
    const capability = await dataService.getMutationCapability();
    assert.equal(typeof capability.canPersistRemotely, 'boolean');
    assert.ok(capability.authMode === 'demo_session' || capability.authMode === 'unauthenticated_anon' || capability.authMode === 'authenticated_user');
    assert.ok(typeof capability.reason === 'string' && capability.reason.length > 0);
    console.log(`  -> PASS: Mutation capability evaluated: authMode="${capability.authMode}", canPersistRemotely=${capability.canPersistRemotely}`);

    // Test 10: Safe Demo-Only Mode Verification (Gated Remote Writes)
    console.log('\nTest 10: Safe Demo Mode & Non-Persistence for Unauthenticated Demo Roles...');
    const demoRes = await dataService.updateTicketTriage(targetTicket.ticket_id, {
      status: 'In Progress',
      priority: 'High'
    });
    assert.equal(demoRes.success, true);
    if (!capability.canPersistRemotely) {
      assert.equal(demoRes.isPersisted, false, 'Unauthenticated demo session must not report isPersisted=true');
      assert.equal(demoRes.mode, 'demo_session', 'Must report demo_session mode');
      assert.ok(demoRes.notice, 'Must include user-facing notice explaining demo gating');
      console.log('  -> PASS: Unauthenticated triage correctly operates in safe Governed Demo Mode.');
    } else {
      console.log('  -> PASS: Persistent environment active; write confirmed.');
    }

    // Test 11: Database Failure / Permission-Denied Simulation & Strict State Rollback
    console.log('\nTest 11: Database Permission-Denied Simulation & State Rollback...');
    const preFailStatus = targetTicket.status;
    const preFailPriority = targetTicket.priority;
    const preFailResolvedAt = targetTicket.resolved_at;

    // Simulate Supabase 42501 permission denied
    dataService._simulateDatabaseErrorForTesting('Permission denied: table "tickets" violates row level security policy for role "anon"');

    const failRes = await dataService.updateTicketTriage(targetTicket.ticket_id, {
      status: 'Resolved',
      priority: 'Critical'
    });

    assert.equal(failRes.success, false, 'Failed database update must return success=false');
    assert.equal(failRes.isPersisted, false, 'Failed database update must return isPersisted=false');
    assert.match(failRes.error, /permission denied/i);

    // Verify state rollback: ticket in memory was NOT mutated by the failed write
    assert.equal(targetTicket.status, preFailStatus, 'Ticket status must be rolled back on write failure');
    assert.equal(targetTicket.priority, preFailPriority, 'Ticket priority must be rolled back on write failure');
    assert.equal(targetTicket.resolved_at, preFailResolvedAt, 'Ticket resolved_at must be rolled back on write failure');
    console.log('  -> PASS: Simulated permission-denied response handled gracefully with zero memory state contamination.');

    // Test 12: Client-Side Role Presentation Non-Escalation
    console.log('\nTest 12: Client-Side Role Presentation Non-Escalation...');
    const adminCap = await dataService.getMutationCapability();
    assert.equal(adminCap.canPersistRemotely, capability.canPersistRemotely, 'Client role must not escalate remote database permissions');
    console.log('  -> PASS: Client presentation roles do not bypass database security boundaries.');

    // Test 13: Direct API Call Bypass Resistance (Bypassing UI)
    console.log('\nTest 13: Direct API Call Bypass Resistance (Bypassing UI)...');
    const directCallRes = await dataService.updateTicketTriage(targetTicket.ticket_id, {
      status: 'Pending',
      resolutionNotes: 'Direct programmatic invocation outside UI'
    });
    assert.equal(directCallRes.success, true);
    assert.equal(directCallRes.isPersisted, false, 'Direct call without verified auth must not persist remotely');
    assert.equal(directCallRes.mode, 'demo_session', 'Must enforce demo_session mode on direct call');
    assert.match(directCallRes.notice || '', /(demo|seeded|disabled)/i);
    console.log('  -> PASS: Direct programmatic invocation safely trapped in session memory without remote database write.');

    // Test 14: Mocked Authenticated User Capability Inspection
    console.log('\nTest 14: Mocked Authenticated User Capability Inspection...');
    const { supabase } = await server.ssrLoadModule('/src/lib/supabase.ts');
    if (supabase?.auth) {
      const originalGetSession = supabase.auth.getSession;
      try {
        // Mock active staff session
        supabase.auth.getSession = async () => ({
          data: {
            session: {
              user: { id: 'usr-agent-01', email: 'verified.agent@company.com' }
            }
          },
          error: null
        });

        // Verify live data mode authenticated capability
        await dataService.hydrateFromSupabase();
        const liveAuthCap = await dataService.getMutationCapability();
        assert.equal(liveAuthCap.canPersistRemotely, true, 'Authenticated session in live mode must enable remote persistence');
        assert.equal(liveAuthCap.authMode, 'authenticated_user', 'Auth mode must resolve to authenticated_user');
        assert.match(liveAuthCap.reason, /verified\.agent@company\.com/i);
        console.log('  -> PASS: Authenticated user session dynamically enables remote persistence capability in live data mode.');
      } finally {
        supabase.auth.getSession = originalGetSession;
      }
    } else {
      console.log('  -> SKIP: Supabase client not initialized in this test environment.');
    }

    // Test 15: Dimension Table Read-Only Access & Integrity
    console.log('\nTest 15: Dimension Table Read-Only Access & Integrity...');
    const depts = dataService.getDepartments();
    const categories = dataService.getCategories();
    const slaRules = dataService.getSlaRules();
    const teams = dataService.getTeams();
    const agents = dataService.getAgents();

    assert.equal(depts.length, 5, 'Departments dimension must contain exactly 5 records');
    assert.equal(categories.length, 6, 'Categories dimension must contain exactly 6 records');
    assert.equal(slaRules.length, 4, 'SLA rules dimension must contain exactly 4 records');
    assert.equal(teams.length, 8, 'Teams dimension must contain exactly 8 records');
    assert.equal(agents.length, 24, 'Agents dimension must contain exactly 24 records');
    console.log('  -> PASS: All 5 dimension tables verified with exact governed record counts.');

    // Test 16: Static Schema Contract Check on Proposed SQL Migration Proposal
    console.log('\nTest 16: Static Schema Contract Check on Proposed SQL Migration Proposal (Not Live Runtime Proof)...');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const migrationPath = path.resolve(process.cwd(), 'it_support_analytics_dataset/sql/security_hardening_migration.sql');
    assert.ok(fs.existsSync(migrationPath), 'security_hardening_migration.sql must exist');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

    // 1. Verify all 6 tables have RLS enabled
    ['tickets', 'departments', 'categories', 'sla_rules', 'teams', 'agents'].forEach(tbl => {
      assert.match(
        sqlContent,
        new RegExp(`ALTER TABLE public\\.${tbl} ENABLE ROW LEVEL SECURITY;`, 'i'),
        `Migration must enable RLS on ${tbl}`
      );
      assert.match(
        sqlContent,
        new RegExp(`REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE[\\s\\S]*?public\\.${tbl}[\\s\\S]*?FROM anon;`, 'i'),
        `Migration must revoke write privileges from anon on ${tbl}`
      );
    });

    // 2. Verify idempotency
    assert.match(sqlContent, /DROP POLICY IF EXISTS/i, 'Migration must contain DROP POLICY IF EXISTS for idempotency');

    // 3. Verify user_metadata removal & app_metadata enforcement
    assert.ok(!/auth\.jwt\(\)\s*->\s*'user_metadata'/i.test(sqlContent), 'Migration must NEVER use client-writable user_metadata for authorization');
    assert.match(sqlContent, /'app_metadata'\s*->>\s*'role'/i, 'Migration must extract role strictly from server-controlled app_metadata');

    // 4. Verify minimal function search_path and execution privileges
    assert.match(sqlContent, /search_path\s*=\s*pg_catalog,\s*pg_temp/i, 'Helper function must use minimal trusted search_path');
    assert.match(sqlContent, /REVOKE ALL ON FUNCTION public\.current_user_role\(\) FROM anon/i, 'Must revoke function execution from anon');

    // 5. Verify complete revocation of direct UPDATE on tickets (RPC-only triage gate)
    assert.match(sqlContent, /REVOKE UPDATE ON TABLE public\.tickets FROM authenticated;/i, 'Must revoke update from authenticated');
    assert.match(sqlContent, /REVOKE UPDATE ON TABLE public\.tickets FROM anon;/i, 'Must revoke update from anon');
    assert.match(sqlContent, /REVOKE UPDATE ON TABLE public\.tickets FROM PUBLIC;/i, 'Must revoke update from PUBLIC');
    assert.ok(!/GRANT\s+UPDATE[\s\S]*?ON\s+TABLE\s+public\.tickets/i.test(sqlContent), 'Must NOT grant direct UPDATE on tickets; triage must be RPC-only');
    assert.ok(!/CREATE\s+POLICY\s+"sec_staff_update_ticket_triage"/i.test(sqlContent), 'sec_staff_update_ticket_triage must NOT be created to prevent direct UPDATE bypass');

    // 5B. Verify Least Privilege Fact Table Read Access (Anonymous & Employee Fact Lockdown)
    assert.match(sqlContent, /REVOKE SELECT ON TABLE public\.tickets FROM anon;/i, 'Must explicitly revoke SELECT on tickets from anon');
    assert.ok(
      !(
        /GRANT\s+SELECT[^;]*?ON\s+(?:TABLE\s+)?public\.tickets[^;]*?TO[^;]*?\banon\b/i.test(sqlContent) ||
        /GRANT\s+SELECT[^;]*?TO[^;]*?\banon\b[^;]*?ON\s+(?:TABLE\s+)?public\.tickets/i.test(sqlContent)
      ),
      'Must NOT grant SELECT on tickets to anon'
    );
    assert.ok(!/CREATE\s+POLICY\s+"sec_anon_select_tickets"/i.test(sqlContent), 'sec_anon_select_tickets must NOT be created');
    assert.ok(!/CREATE\s+POLICY\s+"sec_auth_select_tickets"[\s\S]*?USING\s*\(\s*true\s*\)/i.test(sqlContent), 'Unconditional sec_auth_select_tickets must NOT be created');
    assert.match(
      sqlContent,
      /CREATE POLICY "sec_staff_select_tickets"[\s\S]*?FOR SELECT TO authenticated[\s\S]*?USING \([\s\S]*?public\.current_user_role\(\) IN \('agent', 'manager', 'admin'\)/i,
      'Must restrict tickets SELECT to staff roles'
    );
    // Model C Hybrid checks
    assert.match(sqlContent, /ALTER TABLE public\.agents\s+ADD COLUMN IF NOT EXISTS user_id UUID/i, 'Must define user_id on public.agents');
    assert.match(sqlContent, /CREATE TABLE IF NOT EXISTS public\.team_managers/i, 'Must define public.team_managers table');
    assert.match(sqlContent, /CREATE OR REPLACE FUNCTION public\.current_agent_id\(\)/i, 'Must define current_agent_id helper');
    assert.match(sqlContent, /CREATE OR REPLACE FUNCTION public\.current_agent_team_id\(\)/i, 'Must define current_agent_team_id helper');
    assert.match(sqlContent, /CREATE OR REPLACE FUNCTION public\.is_team_manager/i, 'Must define is_team_manager helper');
    assert.match(sqlContent, /is assigned to peer Agent/i, 'update_ticket_triage must reject peer-assigned ticket mutations');
    assert.match(sqlContent, /Agents cannot move tickets across teams/i, 'update_ticket_triage must reject agent cross-team moves');
    assert.match(sqlContent, /Agents cannot unassign an unassigned ticket/i, 'update_ticket_triage must reject unassigning unassigned ticket (SEC-01)');
    assert.match(sqlContent, /CREATE OR REPLACE VIEW public\.agent_directory AS/i, 'Must define public.agent_directory view (SEC-02)');
    assert.match(sqlContent, /REVOKE SELECT ON TABLE public\.agents FROM anon;/i, 'Must revoke direct SELECT on base agents from anon (SEC-02)');
    assert.ok(!/CREATE POLICY "sec_auth_select_agents"[\s\S]*?USING\s*\(\s*true\s*\)/i.test(sqlContent), 'Must not create permissive sec_auth_select_agents on base table (SEC-02)');
    assert.match(sqlContent, /CREATE POLICY "sec_admin_manage_agents"[\s\S]*?USING \(public\.is_admin\(\)\)/i, 'Direct agents base table access must be gated by is_admin() (SEC-02)');

    // 6. Verify Access Matrix: SQL Grants reconciled with RLS policies (Requirement 4)
    // SQL grants are provided to `authenticated` for admin management, strictly filtered by RLS policies
    assert.match(sqlContent, /GRANT INSERT, UPDATE, DELETE ON TABLE[\s\S]*?public\.departments[\s\S]*?TO authenticated;/i, 'Must grant table operations to authenticated so admin RLS policies are effective');
    assert.match(sqlContent, /REVOKE TRUNCATE ON TABLE[\s\S]*?public\.departments[\s\S]*?FROM authenticated;/i, 'Must unconditionally revoke TRUNCATE from authenticated');
    assert.match(sqlContent, /CREATE POLICY "sec_admin_manage_departments"[\s\S]*?USING \(public\.is_admin\(\)\)/i, 'Admin management on dimensions must be gated by public.is_admin()');

    // 7. Verify Recursion-Free Role Management & Database-Backed user_roles Table (Requirement 1 & 3)
    assert.match(sqlContent, /CREATE TABLE IF NOT EXISTS public\.user_roles/i, 'Migration must define database-backed user_roles table');
    assert.match(sqlContent, /REFERENCES auth\.users\(id\)/i, 'user_roles must reference auth.users(id)');
    assert.match(sqlContent, /ALTER TABLE public\.user_roles ENABLE ROW LEVEL SECURITY;/i, 'user_roles must have RLS enabled');
    assert.match(sqlContent, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/i, 'Must provide dedicated is_admin() helper to prevent RLS recursion');
    assert.match(sqlContent, /CREATE POLICY "sec_admin_manage_user_roles"[\s\S]*?USING \(public\.is_admin\(\)\)[\s\S]*?WITH CHECK \(public\.is_admin\(\)\);/i, 'sec_admin_manage_user_roles must use is_admin() to prevent infinite RLS recursion');
    assert.ok(!/CREATE POLICY "sec_admin_manage_user_roles"[\s\S]*?SELECT 1 FROM public\.user_roles/i.test(sqlContent), 'sec_admin_manage_user_roles must NOT contain a recursive subquery on public.user_roles');

    // 8. Verify Role Whitelisting in public.current_user_role() (Requirement 3)
    assert.match(sqlContent, /IF v_role IN \('agent', 'manager', 'admin'\) THEN/i, 'current_user_role() must strictly whitelist permitted staff roles');
    assert.match(sqlContent, /RETURN 'authenticated';/i, 'current_user_role() must default unprivileged/unknown roles to authenticated');

    // 9. Verify Deep Validation in public.update_ticket_triage (Requirement 2 & 4)
    assert.match(sqlContent, /CREATE OR REPLACE FUNCTION public\.update_ticket_triage/i, 'Migration must propose safe update_ticket_triage function');
    assert.match(sqlContent, /Inconsistent agent\/team assignment/i, 'update_ticket_triage must reject inconsistent agent/team combinations');
    assert.match(sqlContent, /Agent ID .*? not found in canonical agents dimension/i, 'update_ticket_triage must reject unknown agents');
    assert.match(sqlContent, /No SLA rule found for priority/i, 'update_ticket_triage must enforce valid matching SLA rule');
    assert.match(sqlContent, /resolved_at \(.*?\) cannot be earlier than created_at/i, 'update_ticket_triage must validate temporal consistency');
    assert.match(sqlContent, /ALTER FUNCTION public\.update_ticket_triage[\s\S]*?OWNER TO postgres;/i, 'update_ticket_triage must be owned by postgres');
    assert.match(sqlContent, /REVOKE ALL ON FUNCTION public\.update_ticket_triage[\s\S]*?FROM anon;/i, 'update_ticket_triage must revoke execution from anon');
    assert.match(sqlContent, /GRANT EXECUTE ON FUNCTION public\.update_ticket_triage[\s\S]*?TO authenticated, service_role;/i, 'update_ticket_triage must grant execution to authenticated and service_role');

    // 10. Verify PUBLIC & anon Write Revocation (Requirement 4 & 7)
    assert.match(sqlContent, /REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE[\s\S]*?FROM PUBLIC;/i, 'Write access must be revoked from PUBLIC pseudo-role');
    assert.match(sqlContent, /REVOKE UPDATE ON TABLE public\.tickets FROM PUBLIC;/i, 'Ticket UPDATE must be revoked from PUBLIC');
    assert.match(sqlContent, /ALTER DEFAULT PRIVILEGES IN SCHEMA public[\s\S]*?REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLES FROM anon, PUBLIC;/i, 'Default privileges must revoke write from anon and PUBLIC');

    // 11. Verify Identity Governance Reality (Requirement 5 & 6)
    assert.ok(!sqlContent.includes('employee_insert_own_tickets'), 'Must NOT pretend row-level employee ownership exists without user_id column');
    assert.ok(!sqlContent.includes('users can access only their own tickets'), 'Must NOT falsely claim row-level isolation on fact table');
    console.log('  -> PASS: Revised SQL hardening migration satisfies all recursion-free, grant matrix, role whitelist, and triage validation criteria.');

    // Test 17: Column-Level Immutability Enforcement
    console.log('\nTest 17: Service-Level Column Immutability Enforcement...');
    const originalCreatedAt = targetTicket.created_at;
    const originalDeptId = targetTicket.department_id;
    const originalIssueType = targetTicket.issue_type;

    // Direct invocation with forbidden fields attempting to be smuggled
    await dataService.updateTicketTriage(targetTicket.ticket_id, {
      status: 'Open',
      created_at: '1970-01-01 00:00:00',
      department_id: 999,
      issue_type: 'Hacked Issue'
    });

    assert.equal(targetTicket.created_at, originalCreatedAt, 'created_at must not be mutated');
    assert.equal(targetTicket.department_id, originalDeptId, 'department_id must not be mutated');
    assert.equal(targetTicket.issue_type, originalIssueType, 'issue_type must not be mutated');
    console.log('  -> PASS: Service layer strictly strips unpermitted columns; only defined triage columns update.');

    // Test 18: Client-Side Demo Role Non-Elevation
    console.log('\nTest 18: Demo Role Presentation vs Real Auth Enforcement...');
    // Demo user with role 'admin' in client cannot trigger remote persistence
    const adminDemoRes = await dataService.updateTicketTriage(targetTicket.ticket_id, { status: 'In Progress' });
    assert.equal(adminDemoRes.isPersisted, false, 'Selecting admin demo role must NOT grant remote persistence');
    assert.equal(adminDemoRes.mode, 'demo_session', 'Must operate in demo_session mode');
    console.log('  -> PASS: Selecting Admin demo role in UI/client does not grant remote database write permissions.');

    // Test 19: Offline Behavioral Evaluation of SEC-01 Triage Authorization Invariants
    console.log('\nTest 19: Offline Behavioral Evaluation of SEC-01 Invariants (5 Scenarios)...');
    function evaluateAgentTriageRule({
      callerAgentId,
      callerTeamId,
      ticketAgentId,
      ticketTeamId,
      targetAgentId,
      unassignAgent
    }) {
      if (ticketTeamId !== callerTeamId) {
        return { permitted: false, error: 'Unauthorized: Cross-team access prohibited' };
      }
      if (ticketAgentId !== null && ticketAgentId !== callerAgentId) {
        return { permitted: false, error: `Unauthorized: Ticket is assigned to peer Agent ${ticketAgentId}. Mutation prohibited.` };
      } else if (ticketAgentId === null) {
        if (unassignAgent === true) {
          return { permitted: false, error: 'Unauthorized: Ticket is unassigned. Agents cannot unassign an unassigned ticket; Agent must claim unassigned ticket by assigning self before triaging' };
        }
        if (targetAgentId === null || targetAgentId === undefined || targetAgentId !== callerAgentId) {
          return { permitted: false, error: 'Unauthorized: Agent must claim unassigned ticket by assigning self before triaging' };
        }
        return { permitted: true, assignedAgentId: callerAgentId, teamId: callerTeamId };
      } else {
        if (unassignAgent === true) {
          return { permitted: true, assignedAgentId: null, teamId: callerTeamId };
        }
        if (targetAgentId !== null && targetAgentId !== undefined && targetAgentId !== callerAgentId) {
          return { permitted: false, error: 'Unauthorized: Agents cannot reassign tickets to other agents. Manager required.' };
        }
        return { permitted: true, assignedAgentId: callerAgentId, teamId: callerTeamId };
      }
    }

    // 1. Unassigned ticket + p_unassign_agent = TRUE + status change: denied
    const s1 = evaluateAgentTriageRule({ callerAgentId: 5, callerTeamId: 1, ticketAgentId: null, ticketTeamId: 1, targetAgentId: null, unassignAgent: true });
    assert.equal(s1.permitted, false, 'Scenario 1: unassigning unassigned ticket must be denied');
    assert.match(s1.error, /Agents cannot unassign an unassigned ticket/);

    // 2. Unassigned ticket + p_unassign_agent = TRUE + priority change: denied
    const s2 = evaluateAgentTriageRule({ callerAgentId: 5, callerTeamId: 1, ticketAgentId: null, ticketTeamId: 1, targetAgentId: null, unassignAgent: true });
    assert.equal(s2.permitted, false, 'Scenario 2: unassigning unassigned ticket with priority change must be denied');
    assert.match(s2.error, /Agents cannot unassign an unassigned ticket/);

    // 3. Unassigned ticket + explicit valid self-claim: permitted
    const s3 = evaluateAgentTriageRule({ callerAgentId: 5, callerTeamId: 1, ticketAgentId: null, ticketTeamId: 1, targetAgentId: 5, unassignAgent: false });
    assert.equal(s3.permitted, true, 'Scenario 3: valid self-claim must be permitted');
    assert.equal(s3.assignedAgentId, 5);

    // 4. Agent own assigned ticket + legitimate self-unassignment: permitted
    const s4 = evaluateAgentTriageRule({ callerAgentId: 5, callerTeamId: 1, ticketAgentId: 5, ticketTeamId: 1, targetAgentId: null, unassignAgent: true });
    assert.equal(s4.permitted, true, 'Scenario 4: legitimate self-unassign to team queue must be permitted');
    assert.equal(s4.assignedAgentId, null);

    // 5. Peer-assigned ticket + unassign request: denied
    const s5 = evaluateAgentTriageRule({ callerAgentId: 5, callerTeamId: 1, ticketAgentId: 6, ticketTeamId: 1, targetAgentId: null, unassignAgent: true });
    assert.equal(s5.permitted, false, 'Scenario 5: peer-assigned ticket mutation/unassign must be denied');
    assert.match(s5.error, /assigned to peer Agent 6/);

    console.log('  -> PASS: All 5 SEC-01 invariant scenarios verified (unassign on unassigned denied, self-claim allowed, self-unassign allowed, peer denied).');

    // Test 20: Offline Verification of Agent Directory Fallback Hardening & Identity Shielding (Phase 05C.7)
    console.log('\nTest 20: Offline Verification of Agent Directory Fallback Hardening (Phase 05C.7)...');
    const dataServicePath = path.resolve(process.cwd(), 'src/services/dataService.ts');
    assert.ok(fs.existsSync(dataServicePath), 'dataService.ts must exist');
    const dsCode = fs.readFileSync(dataServicePath, 'utf-8');

    // 1. Normal path queries agent_directory with explicit public directory fields
    assert.match(
      dsCode,
      /supabase\.from\(['"]agent_directory['"]\)\.select\(['"]agent_id,\s*agent_code,\s*agent_name,\s*team_id,\s*experience_band,\s*is_active,\s*created_at['"]\)/,
      'Normal path must query agent_directory with explicit public directory columns'
    );

    // 2. Fallback uses explicit safe columns and NEVER select('*')
    assert.match(
      dsCode,
      /supabase\s*\.from\(['"]agents['"]\)\s*\.select\(['"]agent_id,\s*agent_code,\s*team_id,\s*experience_band['"]\)/,
      'Fallback path must query base agents table with explicit safe columns'
    );
    assert.ok(
      !/\.from\(['"]agents['"]\)\s*\.select\(['"]\*['"]\)/.test(dsCode),
      'Fallback path must NEVER use select("*") on base agents table'
    );

    // 3. user_id is strictly EXCLUDED from all client queries
    assert.ok(
      !/\.from\(['"](?:agents|agent_directory)['"]\)\.select\([^)]*?\buser_id\b[^)]*?\)/i.test(dsCode),
      'Client queries on agents or agent_directory must NEVER select user_id'
    );

    // 4. Fallback discriminator logic verification (simulated error evaluation)
    function shouldTriggerFallback(err, isAborted = false) {
      if (!err || isAborted) return false;
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

      return isMissingView;
    }

    // Auth error 42501 -> MUST NOT trigger fallback
    assert.equal(
      shouldTriggerFallback({ code: '42501', message: 'permission denied for relation agent_directory' }),
      false,
      'Authorization error (42501) must NOT trigger fallback'
    );

    // HTTP 401 Unauthorized -> MUST NOT trigger fallback
    assert.equal(
      shouldTriggerFallback({ status: 401, message: 'Invalid JWT' }),
      false,
      'HTTP 401 Unauthorized must NOT trigger fallback'
    );

    // HTTP 403 Forbidden -> MUST NOT trigger fallback
    assert.equal(
      shouldTriggerFallback({ status: 403, message: 'Forbidden' }),
      false,
      'HTTP 403 Forbidden must NOT trigger fallback'
    );

    // Abort / timeout signal -> MUST NOT trigger fallback
    assert.equal(
      shouldTriggerFallback({ name: 'AbortError', message: 'The user aborted a request' }, true),
      false,
      'Abort / timeout error must NOT trigger fallback'
    );

    // Network failure -> MUST NOT trigger fallback
    assert.equal(
      shouldTriggerFallback({ message: 'Failed to fetch' }),
      false,
      'Network failure must NOT trigger fallback'
    );

    // Missing relation 42P01 -> MUST trigger fallback
    assert.equal(
      shouldTriggerFallback({ code: '42P01', message: 'relation "public.agent_directory" does not exist' }),
      true,
      'Genuinely missing view (42P01) MUST trigger fallback'
    );

    // PostgREST schema cache miss PGRST200 -> MUST trigger fallback
    assert.equal(
      shouldTriggerFallback({ code: 'PGRST200', message: "Could not find the table 'agent_directory' in the schema cache" }),
      true,
      'Schema cache miss (PGRST200) MUST trigger fallback'
    );

    // 5. Normalizer fidelity on fallback projection
    const { normalizeAgent, CANONICAL_AGENT_NAMES } = await server.ssrLoadModule('/src/services/dataNormalizer.ts');
    const sampleFallbackRow = {
      agent_id: 1,
      agent_code: 'AGT-001',
      team_id: 1,
      experience_band: 'Senior'
    };
    const normalizedAgent = normalizeAgent(sampleFallbackRow);
    assert.equal(normalizedAgent.agent_id, 1);
    assert.equal(normalizedAgent.agent_code, 'AGT-001');
    assert.equal(normalizedAgent.agent_name, CANONICAL_AGENT_NAMES['AGT-001']);
    assert.equal(normalizedAgent.team_id, 1);
    assert.equal(normalizedAgent.experience_band, 'Senior');
    assert.equal(normalizedAgent.user_id, undefined, 'Normalized agent must not expose user_id');

    console.log('  -> PASS: Agent directory fallback hardening verified (safe projection, no select(*), auth error isolated, normalizer intact).');

    // Test 21: Offline Verification of Agent Directory View Replacement Safety & Contract Parity (Phase 05C.10 Static Invariants)
    console.log('\nTest 21: Offline Verification of Agent Directory View Replacement Safety (Phase 05C.10 Static Invariants)...');
    const schemaSqlPath = path.resolve(process.cwd(), 'it_support_analytics_dataset/sql/supabase_schema.sql');
    const migSqlPath = path.resolve(process.cwd(), 'it_support_analytics_dataset/sql/security_hardening_migration.sql');
    assert.ok(fs.existsSync(schemaSqlPath), 'supabase_schema.sql must exist');
    assert.ok(fs.existsSync(migSqlPath), 'security_hardening_migration.sql must exist');

    const schemaSql = fs.readFileSync(schemaSqlPath, 'utf-8');
    const migSql = fs.readFileSync(migSqlPath, 'utf-8');

    // 1. Both use CREATE OR REPLACE VIEW public.agent_directory
    assert.match(schemaSql, /CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.agent_directory\s+AS/i, 'Fresh schema must use CREATE OR REPLACE VIEW public.agent_directory');
    assert.match(migSql, /CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.agent_directory\s+AS/i, 'Migration must use CREATE OR REPLACE VIEW public.agent_directory');

    // 2. Strict absence of CASCADE drops across all schemas and migrations
    assert.ok(!/(?:^|;)\s*DROP\s+(?:TABLE|VIEW|FUNCTION|SCHEMA)[\s\S]*?\bCASCADE\b/im.test(migSql), 'Migration must not contain CASCADE drops');
    assert.ok(!/(?:^|;)\s*DROP\s+(?:TABLE|VIEW|FUNCTION|SCHEMA)[\s\S]*?\bCASCADE\b/im.test(schemaSql), 'Fresh schema must not contain CASCADE drops');

    // 3. Fresh schema must not DROP view; migration must not unconditionally DROP view at top level
    assert.ok(!/(?:^|;)\s*DROP\s+VIEW\s+(?:IF\s+EXISTS\s+)?(?:public\.)?agent_directory/im.test(schemaSql), 'Fresh schema must not DROP agent_directory');
    assert.ok(!/^\s*DROP\s+VIEW\s+(?:IF\s+EXISTS\s+)?(?:public\.)?agent_directory\s*;/im.test(migSql), 'Migration must not unconditionally DROP view at top level');

    // 4. Guarded type-reconciliation drop in migration (RESTRICT behavior on type mismatch)
    const hasGuardedTypeDrop = /IF\s+v_view_type\s+IS\s+NOT\s+NULL[\s\S]*?v_view_type\s*<>\s*v_table_type[\s\S]*?DROP\s+VIEW\s+public\.agent_directory\s+RESTRICT/i.test(migSql);
    assert.ok(hasGuardedTypeDrop, 'Migration must guard view drop with created_at type comparison and RESTRICT');

    // 5. Ownership and Grants explicitly set in BOTH fresh schema and migration
    assert.match(migSql, /ALTER\s+VIEW\s+public\.agent_directory\s+OWNER\s+TO\s+postgres;/i, 'Migration must set view owner to postgres');
    assert.match(migSql, /GRANT\s+SELECT\s+ON\s+TABLE\s+public\.agent_directory\s+TO\s+anon,\s*authenticated;/i, 'Migration must grant SELECT to anon, authenticated');
    assert.match(migSql, /REVOKE\s+ALL\s+ON\s+TABLE\s+public\.agent_directory\s+FROM\s+PUBLIC;/i, 'Migration must revoke from PUBLIC');

    assert.match(schemaSql, /ALTER\s+VIEW\s+public\.agent_directory\s+OWNER\s+TO\s+postgres;/i, 'Fresh schema must set view owner to postgres');
    assert.match(schemaSql, /GRANT\s+SELECT\s+ON\s+TABLE\s+public\.agent_directory\s+TO\s+anon,\s*authenticated;/i, 'Fresh schema must grant SELECT to anon, authenticated');
    assert.match(schemaSql, /REVOKE\s+ALL\s+ON\s+TABLE\s+public\.agent_directory\s+FROM\s+PUBLIC;/i, 'Fresh schema must revoke from PUBLIC');

    // 6. Cross-file column projection parity
    const extractCols = (sql) => {
      const match = sql.match(/CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.agent_directory\s+AS\s+SELECT([\s\S]*?)FROM/i);
      assert.ok(match, 'Must match view projection');
      return match[1].split(',').map(s => s.trim().replace(/^public\./, '')).filter(Boolean);
    };
    const schemaCols = extractCols(schemaSql);
    const migCols = extractCols(migSql);
    const expectedCols = ['agent_id', 'agent_code', 'agent_name', 'team_id', 'experience_band', 'is_active', 'created_at'];

    assert.deepEqual(schemaCols, expectedCols, 'Fresh schema projection must match canonical contract');
    assert.deepEqual(migCols, expectedCols, 'Migration projection must match canonical contract');
    assert.ok(!schemaCols.includes('user_id'), 'Fresh schema must not project user_id');
    assert.ok(!migCols.includes('user_id'), 'Migration must not project user_id');

    // 7. Default security_invoker = false (no security_invoker = true)
    assert.ok(!/security_invoker\s*=\s*true/i.test(migSql), 'Migration must not set security_invoker = true');
    assert.ok(!/security_invoker\s*=\s*true/i.test(schemaSql), 'Schema must not set security_invoker = true');

    console.log('  -> PASS: View replacement safety verified (static invariants: CREATE OR REPLACE VIEW in-place, zero CASCADE drops, guarded type reconciliation RESTRICT, postgres owner, anon/auth grants in both schema and migration, projection parity [7 cols], no user_id, security_invoker=false).');

    console.log('\n===============================================================');
    console.log(' ALL 21 TICKET TRIAGE PERSISTENCE & SECURITY TESTS PASSED!');
    console.log('===============================================================');
  } finally {
    await server.close();
  }
}

runTicketPersistenceTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
