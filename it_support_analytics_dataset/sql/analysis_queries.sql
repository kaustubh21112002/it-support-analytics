-- =====================================================================
-- IT Support Ticket Analysis and Service Performance Dashboard
-- Analytical Queries for KPI Calculation & Reporting
-- =====================================================================

-- 1. Executive Summary KPIs
SELECT 
    COUNT(*) AS total_tickets,
    SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) AS open_tickets,
    SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_tickets,
    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_tickets,
    SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS resolved_or_closed_tickets,
    ROUND(AVG(CASE WHEN status IN ('Resolved', 'Closed') THEN resolution_time_hours END), 2) AS avg_resolution_time_hours,
    ROUND(
        SUM(CASE WHEN status IN ('Resolved', 'Closed') AND resolution_time_hours <= s.target_resolution_hours THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END), 0), 
        2
    ) AS sla_compliance_pct,
    ROUND(
        SUM(CASE WHEN status IN ('Resolved', 'Closed') AND resolution_time_hours > s.target_resolution_hours THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END), 0), 
        2
    ) AS sla_breach_pct
FROM tickets t
JOIN sla_rules s ON t.sla_rule_id = s.sla_rule_id;

-- 2. Monthly Ticket Volume & Resolution Trends
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') AS ticket_month,
    COUNT(*) AS tickets_created,
    SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS tickets_resolved,
    ROUND(AVG(CASE WHEN status IN ('Resolved', 'Closed') THEN resolution_time_hours END), 2) AS avg_resolution_hours
FROM tickets
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY ticket_month ASC;

-- 3. SLA Performance by Priority
SELECT 
    s.priority,
    s.target_resolution_hours,
    COUNT(t.ticket_id) AS total_resolved_tickets,
    SUM(CASE WHEN t.resolution_time_hours <= s.target_resolution_hours THEN 1 ELSE 0 END) AS sla_compliant_count,
    SUM(CASE WHEN t.resolution_time_hours > s.target_resolution_hours THEN 1 ELSE 0 END) AS sla_breached_count,
    ROUND(
        SUM(CASE WHEN t.resolution_time_hours <= s.target_resolution_hours THEN 1 ELSE 0 END) * 100.0 / COUNT(t.ticket_id),
        2
    ) AS compliance_rate_pct
FROM tickets t
JOIN sla_rules s ON t.sla_rule_id = s.sla_rule_id
WHERE t.status IN ('Resolved', 'Closed')
GROUP BY s.priority, s.target_resolution_hours
ORDER BY s.target_resolution_hours ASC;

-- 4. Top 10 Recurring Issues
SELECT 
    t.issue_type,
    c.category_name,
    COUNT(*) AS issue_frequency,
    ROUND(AVG(CASE WHEN t.status IN ('Resolved', 'Closed') THEN t.resolution_time_hours END), 2) AS avg_resolution_hours,
    ROUND(
        SUM(CASE WHEN t.status IN ('Resolved', 'Closed') AND t.resolution_time_hours > s.target_resolution_hours THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(SUM(CASE WHEN t.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END), 0),
        2
    ) AS breach_rate_pct
FROM tickets t
JOIN categories c ON t.category_id = c.category_id
JOIN sla_rules s ON t.sla_rule_id = s.sla_rule_id
GROUP BY t.issue_type, c.category_name
ORDER BY issue_frequency DESC
LIMIT 10;

-- 5. Team Workload & Resolution Efficiency
SELECT 
    tm.team_name,
    d.department_name,
    COUNT(t.ticket_id) AS total_assigned_tickets,
    SUM(CASE WHEN t.status IN ('Open', 'In Progress', 'Pending') THEN 1 ELSE 0 END) AS current_backlog,
    ROUND(AVG(CASE WHEN t.status IN ('Resolved', 'Closed') THEN t.resolution_time_hours END), 2) AS avg_resolution_hours,
    ROUND(
        SUM(CASE WHEN t.status IN ('Resolved', 'Closed') AND t.resolution_time_hours <= s.target_resolution_hours THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(SUM(CASE WHEN t.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END), 0),
        2
    ) AS sla_compliance_pct
FROM teams tm
JOIN departments d ON tm.department_id = d.department_id
LEFT JOIN tickets t ON tm.team_id = t.team_id
LEFT JOIN sla_rules s ON t.sla_rule_id = s.sla_rule_id
GROUP BY tm.team_name, d.department_name
ORDER BY total_assigned_tickets DESC;

-- 6. Department Analysis
SELECT 
    d.department_name,
    COUNT(t.ticket_id) AS total_tickets,
    ROUND(AVG(CASE WHEN t.status IN ('Resolved', 'Closed') THEN t.resolution_time_hours END), 2) AS avg_resolution_hours,
    ROUND(AVG(t.satisfaction_rating), 2) AS avg_satisfaction_rating
FROM departments d
LEFT JOIN tickets t ON d.department_id = t.department_id
GROUP BY d.department_name
ORDER BY total_tickets DESC;
