# Dataset Generation Specification

## 1. Analytical Rules & Parameters
- **Calendar-Hour Basis**: SLA elapsed time is evaluated using continuous calendar hours between `created_at` and `resolved_at`.
- **Denominator Rule**: Compliance percentages are evaluated exclusively over tickets with completed resolution (`Resolved` or `Closed`). Open tickets are excluded from retrospective compliance denominators to prevent premature zero-biasing.
- **Priority SLA Thresholds**:
  - Critical: 4 hours
  - High: 8 hours
  - Medium: 24 hours
  - Low: 72 hours
- **Satisfaction Scores (CSAT)**: 1 to 5 integer rating generated for ~75% of resolved tickets, correlated with resolution promptness.
