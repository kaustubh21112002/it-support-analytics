# Audit Remediation Report — 2026-10-13

## Changes implemented in this iteration

1. **Historical analytics now use the full clean dataset.** Added `src/data/analyticsTickets.json` generated from the 8,000-row `it_support_analytics_dataset/data/tickets.csv`.
2. **Removed proportional filter scaling.** Summary metrics, monthly trends, category and priority breakdowns, top issues, department/team summaries and resolution-time buckets are calculated from matching ticket rows.
3. **Applied department/priority filters to overview KPIs and breakdowns.** The overview's total/resolved/SLA cards now recalculate against the selected population.
4. **Removed unsupported model-performance claims from the prediction UI.** The model comparison table now marks metrics as unverified when the archive contains no reproducible training pipeline, fitted model or holdout predictions. The current calculator remains a simulated heuristic, and feature-importance bars are explicitly marked illustrative.
5. **Added client-side route role guards.** Employee portal routes, agent routes, manager/admin analytics routes and admin routes have allowed-role checks. These checks improve prototype behavior but are not a substitute for server-side authorization.
6. **Added `sql/load_data.sql`.** This loads dimension CSVs before tickets, maps empty nullable CSV values to SQL NULL, and includes basic post-load checks.
7. **Reconciled the dirty-data QA report against the actual CSV.** Observed values are recorded rather than retaining the unfulfilled injection targets.

## Direct checks against the supplied CSVs

- Clean ticket rows: 8,000
- Distinct clean ticket IDs: 8,000
- Resolved/closed tickets with durations: 6,612
- Mean resolution time: 14.9 calendar hours
- SLA-compliant resolved/closed tickets under priority targets: 5,814
- SLA compliance: 87.9%
- SLA breaches: 798
- Dirty rows: 8,040
- Distinct dirty ticket IDs: 8,000 (40 duplicate rows)
- Dirty rows with `resolved_at < created_at`: 22
- Dirty rows with `resolution_time_hours = 9999`: 17
- Rows with `category_id = 999`: 30
- Rows with `department_id = 888`: 30
- Blank cells among schema-required fields: 84

The two orphan-field counts may overlap. Expected nulls (such as unresolved timestamps, optional ratings and unassigned agents) are not treated as defects.

## Important limitations that remain

- This is still a frontend prototype. Role guards run in the browser and cannot secure a production API.
- Historical analytics use the clean reference dataset; demo ticket mutations are deliberately not merged into the historical baseline.
- Demo ticket state is still primarily in memory; reload persistence and a backend/database are not implemented by this remediation.
- No model-training script, fitted model, reproducible predictions or holdout evaluation artifact was present in the submitted ZIP. ML metrics remain unverified.
- This environment did not contain the project's `node_modules`, so TypeScript and Vite production build commands could not be rerun here. Run `npm ci` and `npm run build` locally before replacing your working copy.
