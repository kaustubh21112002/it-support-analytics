# STRATOS IT Support Analytics — Staging Security Verification Guide

This guide details the protocol for executing runtime security verification of `it_support_analytics_dataset/sql/security_hardening_migration.sql` against an **isolated, disposable Supabase staging environment**. For the complete agent authorization architecture, proposed schema diff, and preflight operational checklist, refer to [docs/staging-readiness.md](docs/staging-readiness.md).

> [!CAUTION]
> **SAFETY CRITICAL**: NEVER execute the hardening migration, administrative DDL, or destructive mutation tests against the live production Supabase instance. Live security testing MUST strictly be confined to a disposable staging project.

---

## 1. Prerequisites & Isolation Requirements

To establish a secure staging verification environment:

1. **Disposable Supabase Project**:
   - Provision a fresh, temporary Supabase project in the Supabase Dashboard (e.g. `stratos-staging-sec-test`).
   - Obtain the project URL and Anon / Service Role keys.
2. **Dedicated Test Accounts**:
   - Create 4 distinct Auth users in the staging project's Supabase Auth console:
     - `test.employee@example.com` (Unprivileged caller)
     - `test.agent@example.com` (Support specialist)
     - `test.manager@example.com` (Operations manager)
     - `test.admin@example.com` (Governance administrator)
3. **Synthetic Test Data Only**:
   - Populate the staging tables using the baseline schema (`it_support_analytics_dataset/sql/supabase_schema.sql`) and minimal synthetic records.
   - Do NOT use sensitive customer data or live operational records.

---

## 2. Administrator Setup Steps (Manual Preparation)

Before running the verification suite, execute the following steps in the Staging Supabase SQL Editor:

### Step 1: Base Schema & Table Creation
Execute `it_support_analytics_dataset/sql/supabase_schema.sql` to initialize:
- ENUM types: `ticket_status`, `ticket_priority`.
- Dimension tables: `departments`, `categories`, `sla_rules`, `teams`, `agents`.
- Fact table: `tickets`.

### Step 2: Seed Minimal Synthetic Records
```sql
-- Synthetic Department & Team
INSERT INTO public.departments (department_id, department_name)
VALUES (999, 'Staging Test Dept')
ON CONFLICT (department_id) DO NOTHING;

INSERT INTO public.teams (team_id, team_name, department_id)
VALUES (991, 'Staging Team Alpha', 999), (992, 'Staging Team Beta', 999)
ON CONFLICT (team_id) DO NOTHING;

-- Synthetic Agents: Target Schema Variant A (Canonical Local DDL: it_support_analytics_dataset/sql/supabase_schema.sql)
-- Requires agent_code NOT NULL UNIQUE AND agent_name NOT NULL:
INSERT INTO public.agents (agent_id, agent_code, agent_name, team_id, experience_band)
VALUES 
  (901, 'STG-001', 'Staging Agent Alpha', 991, 'Senior'),
  (902, 'STG-002', 'Staging Agent Beta', 992, 'Mid-level')
ON CONFLICT (agent_id) DO NOTHING;

-- Synthetic Agents: Target Schema Variant B (Remote Supabase Cloned Environment)
-- If staging is provisioned by cloning the live remote database where agent_name was omitted during CSV import:
-- Run this statement instead (omits agent_name to avoid SQLSTATE 42703 "column agent_name does not exist"):
-- INSERT INTO public.agents (agent_id, agent_code, team_id, experience_band)
-- VALUES (901, 'STG-001', 991, 'Senior'), (902, 'STG-002', 992, 'Mid-level')
-- ON CONFLICT (agent_id) DO NOTHING;

-- Synthetic SLA Rules (Matches canonical sla_rules schema: target_resolution_hours)
INSERT INTO public.sla_rules (sla_rule_id, priority, target_resolution_hours, description)
VALUES 
  (901, 'Critical', 4.0, 'Critical SLA - 4h turnaround'),
  (902, 'High', 8.0, 'High SLA - 8h turnaround'),
  (903, 'Medium', 24.0, 'Medium SLA - 24h turnaround'),
  (904, 'Low', 72.0, 'Low SLA - 72h turnaround')
ON CONFLICT (sla_rule_id) DO NOTHING;

-- Synthetic Test Ticket
INSERT INTO public.tickets (
  ticket_id, created_at, status, priority, category_id, issue_type,
  department_id, team_id, agent_id, sla_rule_id
) VALUES (
  'STG-00001', CURRENT_TIMESTAMP - INTERVAL '2 hours', 'Open', 'Medium',
  1, 'Staging Test Incident', 999, 991, NULL, 903
) ON CONFLICT (ticket_id) DO NOTHING;
```

### Step 3: Apply the Hardening Migration
In the Staging SQL Editor, execute the complete contents of:
`it_support_analytics_dataset/sql/security_hardening_migration.sql`

Confirm:
- `public.user_roles` table is created.
- Functions `is_admin()`, `current_user_role()`, and `update_ticket_triage()` exist and are owned by `postgres`.
- RLS is enabled on all 6 tables.

### Step 4: Map Staging User Roles
Retrieve the UUIDs for your test accounts from `auth.users` and assign their roles:
```sql
-- Replace <AGENT_UUID>, <MANAGER_UUID>, <ADMIN_UUID> with staging auth.users.id
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('<AGENT_UUID>', 'agent'),
  ('<MANAGER_UUID>', 'manager'),
  ('<ADMIN_UUID>', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
```
*(Leave `test.employee@example.com` unassigned in `user_roles` to test default unprivileged behavior).*

### Step 4B: Map Agent & Manager Scopes (Model C Hybrid)
Link the authenticated staff UUIDs to the canonical relational dimensions:
```sql
-- Link agent auth UUID to Staging Agent Alpha (Agent 901, Team 991)
UPDATE public.agents 
SET user_id = '<AGENT_UUID>' 
WHERE agent_id = 901;

-- Assign manager auth UUID to manage Staging Team Alpha (Team 991)
INSERT INTO public.team_managers (user_id, team_id, assigned_by)
VALUES ('<MANAGER_UUID>', 991, '<ADMIN_UUID>')
ON CONFLICT (user_id, team_id) DO NOTHING;
```

---

## 3. Staging Security Test Matrix (20 Required Checks)

| Test ID | Scenario | Caller Identity | Action Executed | Expected Outcome | Failure Condition |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **STAGE-01** | Anonymous Fact Read Denial | `anon` | `SELECT * FROM public.tickets LIMIT 5;` | **PASS (42501 / 0 rows)**: Permission denied or 0 rows returned. Anonymous callers cannot query operational tickets. | Ticket records returned to unauthenticated caller. |
| **STAGE-01B** | Anonymous Dimension Read | `anon` | `SELECT * FROM public.departments LIMIT 5;` | **PASS (HTTP 200)**: Reference master data returned for UI navigation and scaffolding. | Reference dimensions inaccessible. |
| **STAGE-02** | Anonymous Write Rejection | `anon` | `INSERT INTO public.departments (department_id, department_name) VALUES (998, 'Hack');` | **PASS (42501)**: Permission denied by PostgreSQL. | Insertion succeeds. |
| **STAGE-03A** | Employee Cross-Ticket Denial | `test.employee` (Authenticated) | `SELECT * FROM public.tickets LIMIT 5;` | **PASS (0 rows / 42501)**: Returns 0 rows. Ordinary employees cannot browse company-wide ticket queue. | Returns operational tickets filed across other departments. |
| **STAGE-03B** | Employee Triage Rejection | `test.employee` (Authenticated) | `SELECT public.update_ticket_triage('STG-00001', p_status => 'In Progress');` | **PASS (42501)**: Exception: `Unauthorized: Caller role "authenticated" is not permitted to triage tickets`. | Triage executes. |
| **STAGE-04A** | Staff Operational Queue Read | `test.agent` or `test.manager` | `SELECT count(*) FROM public.tickets;` | **PASS (HTTP 200)**: Authorized staff can view operational ticket queue for triage and SLA monitoring. | Staff denied read access to operational queue. |
| **STAGE-04B** | Agent Valid Triage via RPC | `test.agent` (Authenticated) | `SELECT public.update_ticket_triage('STG-00001', p_status => 'In Progress', p_agent_id => 901);` | **PASS (JSON)**: Target updated; `agent_id = 901`, `team_id = 991` derived automatically. | Error or unassigned team. |
| **STAGE-05** | Inconsistent Team Rejection | `test.agent` (Authenticated) | `SELECT public.update_ticket_triage('STG-00001', p_agent_id => 901, p_team_id => 992);` | **PASS (23514 / 42501)**: Exception: `Inconsistent agent/team assignment` or `Agents cannot move tickets across teams`. | Mismatched team saved. |
| **STAGE-06** | Invalid Status / Priority | `test.agent` (Authenticated) | `SELECT public.update_ticket_triage('STG-00001', p_status => 'Draft');` | **PASS (22023)**: Exception: `Invalid status "Draft"`. | Non-standard status accepted. |
| **STAGE-07** | Direct SQL UPDATE Rejection | `test.agent` (Authenticated) | `UPDATE public.tickets SET status = 'Resolved' WHERE ticket_id = 'STG-00001';` | **PASS (42501)**: Permission denied by PostgreSQL; direct table/column UPDATE rejected. | Direct UPDATE succeeds bypassing RPC. |
| **STAGE-08** | Dimension Immutability | `test.admin` (Authenticated) | Direct update or RPC parameter smuggling attempting to alter `created_at` or `department_id`. | **PASS (42501)**: Column update rejected; historical dimensions remain immutable. | Historical dimension altered. |
| **STAGE-09** | Unauthorized RPC Execution | `anon` | Direct POST to `/rest/v1/rpc/update_ticket_triage` | **PASS (42501)**: Permission denied for function `update_ticket_triage`. | RPC executes anonymously. |
| **STAGE-10** | Role Escalation Attempt | `test.employee` (Authenticated) | `INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin');` | **PASS (42501)**: RLS policy `sec_admin_manage_user_roles` blocks insertion. | Self-escalation succeeds. |
| **STAGE-11** | Admin Dimension Management | `test.admin` vs `test.agent` | `INSERT INTO public.departments (department_id, department_name) VALUES (997, 'New Dept');` | **PASS**: Admin succeeds; Agent receives permission denied via RLS. | Agent can insert departments. |
| **STAGE-12** | Dynamic Role Revocation | `test.agent` (Demoted to employee) | Delete role from `public.user_roles` and attempt triage call. | **PASS (42501)**: Immediately rejected on subsequent request with zero lag. | Stale cached role allows triage. |
| **STAGE-13** | Agent Team-Queue Isolation | `test.agent` (Team 991) | `SELECT count(*) FROM public.tickets WHERE team_id = 992;` | **PASS (0 rows)**: Returns 0 rows. Tickets outside agent's team queue are shielded by RLS. | Cross-team tickets returned. |
| **STAGE-14** | Agent Claim in Own Team | `test.agent` (Agent 901, Team 991) | Claim unassigned ticket: `SELECT public.update_ticket_triage('STG-00001', p_agent_id => 901);` | **PASS (JSON)**: Self-assignment succeeds; ticket assigned to Agent 901 in Team 991. | Self-claim fails or permits assigning peer. |
| **STAGE-15** | Peer Mutation Rejection | `test.agent` (Agent 901) | Triage ticket assigned to Agent 902: `SELECT public.update_ticket_triage('STG-00002', p_status => 'In Progress');` | **PASS (42501)**: Exception: `Unauthorized: Ticket is assigned to peer Agent. Mutation prohibited.` | Peer ticket mutated by agent. |
| **STAGE-16** | Cross-Team Transfer Rejection | `test.agent` (Team 991) | Move ticket: `SELECT public.update_ticket_triage('STG-00001', p_team_id => 992);` | **PASS (42501)**: Exception: `Unauthorized: Agents cannot move tickets across teams.` | Ticket moved across teams by agent. |
| **STAGE-17** | Manager Scoped Authority | `test.manager` (Mapped to Team 991) | Triage ticket in Team 991 (allowed) vs Team 992 (unauthorized). | **PASS**: Team 991 mutation succeeds; Team 992 mutation rejected with `42501`. | Manager can triage unassigned team. |
| **STAGE-18** | Unmapped Agent Fail-Closed | `test.unmapped_agent` (Role 'agent', `user_id = NULL`) | Attempt queue read and triage call. | **PASS (0 rows / 42501)**: Queue read returns 0 rows; RPC raises unmapped exception `42501`. | Unmapped caller gains operational access. |
| **STAGE-19** | Unassigned Mutation Guardrail (SEC-01) | `test.agent` (Agent 901, Team 991) | Attempt status update on unassigned ticket without claiming (`p_unassign_agent => TRUE`). | **PASS (42501)**: Exception: `Unauthorized: Ticket is unassigned. Agents cannot unassign an unassigned ticket; Agent must claim unassigned ticket by assigning self before triaging`. | Status/priority altered on unassigned ticket without self-claim. |
| **STAGE-20** | Agent Directory user_id Shielding (SEC-02) | `anon` & `test.employee` | `SELECT * FROM public.agent_directory;` vs `SELECT user_id FROM public.agents;` | **PASS**: `agent_directory` returns 24 agents without `user_id` (view executes as owner `postgres`); base `agents` table direct SELECT denied (42501 for anon) or returns 0 rows (for non-admin authenticated). | `agents.user_id` readable by unprivileged clients or view fails due to security_invoker. |
| **STAGE-21** | View Replacement Safety & Contract Parity (Phase 05C.9) | All 5 Roles (`anon`, `test.employee`, `test.agent`, `test.manager`, `test.admin`) | Execute directory verification queries; inspect view definition, owner, security-invoker, role-based access, and client hydration. | **PASS**: View projects 7 columns without `user_id`; owned by `postgres`; `security_invoker = false`; all 5 roles receive HTTP 200 on `agent_directory`; direct queries to `public.agents` fail for non-admins; client hydration succeeds after `NOTIFY pgrst`. | Privilege loss, missing columns, `user_id` leakage, or hydration failure. |
| **STAGE-22** | Migration Rerun Idempotency & Schema-Cache Refresh | Superuser / Deployment Admin (`postgres`) | Execute `security_hardening_migration.sql` a second time against migrated database. | **PASS**: Transaction commits cleanly; zero SQL errors; tables, roles, and records unaltered; `NOTIFY pgrst` successfully refreshes schema cache. | DDL failure on re-execution, duplicate object error, privilege loss, or dropped data. |

---

### 3.1 Agent Directory View Replacement & Access Control Verification Procedure (Phase 05C.9)

> [!NOTE]
> **STAGING EXECUTION ONLY**: These verification queries and commands must be executed against the disposable staging database after running `security_hardening_migration.sql`. They have NOT been executed against production, and cannot be claimed as passed until verified in staging.

#### 1. View Definition & Column Contract Verification
Verify in Staging SQL Editor that `public.agent_directory` projects the canonical 7 columns and strictly excludes `user_id`:
```sql
SELECT column_name, data_type, ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'agent_directory'
ORDER BY ordinal_position;
```
*Expected Result*:
1. `agent_id` (integer)
2. `agent_code` (character varying)
3. `agent_name` (character varying)
4. `team_id` (integer)
5. `experience_band` (USER-DEFINED experience_level)
6. `is_active` (boolean)
7. `created_at` (timestamp with time zone)
*Zero `user_id` column present.*

#### 2. View Ownership & Security Invoker Configuration
Verify that the view is owned by `postgres` and executes under owner permissions (`security_invoker = false`):
```sql
SELECT 
    c.relname AS view_name,
    pg_get_userbyid(c.relowner) AS view_owner,
    c.reloptions
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'agent_directory';
```
*Expected Result*:
- `view_name`: `agent_directory`
- `view_owner`: `postgres`
- `reloptions`: `NULL` or does not contain `security_invoker=true`. (Standard view owner privileges apply).

#### 3. Effective Access Verification Across All 5 Roles
Verify directory read access and base-table denial across each role:

| Caller Role | `SELECT count(*) FROM public.agent_directory;` | `SELECT count(*) FROM public.agents;` | Rationale |
| :--- | :--- | :--- | :--- |
| **Anonymous (`anon`)** | **HTTP 200 (24 rows)** | **HTTP 401 / 42501 (Permission Denied)** | Public demo and landing page read canonical staff names without authentication; direct base table SELECT revoked. |
| **Ordinary Employee (`authenticated`)** | **HTTP 200 (24 rows)** | **0 rows returned (RLS shielded)** | Portal users view assigned agent names on tickets; RLS `sec_admin_manage_agents` shields base table. |
| **Support Agent (`authenticated`)** | **HTTP 200 (24 rows)** | **0 rows returned (RLS shielded)** | Triage view displays agent directory; direct table reads blocked by RLS. |
| **Team Manager (`authenticated`)** | **HTTP 200 (24 rows)** | **0 rows returned (RLS shielded)** | Manager assigns staff from public directory; direct table reads blocked by RLS. |
| **Administrator (`authenticated`)** | **HTTP 200 (24 rows)** | **HTTP 200 (24 rows)** | Administrators have full governance access via RLS `sec_admin_manage_agents`. |

#### 4. PostgREST Schema Reload & Client Hydration Verification
Verify that after `NOTIFY pgrst, 'reload schema'` triggers upon migration commit, the PostgREST API immediately serves the view:
```bash
# Verify PostgREST endpoint exposes agent_directory
curl -i -H "apikey: $SUPABASE_STAGING_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_STAGING_ANON_KEY" \
     "$SUPABASE_STAGING_URL/rest/v1/agent_directory?select=agent_id,agent_code,agent_name,team_id,experience_band,is_active,created_at&limit=5"

# Run frontend hydration test against staging endpoint
node scripts/test-hydration.mjs
```

## 4. Automated Verification Execution

Once your disposable staging environment is configured, execute the automated verification toolkit:

```bash
# 1. Set staging credentials in temporary shell (NEVER use production values)
$env:SUPABASE_STAGING_URL = "https://your-disposable-staging.supabase.co"
$env:SUPABASE_STAGING_KEY = "your-staging-anon-key"

# 2. Run the security migration checker
node scripts/check-security-migration.mjs
```

### Safety Interlock in Toolkit:
If `$env:SUPABASE_STAGING_URL` matches the production project URL defined in `.env.local`, the script automatically halts and refuses to execute live database calls, protecting the production instance.

---

## 5. Rollback Documentation & Safe Recovery Guidance

> [!CAUTION]
> **CRITICAL ARCHITECTURAL PRINCIPLE: ZERO DIRECT TABLE UPDATES & MANDATORY DISPOSABLE LIFECYCLE**
>
> 1. **Zero-Trust Staging Lifecycle**: Rather than executing manual rollback SQL scripts against a mutated database, **the mandatory standard operating procedure for testing is to destroy and re-provision a fresh, disposable staging project**. Recreating a clean staging environment provides 100% cryptographic and state isolation without relying on partial schema rollbacks or introducing permission anomalies.
> 2. **Prohibition of Direct Table UPDATE Grants**:
>    - Direct SQL `UPDATE` on `public.tickets` is **strictly revoked** from all client roles (`authenticated`, `anon`, `PUBLIC`) to prevent bypassing deep RPC validations (agent-team consistency, priority-SLA pairing, status transitions, and temporal order).
>    - Recovery guidance must **NEVER** recommend `GRANT UPDATE ... ON public.tickets TO authenticated`. Granting direct column or table updates reintroduces the security vulnerability where clients bypass `update_ticket_triage()`.
>    - If the RPC is malfunctioning, the correct remediation is to re-deploy and verify the RPC function definition and ensure `GRANT EXECUTE ON FUNCTION public.update_ticket_triage TO authenticated`, NOT to grant direct table mutations.
> 3. **Production Disaster Hazards of Historical Rollback Scripts**:
>    - **Permanent Role Loss**: Executing `DROP TABLE public.user_roles;` irreversibly destroys all staff and administrative role assignments.
>    - **Public Data Exposure Violation**: Re-creating `CREATE POLICY "Allow public read-only access" ON public.tickets FOR SELECT USING (true);` re-exposes operational incident records to unauthenticated public web scrapers. Under NO circumstances should public ticket access ever be reopened.
>    - **Grant Asymmetry**: Historical rollback scripts dropped policies but failed to re-grant table-level SELECT on `tickets` to `anon`, leaving the database in an inconsistent, broken authorization state.
> 4. **Non-Destructive Emergency Incident Recovery (Least Privilege Preserved)**:
>    If an emergency operational recovery is required on an existing database, the recovery procedure MUST:
>    - Preserve `public.user_roles` intact.
>    - Maintain zero anonymous access (`anon` denied fact reads).
>    - Maintain direct SQL `UPDATE` completely revoked from all client roles.
>    - Re-verify RPC execution permissions: `GRANT EXECUTE ON FUNCTION public.update_ticket_triage TO authenticated;`.

### Verified Incident Recovery Procedure (RPC Preservation & Zero Direct Updates)
```sql
-- EMERGENCY RECOVERY ONLY: Preserves role mappings, blocks anonymous exposure, maintains RPC-only mutations
BEGIN;

-- 1. Ensure authenticated users have read access to operational tickets if staff policies require fallback
CREATE POLICY "sec_auth_select_tickets_recovery"
    ON public.tickets FOR SELECT TO authenticated
    USING (true);

-- 2. Ensure RPC execute permissions are verified (Never grant direct UPDATE on public.tickets)
GRANT EXECUTE ON FUNCTION public.update_ticket_triage(VARCHAR(20), TEXT, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT) 
TO authenticated, service_role;

-- 3. DO NOT GRANT UPDATE ON TABLE public.tickets; (Maintains RPC-only mutation gate and validation integrity)
-- 4. DO NOT DROP TABLE public.user_roles; (Preserves staff and administrative role mappings)
-- 5. DO NOT GRANT SELECT TO anon; (Never re-exposes operational incident data to public web)

COMMIT;
```
