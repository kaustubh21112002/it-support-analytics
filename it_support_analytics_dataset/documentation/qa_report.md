# Quality Assurance & Integrity Audit Report

## 1. Dataset Generation Summary
- **Target Row Count**: 8,000 tickets
- **Observed Row Count (Clean)**: 8000 tickets
- **Observed Row Count (Dirty Variant)**: 8040 tickets
- **Date Range Covered**: 2024-01-01 08:00:00 to 2024-12-31 18:00:00
- **Seed Used**: 42 (Fully deterministic)

## 2. Integrity Checks (Clean Reference Dataset)
- **Primary Key Uniqueness**: 100% (8,000 distinct ticket_ids)
- **Foreign Key Integrity**:
  - `department_id`: Valid (100% match in `departments`)
  - `team_id`: Valid (100% match in `teams` and child of corresponding department)
  - `agent_id`: Valid (100% match in `agents` for assigned tickets; NULL for unassigned)
  - `category_id`: Valid (100% match in `categories`)
  - `sla_rule_id`: Valid (100% match in `sla_rules`)
- **Lifecycle & Temporal Logic**:
  - Resolved / Closed tickets: 100% have valid `resolved_at >= created_at`
  - Unresolved tickets (Open, In Progress, Pending): 100% have NULL `resolved_at` and NULL `resolution_time_hours`
- **SLA Calculation Integrity**:
  - Calculated resolution time = `(resolved_at - created_at)` in decimal hours.
  - Overall Compliance Rate: ~87.3%
  - Overall Breach Rate: ~12.7%

## 3. Injected Defects Audit (Raw/Dirty Variant: `tickets_raw_dirty.csv`)
- **Duplicates Injected**: 40 rows
- **Missing Values Injected**: 85 cells
- **Invalid Temporal Orders Injected**: 25 rows (`resolved_at < created_at`)
- **Orphan Foreign Keys Injected**: 30 rows (`category_id = 999`, `department_id = 888`)
- **Extreme Outliers Injected**: 20 rows (`resolution_time_hours = 9999.0`)
- **Total Rows in Dirty Dataset**: 8040 rows
