-- =====================================================================
-- IT Support Analytics Platform - Access Requests DDL Migration
-- Idempotent PostgreSQL / Supabase Migration for Access Request Workflow
-- =====================================================================
-- TARGET ENVIRONMENT: PostgreSQL 15+ / Supabase
-- STATUS: Staged for Administrator Review
-- EXECUTION SAFETY: Non-destructive, idempotent application.
--                  Contains NO DROP TABLE, TRUNCATE, or DELETE statements.
-- =====================================================================

BEGIN;

-- 1. Create access request status enum defensive check
DO $$ BEGIN
    CREATE TYPE access_request_status AS ENUM ('pending_review', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create access_requests table
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

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_work_email ON public.access_requests(work_email);
CREATE INDEX IF NOT EXISTS idx_access_requests_submitted_at ON public.access_requests(submitted_at);

-- 4. Enable Row Level Security
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- 5. Revoke default PUBLIC and anon privileges
REVOKE ALL ON TABLE public.access_requests FROM PUBLIC;
REVOKE UPDATE, DELETE ON TABLE public.access_requests FROM anon;

-- 6. Grant INSERT to anon and authenticated (unauthenticated onboarding applicants can submit requests)
GRANT INSERT ON TABLE public.access_requests TO anon, authenticated;

-- 7. Grant SELECT and UPDATE to authenticated administrators
GRANT SELECT, UPDATE ON TABLE public.access_requests TO authenticated;
GRANT ALL ON TABLE public.access_requests TO service_role;

-- 8. Policy: Anyone can insert a new pending request (cannot insert pre-approved or modify existing)
DO $$ BEGIN
    CREATE POLICY "sec_anon_insert_access_request"
    ON public.access_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        status = 'pending_review' 
        AND reviewed_at IS NULL 
        AND reviewed_by IS NULL
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 9. Policy: Only administrators can read access requests
DO $$ BEGIN
    CREATE POLICY "sec_admin_select_access_requests"
    ON public.access_requests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
              AND ur.role = 'admin'
        )
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 10. Policy: Only administrators can update request status
DO $$ BEGIN
    CREATE POLICY "sec_admin_update_access_requests"
    ON public.access_requests
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
              AND ur.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
              AND ur.role = 'admin'
        )
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
