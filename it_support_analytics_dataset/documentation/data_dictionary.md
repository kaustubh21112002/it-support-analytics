# Data Dictionary: IT Support Analytics Dataset

## 1. Entity Overview

The IT Support Analytics platform is structured as an analytical snowflake/star schema centered on the `tickets` fact table with five supporting dimension tables: `departments`, `teams`, `agents`, `categories`, and `sla_rules`.

---

## 2. Table Specifications

### A. `tickets` (Core Fact Table)
Contains exactly 8,000 synthetic ticket transactions across calendar year 2024.

| Column Name | Data Type | Nullable | Description | Example |
|---|---|---|---|---|
| `ticket_id` | VARCHAR(20) | NO | Unique ticket primary key | `TKT-00042` |
| `created_at` | DATETIME | NO | Timestamp when employee logged ticket | `2024-03-14 09:22:00` |
| `resolved_at` | DATETIME | YES | Timestamp when ticket reached Resolved/Closed | `2024-03-14 14:46:00` |
| `status` | ENUM | NO | Ticket lifecycle stage (`Open`, `In Progress`, `Pending`, `Resolved`, `Closed`) | `Resolved` |
| `priority` | ENUM | NO | Impact & urgency tier (`Critical`, `High`, `Medium`, `Low`) | `High` |
| `category_id` | INT | NO | FK referencing `categories.category_id` | `4` |
| `issue_type` | VARCHAR(150) | NO | Specific business issue description | `VPN connection issue` |
| `department_id` | INT | NO | FK referencing requester's `departments.department_id` | `2` |
| `team_id` | INT | NO | FK referencing assigned support `teams.team_id` | `3` |
| `agent_id` | INT | YES | FK referencing assigned `agents.agent_id` (NULL if unassigned) | `1` |
| `sla_rule_id` | INT | NO | FK referencing applicable `sla_rules.sla_rule_id` | `2` |
| `satisfaction_rating` | TINYINT | YES | Requester CSAT score (1–5 integer, nullable) | `5` |
| `resolution_time_hours`| DECIMAL(8,2)| YES | Elapsed calendar hours between created_at and resolved_at | `5.40` |

### B. `departments`
| Column Name | Data Type | Nullable | Description |
|---|---|---|---|
| `department_id` | INT | NO | Primary key |
| `department_name` | VARCHAR(100) | NO | Business department name |

### C. `teams`
| Column Name | Data Type | Nullable | Description |
|---|---|---|---|
| `team_id` | INT | NO | Primary key |
| `team_name` | VARCHAR(100) | NO | Support team name |
| `department_id` | INT | NO | FK referencing `departments.department_id` |

### D. `agents`
| Column Name | Data Type | Nullable | Description |
|---|---|---|---|
| `agent_id` | INT | NO | Primary key |
| `agent_code` | VARCHAR(20) | NO | Unique agent badge identifier (`AGT-001`) |
| `agent_name` | VARCHAR(100) | NO | Full name of support specialist |
| `team_id` | INT | NO | FK referencing `teams.team_id` |
| `experience_band` | ENUM | NO | Seniority band (`Junior`, `Mid-level`, `Senior`) |

### E. `categories`
| Column Name | Data Type | Nullable | Description |
|---|---|---|---|
| `category_id` | INT | NO | Primary key |
| `category_name` | VARCHAR(100) | NO | High-level category |
| `subcategory_name` | VARCHAR(150) | NO | Detailed subcategory |

### F. `sla_rules`
| Column Name | Data Type | Nullable | Description |
|---|---|---|---|
| `sla_rule_id` | INT | NO | Primary key |
| `priority` | ENUM | NO | Priority tier |
| `target_resolution_hours`| DECIMAL(6,2)| NO | Target resolution window in calendar hours |
