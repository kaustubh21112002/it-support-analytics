# IT Support Ticket Analysis and Service Performance Dashboard

An MBA Business Analytics project providing a comprehensive service intelligence platform for IT Service Management (ITSM).

## Dataset Directory Structure
```
it_support_analytics_dataset/
  data/
    tickets.csv               # 8,000 clean tickets reference dataset
    tickets_raw_dirty.csv     # Raw dataset with 200 controlled injected anomalies
    agents.csv                # 24 support agents with experience bands
    teams.csv                 # 8 support teams
    departments.csv           # 5 corporate departments
    categories.csv            # 6 issue categories & subcategories
    sla_rules.csv             # 4 SLA priority thresholds
  sql/
    create_schema.sql         # MySQL DDL with constraints and indexes
    analysis_queries.sql      # Analytical queries for KPIs and breakdowns
  documentation/
    data_dictionary.md        # Comprehensive entity and attribute specification
    erd.md                    # Mermaid ERD diagram
    qa_report.md              # Data quality audit and verification
    generation_spec.md        # Generation parameters and business rules
  README.md
```
