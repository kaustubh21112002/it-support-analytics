import assert from 'node:assert/strict';
import { createServer } from 'vite';

async function runFilterSyncTests() {
  console.log('===============================================================');
  console.log(' Running Phase 2: Analytics Filter Synchronization & KPI Tests');
  console.log('===============================================================\n');

  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  try {
    const {
      parseDepartmentParam,
      parsePriorityParam,
      parseStatusParam,
      parseSlaParam,
      parseDateRangeParam,
      parseSearchParam,
      buildFilterQueryString
    } = await server.ssrLoadModule('/src/lib/urlFilters.ts');

    const { dataService } = await server.ssrLoadModule('/src/services/dataService.ts');

    let totalAssertions = 0;

    // =========================================================================
    // Test 1: URL Parameter Parsing & Safe Sanitization
    // =========================================================================
    console.log('Test 1: URL Parameter Parsing & Safe Sanitization...');

    // Department parsing
    assert.equal(parseDepartmentParam('1'), '1');
    assert.equal(parseDepartmentParam('5'), '5');
    assert.equal(parseDepartmentParam('0'), 'All');
    assert.equal(parseDepartmentParam('6'), 'All');
    assert.equal(parseDepartmentParam('All'), 'All');
    assert.equal(parseDepartmentParam('all'), 'All');
    assert.equal(parseDepartmentParam('invalid'), 'All');
    assert.equal(parseDepartmentParam(null), 'All');
    assert.equal(parseDepartmentParam(undefined), 'All');
    totalAssertions += 9;

    // Priority parsing
    assert.equal(parsePriorityParam('Critical'), 'Critical');
    assert.equal(parsePriorityParam('high'), 'High');
    assert.equal(parsePriorityParam('MEDIUM'), 'Medium');
    assert.equal(parsePriorityParam('low'), 'Low');
    assert.equal(parsePriorityParam('All'), 'All');
    assert.equal(parsePriorityParam('Urgent'), 'All');
    assert.equal(parsePriorityParam(null), 'All');
    totalAssertions += 7;

    // Status parsing (including aggregates)
    assert.equal(parseStatusParam('Active Backlog'), 'Active Backlog');
    assert.equal(parseStatusParam('active backlog'), 'Active Backlog');
    assert.equal(parseStatusParam('active_backlog'), 'Active Backlog');
    assert.equal(parseStatusParam('backlog'), 'Active Backlog');
    assert.equal(parseStatusParam('Resolved Outcomes'), 'Resolved Outcomes');
    assert.equal(parseStatusParam('resolved outcomes'), 'Resolved Outcomes');
    assert.equal(parseStatusParam('resolved_outcomes'), 'Resolved Outcomes');
    assert.equal(parseStatusParam('Open'), 'Open');
    assert.equal(parseStatusParam('in progress'), 'In Progress');
    assert.equal(parseStatusParam('Pending'), 'Pending');
    assert.equal(parseStatusParam('Resolved'), 'Resolved');
    assert.equal(parseStatusParam('Closed'), 'Closed');
    assert.equal(parseStatusParam('UnknownStatus'), 'All');
    assert.equal(parseStatusParam(null), 'All');
    totalAssertions += 14;

    // SLA parsing
    assert.equal(parseSlaParam('Breached'), 'Breached');
    assert.equal(parseSlaParam('breached'), 'Breached');
    assert.equal(parseSlaParam('breach'), 'Breached');
    assert.equal(parseSlaParam('Compliant'), 'Compliant');
    assert.equal(parseSlaParam('compliant'), 'Compliant');
    assert.equal(parseSlaParam('met'), 'Compliant');
    assert.equal(parseSlaParam('At Risk'), 'At Risk');
    assert.equal(parseSlaParam('at_risk'), 'At Risk');
    assert.equal(parseSlaParam('All'), 'All');
    assert.equal(parseSlaParam('random'), 'All');
    assert.equal(parseSlaParam(null), 'All');
    totalAssertions += 11;

    // Date Range parsing
    assert.equal(parseDateRangeParam('FY 2024 (Full Year)'), 'FY 2024 (Full Year)');
    assert.equal(parseDateRangeParam('Q1 2024'), 'Q1 2024');
    assert.equal(parseDateRangeParam('Q5 2024'), 'FY 2024 (Full Year)');
    assert.equal(parseDateRangeParam(null), 'FY 2024 (Full Year)');
    totalAssertions += 4;

    // Search parsing
    assert.equal(parseSearchParam('  VPN access  '), 'VPN access');
    assert.equal(parseSearchParam('a'.repeat(150)).length, 100);
    assert.equal(parseSearchParam(null), '');
    totalAssertions += 3;

    console.log('  -> URL Parameter Parsing passed (34 assertions).\n');

    // =========================================================================
    // Test 2: Query String Serialization & Preservation
    // =========================================================================
    console.log('Test 2: Query String Serialization & Parameter Preservation...');

    const qs1 = buildFilterQueryString({ status: 'Active Backlog', priority: 'Critical' });
    assert(qs1.includes('status=Active+Backlog') && qs1.includes('priority=Critical'), 'Query string contains status and priority');

    const qs2 = buildFilterQueryString({ dept: '2', sla: 'Breached' });
    assert(qs2.includes('dept=2') && qs2.includes('sla=Breached'), 'Query string contains dept and sla');

    // Defaults should be omitted
    const qs3 = buildFilterQueryString({ dept: 'All', priority: 'All', status: 'All' });
    assert.equal(qs3, '');

    // Preserving unrelated query params
    const existing = new URLSearchParams('tab=performance&view=compact');
    const qs4 = buildFilterQueryString({ dept: '3', status: 'Resolved Outcomes' }, existing);
    assert(qs4.includes('tab=performance'), 'Preserves unrelated param "tab"');
    assert(qs4.includes('view=compact'), 'Preserves unrelated param "view"');
    assert(qs4.includes('dept=3'), 'Sets dept=3');
    assert(qs4.includes('status=Resolved+Outcomes'), 'Sets status=Resolved+Outcomes');
    totalAssertions += 7;

    console.log('  -> Query String Serialization passed (7 assertions).\n');

    // =========================================================================
    // Test 3: Governed Baseline Controlled Totals Reconciliation
    // =========================================================================
    console.log('Test 3: Governed Baseline Totals Reconciliation (Seed 42)...');

    // Hydrate live/full dataset from Supabase or full baseline
    await dataService.hydrateFromSupabase();

    const allTickets = dataService.getTickets({ limit: 8000 });
    assert.equal(allTickets.total, 8000, 'Baseline total must equal 8,000');
    totalAssertions += 1;

    // Active Backlog: exactly 1,388 (Open + In Progress + Pending)
    const activeBacklog = dataService.getTickets({ status: 'Active Backlog', limit: 8000 });
    assert.equal(activeBacklog.total, 1388, 'Active Backlog must reconcile to exactly 1,388 tickets');
    const openTickets = dataService.getTickets({ status: 'Open', limit: 8000 });
    const inProgressTickets = dataService.getTickets({ status: 'In Progress', limit: 8000 });
    const pendingTickets = dataService.getTickets({ status: 'Pending', limit: 8000 });
    assert.equal(openTickets.total, 552, 'Single Open stage must be 552');
    assert.equal(inProgressTickets.total, 523, 'Single In Progress stage must be 523');
    assert.equal(pendingTickets.total, 313, 'Single Pending stage must be 313');
    assert.equal(
      openTickets.total + inProgressTickets.total + pendingTickets.total,
      1388,
      'Active Backlog sum 552 + 523 + 313 must equal 1,388'
    );
    totalAssertions += 5;

    // Resolved Outcomes: exactly 6,612 (Resolved 4,882 + Closed 1,730)
    const resolvedOutcomes = dataService.getTickets({ status: 'Resolved Outcomes', limit: 8000 });
    assert.equal(resolvedOutcomes.total, 6612, 'Resolved Outcomes must reconcile to exactly 6,612');
    const singleResolved = dataService.getTickets({ status: 'Resolved', limit: 8000 });
    const singleClosed = dataService.getTickets({ status: 'Closed', limit: 8000 });
    assert.equal(singleResolved.total, 4882, 'Single Resolved status must be 4,882');
    assert.equal(singleClosed.total, 1730, 'Single Closed status must be 1,730');
    assert.equal(
      singleResolved.total + singleClosed.total,
      6612,
      'Resolved + Closed must sum to 6,612'
    );
    assert.equal(
      activeBacklog.total + resolvedOutcomes.total,
      8000,
      'Active Backlog (1,388) + Resolved Outcomes (6,612) must sum to 8,000'
    );
    totalAssertions += 5;

    console.log('  -> Controlled Totals passed (11 assertions).\n');

    // =========================================================================
    // Test 4: Governed SLA Compliance & Breach Reconciliation
    // =========================================================================
    console.log('Test 4: SLA Compliance & Breach Reconciliation...');

    const compliantTickets = dataService.getTickets({ sla: 'Compliant', limit: 8000 });
    assert.equal(compliantTickets.total, 5814, 'SLA Compliant must be exactly 5,814 tickets');

    const breachedTickets = dataService.getTickets({ sla: 'Breached', limit: 8000 });
    assert.equal(breachedTickets.total, 798, 'SLA Breached must be exactly 798 tickets');

    assert.equal(
      compliantTickets.total + breachedTickets.total,
      6612,
      'Compliant (5,814) + Breached (798) must equal Total Resolved Outcomes (6,612)'
    );

    const compliancePct = Math.round((compliantTickets.total / 6612) * 1000) / 10;
    assert.equal(compliancePct, 87.9, 'Retrospective SLA compliance must be exactly 87.9%');

    // At Risk Queue: Projected open tickets
    const atRiskQueue = dataService.getTickets({ sla: 'At Risk', limit: 8000 });
    assert.equal(atRiskQueue.total, 1388, 'At Risk queue encompasses all 1,388 active backlog tickets');

    // Cross-check summary metrics against getTickets result
    const summaryMetrics = dataService.getSummaryMetrics();
    assert.equal(summaryMetrics.totalTickets, 8000);
    assert.equal(summaryMetrics.openTickets, 1388);
    assert.equal(summaryMetrics.resolvedTickets, 6612);
    assert.equal(summaryMetrics.slaCompliantCount, 5814);
    assert.equal(summaryMetrics.slaBreachedCount, 798);
    assert.equal(summaryMetrics.slaCompliancePct, 87.9);
    totalAssertions += 11;

    console.log('  -> SLA Reconciliation passed (11 assertions).\n');

    // =========================================================================
    // Test 5: Multi-Dimensional Filter Reconciliation
    // =========================================================================
    console.log('Test 5: Multi-Dimensional Filter Reconciliation...');

    // Filter by Dept 1 (Corporate IT)
    const dept1Metrics = dataService.getSummaryMetrics(1);
    const dept1Active = dataService.getTickets({ departmentId: 1, status: 'Active Backlog', limit: 8000 });
    const dept1Resolved = dataService.getTickets({ departmentId: 1, status: 'Resolved Outcomes', limit: 8000 });
    assert.equal(dept1Metrics.openTickets, dept1Active.total, 'Dept 1 backlog metric matches filtered queue');
    assert.equal(dept1Metrics.resolvedTickets, dept1Resolved.total, 'Dept 1 resolved metric matches filtered queue');

    // Filter by Priority Critical
    const critMetrics = dataService.getSummaryMetrics(undefined, 'Critical');
    const critActive = dataService.getTickets({ priority: 'Critical', status: 'Active Backlog', limit: 8000 });
    const critResolved = dataService.getTickets({ priority: 'Critical', status: 'Resolved Outcomes', limit: 8000 });
    const critBreached = dataService.getTickets({ priority: 'Critical', sla: 'Breached', limit: 8000 });
    const critCompliant = dataService.getTickets({ priority: 'Critical', sla: 'Compliant', limit: 8000 });
    assert.equal(critMetrics.openTickets, critActive.total, 'Critical backlog metric matches queue');
    assert.equal(critMetrics.resolvedTickets, critResolved.total, 'Critical resolved metric matches queue');
    assert.equal(critMetrics.slaBreachedCount, critBreached.total, 'Critical breached metric matches queue');
    assert.equal(critMetrics.slaCompliantCount, critCompliant.total, 'Critical compliant metric matches queue');

    // Combined Dept 2 + Priority High
    const comboMetrics = dataService.getSummaryMetrics(2, 'High');
    const comboResolved = dataService.getTickets({ departmentId: 2, priority: 'High', status: 'Resolved Outcomes', limit: 8000 });
    const comboBreached = dataService.getTickets({ departmentId: 2, priority: 'High', sla: 'Breached', limit: 8000 });
    assert.equal(comboMetrics.resolvedTickets, comboResolved.total, 'Dept 2 + High resolved matches queue');
    assert.equal(comboMetrics.slaBreachedCount, comboBreached.total, 'Dept 2 + High breached matches queue');
    totalAssertions += 8;

    console.log('  -> Multi-Dimensional Filter Reconciliation passed (8 assertions).\n');

    // =========================================================================
    // Test 6: Safe Fallbacks, Edge Cases & Empty Results
    // =========================================================================
    console.log('Test 6: Safe Fallbacks & Empty Search Results...');

    // Non-existent search returns 0 tickets gracefully
    const emptySearch = dataService.getTickets({ search: 'NONEXISTENT_KEYWORD_XYZ_9999' });
    assert.equal(emptySearch.total, 0, 'Non-existent keyword returns 0 tickets');
    assert.equal(emptySearch.tickets.length, 0, 'Tickets array is empty');

    // Invalid department id in getTickets
    const invalidDept = dataService.getTickets({ departmentId: 999 });
    assert.equal(invalidDept.total, 0, 'Invalid dept ID returns 0 tickets without throwing');

    totalAssertions += 3;
    console.log('  -> Safe Fallbacks passed (3 assertions).\n');

    // =========================================================================
    // Final Summary
    // =========================================================================
    console.log('===============================================================');
    console.log(` ALL PHASE 2 FILTER SYNCHRONIZATION TESTS PASSED (${totalAssertions} assertions)`);
    console.log('===============================================================');

  } finally {
    await server.close();
  }
}

runFilterSyncTests().catch((err) => {
  console.error('\nFilter Synchronization Test Failed:', err);
  process.exit(1);
});
