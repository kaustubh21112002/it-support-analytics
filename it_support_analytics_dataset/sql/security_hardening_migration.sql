-- =====================================================================
-- IT Support Analytics Platform - Database Security Hardening (REVISED)
-- Idempotent PostgreSQL / Supabase Row Level Security & Column Grants
-- =====================================================================
-- TARGET ENVIRONMENT: PostgreSQL 15+ / Supabase
-- STATUS: PROPOSAL ONLY - Staged for Administrator Review
-- EXECUTION SAFETY: Non-destructive, idempotent application.
--                  Contains NO DROP TABLE, TRUNCATE, or DELETE statements.
--                  Safe to execute multiple times without error.
--
-- CORE ARCHITECTURAL & SECURITY PRINCIPLES:
-- 1. Recursion-Free Role Management:
--    The policy `sec_admin_manage_user_roles` previously queried `public.user_roles`
--    directly in a subquery on that same table, creating an infinite RLS recursion risk.
--    This has been replaced by a dedicated `SECURITY DEFINER` helper `public.is_admin()`
--    owned by `postgres`, which safely evaluates administrator status using table-owner
--    privileges without invoking RLS recursion.
-- 2. Strict Role Whitelist (No Client Self-Escalation):
--    `public.current_user_role()` accepts ONLY exact permitted roles: 'agent', 'manager',
--    and 'admin'. Any malformed, unknown, or unexpected value defaults to 'authenticated'
--    (unprivileged). `user_metadata` (raw_user_meta_data) is completely excluded because
--    clients can modify it via `supabase.auth.updateUser()`.
-- 3. Comprehensive Access Matrix Reconciling Grants & RLS:
--    PostgreSQL checks SQL table grants before evaluating RLS policies. RLS policies
--    alone do not grant SQL privileges, and column grants do not replace row authorization.
--    This migration aligns table grants so that administrators can exercise management
--    policies while ordinary users remain strictly confined by RLS and column-level grants.
-- 4. Deep Ticket Triage Validation (`public.update_ticket_triage`):
--    - Enforces canonical agent/team alignment: derives team directly from `public.agents`
--      and rejects inconsistent agent/team parameter combinations.
--    - Validates that the requested priority has an exact matching SLA rule.
--    - Enforces status transitions, resolution timestamps, and temporal ordering (resolved_at >= created_at).
--    - Preserves historical analytical dimensions (ticket_id, created_at, department_id,
--      category_id, issue_type) as 100% immutable.
--    - Guarantees transactional rollback on any validation failure.
-- 5. Complete Anonymous & PUBLIC Write Lockdown:
--    Revokes write access from both `anon` and the PostgreSQL `PUBLIC` pseudo-role across
--    all tables, sequences, and default privileges.
-- 6. Identity Reality Alignment:
--    Acknowledges that `public.tickets` currently has NO `created_by_user_id` foreign key.
--    No false claims of row-level employee ownership are made.
-- 7. Separation of Demo Mode vs Production Auth:
--    Unauthenticated demo sessions hydrate read-only via `anon SELECT` and isolate mutations
--    to client session memory. Persistent remote writes require verified Supabase Auth JWTs.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Pre-Flight Inspection & Policy Reconciliation Queries
-- ---------------------------------------------------------------------
-- Run these queries in the Supabase SQL Editor BEFORE applying this migration
-- to inspect active policies, table RLS states, and existing table grants:

-- 0A. List all existing policies on application tables:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' 
--   AND tablename IN ('departments', 'categories', 'sla_rules', 'teams', 'agents', 'tickets', 'user_roles')
-- ORDER BY tablename, policyname;

-- 0B. Check RLS enabled status on application tables:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('departments', 'categories', 'sla_rules', 'teams', 'agents', 'tickets');

-- 0C. Check table-level privileges granted to anon, authenticated, and PUBLIC:
-- SELECT grantee, table_name, privilege_type
-- FROM information_schema.table_privileges
-- WHERE table_schema = 'public'
--   AND table_name IN ('departments', 'categories', 'sla_rules', 'teams', 'agents', 'tickets', 'user_roles')
--   AND grantee IN ('anon', 'authenticated', 'PUBLIC')
-- ORDER BY table_name, grantee, privilege_type;


-- ---------------------------------------------------------------------
-- 1. Database-Backed Role Mapping Table (`public.user_roles`)
-- ---------------------------------------------------------------------
-- TRANSACTION WRAPPER:
-- Enclose entire security hardening migration in an atomic transaction.
-- All DDL, grants, RLS policies, and NOTIFY statements are transaction-safe in PostgreSQL 15+.
BEGIN;


-- SECURITY RATIONALE:
-- Dedicated relational role mapping tied to `auth.users(id)`.
-- Clients cannot insert, update, or delete role records because RLS
-- and table-level policies restrict management strictly to verified administrators.

CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('agent', 'manager', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security on the role mapping table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Revoke all access from anonymous and PUBLIC roles
REVOKE ALL ON TABLE public.user_roles FROM anon, PUBLIC;

-- Grant SQL table privileges to authenticated role so administrators can manage it via RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;
REVOKE TRUNCATE ON TABLE public.user_roles FROM authenticated;


-- ---------------------------------------------------------------------
-- 2. Non-Recursive Administrator Helper: public.is_admin()
-- ---------------------------------------------------------------------
-- SECURITY RATIONALE:
-- Prevents infinite RLS recursion on `public.user_roles`.
-- When a policy on `public.user_roles` executes `SELECT 1 FROM public.user_roles`,
-- PostgreSQL re-evaluates the policy, triggering infinite recursion.
-- `public.is_admin()` runs with `SECURITY DEFINER` and is owned by `postgres` (which
-- bypasses RLS), reading `public.user_roles` safely without policy re-entry.
-- Search path is explicitly locked to `pg_catalog, pg_temp` (CWE-426 mitigation).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    v_uid UUID;
    v_role TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN FALSE;
    END IF;

    -- 1. Check database role mapping table (Authoritative Source of Truth).
    -- Table-owner execution bypasses RLS on public.user_roles, preventing recursion.
    BEGIN
        SELECT ur.role INTO v_role
        FROM public.user_roles ur
        WHERE ur.user_id = v_uid;

        -- Authoritative rule: If public.user_roles exists, it is the sole authority.
        -- Any absent row or non-admin role strictly evaluates to FALSE.
        -- Potentially stale JWT app_metadata is strictly ignored once user_roles exists.
        IF v_role = 'admin' THEN
            RETURN TRUE;
        END IF;

        RETURN FALSE;
    EXCEPTION
        WHEN undefined_table THEN
            -- 2. Bootstrap fallback: ONLY if public.user_roles table does not yet exist.
            -- user_metadata is intentionally omitted.
            IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' THEN
                RETURN TRUE;
            END IF;
            RETURN FALSE;
    END;
END;
$$;

ALTER FUNCTION public.is_admin() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;


-- ---------------------------------------------------------------------
-- 3. Server-Controlled Role Extraction Helper: public.current_user_role()
-- ---------------------------------------------------------------------
-- SECURITY RATIONALE:
-- Evaluates caller identity using only trusted, server-enforced sources:
--   Authoritative Source: Database table `public.user_roles` (admin-managed).
--   Fallback: 'anon' if unauthenticated, or 'authenticated' if signed in without a staff role.
-- Once `public.user_roles` exists, missing or non-staff rows strictly return 'authenticated'.
-- Potentially stale `app_metadata.role` in client JWTs cannot resurrect a revoked role!
-- Strict whitelist: accepts ONLY exact 'agent', 'manager', 'admin'.
-- Any unexpected, malformed, or missing value defaults to 'authenticated' (unprivileged).
-- Search path is explicitly locked to `pg_catalog, pg_temp`.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    v_role TEXT;
    v_uid UUID;
BEGIN
    -- 1. Unauthenticated / anonymous check
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN 'anon';
    END IF;

    -- 2. Check database-backed role mapping table (Authoritative Source of Truth)
    -- Table-owner execution bypasses RLS on public.user_roles
    BEGIN
        SELECT ur.role INTO v_role
        FROM public.user_roles ur
        WHERE ur.user_id = v_uid;

        -- Strict whitelist: accept ONLY permitted staff roles from the authoritative database table
        IF v_role IN ('agent', 'manager', 'admin') THEN
            RETURN v_role;
        END IF;

        -- Authoritative rule: If public.user_roles exists, a missing row or unprivileged
        -- role strictly resolves to least-privileged 'authenticated'.
        -- Do NOT fall back to potentially stale app_metadata.role after a role row is absent!
        RETURN 'authenticated';
    EXCEPTION
        WHEN undefined_table THEN
            -- 3. Bootstrap fallback: ONLY if public.user_roles table does not yet exist.
            -- user_metadata (raw_user_meta_data) is EXCLUDED because users can self-edit it.
            v_role := (auth.jwt() -> 'app_metadata' ->> 'role');
            IF v_role IN ('agent', 'manager', 'admin') THEN
                RETURN v_role;
            END IF;

            RETURN 'authenticated';
    END;
END;
$$;

ALTER FUNCTION public.current_user_role() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;


-- ---------------------------------------------------------------------
-- 4. Policies on public.user_roles (Safe, Non-Recursive)
-- ---------------------------------------------------------------------

-- Drop existing user_roles policies idempotently
DROP POLICY IF EXISTS "sec_users_select_own_role" ON public.user_roles;
DROP POLICY IF EXISTS "sec_admin_manage_user_roles" ON public.user_roles;

-- Authenticated users can view their own role; administrators can view all roles
CREATE POLICY "sec_users_select_own_role"
    ON public.user_roles FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

-- Administrators can insert, update, or delete role assignments.
-- Uses public.is_admin() to prevent RLS self-recursion!
CREATE POLICY "sec_admin_manage_user_roles"
    ON public.user_roles FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 4B. Agent Identity Mapping & Multi-Team Manager Mapping (Model C Hybrid)
-- ---------------------------------------------------------------------

-- UPGRADE-PATH COLUMN INTEGRITY:
-- Ensures all columns referenced by public.agent_directory view exist on public.agents
-- even if migrating from a minimal legacy schema where agent_name or timestamps were omitted.
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS agent_name VARCHAR(100);
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);

-- 4B.2 Multi-Team Manager Authorization Table
-- Supports 1:M and M:M relationships between operations managers and support teams.
CREATE TABLE IF NOT EXISTS public.team_managers (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES public.teams(team_id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES auth.users(id),
    PRIMARY KEY (user_id, team_id)
);

ALTER TABLE public.team_managers ENABLE ROW LEVEL SECURITY;

-- 4B.3 Cryptographic Identity & Scope Helper Functions
CREATE OR REPLACE FUNCTION public.current_agent_id()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    v_uid UUID;
    v_role TEXT;
    v_agent_id INTEGER;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN NULL;
    END IF;

    -- Verify caller holds verified staff role
    v_role := public.current_user_role();
    IF v_role NOT IN ('agent', 'manager', 'admin') THEN
        RETURN NULL;
    END IF;

    SELECT a.agent_id INTO v_agent_id
    FROM public.agents a
    WHERE a.user_id = v_uid
      AND a.is_active = TRUE;

    RETURN v_agent_id;
END;
$$;

ALTER FUNCTION public.current_agent_id() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.current_agent_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_agent_id() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.current_agent_team_id()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    v_uid UUID;
    v_role TEXT;
    v_team_id INTEGER;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN NULL;
    END IF;

    -- Verify caller holds verified staff role
    v_role := public.current_user_role();
    IF v_role NOT IN ('agent', 'manager', 'admin') THEN
        RETURN NULL;
    END IF;

    SELECT a.team_id INTO v_team_id
    FROM public.agents a
    WHERE a.user_id = v_uid
      AND a.is_active = TRUE;

    RETURN v_team_id;
END;
$$;

ALTER FUNCTION public.current_agent_team_id() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.current_agent_team_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_agent_team_id() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_team_manager(p_team_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    v_uid UUID;
    v_role TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL OR p_team_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verify caller holds verified 'manager' role or 'admin'
    v_role := public.current_user_role();
    IF v_role NOT IN ('manager', 'admin') THEN
        RETURN FALSE;
    END IF;

    -- Administrators have global managerial authority over all teams
    IF v_role = 'admin' THEN
        RETURN TRUE;
    END IF;

    -- Operations managers require explicit team assignment in public.team_managers
    RETURN EXISTS (
        SELECT 1 
        FROM public.team_managers tm
        WHERE tm.user_id = v_uid
          AND tm.team_id = p_team_id
    );
END;
$$;

ALTER FUNCTION public.is_team_manager(INTEGER) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_team_manager(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_team_manager(INTEGER) TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 4B.4 Public-Safe Agent Directory View (Projection Excluding user_id)
-- ---------------------------------------------------------------------
-- Standard client applications, UI dashboards, and anonymous demo visitors
-- need agent directory data (names, codes, teams, experience bands) but must
-- NEVER be exposed to internal cryptographic user_id mapping UUIDs.
-- This view provides an exact public projection that completely excludes user_id.

-- 4B.4A Guarded Type Reconciliation for View Replacement:
-- In PostgreSQL, CREATE OR REPLACE VIEW cannot alter an existing output column's data type (ERRCODE 42P16).
-- If public.agent_directory already exists and its created_at output type differs from
-- public.agents.created_at (e.g. legacy TIMESTAMP vs TIMESTAMPTZ), in-place replacement fails.
-- This guarded block inspects both catalog data types. If and only if an incompatibility exists,
-- it verifies zero downstream object dependencies and performs a guarded, non-cascading DROP VIEW RESTRICT.
-- In all normal executions (matching data types or fresh schema), the view is replaced in-place without dropping.
DO $$
DECLARE
    v_view_type text;
    v_table_type text;
    v_dep_count integer;
    v_regclass regclass;
BEGIN
    -- Check output data type of existing view column (if view exists)
    SELECT data_type INTO v_view_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agent_directory' AND column_name = 'created_at';

    -- Check data type of underlying table column
    SELECT data_type INTO v_table_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'created_at';

    -- Only intervene if view exists and data type incompatibility would trigger 42P16
    IF v_view_type IS NOT NULL AND v_table_type IS NOT NULL AND v_view_type <> v_table_type THEN
        v_regclass := to_regclass('public.agent_directory');
        IF v_regclass IS NOT NULL THEN
            -- Check for external dependent objects (excluding the view rewrite rules themselves)
            SELECT count(*) INTO v_dep_count
            FROM pg_depend dep
            JOIN pg_rewrite rw ON dep.objid = rw.oid
            JOIN pg_class c ON rw.ev_class = c.oid
            WHERE dep.refobjid = v_regclass
              AND c.oid != v_regclass;

            IF v_dep_count > 0 THEN
                RAISE EXCEPTION 'Cannot safely replace public.agent_directory: % dependent object(s) detected. Manual staging resolution required (CASCADE drop prohibited).', v_dep_count
                    USING ERRCODE = '2BP01';
            END IF;

            -- Guarded non-cascading drop: RESTRICT ensures execution halts if any dependency was missed
            EXECUTE 'DROP VIEW public.agent_directory RESTRICT';
        END IF;
    END IF;
END $$;

-- 4B.4B View Creation / Replacement:
-- Uses CREATE OR REPLACE VIEW for safe in-place replacement while preserving existing object metadata and grants.
CREATE OR REPLACE VIEW public.agent_directory AS
SELECT
    agent_id,
    agent_code,
    agent_name,
    team_id,
    experience_band,
    is_active,
    created_at
FROM public.agents;

ALTER VIEW public.agent_directory OWNER TO postgres;


-- ---------------------------------------------------------------------
-- 5. Comprehensive SQL Grants & Table Privilege Hardening
-- ---------------------------------------------------------------------
-- ACCESS MATRIX RECONCILIATION:
-- RLS policies only evaluate if table-level SQL grants exist.
-- To allow administrators to manage dimension, role, and fact tables via RLS,
-- SQL grants must be available to the `authenticated` role, while RLS
-- strictly blocks ordinary users and support staff from unauthorized operations.

-- 5A. Revoke all write operations from anon and PUBLIC across all exposed tables
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE
    public.departments,
    public.categories,
    public.sla_rules,
    public.teams,
    public.agents,
    public.team_managers,
    public.tickets
FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE
    public.departments,
    public.categories,
    public.sla_rules,
    public.teams,
    public.agents,
    public.team_managers,
    public.tickets
FROM PUBLIC;

-- 5B. Dimension Tables, Views & Management Tables Grants:
-- SELECT on standard dimension tables is granted to anon and authenticated for dashboards.
-- SELECT on agent directory is granted via public.agent_directory view which omits user_id.
-- Base table public.agents has direct SELECT revoked from anon, and is restricted by RLS to admins.
GRANT SELECT ON TABLE
    public.departments,
    public.categories,
    public.sla_rules,
    public.teams
TO anon, authenticated;

-- Public-Safe Agent Directory View Grants:
REVOKE ALL ON TABLE public.agent_directory FROM PUBLIC;
GRANT SELECT ON TABLE public.agent_directory TO anon, authenticated;
GRANT ALL ON TABLE public.agent_directory TO service_role;

-- Base Agents Dimension Grants:
-- Direct SELECT on base table revoked from anon to shield user_id cryptographic mapping UUIDs.
-- Authenticated role receives SELECT, INSERT, UPDATE, DELETE strictly gated by RLS sec_admin_manage_agents.
REVOKE SELECT ON TABLE public.agents FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.agents TO authenticated;
GRANT ALL ON TABLE public.agents TO service_role;

GRANT INSERT, UPDATE, DELETE ON TABLE
    public.departments,
    public.categories,
    public.sla_rules,
    public.teams,
    public.team_managers
TO authenticated;

GRANT SELECT ON TABLE public.team_managers TO authenticated;
GRANT ALL ON TABLE public.team_managers TO service_role;

REVOKE TRUNCATE ON TABLE
    public.departments,
    public.categories,
    public.sla_rules,
    public.teams,
    public.agents,
    public.team_managers
FROM authenticated;


-- 5C. Fact Table (public.tickets) Grants:
-- LEAST PRIVILEGE ENFORCEMENT: Fact table SELECT is completely revoked from anon to protect
-- operational support records and internal incident metadata from unauthenticated access.
-- SELECT is granted strictly to the authenticated role (and further restricted by RLS to staff roles).
-- INSERT, DELETE are granted to authenticated for administrative governance (gated by RLS).
-- TRUNCATE is revoked unconditionally.
REVOKE SELECT ON TABLE public.tickets FROM anon;
GRANT SELECT ON TABLE public.tickets TO authenticated;
GRANT INSERT, DELETE ON TABLE public.tickets TO authenticated;
REVOKE TRUNCATE ON TABLE public.tickets FROM authenticated;

-- 5D. Complete Revocation of Direct Ticket UPDATE Privileges (RPC-Only Triage Enforcement):
-- Table-level and column-level direct UPDATE is completely revoked from authenticated, anon, and PUBLIC.
-- NO client role can issue direct SQL UPDATE statements against public.tickets.
-- This eliminates the security gap where direct UPDATE bypassed cross-table agent/team alignment
-- and priority/SLA pairing validations.
-- All triage mutations must proceed EXCLUSIVELY through the governed transactional RPC:
-- `public.update_ticket_triage()`.
-- Because update_ticket_triage() runs with SECURITY DEFINER and is owned by postgres,
-- its internal UPDATE executes with table-owner privileges, unaffected by client-side table grant revocations.
REVOKE UPDATE ON TABLE public.tickets FROM authenticated;
REVOKE UPDATE ON TABLE public.tickets FROM anon;
REVOKE UPDATE ON TABLE public.tickets FROM PUBLIC;

-- 5E. Sequence Hardening:
-- Revoke sequence manipulation privileges from non-admin roles
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, PUBLIC, authenticated;

-- 5F. Default Privileges Hardening:
-- NOTE: In PostgreSQL, ALTER DEFAULT PRIVILEGES applies only to objects created
-- by the executing role (e.g., `postgres`). If objects are created by another role,
-- corresponding default privileges must be configured for that specific role.
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLES FROM anon, PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    REVOKE ALL ON SEQUENCES FROM anon, PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    REVOKE EXECUTE ON ROUTINES FROM anon, PUBLIC;


-- ---------------------------------------------------------------------
-- 6. Safe Database RPC Function: update_ticket_triage (Model C Hybrid)
-- ---------------------------------------------------------------------
-- Robust, server-enforced triage entry point with complete parameter validation:
--   - Validates non-empty ticket ID and ensures target ticket exists (with FOR UPDATE lock).
--   - Verifies caller authorization using server-checked role (never trusts client parameters).
--   - Enforces Model C Hybrid Agent Scope:
--       * Agent can triage only tickets in their verified active team queue.
--       * Agent can triage tickets assigned to them.
--       * Agent can self-assign unassigned tickets in their team.
--       * Peer-assigned tickets cannot be modified, unassigned, or reassigned by an agent.
--       * Cross-team transfers are strictly rejected for agents.
--   - Enforces Manager Scope:
--       * Manager can triage and reassign only within teams explicitly assigned in team_managers.
--       * Cross-team transfers require authorization over both origin and destination teams.
--   - Enforces Admin Scope:
--       * Global authority across all teams, preserving agent/team relational consistency.
--   - Validates priority against public.sla_rules, ensuring exact SLA rule pairing.
--   - Validates status transitions and resolution timestamps (resolved_at >= created_at).
--   - Clears resolution timestamps when ticket is reopened.
--   - Modifies ONLY the 7 writable triage columns; historical dimensions remain immutable.
--   - Any error raises an exception, automatically triggering transaction rollback.
--
-- NOTE ON p_resolution_notes:
-- p_resolution_notes is accepted by this RPC to preserve interface compatibility with the
-- frontend caller (src/services/dataService.ts / AgentTicketDetail.tsx). However, because
-- public.tickets currently has NO resolution_notes column in the database schema, this parameter
-- is NOT persisted to the database. It is safely received without raising schema errors.
--
-- EXACT CANONICAL SIGNATURE:
-- public.update_ticket_triage(VARCHAR(20), TEXT, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT)

CREATE OR REPLACE FUNCTION public.update_ticket_triage(
    p_ticket_id VARCHAR(20),
    p_status TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT NULL,
    p_agent_id INTEGER DEFAULT NULL,
    p_team_id INTEGER DEFAULT NULL,
    p_unassign_agent BOOLEAN DEFAULT FALSE,
    p_resolution_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_caller_role TEXT;
    v_ticket RECORD;
    v_new_status TEXT;
    v_new_priority TEXT;
    v_new_agent_id INTEGER;
    v_new_team_id INTEGER;
    v_caller_agent_id INTEGER;
    v_caller_team_id INTEGER;
    v_agent_team_id INTEGER;
    v_target_agent_active BOOLEAN;
    v_sla_rule_id INTEGER;
    v_resolved_at TIMESTAMP;
    v_resolution_time_hours DECIMAL(8,2);
    v_result JSONB;
BEGIN
    -- 1. Ticket ID Validation
    IF p_ticket_id IS NULL OR trim(p_ticket_id) = '' THEN
        RAISE EXCEPTION 'Invalid ticket ID: ticket ID cannot be null or empty'
            USING ERRCODE = '22023';
    END IF;

    -- 2. Authorization Gate: Server-verified caller & role check (never trust client parameters)
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Unauthenticated caller cannot triage tickets'
            USING ERRCODE = '42501';
    END IF;

    v_caller_role := public.current_user_role();
    IF v_caller_role NOT IN ('agent', 'manager', 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Caller role "%" is not permitted to triage tickets', v_caller_role
            USING ERRCODE = '42501';
    END IF;

    -- 3. Fetch target ticket with lock for update
    SELECT * INTO v_ticket
    FROM public.tickets
    WHERE ticket_id = p_ticket_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ticket "%" was not found in public.tickets', p_ticket_id
            USING ERRCODE = 'P0002';
    END IF;

    -- 4. Status Validation & State Transitions
    IF p_status IS NOT NULL THEN
        IF p_status NOT IN ('Open', 'In Progress', 'Pending', 'Resolved', 'Closed') THEN
            RAISE EXCEPTION 'Invalid status "%". Permitted values: Open, In Progress, Pending, Resolved, Closed', p_status
                USING ERRCODE = '22023';
        END IF;
        v_new_status := p_status;
    ELSE
        v_new_status := v_ticket.status::TEXT;
    END IF;

    -- 5. Priority Validation & SLA Rule Pairing
    IF p_priority IS NOT NULL THEN
        IF p_priority NOT IN ('Critical', 'High', 'Medium', 'Low') THEN
            RAISE EXCEPTION 'Invalid priority "%". Permitted values: Critical, High, Medium, Low', p_priority
                USING ERRCODE = '22023';
        END IF;

        -- Verify exactly one matching SLA rule
        SELECT sla_rule_id INTO v_sla_rule_id
        FROM public.sla_rules
        WHERE priority::TEXT = p_priority;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Inconsistent SLA configuration: No SLA rule found for priority "%"', p_priority
                USING ERRCODE = '23503';
        END IF;
        v_new_priority := p_priority;
    ELSE
        v_new_priority := v_ticket.priority::TEXT;
        v_sla_rule_id := v_ticket.sla_rule_id;
    END IF;

    -- 6. Role-Specific Scoping & Canonical Agent/Team Assignment (Model C Hybrid)
    IF v_caller_role = 'agent' THEN
        -- Resolve caller agent identity
        v_caller_agent_id := public.current_agent_id();
        v_caller_team_id := public.current_agent_team_id();

        IF v_caller_agent_id IS NULL OR v_caller_team_id IS NULL THEN
            RAISE EXCEPTION 'Unauthorized: Caller % is not mapped to an active agent record in public.agents', v_caller_uid
                USING ERRCODE = '42501';
        END IF;

        -- Check team boundary: agent can only access tickets in their verified team
        IF v_ticket.team_id <> v_caller_team_id THEN
            RAISE EXCEPTION 'Unauthorized: Agent belongs to Team % and cannot access Ticket % belonging to Team %',
                v_caller_team_id, p_ticket_id, v_ticket.team_id
                USING ERRCODE = '42501';
        END IF;

        -- Check destination team: cross-team transfer is strictly prohibited for agents
        IF p_team_id IS NOT NULL AND p_team_id <> v_caller_team_id THEN
            RAISE EXCEPTION 'Unauthorized: Agents cannot move tickets across teams (requested Team %, caller Team %)',
                p_team_id, v_caller_team_id
                USING ERRCODE = '42501';
        END IF;

        -- Check ticket assignment state
        IF v_ticket.agent_id IS NOT NULL AND v_ticket.agent_id <> v_caller_agent_id THEN
            -- Ticket is assigned to a peer agent!
            RAISE EXCEPTION 'Unauthorized: Ticket % is assigned to peer Agent %. Mutation prohibited.',
                p_ticket_id, v_ticket.agent_id
                USING ERRCODE = '42501';
        ELSIF v_ticket.agent_id IS NULL THEN
            -- Ticket is currently unassigned!
            -- SEC-01 INVARIANT: An agent may mutate an unassigned ticket ONLY when the same RPC call
            -- claims it for that verified caller (p_agent_id = current_agent_id() and p_unassign_agent IS NOT TRUE).
            -- Agents cannot unassign an unassigned ticket to alter status/priority while leaving it unassigned.
            IF p_unassign_agent IS TRUE THEN
                RAISE EXCEPTION 'Unauthorized: Ticket % is unassigned. Agents cannot unassign an unassigned ticket; Agent must claim unassigned ticket by assigning self before triaging',
                    p_ticket_id
                    USING ERRCODE = '42501';
            END IF;

            IF p_agent_id IS NULL OR p_agent_id <> v_caller_agent_id THEN
                RAISE EXCEPTION 'Unauthorized: Agent must claim unassigned ticket by assigning self (requested Agent %, caller Agent %) before triaging',
                    p_agent_id, v_caller_agent_id
                    USING ERRCODE = '42501';
            END IF;

            -- Explicit verified self-claim:
            v_new_agent_id := v_caller_agent_id;
            v_new_team_id := v_caller_team_id;
        ELSE
            -- Ticket is currently assigned to caller (v_ticket.agent_id = v_caller_agent_id)
            IF p_unassign_agent IS TRUE THEN
                -- Self-unassign back to team queue
                v_new_agent_id := NULL;
                v_new_team_id := v_caller_team_id;
            ELSIF p_agent_id IS NOT NULL AND p_agent_id <> v_caller_agent_id THEN
                -- Attempting peer reassignment
                RAISE EXCEPTION 'Unauthorized: Agents cannot reassign tickets to other agents. Manager required.'
                    USING ERRCODE = '42501';
            ELSE
                -- Retain caller assignment
                v_new_agent_id := v_caller_agent_id;
                v_new_team_id := v_caller_team_id;
            END IF;
        END IF;

    ELSIF v_caller_role = 'manager' THEN
        -- Verify manager is authorized for ticket's current team
        IF NOT public.is_team_manager(v_ticket.team_id) THEN
            RAISE EXCEPTION 'Unauthorized: Manager % is not authorized to triage tickets for Team %',
                v_caller_uid, v_ticket.team_id
                USING ERRCODE = '42501';
        END IF;

        -- Verify destination team if transferring
        IF p_team_id IS NOT NULL AND p_team_id <> v_ticket.team_id THEN
            IF NOT public.is_team_manager(p_team_id) THEN
                RAISE EXCEPTION 'Unauthorized: Manager is not authorized for destination Team %',
                    p_team_id
                    USING ERRCODE = '42501';
            END IF;
            v_new_team_id := p_team_id;
        ELSE
            v_new_team_id := v_ticket.team_id;
        END IF;

        -- Handle agent assignment/reassignment/unassignment
        IF p_unassign_agent IS TRUE THEN
            v_new_agent_id := NULL;
        ELSIF p_agent_id IS NOT NULL THEN
            SELECT a.team_id, a.is_active INTO v_agent_team_id, v_target_agent_active
            FROM public.agents a
            WHERE a.agent_id = p_agent_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Agent ID % not found in canonical agents dimension', p_agent_id
                    USING ERRCODE = '23503';
            END IF;

            IF NOT v_target_agent_active THEN
                RAISE EXCEPTION 'Cannot assign inactive Agent %', p_agent_id
                    USING ERRCODE = '23514';
            END IF;

            IF v_agent_team_id <> v_new_team_id THEN
                RAISE EXCEPTION 'Inconsistent agent/team assignment: Agent % belongs to Team %, not requested Team %',
                    p_agent_id, v_agent_team_id, v_new_team_id
                    USING ERRCODE = '23514';
            END IF;

            v_new_agent_id := p_agent_id;
        ELSE
            v_new_agent_id := v_ticket.agent_id;
            IF v_new_agent_id IS NOT NULL THEN
                SELECT a.team_id INTO v_agent_team_id
                FROM public.agents a
                WHERE a.agent_id = v_new_agent_id;

                IF v_agent_team_id <> v_new_team_id THEN
                    RAISE EXCEPTION 'Cannot move ticket to Team % while assigned to Agent % (Team %). Unassign or reassign agent first.',
                        v_new_team_id, v_new_agent_id, v_agent_team_id
                        USING ERRCODE = '23514';
                END IF;
            END IF;
        END IF;

    ELSIF v_caller_role = 'admin' THEN
        -- Admin has global scope across all teams
        IF p_unassign_agent IS TRUE THEN
            v_new_agent_id := NULL;
            IF p_team_id IS NOT NULL THEN
                IF NOT EXISTS (SELECT 1 FROM public.teams WHERE team_id = p_team_id) THEN
                    RAISE EXCEPTION 'Invalid team ID %: team does not exist in public.teams', p_team_id
                        USING ERRCODE = '23503';
                END IF;
                v_new_team_id := p_team_id;
            ELSE
                v_new_team_id := v_ticket.team_id;
            END IF;
        ELSIF p_agent_id IS NOT NULL THEN
            SELECT a.team_id, a.is_active INTO v_agent_team_id, v_target_agent_active
            FROM public.agents a
            WHERE a.agent_id = p_agent_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Agent ID % not found in canonical agents dimension', p_agent_id
                    USING ERRCODE = '23503';
            END IF;

            IF NOT v_target_agent_active THEN
                RAISE EXCEPTION 'Cannot assign inactive Agent %', p_agent_id
                    USING ERRCODE = '23514';
            END IF;

            IF p_team_id IS NOT NULL AND p_team_id <> v_agent_team_id THEN
                RAISE EXCEPTION 'Inconsistent agent/team assignment: Agent % belongs to Team %, not requested Team %',
                    p_agent_id, v_agent_team_id, p_team_id
                    USING ERRCODE = '23514';
            END IF;

            v_new_agent_id := p_agent_id;
            v_new_team_id := v_agent_team_id;
        ELSE
            v_new_agent_id := v_ticket.agent_id;
            IF p_team_id IS NOT NULL THEN
                IF v_new_agent_id IS NOT NULL THEN
                    SELECT a.team_id INTO v_agent_team_id
                    FROM public.agents a
                    WHERE a.agent_id = v_new_agent_id;

                    IF p_team_id <> v_agent_team_id THEN
                        RAISE EXCEPTION 'Cannot change team to % while assigned to Agent % (Team %)',
                            p_team_id, v_new_agent_id, v_agent_team_id
                            USING ERRCODE = '23514';
                    END IF;
                ELSE
                    IF NOT EXISTS (SELECT 1 FROM public.teams WHERE team_id = p_team_id) THEN
                        RAISE EXCEPTION 'Invalid team ID %: team does not exist', p_team_id
                            USING ERRCODE = '23503';
                    END IF;
                END IF;
                v_new_team_id := p_team_id;
            ELSE
                v_new_team_id := v_ticket.team_id;
            END IF;
        END IF;
    END IF;

    -- 7. Status Transitions & Resolution Timestamps
    IF v_new_status IN ('Resolved', 'Closed') THEN
        v_resolved_at := COALESCE(v_ticket.resolved_at, CURRENT_TIMESTAMP::TIMESTAMP);
        
        -- Validate temporal consistency: resolved_at cannot be prior to created_at
        IF v_resolved_at < v_ticket.created_at THEN
            RAISE EXCEPTION 'Temporal inconsistency: resolved_at (%) cannot be earlier than created_at (%)',
                v_resolved_at, v_ticket.created_at
                USING ERRCODE = '23514';
        END IF;

        v_resolution_time_hours := GREATEST(
            0.5,
            ROUND(EXTRACT(EPOCH FROM (v_resolved_at - v_ticket.created_at)) / 3600.0, 2)
        );
    ELSE
        -- Reopening to Open, In Progress, or Pending clears resolution timestamps
        v_resolved_at := NULL;
        v_resolution_time_hours := NULL;
    END IF;

    -- 8. Execute update strictly on writable triage columns
    -- Historical dimensions (ticket_id, created_at, department_id, category_id, issue_type) remain 100% immutable
    UPDATE public.tickets
    SET status = v_new_status::public.ticket_status,
        priority = v_new_priority::public.ticket_priority,
        sla_rule_id = v_sla_rule_id,
        agent_id = v_new_agent_id,
        team_id = v_new_team_id,
        resolved_at = v_resolved_at,
        resolution_time_hours = v_resolution_time_hours
    WHERE ticket_id = p_ticket_id
    RETURNING to_jsonb(public.tickets.*) INTO v_result;

    RETURN v_result;
END;
$$;

ALTER FUNCTION public.update_ticket_triage(VARCHAR(20), TEXT, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.update_ticket_triage(VARCHAR(20), TEXT, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_ticket_triage(VARCHAR(20), TEXT, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_ticket_triage(VARCHAR(20), TEXT, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT) TO authenticated, service_role;



-- ---------------------------------------------------------------------
-- 7. Enable Row Level Security (RLS) on All Exposed Tables
-- ---------------------------------------------------------------------
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------
-- 8. Idempotent Policy Teardown (Targeted Policy Names Only)
-- ---------------------------------------------------------------------
-- Drops only application-specific policy names and known Supabase default policy
-- names on these tables. Unrelated administrative or external policies are preserved.

-- Dropping known legacy/template policies if present
DROP POLICY IF EXISTS "Allow public read-only access" ON public.departments;
DROP POLICY IF EXISTS "Allow public read-only access" ON public.categories;
DROP POLICY IF EXISTS "Allow public read-only access" ON public.sla_rules;
DROP POLICY IF EXISTS "Allow public read-only access" ON public.teams;
DROP POLICY IF EXISTS "Allow public read-only access" ON public.agents;
DROP POLICY IF EXISTS "Allow public read-only access" ON public.tickets;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tickets;
DROP POLICY IF EXISTS "Allow authenticated update on tickets" ON public.tickets;

-- Dropping application policies for clean, idempotent replacement
DROP POLICY IF EXISTS "sec_anon_select_departments" ON public.departments;
DROP POLICY IF EXISTS "sec_auth_select_departments" ON public.departments;
DROP POLICY IF EXISTS "sec_admin_manage_departments" ON public.departments;

DROP POLICY IF EXISTS "sec_anon_select_categories" ON public.categories;
DROP POLICY IF EXISTS "sec_auth_select_categories" ON public.categories;
DROP POLICY IF EXISTS "sec_admin_manage_categories" ON public.categories;

DROP POLICY IF EXISTS "sec_anon_select_sla_rules" ON public.sla_rules;
DROP POLICY IF EXISTS "sec_auth_select_sla_rules" ON public.sla_rules;
DROP POLICY IF EXISTS "sec_admin_manage_sla_rules" ON public.sla_rules;

DROP POLICY IF EXISTS "sec_anon_select_teams" ON public.teams;
DROP POLICY IF EXISTS "sec_auth_select_teams" ON public.teams;
DROP POLICY IF EXISTS "sec_admin_manage_teams" ON public.teams;

DROP POLICY IF EXISTS "sec_anon_select_agents" ON public.agents;
DROP POLICY IF EXISTS "sec_auth_select_agents" ON public.agents;
DROP POLICY IF EXISTS "sec_admin_manage_agents" ON public.agents;

DROP POLICY IF EXISTS "sec_users_select_own_manager_teams" ON public.team_managers;
DROP POLICY IF EXISTS "sec_admin_manage_team_managers" ON public.team_managers;

DROP POLICY IF EXISTS "sec_anon_select_tickets" ON public.tickets;
DROP POLICY IF EXISTS "sec_auth_select_tickets" ON public.tickets;
DROP POLICY IF EXISTS "sec_staff_select_tickets" ON public.tickets;
DROP POLICY IF EXISTS "sec_staff_update_ticket_triage" ON public.tickets;
DROP POLICY IF EXISTS "sec_admin_manage_tickets" ON public.tickets;


-- ---------------------------------------------------------------------
-- 9. Dimension Tables & Management Tables Policies (Master Reference Data)
-- ---------------------------------------------------------------------
-- Master data is read-only for anonymous users, ordinary users, and support agents.
-- Full modification privileges are restricted to verified administrators via public.is_admin().

-- Table 1: departments
CREATE POLICY "sec_anon_select_departments"
    ON public.departments FOR SELECT TO anon USING (true);

CREATE POLICY "sec_auth_select_departments"
    ON public.departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "sec_admin_manage_departments"
    ON public.departments FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Table 2: categories
CREATE POLICY "sec_anon_select_categories"
    ON public.categories FOR SELECT TO anon USING (true);

CREATE POLICY "sec_auth_select_categories"
    ON public.categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "sec_admin_manage_categories"
    ON public.categories FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Table 3: sla_rules
CREATE POLICY "sec_anon_select_sla_rules"
    ON public.sla_rules FOR SELECT TO anon USING (true);

CREATE POLICY "sec_auth_select_sla_rules"
    ON public.sla_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "sec_admin_manage_sla_rules"
    ON public.sla_rules FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Table 4: teams
CREATE POLICY "sec_anon_select_teams"
    ON public.teams FOR SELECT TO anon USING (true);

CREATE POLICY "sec_auth_select_teams"
    ON public.teams FOR SELECT TO authenticated USING (true);

CREATE POLICY "sec_admin_manage_teams"
    ON public.teams FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Table 5: agents (Base Table Protected; Reads Redirected to public.agent_directory)
-- Standard clients (anon and authenticated staff) read via public.agent_directory view.
-- Direct base table access contains sensitive user_id mapping UUIDs and is restricted to administrators.
CREATE POLICY "sec_admin_manage_agents"
    ON public.agents FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Table 6: team_managers
-- Authenticated users can view only their own team management assignments; admins can view all
CREATE POLICY "sec_users_select_own_manager_teams"
    ON public.team_managers FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

-- Only administrators can insert, update, or delete manager-team assignments
CREATE POLICY "sec_admin_manage_team_managers"
    ON public.team_managers FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- ---------------------------------------------------------------------
-- 10. Fact Table Policies (public.tickets)
-- ---------------------------------------------------------------------

-- Policy 10A: Staff-Restricted Operational Read Access (Model C Hybrid)
-- LEAST PRIVILEGE ENFORCEMENT:
-- Fact table read access is strictly restricted to verified staff roles: 'agent', 'manager', and 'admin'.
-- Sourced exclusively from trusted server-controlled identity.
-- Team-queue scoping is enforced:
--   1. Administrators read all tickets globally.
--   2. Operations managers read tickets only in teams they explicitly manage via team_managers.
--   3. Support agents read tickets only in their verified active team queue.
--   4. Anonymous users and ordinary authenticated employees receive zero operational access (0 rows).
CREATE POLICY "sec_staff_select_tickets"
    ON public.tickets FOR SELECT TO authenticated
    USING (
        (public.current_user_role() IN ('agent', 'manager', 'admin'))
        AND
        CASE
            -- 1. Administrators can read all tickets globally
            WHEN public.is_admin() THEN TRUE

            -- 2. Managers can read tickets only in teams they explicitly manage
            WHEN public.current_user_role() = 'manager' THEN 
                public.is_team_manager(public.tickets.team_id)

            -- 3. Agents can read tickets only in their verified active team queue
            WHEN public.current_user_role() = 'agent' THEN 
                public.tickets.team_id = public.current_agent_team_id()

            -- 4. Ordinary employees and unmapped users receive zero operational access
            ELSE FALSE
        END
    );


-- Policy 10B: Elimination of Direct SQL UPDATE Bypass (RPC-Only Triage):
-- Direct UPDATE policies on public.tickets are intentionally NOT created for staff or authenticated users.
-- Because direct SQL UPDATE privileges are completely revoked in Section 5D, all triage modifications
-- are required to execute via the `public.update_ticket_triage()` RPC gate.
-- The RPC runs as SECURITY DEFINER (owned by postgres) and performs deep transactional validation:
-- caller authorization, canonical agent/team matching, priority/SLA pairing, and temporal consistency.
-- Any legacy policy `sec_staff_update_ticket_triage` is dropped in Section 8 for clean enforcement.

-- Policy 10C: Administrative Governance
-- Dedicated administrative policy for data governance operations.
CREATE POLICY "sec_admin_manage_tickets"
    ON public.tickets
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- ---------------------------------------------------------------------
-- 11. Governance Blueprint: Identity Mapping Reality & Future Auth Architecture
-- ---------------------------------------------------------------------
-- A. IDENTITY REALITY & EMPLOYEE OWNERSHIP LIMITATION:
-- The `public.tickets` table currently lacks a `created_by_user_id UUID`
-- foreign-key column referencing `auth.users(id)`.
-- Therefore, row-level employee ownership (restricting ticket reads/writes
-- to the originating user) CANNOT be enforced by PostgreSQL without a schema
-- modification.
-- Per-employee ticket access remains unavailable until a separate, approved
-- schema and data-migration design introduces a trustworthy ownership mapping.
-- In the interim, ordinary authenticated employees have no fact table SELECT
-- policy and cannot browse enterprise operational tickets.
--
-- To support genuine row-level employee ownership in future production phases:
--   Step 1: Execute schema alteration:
--     ALTER TABLE public.tickets 
--     ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id);
--   Step 2: Add authenticated employee access policies:
--     CREATE POLICY "sec_employee_select_own_tickets" ON public.tickets
--     FOR SELECT TO authenticated
--     USING (
--         auth.uid() = created_by_user_id 
--         OR public.current_user_role() IN ('agent', 'manager', 'admin')
--     );
--     CREATE POLICY "sec_employee_insert_own_ticket" ON public.tickets
--     FOR INSERT TO authenticated
--     WITH CHECK (
--         auth.uid() = created_by_user_id 
--         AND status = 'Open' 
--         AND agent_id IS NULL
--     );
--
-- B. SEPARATION OF DEMO MODE VS PRODUCTION AUTH:
-- Current State (Governed Demo Mode):
--   - Unauthenticated visitors and demo users operate safely in read-only mode using local synthetic
--     benchmark data (src/data/seededData.json). Direct anonymous access to operational tickets in
--     public.tickets is denied by least-privilege policy.
--   - UI role switcher operates strictly in client-side memory (`isDemoAuth: true`).
--   - Triage updates in demo mode mutate active session state and audit logs only;
--     no remote Supabase write is attempted (gated by `dataService.getMutationCapability()`).
--
-- Future Production State:
--   - Users authenticate through Supabase Auth (`supabase.auth.signInWithPassword` or SSO).
--   - Staff roles are assigned in `public.user_roles` by an administrator:
--       INSERT INTO public.user_roles (user_id, role)
--       VALUES ('<auth_uid>', 'agent')
--       ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
--     OR set via Supabase Admin API / SQL in app_metadata:
--       UPDATE auth.users 
--       SET raw_app_meta_data = raw_app_meta_data || '{"role": "agent"}'::jsonb 
--       WHERE email = 'agent@company.com';
--   - Authenticated JWTs activate `sec_staff_select_tickets` for authorized staff queue reading
--     and `public.update_ticket_triage` for authorized staff triage mutations.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 12. PostgREST Schema Cache Reload
-- ---------------------------------------------------------------------
-- Signal the PostgREST server daemon to immediately refresh its schema cache,
-- ensuring instant recognition of new RPC functions (public.update_ticket_triage),
-- updated grants, and hardened RLS policies without container restart or PGRST202 lag.
NOTIFY pgrst, 'reload schema';

-- Commit the atomic transaction
COMMIT;

