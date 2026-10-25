# Permanent Coding Rules & Agent Instructions (AGENTS.md)

**Target Codebase:** IT Support Ticket Analytics Platform (`it-support-analytics`)  
**Product Identity:** IT Support Ticket Analysis & Service Management Analytics  
**Governing Principle:** PRESERVE → DOCUMENT → FLAG → GOVERN  
**Primary Authority:** `docs/PRD.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/API.md`

---

## 1. Core Operating Identity & Product Scope

1. **Strict Product Identity**:
   - This application is an **IT Support Ticket Analysis and Service Management Analytics** platform.
   - It is **NOT** a STRATOS AI product. Do not introduce STRATOS AI branding, AI-product marketing copy, fictional generative AI features, or unrelated SaaS themes.
2. **Existing Application Context**:
   - This is an existing, working codebase. It is not a greenfield project.
   - Preserve existing architecture, routing patterns, authentication flow, and design tokens.

---

## 2. Non-Negotiable Safety & Git Integrity Rules

1. **Preserve All Changes**:
   - Always preserve existing uncommitted and untracked changes.
   - **NEVER** run destructive Git operations: `git reset`, `git clean`, `git checkout -- .`, `git restore`, or bulk file deletions.
2. **Deployment & Publishing Limits**:
   - Do **NOT** commit, push, deploy, or publish without explicit written authorization from the user.
3. **Database Mutation Restrictions**:
   - Do **NOT** execute SQL migrations, drop tables, alter schema, or modify policies on live Supabase databases without explicit instruction.
   - Do **NOT** execute `security_hardening_migration.sql` against production.
   - Do **NOT** execute rollback SQL scripts against live databases.
4. **Secret Protection**:
   - **NEVER** expose, commit, print, or place `SUPABASE_SERVICE_ROLE_KEY` in frontend code or client bundles.
   - Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are permissible in client `.env` files.

---

## 3. Analytical Rigor & Data Governance

1. **Never Fabricate Data or Claims**:
   - Do not invent KPIs, targets, synthetic trends, or causal explanations.
   - Use descriptive analytical language: *"observed"*, *"recorded"*, *"associated"*, *"correlated"*, *"requires investigation"*.
   - Never claim causality from observational ticket data.
2. **Governed Formulas & Definitions**:
   - **Active Backlog**: $\text{Open} + \text{In Progress} + \text{Pending} = 1,388$ (in reference dataset).
   - **SLA Compliance Denominator**: $\frac{\text{Compliant Resolved}}{\text{Total Resolved}} \times 100$. Unresolved tickets must **never** be mixed into retrospective compliance metrics.
   - **Resolution Turnaround**: Measured in **calendar hours (24/7)** from `created_at` to `resolved_at`.
3. **Trace Discrepancies Before Fixing**:
   - When metrics appear misaligned, trace the formula and source dataset before modifying code.
   - Document the underlying cause in test suites.

---

## 4. Architectural & Implementation Standards

1. **Service Layer Abstraction**:
   - All data fetching and transformations must flow through `src/services/dataService.ts`.
   - **Pages and components must NEVER import mock JSON or execute raw database queries directly.**
2. **Component Reuse**:
   - Reuse existing design system components: `KpiCard`, `ChartCard`, `DataTable`, `FilterBar`, `PageHeader`, `Skeleton`, `AppShell`.
   - Follow the design system tokens in `src/index.css` and `tailwind.config.js`.
3. **Minimal Complete Changes**:
   - Implement the smallest complete solution that resolves the requirement.
   - Avoid introducing new dependencies or refactoring unrelated subsystems.
4. **Strict TypeScript & Type Safety**:
   - Keep TypeScript strict mode clean (`noImplicitAny`, strict null checks).
   - Use governed interfaces from `src/types/ticket.ts`. Do not use `any` as an escape hatch.

---

## 5. Mandatory Verification Protocol

After making any code changes, **ALWAYS** execute the following verification steps before declaring a task complete:

```bash
# 1. TypeScript & Vite Production Build
npm run build

# 2. Analytics Business Logic & Regression Suite
node scripts/test-analytics-regression.mjs

# 3. Data Normalization & Type Integrity
node scripts/test-normalization.mjs

# 4. Live Hydration & Controlled Totals
node scripts/test-hydration.mjs

# 5. Ticket Triage Persistence & Mutation Rollback
node scripts/test-ticket-persistence.mjs

# 6. Route Permissions & Role Boundaries
node scripts/test-auth-routing.mjs

# 7. Evidence Audit (Totals, CSV Escaping, Baseline Labels)
node scripts/verify-evidence.mjs
```

### Verification Reporting Standards:
- Report exact command exit codes and test pass counts.
- Distinguish between **code inspection evidence**, **automated script execution**, and **browser visual verification**.
- If browser testing was not performed due to environment limitations, state that fact honestly.

---

## 6. Communication Style

- Be concise and factual.
- State the problem, evidence, proposed solution, and affected files before executing major changes.
- Summarize changes, validation results, remaining limitations, and the recommended next step after execution.
