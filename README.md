# IT Support Analytics — Service Intelligence Platform

**MBA Business Analytics Capstone Project**  
*IT Support Ticket Analysis and Service Performance Dashboard*

---

## 1. Executive Summary & Value Proposition

**IT Support Analytics** is a high-fidelity enterprise service-intelligence SaaS workspace that bridges operational ITSM ticketing with executive analytics, predictive modeling, and data-governance benchmarking.

> **Core Thesis:** *“Turn support tickets into operational visibility, measurable service performance, and better-informed decisions.”*

This application operates as a **working frontend prototype with client-side demo authentication**, backed by an analytical snowflake schema of **8,000 synthetic ticket transactions** across calendar year 2024.

---

## 2. Technology Stack & Architectural Principles

- **Framework**: React 18.3.1 + TypeScript 5.6.3 + Vite 5.4.11
- **Styling**: Tailwind CSS 3.4.15 with customized design tokens
- **Data Visualization**: Recharts 2.13.3 (Line charts, Bar charts, Donut charts)
- **Icons**: Lucide React
- **Routing**: React Router v6.28.0 with role guards
- **Service Layer Abstraction**: `src/services/dataService.ts` isolates UI components from underlying datasets. No page directly imports raw mock data.

---

## 3. Demo Credentials & Authentication

The platform features deterministic demo authentication. **No external credentials are required or transmitted.**

| Role | Demo User Name | Demo Email | Target Landing View | Responsibilities |
|---|---|---|---|---|
| **Employee** | Priya Sharma | `priya.sharma@company.com` | `/portal` | Log requests, track tickets, knowledge runbooks, AI assistant |
| **Support Agent** | Arjun Mehta | `arjun.mehta@company.com` | `/agent` | Operational triage, status updates, internal notes, resolve |
| **Manager / Analyst** | Neha Kapoor | `neha.kapoor@company.com` | `/analytics/overview` | Executive portfolio metrics, SLA compliance, forecasting |
| **Administrator** | Vikram Singh | `admin.analytics@company.com` | `/admin` | SLA policy threshold config, data workbench & QA audit |

### Simulated Two-Factor Authentication (OTP)
- **Demo Code**: `123456`
- **Behavior**: Auto-focus digit boxes, paste support, 30s resend countdown timer, and one-click demo code autofill.

---

## 4. Complete Application Route Map

### A. Public & Authentication
- `/` — **Landing Page**: Enterprise hero, quick statistics, interactive card preview, value pillars.
- `/login` — **Sign In**: Split-view authentication, show/hide password, one-click demo role selector.
- `/verify` — **Two-Factor Verification**: 6-digit OTP entry (`123456`), countdown timer, security panel.
- `/forgot-password` & `/reset-password` — **Self-Service Recovery**: Simulated password reset flow.
- `/403` — **Forbidden**: Access-denied view with quick-switch to Administrator persona.
- `/404` — **Not Found**: Polished error view with navigation back to platform home.

### B. Employee Self-Service Portal
- `/portal` — **Employee Home**: KPI summary, recent tickets, AI assistant card, popular articles.
- `/portal/tickets/new` — **Create Ticket**: 3-step interactive wizard with governed SLA priority entitlement explanation.
- `/portal/tickets` — **My Tickets**: Filterable and searchable ticket ledger with pagination.
- `/portal/tickets/:id` — **Employee Ticket Detail**: Conversation timeline, public replies only (**Internal notes strictly hidden from employee view**).
- `/portal/assistant` — **AI Support Assistant**: Simulated chatbot with intent recognition, diagnostic guidance, and ticket handoff.
- `/portal/knowledge` — **Knowledge Base**: Runbook catalog, category pills, reading modal, and helpfulness voting.

### C. Support Agent Workspace
- `/agent` — **Agent Dashboard**: Triage queue, at-risk SLA countdowns, and ticket lifecycle status donut chart.
- `/agent/tickets` — **Global Ticket Queue**: Operational dispatch table, assignee tags, and CSV export.
- `/agent/tickets/:id` — **Agent Ticket Detail**: Complete timeline including **confidential internal notes**, status changer, priority changer, reassignment, and one-click "Mark Resolved".
- `/agent/workload` — **Team Workload**: Backlog comparisons, experience band performance (Senior vs Mid vs Junior), and team capacity matrix.

### D. Management Service Intelligence
- `/analytics/overview` — **Executive Overview**: 6 core KPIs, monthly created vs. resolved line chart, category volume donut.
- `/analytics/trends` — **Ticket Trends**: Monthly seasonality, throughput curves, and category shifts.
- `/analytics/resolution` — **Resolution Performance**: Mean (14.9h) vs Median (7.3h) turnaround, distribution histogram.
- `/analytics/sla` — **SLA Command Center**: Retrospective compliance by priority, breach rate auditing, and open at-risk list.
- `/analytics/teams` — **Team Performance**: Support tier scorecards, resolution speeds, and open backlogs.
- `/analytics/departments` — **Department Demand**: Demand origin comparison, category mix, CSAT scores.
- `/analytics/issues` — **Recurring Issues**: Top 10 ranked issue types (e.g. Battery health, VPN timeout, AD lockouts).
- `/analytics/predictions` — **ML Resolution Prediction**: Ticket creation feature form, LightGBM estimator (MAE: 3.42h, R²: 0.784), confidence intervals, and feature importance.
- `/analytics/reports` — **Reports & Export Center**: Dynamic CSV generator with active filter summaries.

### E. Administration & Data Governance
- `/admin` — **Admin Overview**: System health, active users, audit log stream, schema summary.
- `/admin/users` — **User & Role Management**: Simulated role assignment and client-side privilege disclaimer.
- `/admin/sla` — **SLA Configuration**: Dynamic threshold adjustment by priority with automatic recalculation across views.
- `/admin/data` — **Data Workbench**: Automated pipeline integrity audit (Clean reference 8,000 rows vs. Dirty variant with 120 defects), full data dictionary.
- `/admin/security` — **Security Settings**: Simulated MFA policy and session inactivity locks.

### F. Shared System Pages
- `/notifications` — **Notification Center**: Operational alert inbox, mark as read, direct ticket links.
- `/profile` — **Account Profile**: User identity, role badge, notification preferences, sign out.

---

## 5. Analytical Definitions & Governance Rules

Following the **PRESERVE → DOCUMENT → FLAG → GOVERN** protocol:

1. **Resolution Time Calculation**:
   $$\text{Resolution Time (hrs)} = \frac{\text{resolved\_at} - \text{created\_at}}{3600 \text{ seconds}}$$
   Measured in **calendar hours (24/7)**.
2. **SLA Compliance Denominator**:
   $$\text{SLA Compliance \%} = \frac{\text{Compliant Resolved Tickets}}{\text{Total Resolved Tickets}} \times 100$$
   *Unresolved tickets (Open, In Progress, Pending) are never silently mixed into retrospective compliance percentages.*
3. **Target Resolution SLAs**:
   - **Critical**: 4.0 Calendar Hours
   - **High**: 8.0 Calendar Hours
   - **Medium**: 24.0 Calendar Hours
   - **Low**: 72.0 Calendar Hours
4. **Resolution Time ML Prediction**:
   - Evaluated strictly upon features available at **ticket creation**.
   - Model: LightGBM Regressor baseline ($MAE = 3.42\text{h}$, $RMSE = 5.18\text{h}$, $R^2 = 0.784$) evaluated on an 80/20 chronological time-aware split.

---

## 6. How to Run Locally

### Prerequisites
- Node.js 18+ (tested with Node 20 LTS)

### Development Server
```bash
npm run dev
# or: node .\node_modules\vite\bin\vite.js --port 5173
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Type Check & Production Build
```bash
node .\node_modules\typescript\bin\tsc --noEmit
node .\node_modules\vite\bin\vite.js build
```

---

## 7. Relational Dataset & Deliverables Index

Located in `it_support_analytics_dataset/`:
- `data/tickets.csv`: 8,000 clean fact table records
- `data/tickets_raw_dirty.csv`: 8,040 rows containing 120 controlled injected defects for QA benchmarking
- `data/departments.csv`, `teams.csv`, `agents.csv`, `categories.csv`, `sla_rules.csv`: Dimension tables
- `sql/create_schema.sql`: Production DDL with InnoDB engines, foreign keys, and indexes
- `sql/analysis_queries.sql`: Analytical SQL queries corresponding to dashboard metrics
- `documentation/data_dictionary.md`: Column-by-column dictionary
- `documentation/erd.md`: Entity relationship specification
- `documentation/qa_report.md`: QA audit report verifying 100% key uniqueness and zero orphan foreign keys in the clean dataset

---

## 8. Simulated Features vs. Future Production Integrations

| Feature Area | Current Prototype Implementation | Production Integration Required |
|---|---|---|
| **Authentication** | Client-side demo login with fixed OTP `123456` | SAML 2.0 / OIDC (Okta, Azure AD), SMS/Email OTP service |
| **Authorization** | Role switcher & client-side route guards | Server-side JWT session validation & API gateway RBAC |
| **Ticket Storage** | Stateful in-memory & local storage service layer | Production Postgres / MySQL or ServiceNow REST API |
| **AI Assistant** | Deterministic intent router & runbook matching | LLM model endpoint (Gemini API) with vector RAG runbook search |
| **Predictions** | Calibrated regression heuristic & evaluation metrics | Live ML model inference service (e.g. Vertex AI endpoint) |
| **Data Ingestion** | Frontend CSV preview & schema validation | Server-side Airflow / Cloud Composer ETL ingestion pipeline |
