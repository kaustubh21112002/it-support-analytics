import assert from 'node:assert/strict';
import { createServer } from 'vite';

async function runRegressionTests() {
  console.log('===============================================================');
  console.log(' Running Analytics Regression & Business Logic Tests');
  console.log('===============================================================\n');

  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  try {
    const norm = await server.ssrLoadModule('/src/services/dataNormalizer.ts');

    // Governed reference dimensions
    const categories = [
      { category_id: 1, category_name: 'Hardware' },
      { category_id: 2, category_name: 'Software' },
      { category_id: 3, category_name: 'Access & Identity' },
      { category_id: 4, category_name: 'Network' },
      { category_id: 5, category_name: 'Communication' },
      { category_id: 6, category_name: 'Cloud & Infrastructure' }
    ];

    const departments = [
      { department_id: 1, department_name: 'Corporate IT' },
      { department_id: 2, department_name: 'Engineering & Tech' },
      { department_id: 3, department_name: 'Finance & Accounting' },
      { department_id: 4, department_name: 'HR & Workplace' },
      { department_id: 5, department_name: 'Sales & Customer Operations' }
    ];

    const slaRules = [
      { sla_rule_id: 1, priority: 'Critical', target_resolution_hours: 4 },
      { sla_rule_id: 2, priority: 'High', target_resolution_hours: 8 },
      { sla_rule_id: 3, priority: 'Medium', target_resolution_hours: 24 },
      { sla_rule_id: 4, priority: 'Low', target_resolution_hours: 72 }
    ];

    const teams = [
      { team_id: 1, team_name: 'Service Desk Tier 1', department_id: 1 },
      { team_id: 2, team_name: 'Infrastructure & Cloud', department_id: 1 }
    ];

    // =========================================================================
    // Test 1: Monthly Trends (Deterministic Timestamps, Filters & 12-Month Array)
    // =========================================================================
    console.log('Test 1: Monthly Trends (Deterministic Timestamps & Contract)...');

    const trendFixture = [
      // Jan 2024: Dept 1, Critical, Created & Resolved (5.0 hrs)
      {
        ticket_id: 'TKT-M-01',
        created_at: '2024-01-10T09:00:00Z',
        resolved_at: '2024-01-10T14:00:00Z',
        status: 'Resolved',
        priority: 'Critical',
        department_id: 1,
        category_id: 1,
        team_id: 1,
        agent_id: 1,
        sla_rule_id: 1,
        resolution_time_hours: 5.0
      },
      // Jan 2024: Dept 2, High, Created only (Open)
      {
        ticket_id: 'TKT-M-02',
        created_at: '2024-01-20T10:00:00Z',
        resolved_at: null,
        status: 'Open',
        priority: 'High',
        department_id: 2,
        category_id: 2,
        team_id: 1,
        agent_id: null,
        sla_rule_id: 2,
        resolution_time_hours: null
      },
      // Feb 2024: Dept 1, High, Created Jan, Resolved Feb (24.0 hrs)
      {
        ticket_id: 'TKT-M-03',
        created_at: '2024-01-31T20:00:00Z',
        resolved_at: '2024-02-01T20:00:00Z',
        status: 'Closed',
        priority: 'High',
        department_id: 1,
        category_id: 1,
        team_id: 1,
        agent_id: 1,
        sla_rule_id: 2,
        resolution_time_hours: 24.0
      },
      // Dec 2024: Dept 1, Critical, Created Dec, Resolved Dec (2.0 hrs)
      {
        ticket_id: 'TKT-M-04',
        created_at: '2024-12-15T08:00:00Z',
        resolved_at: '2024-12-15T10:00:00Z',
        status: 'Resolved',
        priority: 'Critical',
        department_id: 1,
        category_id: 1,
        team_id: 1,
        agent_id: 1,
        sla_rule_id: 1,
        resolution_time_hours: 2.0
      }
    ];

    // 1a. Unfiltered trend
    const unfilteredTrend = norm.computeLiveMonthlyTrend(trendFixture);
    assert.equal(unfilteredTrend.length, 12, 'Must contain exactly 12 calendar months');
    assert.equal(unfilteredTrend[0].month, 'Jan');
    assert.equal(unfilteredTrend[0].fullMonth, '2024-01');
    assert.equal(unfilteredTrend[0].created, 3, 'Jan created: TKT-M-01, TKT-M-02, TKT-M-03');
    assert.equal(unfilteredTrend[0].resolved, 1, 'Jan resolved: TKT-M-01');
    assert.equal(unfilteredTrend[0].avgResolutionHours, 5.0);

    assert.equal(unfilteredTrend[1].month, 'Feb');
    assert.equal(unfilteredTrend[1].created, 0, 'Feb created: 0');
    assert.equal(unfilteredTrend[1].resolved, 1, 'Feb resolved: TKT-M-03');
    assert.equal(unfilteredTrend[1].avgResolutionHours, 24.0);

    // Empty month check (e.g. Mar)
    assert.equal(unfilteredTrend[2].month, 'Mar');
    assert.equal(unfilteredTrend[2].created, 0);
    assert.equal(unfilteredTrend[2].resolved, 0);
    assert.equal(unfilteredTrend[2].avgResolutionHours, 0);

    assert.equal(unfilteredTrend[11].month, 'Dec');
    assert.equal(unfilteredTrend[11].created, 1);
    assert.equal(unfilteredTrend[11].resolved, 1);
    assert.equal(unfilteredTrend[11].avgResolutionHours, 2.0);

    // 1b. Department Filter (department_id = 2)
    const dept2Trend = norm.computeLiveMonthlyTrend(trendFixture, 2);
    assert.equal(dept2Trend[0].created, 1, 'Dept 2 in Jan: TKT-M-02 only');
    assert.equal(dept2Trend[0].resolved, 0);
    assert.equal(dept2Trend[1].resolved, 0);

    // 1c. Priority Filter (priority = 'Critical')
    const critTrend = norm.computeLiveMonthlyTrend(trendFixture, undefined, 'Critical');
    assert.equal(critTrend[0].created, 1, 'Critical Jan created: TKT-M-01');
    assert.equal(critTrend[0].resolved, 1, 'Critical Jan resolved: TKT-M-01');
    assert.equal(critTrend[1].resolved, 0, 'Critical Feb resolved: 0');
    assert.equal(critTrend[11].created, 1, 'Critical Dec created: TKT-M-04');

    console.log('  -> PASS: Correct month assignment, filter isolation & empty month contract.\n');

    // =========================================================================
    // Test 2: Resolution Distribution (Boundaries, Null Safety & Reconciliations)
    // =========================================================================
    console.log('Test 2: Resolution Distribution (Exact Boundaries & Null Safety)...');

    const distributionFixture = [
      // Boundary 1: < 4 hours (e.g. 0.5, 3.99)
      { ticket_id: 'D-01', status: 'Resolved', resolution_time_hours: 0.5, priority: 'Low', department_id: 1 },
      { ticket_id: 'D-02', status: 'Resolved', resolution_time_hours: 3.99, priority: 'Low', department_id: 1 },

      // Boundary 2: 4 - 8 hours (e.g. 4.0, 8.0)
      { ticket_id: 'D-03', status: 'Resolved', resolution_time_hours: 4.0, priority: 'Medium', department_id: 1 },
      { ticket_id: 'D-04', status: 'Resolved', resolution_time_hours: 8.0, priority: 'Medium', department_id: 1 },

      // Boundary 3: 8 - 24 hours (e.g. 8.01, 24.0)
      { ticket_id: 'D-05', status: 'Resolved', resolution_time_hours: 8.01, priority: 'High', department_id: 1 },
      { ticket_id: 'D-06', status: 'Closed', resolution_time_hours: 24.0, priority: 'High', department_id: 1 },

      // Boundary 4: 24 - 72 hours (e.g. 24.01, 72.0)
      { ticket_id: 'D-07', status: 'Resolved', resolution_time_hours: 24.01, priority: 'Critical', department_id: 1 },
      { ticket_id: 'D-08', status: 'Closed', resolution_time_hours: 72.0, priority: 'Critical', department_id: 1 },

      // Boundary 5: > 72 hours (e.g. 72.01, 150.0)
      { ticket_id: 'D-09', status: 'Resolved', resolution_time_hours: 72.01, priority: 'Critical', department_id: 2 },
      { ticket_id: 'D-10', status: 'Resolved', resolution_time_hours: 150.0, priority: 'Critical', department_id: 2 },

      // Non-eligible / edge-case tickets
      { ticket_id: 'D-OPEN', status: 'Open', resolution_time_hours: null, priority: 'High', department_id: 1 },
      { ticket_id: 'D-NULL-HRS', status: 'Resolved', resolution_time_hours: null, priority: 'High', department_id: 1 } // Resolved but unrecorded duration
    ];

    const distResult = norm.computeLiveResolutionDistribution(distributionFixture);
    assert.equal(distResult.totalResolved, 10, 'Must only include resolved tickets with valid hours');

    const [b1, b2, b3, b4, b5] = distResult.distribution;
    assert.equal(b1.range, '< 4 hours');
    assert.equal(b1.count, 2, 'D-01 (0.5h) and D-02 (3.99h)');
    assert.equal(b1.share, 20.0);

    assert.equal(b2.range, '4 - 8 hours');
    assert.equal(b2.count, 2, 'D-03 (4.0h) and D-04 (8.0h)');
    assert.equal(b2.share, 20.0);

    assert.equal(b3.range, '8 - 24 hours');
    assert.equal(b3.count, 2, 'D-05 (8.01h) and D-06 (24.0h)');
    assert.equal(b3.share, 20.0);

    assert.equal(b4.range, '24 - 72 hours');
    assert.equal(b4.count, 2, 'D-07 (24.01h) and D-08 (72.0h)');
    assert.equal(b4.share, 20.0);

    assert.equal(b5.range, '> 72 hours');
    assert.equal(b5.count, 2, 'D-09 (72.01h) and D-10 (150.0h)');
    assert.equal(b5.share, 20.0);

    // Sum of bucket counts must reconcile with totalResolved
    const sumBuckets = b1.count + b2.count + b3.count + b4.count + b5.count;
    assert.equal(sumBuckets, distResult.totalResolved);

    // Same-day rate: (< 4h + 4-8h) = 4 / 10 = 40.0%
    assert.equal(distResult.sameDayRate, 40.0);

    // Filter check: Dept 2 only
    const dept2Dist = norm.computeLiveResolutionDistribution(distributionFixture, 2);
    assert.equal(dept2Dist.totalResolved, 2);
    assert.equal(dept2Dist.distribution[4].count, 2, 'D-09 and D-10 in > 72 hours');
    assert.equal(dept2Dist.sameDayRate, 0);

    console.log('  -> PASS: Boundary assignments (<4, 4-8, 8-24, 24-72, >72) & null preservation verified.\n');

    // =========================================================================
    // Test 3: Recurring Issues (Ranking, Tie-Breaking & Breach Rates)
    // =========================================================================
    console.log('Test 3: Recurring Issues (Ranking, Tie-Breaking & SLA Rates)...');

    const issuesFixture = [
      // "VPN Timeout": 3 tickets, all resolved. 2 compliant (5h, 6h), 1 breached (12h > 8h High target)
      { ticket_id: 'I-01', issue_type: 'VPN Timeout', category_id: 4, sla_rule_id: 2, status: 'Resolved', resolution_time_hours: 5.0 },
      { ticket_id: 'I-02', issue_type: 'VPN Timeout', category_id: 4, sla_rule_id: 2, status: 'Resolved', resolution_time_hours: 6.0 },
      { ticket_id: 'I-03', issue_type: 'VPN Timeout', category_id: 4, sla_rule_id: 2, status: 'Closed', resolution_time_hours: 12.0 },

      // "Battery Failure": 3 tickets (TIED with VPN Timeout!). 1 resolved (10h, breached > 4h Critical), 2 open.
      { ticket_id: 'I-04', issue_type: 'Battery Failure', category_id: 1, sla_rule_id: 1, status: 'Resolved', resolution_time_hours: 10.0 },
      { ticket_id: 'I-05', issue_type: 'Battery Failure', category_id: 1, sla_rule_id: 1, status: 'Open', resolution_time_hours: null },
      { ticket_id: 'I-06', issue_type: 'Battery Failure', category_id: 1, sla_rule_id: 1, status: 'In Progress', resolution_time_hours: null },

      // "Password Reset": 2 tickets. Both resolved in 1.0h, compliant with Critical (4h).
      { ticket_id: 'I-07', issue_type: 'Password Reset', category_id: 3, sla_rule_id: 1, status: 'Resolved', resolution_time_hours: 1.0 },
      { ticket_id: 'I-08', issue_type: 'Password Reset', category_id: 3, sla_rule_id: 1, status: 'Resolved', resolution_time_hours: 1.0 },

      // "Cloud Bucket 403": 1 ticket, open only (no resolved records).
      { ticket_id: 'I-09', issue_type: 'Cloud Bucket 403', category_id: 6, sla_rule_id: 1, status: 'Open', resolution_time_hours: null }
    ];

    const topIssues = norm.computeLiveTopIssues(issuesFixture, categories, slaRules);
    assert.equal(topIssues.length, 4);

    // Tie-breaker verification: "Battery Failure" and "VPN Timeout" both have frequency 3.
    // Alphabetical secondary sort places "Battery Failure" before "VPN Timeout".
    assert.equal(topIssues[0].issue, 'Battery Failure');
    assert.equal(topIssues[0].frequency, 3);
    assert.equal(topIssues[0].category, 'Hardware');
    assert.equal(topIssues[0].avgResolutionHours, 10.0, 'Only resolved ticket counted');
    assert.equal(topIssues[0].breachRatePct, 100.0, '1 of 1 resolved breached');

    assert.equal(topIssues[1].issue, 'VPN Timeout');
    assert.equal(topIssues[1].frequency, 3);
    assert.equal(topIssues[1].category, 'Network');
    // Avg turnaround: (5 + 6 + 12) / 3 = 23 / 3 = 7.7 hrs
    assert.equal(topIssues[1].avgResolutionHours, 7.7);
    // Breach rate: 1 breached out of 3 = 33.3%
    assert.equal(topIssues[1].breachRatePct, 33.3);

    assert.equal(topIssues[2].issue, 'Password Reset');
    assert.equal(topIssues[2].frequency, 2);
    assert.equal(topIssues[2].avgResolutionHours, 1.0);
    assert.equal(topIssues[2].breachRatePct, 0.0);

    assert.equal(topIssues[3].issue, 'Cloud Bucket 403');
    assert.equal(topIssues[3].frequency, 1);
    assert.equal(topIssues[3].avgResolutionHours, 0, 'No resolved records must yield 0, not NaN');
    assert.equal(topIssues[3].breachRatePct, 0, 'No resolved records must yield 0, not NaN');

    console.log('  -> PASS: Frequency ranking, deterministic tie-breaking & SLA eligibility verified.\n');

    // =========================================================================
    // Test 4: Summary Metrics & Breakdown Reconciliations
    // =========================================================================
    console.log('Test 4: Summary Metrics & Breakdown Reconciliation Rules...');

    const summaryFixture = [
      // 2 Open, 1 In Progress, 1 Pending (Total Open Backlog = 4)
      { ticket_id: 'S-01', status: 'Open', priority: 'Critical', category_id: 1, department_id: 1, sla_rule_id: 1, resolution_time_hours: null },
      { ticket_id: 'S-02', status: 'Open', priority: 'High', category_id: 1, department_id: 1, sla_rule_id: 2, resolution_time_hours: null },
      { ticket_id: 'S-03', status: 'In Progress', priority: 'Medium', category_id: 2, department_id: 1, sla_rule_id: 3, resolution_time_hours: null },
      { ticket_id: 'S-04', status: 'Pending', priority: 'Low', category_id: 3, department_id: 2, sla_rule_id: 4, resolution_time_hours: null },

      // 3 Resolved, 1 Closed (Total Resolved = 4)
      // S-05: Critical (target 4h), took 3.0h -> Compliant
      { ticket_id: 'S-05', status: 'Resolved', priority: 'Critical', category_id: 1, department_id: 1, sla_rule_id: 1, resolution_time_hours: 3.0 },
      // S-06: Critical (target 4h), took 6.0h -> Breached
      { ticket_id: 'S-06', status: 'Resolved', priority: 'Critical', category_id: 2, department_id: 1, sla_rule_id: 1, resolution_time_hours: 6.0 },
      // S-07: High (target 8h), took 8.0h -> Compliant
      { ticket_id: 'S-07', status: 'Resolved', priority: 'High', category_id: 3, department_id: 1, sla_rule_id: 2, resolution_time_hours: 8.0 },
      // S-08: Medium (target 24h), took 12.0h -> Compliant
      { ticket_id: 'S-08', status: 'Closed', priority: 'Medium', category_id: 4, department_id: 2, sla_rule_id: 3, resolution_time_hours: 12.0 }
    ];

    const metrics = norm.computeLiveSummaryMetrics(summaryFixture, slaRules);
    assert.equal(metrics.totalTickets, 8);
    assert.equal(metrics.openTickets, 4);
    assert.equal(metrics.openBreakdown.open, 2);
    assert.equal(metrics.openBreakdown.inProgress, 1);
    assert.equal(metrics.openBreakdown.pending, 1);
    assert.equal(metrics.resolvedTickets, 4);
    assert.equal(metrics.resolvedBreakdown.resolved, 3);
    assert.equal(metrics.resolvedBreakdown.closed, 1);

    // Reconcile total: open + resolved === total
    assert.equal(metrics.openTickets + metrics.resolvedTickets, metrics.totalTickets);

    // Turnaround: hours are [3, 6, 8, 12] -> sum = 29 / 4 = 7.25 -> 7.3
    assert.equal(metrics.avgResolutionHours, 7.3);
    // Median of [3, 6, 8, 12] -> (6 + 8) / 2 = 7.0
    assert.equal(metrics.medianResolutionHours, 7.0);

    // SLA: Compliant = 3 (S-05, S-07, S-08), Breached = 1 (S-06)
    assert.equal(metrics.slaCompliantCount, 3);
    assert.equal(metrics.slaBreachedCount, 1);
    assert.equal(metrics.slaCompliantCount + metrics.slaBreachedCount, metrics.resolvedTickets);
    assert.equal(metrics.slaCompliancePct, 75.0);
    assert.equal(metrics.slaBreachPct, 25.0);
    assert.equal(metrics.slaCompliancePct + metrics.slaBreachPct, 100.0);

    // Priority breakdown reconciliation
    const priorityBreakdown = norm.computeLivePriorityBreakdown(summaryFixture, slaRules);
    assert.equal(priorityBreakdown.length, 4);
    const crit = priorityBreakdown.find(p => p.priority === 'Critical');
    assert.equal(crit.resolvedTotal, 2);
    assert.equal(crit.compliantCount, 1);
    assert.equal(crit.breachedCount, 1);
    assert.equal(crit.compliancePct, 50.0);

    // Category breakdown reconciliation
    const catBreakdown = norm.computeLiveCategoryBreakdown(summaryFixture, categories, slaRules);
    assert.equal(catBreakdown.length, 6);
    const totalCatTickets = catBreakdown.reduce((sum, c) => sum + c.count, 0);
    assert.equal(totalCatTickets, 8, 'Sum of category counts must equal total tickets');

    console.log('  -> PASS: Summary metrics and breakdown reconciliations match business rules.\n');

    // =========================================================================
    // Test 5: Empty Datasets & Optional Missing Data Safety
    // =========================================================================
    console.log('Test 5: Empty Datasets & Null Field Robustness...');

    // 5a. Empty dataset checks
    const emptyMetrics = norm.computeLiveSummaryMetrics([], slaRules);
    assert.equal(emptyMetrics.totalTickets, 0);
    assert.equal(emptyMetrics.openTickets, 0);
    assert.equal(emptyMetrics.resolvedTickets, 0);
    assert.equal(emptyMetrics.avgResolutionHours, 0);
    assert.equal(emptyMetrics.medianResolutionHours, 0);
    assert.equal(emptyMetrics.slaCompliancePct, 0);
    assert.equal(emptyMetrics.slaBreachPct, 0);
    assert.equal(emptyMetrics.slaCompliantCount, 0);
    assert.equal(emptyMetrics.slaBreachedCount, 0);

    const emptyTrends = norm.computeLiveMonthlyTrend([]);
    assert.equal(emptyTrends.length, 12);
    assert.equal(emptyTrends.every(m => m.created === 0 && m.resolved === 0 && m.avgResolutionHours === 0), true);

    const emptyDist = norm.computeLiveResolutionDistribution([]);
    assert.equal(emptyDist.totalResolved, 0);
    assert.equal(emptyDist.sameDayRate, 0);
    assert.equal(emptyDist.distribution.length, 5);
    assert.equal(emptyDist.distribution.every(b => b.count === 0 && b.share === 0), true);

    const emptyIssues = norm.computeLiveTopIssues([], categories, slaRules);
    assert.deepEqual(emptyIssues, []);

    const emptyPriorities = norm.computeLivePriorityBreakdown([], slaRules);
    assert.equal(emptyPriorities.length, 4);
    assert.equal(emptyPriorities.every(p => p.resolvedTotal === 0 && p.compliantCount === 0 && p.compliancePct === 0), true);

    const emptyCategories = norm.computeLiveCategoryBreakdown([], categories, slaRules);
    assert.equal(emptyCategories.length, 6);
    assert.equal(emptyCategories.every(c => c.count === 0 && c.sharePct === 0), true);

    const emptyDepts = norm.computeLiveDepartmentBreakdown([], departments);
    assert.equal(emptyDepts.length, 5);
    assert.equal(emptyDepts.every(d => d.ticketCount === 0 && d.avgResolutionHours === 0 && d.avgCsat === 0), true);

    const emptyTeams = norm.computeLiveTeamBreakdown([], teams, departments, slaRules);
    assert.equal(emptyTeams.length, 2);
    assert.equal(emptyTeams.every(t => t.totalTickets === 0 && t.openBacklog === 0 && t.avgResolutionHours === 0 && t.slaCompliancePct === 0), true);

    // 5b. Missing optional fields
    const ticketsWithMissingFields = [
      {
        ticket_id: 'OPT-01',
        created_at: '2024-05-01T10:00:00Z',
        resolved_at: '2024-05-01T12:00:00Z',
        status: 'Resolved',
        priority: 'High',
        category_id: 1,
        department_id: 1,
        team_id: 1,
        agent_id: null, // missing agent
        sla_rule_id: 2,
        satisfaction_rating: null, // missing CSAT
        resolution_time_hours: 2.0 // valid hours
      },
      {
        ticket_id: 'OPT-02',
        created_at: '2024-05-02T10:00:00Z',
        resolved_at: '2024-05-02T14:00:00Z',
        status: 'Resolved',
        priority: 'High',
        category_id: 1,
        department_id: 1,
        team_id: 1,
        agent_id: 1,
        sla_rule_id: 2,
        satisfaction_rating: null, // missing CSAT
        resolution_time_hours: null // missing resolution hours
      }
    ];

    const deptWithMissing = norm.computeLiveDepartmentBreakdown(ticketsWithMissingFields, departments);
    assert.equal(deptWithMissing[0].avgCsat, 0, 'No ratings must yield 0 CSAT, never fabricated 4.2');
    assert.equal(deptWithMissing[0].avgResolutionHours, 2.0, 'Must only average recorded hours (OPT-01)');

    console.log('  -> PASS: Zero-data safety and missing optional field resilience verified.\n');

    // =========================================================================
    // Test 6: Actionable Exceptions (Breached & At-Risk Prioritization)
    // =========================================================================
    console.log('Test 6: Actionable Exceptions (Breached & At-Risk Prioritization)...');

    const exceptionsFixture = [
      // Breached ticket 1: Critical (4h target), took 10.0h -> +6.0h variance
      {
        ticket_id: 'EX-01',
        issue_type: 'Prod DB Outage',
        priority: 'Critical',
        department_id: 1,
        sla_rule_id: 1,
        status: 'Resolved',
        resolution_time_hours: 10.0
      },
      // Compliant ticket: Critical (4h target), took 2.0h -> Must NOT be in exceptions
      {
        ticket_id: 'EX-COMPLIANT',
        issue_type: 'Minor Cache Reset',
        priority: 'Critical',
        department_id: 1,
        sla_rule_id: 1,
        status: 'Resolved',
        resolution_time_hours: 2.0
      },
      // Breached ticket 2: High (8h target), took 12.0h -> +4.0h variance
      {
        ticket_id: 'EX-02',
        issue_type: 'VPN Gateway Timeout',
        priority: 'High',
        department_id: 2,
        sla_rule_id: 2,
        status: 'Closed',
        resolution_time_hours: 12.0
      },
      // At-risk open ticket: Critical (4h target), open
      {
        ticket_id: 'EX-03',
        issue_type: 'Firewall Rule Block',
        priority: 'Critical',
        department_id: 1,
        sla_rule_id: 1,
        status: 'Open',
        resolution_time_hours: null
      }
    ];

    const exceptionsResult = norm.computeLiveActionableExceptions(
      exceptionsFixture,
      departments,
      slaRules,
      undefined,
      undefined,
      5
    );

    assert.equal(exceptionsResult.length, 3, 'Must include 2 breached + 1 open at-risk, excluding compliant');
    
    // First should be the most severely breached: EX-01 (+6h)
    assert.equal(exceptionsResult[0].ticket_id, 'EX-01');
    assert.equal(exceptionsResult[0].exception_type, 'breached');
    assert.equal(exceptionsResult[0].variance_hours, 6.0);
    assert.equal(exceptionsResult[0].department_name, 'Corporate IT');

    // Second should be EX-02 (+4h)
    assert.equal(exceptionsResult[1].ticket_id, 'EX-02');
    assert.equal(exceptionsResult[1].exception_type, 'breached');
    assert.equal(exceptionsResult[1].variance_hours, 4.0);
    assert.equal(exceptionsResult[1].department_name, 'Engineering & Tech');

    // Third should be open at-risk: EX-03
    assert.equal(exceptionsResult[2].ticket_id, 'EX-03');
    assert.equal(exceptionsResult[2].exception_type, 'at_risk');
    assert.ok(exceptionsResult[2].variance_hours < 0, 'At-risk must have negative variance (hours remaining)');

    // Filter check: Department 2 only
    const dept2Exceptions = norm.computeLiveActionableExceptions(
      exceptionsFixture,
      departments,
      slaRules,
      2
    );
    assert.equal(dept2Exceptions.length, 1);
    assert.equal(dept2Exceptions[0].ticket_id, 'EX-02');

    // Empty dataset safety
    const emptyExceptions = norm.computeLiveActionableExceptions([], departments, slaRules);
    assert.deepEqual(emptyExceptions, []);

    console.log('  -> PASS: Breached ranking, at-risk isolation, and compliant exclusion verified.\n');

    // =========================================================================
    // Test 7: Recurring Issues Analysis (Grouping, Filters, Longitudinal Trends)
    // =========================================================================
    console.log('Test 7: Recurring Issues Analysis (Grouping, Filters & Breakdowns)...');

    const recurringAnalysis = norm.computeLiveRecurringIssuesAnalysis(
      issuesFixture,
      categories,
      departments,
      slaRules
    );

    assert.equal(recurringAnalysis.totalIncidents, issuesFixture.length);
    assert.equal(recurringAnalysis.uniqueIssueCount, 4);
    assert.equal(recurringAnalysis.highestVolumeIssue, 'Battery Failure');
    assert.ok(recurringAnalysis.topTrendSeries.length === 12, 'Must yield 12 monthly trend buckets');

    const batteryDetail = recurringAnalysis.issues.find(i => i.issue === 'Battery Failure');
    assert.ok(batteryDetail, 'Battery Failure must be in issues register');
    assert.equal(batteryDetail.frequency, 3);
    assert.equal(batteryDetail.activeCount, 2);
    assert.equal(batteryDetail.resolvedCount, 1);
    assert.equal(batteryDetail.breachRatePct, 100.0);
    assert.equal(batteryDetail.slaCompliancePct, 0.0);

    // Filter check: Category 4 only (VPN Timeout)
    const cat4Analysis = norm.computeLiveRecurringIssuesAnalysis(
      issuesFixture,
      categories,
      departments,
      slaRules,
      { categoryId: 4 }
    );
    assert.equal(cat4Analysis.totalIncidents, 3);
    assert.equal(cat4Analysis.issues.length, 1);
    assert.equal(cat4Analysis.issues[0].issue, 'VPN Timeout');
    assert.equal(cat4Analysis.issues[0].slaCompliancePct, 66.7); // 2 out of 3 compliant

    console.log('  -> PASS: Recurring issue grouping, monthly trend series, and category filter verified.\n');

    console.log('===============================================================');
    console.log(' ALL 7 ANALYTICS REGRESSION TEST SUITES PASSED PERFECTLY!');
    console.log('===============================================================\n');

  } finally {
    await server.close();
  }
}

runRegressionTests().catch(err => {
  console.error('[ANALYTICS REGRESSION TEST FAILED]', err);
  process.exit(1);
});
