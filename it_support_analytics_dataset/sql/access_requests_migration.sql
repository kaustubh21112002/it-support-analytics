-- =====================================================================
-- IT Support Analytics Platform - Production Access Requests Architecture
-- Idempotent PostgreSQL / Supabase Migration for Access Request Workflow
-- =====================================================================
-- TARGET ENVIRONMENT: PostgreSQL 15+ / Supabase
-- STATUS: Staged for Administrator Review
-- EXECUTION SAFETY: Non-destructive, idempotent application.
--                  Contains NO DROP TABLE, TRUNCATE, or DELETE statements.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Helper Function: public.is_admin() (Non-recursive, secure definer)
-- ---------------------------------------------------------------------
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

    -- 1. Check database role mapping table if present
    BEGIN
        SELECT ur.role INTO v_role
        FROM public.user_roles ur
        WHERE ur.user_id = v_uid;

        IF v_role = 'admin' THEN
            RETURN TRUE;
        END IF;

        IF v_role IS NOT NULL THEN
            RETURN FALSE;
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            NULL; -- proceed to JWT app_metadata check below
    END;

    -- 2. Fallback to trusted app_metadata from verified server-issued JWT
    IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

ALTER FUNCTION public.is_admin() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;


-- ---------------------------------------------------------------------
-- 2. Custom Enum Types
-- ---------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE access_request_status AS ENUM ('pending_review', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- ---------------------------------------------------------------------
-- 3. Authoritative Access Requests Fact Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_requests (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    work_email VARCHAR(255) NOT NULL,
    department_id INTEGER NOT NULL REFERENCES public.departments(department_id),
    department_name VARCHAR(100) NOT NULL,
    requested_role VARCHAR(20) NOT NULL CHECK (requested_role IN ('employee', 'agent', 'manager', 'admin')),
    reason TEXT NOT NULL,
    status access_request_status NOT NULL DEFAULT 'pending_review',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ NULL,
    reviewed_by VARCHAR(100) NULL,
    reviewed_by_name VARCHAR(150) NULL,
    review_reason TEXT NULL
);

-- Partial unique index preventing duplicate pending requests for the same email and requested role
CREATE UNIQUE INDEX IF NOT EXISTS uq_access_requests_pending 
ON public.access_requests(work_email, requested_role) 
WHERE status = 'pending_review';

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_work_email ON public.access_requests(work_email);
CREATE INDEX IF NOT EXISTS idx_access_requests_submitted_at ON public.access_requests(submitted_at);


-- ---------------------------------------------------------------------
-- 4. Enable Row Level Security & SQL Table Grants
-- ---------------------------------------------------------------------
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.access_requests FROM PUBLIC;
REVOKE ALL ON TABLE public.access_requests FROM anon;

-- Grant INSERT only to anon and authenticated (unauthenticated onboarding applicants can submit requests)
GRANT INSERT ON TABLE public.access_requests TO anon, authenticated;

-- Grant SELECT and UPDATE to authenticated role (evaluated strictly by RLS policies)
GRANT SELECT, UPDATE ON TABLE public.access_requests TO authenticated;
GRANT ALL ON TABLE public.access_requests TO service_role;


-- ---------------------------------------------------------------------
-- 5. Row Level Security Policies
-- ---------------------------------------------------------------------

-- Policy 1: Applicant submission lockdown.
-- Anyone can submit a request, but it MUST be pending_review with null review metadata.
-- Rejects attempts by applicants to inject pre-approved status or fraudulent reviewer metadata.
DO $$ BEGIN
    CREATE POLICY "sec_applicant_insert_access_request"
    ON public.access_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        status = 'pending_review' 
        AND reviewed_at IS NULL 
        AND reviewed_by IS NULL
        AND reviewed_by_name IS NULL
        AND review_reason IS NULL
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Policy 2: Read restriction.
-- Only verified administrators can SELECT access requests.
-- Anonymous callers, employees, agents, and managers evaluate to FALSE (0 rows).
DO $$ BEGIN
    CREATE POLICY "sec_admin_select_access_requests"
    ON public.access_requests
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Policy 3: Update restriction.
-- Only verified administrators can UPDATE access requests.
-- Prevents non-admins from modifying requests.
DO $$ BEGIN
    CREATE POLICY "sec_admin_update_access_requests"
    ON public.access_requests
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
    )
    WITH CHECK (
        public.is_admin()
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- ---------------------------------------------------------------------
-- 6. Stored Procedure: Review Access Request (Optimistic Locking & Audit Trail)
-- ---------------------------------------------------------------------
-- Atomic review function:
-- 1. Verifies caller is administrator.
-- 2. Enforces that target request is in 'pending_review' status (prevents concurrent overwrite).
-- 3. Updates status, timestamp, reviewer ID, reviewer name, and audit reason.
-- 4. Returns updated record.
CREATE OR REPLACE FUNCTION public.review_access_request(
    p_request_id VARCHAR(50),
    p_action VARCHAR(20),
    p_reviewer_name VARCHAR(150),
    p_review_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    v_uid UUID;
    v_is_adm BOOLEAN;
    v_target RECORD;
    v_new_status public.access_request_status;
    v_now TIMESTAMPTZ;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION '42501: Authentication required to review access requests.';
    END IF;

    -- Verify administrator authority
    SELECT public.is_admin() INTO v_is_adm;
    IF NOT v_is_adm THEN
        RAISE EXCEPTION '42501: Access denied. Only administrators can review access requests.';
    END IF;

    IF p_action = 'approve' THEN
        v_new_status := 'approved'::public.access_request_status;
    ELSIF p_action = 'reject' THEN
        v_new_status := 'rejected'::public.access_request_status;
    ELSE
        RAISE EXCEPTION '22023: Invalid review action. Must be approve or reject.';
    END IF;

    v_now := clock_timestamp();

    -- Row lock and status verification
    SELECT * INTO v_target
    FROM public.access_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'P0002: Access request % not found.', p_request_id;
    END IF;

    IF v_target.status != 'pending_review' THEN
        RAISE EXCEPTION 'P0001: Access request % has already been decided (Status: %).', p_request_id, v_target.status;
    END IF;

    -- Apply update
    UPDATE public.access_requests
    SET status = v_new_status,
        reviewed_at = v_now,
        reviewed_by = v_uid::TEXT,
        reviewed_by_name = COALESCE(p_reviewer_name, 'Administrator'),
        review_reason = p_review_reason
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
        'success', true,
        'id', p_request_id,
        'status', v_new_status,
        'reviewed_at', v_now,
        'reviewed_by', v_uid::TEXT
    );
END;
$$;

ALTER FUNCTION public.review_access_request(VARCHAR, VARCHAR, VARCHAR, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.review_access_request(VARCHAR, VARCHAR, VARCHAR, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_access_request(VARCHAR, VARCHAR, VARCHAR, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.review_access_request(VARCHAR, VARCHAR, VARCHAR, TEXT) TO authenticated, service_role;

COMMIT;
