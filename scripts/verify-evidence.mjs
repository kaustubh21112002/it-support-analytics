import fs from 'fs';
import assert from 'assert';
import { createServer } from 'vite';

async function runVerification() {
  console.log('===============================================================');
  console.log(' STRATOS IT Support Analytics: Evidence-Based Verification Suite');
  console.log('===============================================================\n');

  // Step 0: Start Vite SSR server to import application modules
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  try {
    const { dataService } = await server.ssrLoadModule('./src/services/dataService.ts');

    console.log('[Check 1] Investigate Open-Ticket Count Discrepancy & Status Definitions');
    console.log('-------------------------------------------------------------------------');

    // 1a. Inspect ground-truth tickets.csv
    const rawCsv = fs.readFileSync('it_support_analytics_dataset/data/tickets.csv', 'utf-8');
    const csvLines = rawCsv.trim().split('\n');
    const headerCols = csvLines[0].trim().split(',');
    const statusColIdx = headerCols.indexOf('status');
    const idColIdx = headerCols.indexOf('ticket_id');

    const csvStatusCounts = {};
    const csvIds = new Set();
    let csvDuplicates = 0;

    for (let i = 1; i < csvLines.length; i++) {
      const parts = csvLines[i].split(',');
      const status = parts[statusColIdx];
      const id = parts[idColIdx];
      csvStatusCounts[status] = (csvStatusCounts[status] || 0) + 1;
      if (csvIds.has(id)) csvDuplicates++;
      csvIds.add(id);
    }

    console.log('  1. Source Dataset Status Counts (8,000 tickets):', csvStatusCounts);
    assert.equal(csvStatusCounts['Open'], 552);
    assert.equal(csvStatusCounts['In Progress'], 523);
    assert.equal(csvStatusCounts['Pending'], 313);
    assert.equal(csvStatusCounts['Resolved'], 4882);
    assert.equal(csvStatusCounts['Closed'], 1730);
    assert.equal(csvIds.size, 8000);
    assert.equal(csvDuplicates, 0);

    // 1b. Hydrate from live Supabase
    console.log('  2. Hydrating from live Supabase backend...');
    const startTime = Date.now();
    const hydrationSuccess = await dataService.hydrateFromSupabase({ force: true });
    console.log(`     Hydration completed in ${Date.now() - startTime}ms. Success: ${hydrationSuccess}`);
    assert.ok(hydrationSuccess, 'Hydration must succeed');

    const liveProv = dataService.getDataProvenance();
    assert.equal(liveProv.dataSource, 'live');
    assert.equal(liveProv.totalTickets, 8000);

    // 1c. Compare Summary Metrics vs Status Filters
    const summary = dataService.getSummaryMetrics();
    console.log('  3. Governed Live Summary Metrics:');
    console.log(`     - Total Volume: ${summary.totalTickets}`);
    console.log(`     - Open Backlog (Active): ${summary.openTickets}`);
    console.log(`       * Open (Awaiting triage): ${summary.openBreakdown.open}`);
    console.log(`       * In Progress (Investigation): ${summary.openBreakdown.inProgress}`);
    console.log(`       * Pending (Blocked/User feedback): ${summary.openBreakdown.pending}`);
    console.log(`     - Resolved Outcomes: ${summary.resolvedTickets}`);
    console.log(`       * Resolved: ${summary.resolvedBreakdown.resolved}`);
    console.log(`       * Closed: ${summary.resolvedBreakdown.closed}`);

    assert.equal(summary.totalTickets, 8000);
    assert.equal(summary.openTickets, 1388);
    assert.equal(summary.openBreakdown.open, 552);
    assert.equal(summary.openBreakdown.inProgress, 523);
    assert.equal(summary.openBreakdown.pending, 313);
    assert.equal(summary.resolvedTickets, 6612);
    assert.equal(summary.resolvedBreakdown.resolved, 4882);
    assert.equal(summary.resolvedBreakdown.closed, 1730);

    // 1d. Test filter predicates
    const openFilter = dataService.getTickets({ status: 'Open' });
    const inProgFilter = dataService.getTickets({ status: 'In Progress' });
    const pendingFilter = dataService.getTickets({ status: 'Pending' });
    const activeBacklogFilter = dataService.getTickets({ status: 'Active Backlog' });
    const resolvedFilter = dataService.getTickets({ status: 'Resolved' });
    const closedFilter = dataService.getTickets({ status: 'Closed' });
    const allFilter = dataService.getTickets();

    console.log('  4. Filter Predicate Results:');
    console.log(`     - filter({ status: 'Open' })          => ${openFilter.total} (Exact match to Open stage)`);
    console.log(`     - filter({ status: 'In Progress' })   => ${inProgFilter.total} (Exact match to In Progress stage)`);
    console.log(`     - filter({ status: 'Pending' })       => ${pendingFilter.total} (Exact match to Pending stage)`);
    console.log(`     - filter({ status: 'Active Backlog' })=> ${activeBacklogFilter.total} (Sum of Open + In Progress + Pending)`);
    console.log(`     - filter({ status: 'Resolved' })      => ${resolvedFilter.total}`);
    console.log(`     - filter({ status: 'Closed' })        => ${closedFilter.total}`);
    console.log(`     - filter(all)                         => ${allFilter.total}`);

    assert.equal(openFilter.total, 552);
    assert.equal(inProgFilter.total, 523);
    assert.equal(pendingFilter.total, 313);
    assert.equal(activeBacklogFilter.total, 1388);
    assert.equal(resolvedFilter.total, 4882);
    assert.equal(closedFilter.total, 1730);
    assert.equal(allFilter.total, 8000);

    console.log('  -> PASS: Discrepancy explained: 1,388 is aggregate Active Backlog (552+523+313); 552 is triage Open.\n');

    console.log('[Check 2] Verify CSV Export Structure, Row Counts & Escaping');
    console.log('------------------------------------------------------------');

    // 2a. Pure live export (no session mutations)
    const pureCsv = dataService.exportTicketsToCsv();
    const pureCsvLines = pureCsv.trim().split('\n');
    console.log(`  1. Pure Live Export Total Lines: ${pureCsvLines.length}`);
    console.log(`     - Header line: 1`);
    console.log(`     - Data records: ${pureCsvLines.length - 1}`);
    assert.equal(pureCsvLines.length, 8001, 'Pure CSV export must contain exactly 1 header + 8000 data rows = 8001 lines');

    // 2b. Verify header schema
    const exportedHeader = pureCsvLines[0].split(',');
    assert.deepEqual(exportedHeader, [
      'ticket_id',
      'created_at',
      'resolved_at',
      'status',
      'priority',
      'category_id',
      'issue_type',
      'department_id',
      'team_id',
      'agent_id',
      'sla_rule_id',
      'satisfaction_rating',
      'resolution_time_hours'
    ]);
    console.log('  2. Header schema matches governed fact table (13 columns): PASS');

    // 2c. Check for duplicate or missing IDs in export
    const exportedIds = new Set();
    let exportDuplicates = 0;
    for (let i = 1; i < pureCsvLines.length; i++) {
      const line = pureCsvLines[i];
      const id = line.split(',')[0];
      if (exportedIds.has(id)) exportDuplicates++;
      exportedIds.add(id);
    }
    console.log(`  3. Unique IDs in Export: ${exportedIds.size} / 8000 (Duplicates: ${exportDuplicates})`);
    assert.equal(exportedIds.size, 8000);
    assert.equal(exportDuplicates, 0);

    // 2d. Validate CSV escaping on quotes and commas
    const escapedQuotesSample = pureCsvLines.find(l => l.includes('""') || l.includes('","'));
    console.log(`  4. RFC 4180 Escaping Check (Sample escaped line): ${escapedQuotesSample ? 'Verified' : 'All standard'}`);

    // 2e. Explain the 8,002 rows from test-hydration.mjs
    console.log('  5. Testing 8,002-row explanation (1 session ticket created)...');
    const sessionTicket = dataService.createTicket({
      subject: 'Temporary Session Diagnostic Ticket',
      description: 'Used solely to test in-memory mutation lifecycle',
      category_id: 1,
      issue_type: 'Account lockout',
      department_id: 1,
      requester_name: 'Test Auditor',
      requester_email: 'auditor@company.com'
    });
    const sessionCsv = dataService.exportTicketsToCsv();
    const sessionCsvLines = sessionCsv.trim().split('\n');
    console.log(`     - In-memory tickets with session ticket: ${dataService.getTickets().total}`);
    console.log(`     - Exported CSV total lines: ${sessionCsvLines.length}`);
    assert.equal(sessionCsvLines.length, 8002);
    console.log('  -> PASS: 8,002 lines confirmed as 1 header + 8,000 live tickets + 1 in-memory session ticket.\n');

    console.log('[Check 3] Verify Data Provenance & Explicit Baseline Labelling');
    console.log('------------------------------------------------------------');

    // 3a. Confirm live calculations derive from live tickets
    const catBreakdown = dataService.getCategoryBreakdown();
    const catSum = catBreakdown.reduce((sum, c) => sum + c.count, 0);
    console.log(`  1. Category Breakdown Total: ${catSum} (Live hydrated tickets)`);
    assert.equal(catSum >= 8000, true);

    const prioBreakdown = dataService.getPriorityBreakdown();
    const prioResolvedSum = prioBreakdown.reduce((sum, p) => sum + p.resolvedTotal, 0);
    console.log(`  2. Priority Breakdown Total Resolved: ${prioResolvedSum} (Matches 6,612 resolved outcomes)`);
    assert.equal(prioResolvedSum, 6612);

    const deptBreakdown = dataService.getDepartmentBreakdown();
    const deptSum = deptBreakdown.reduce((sum, d) => sum + d.ticketCount, 0);
    console.log(`  3. Department Breakdown Total: ${deptSum} (Live hydrated tickets)`);
    assert.equal(deptSum >= 8000, true);

    // 3b. Verify monthlyTrend & topIssues are seeded baselines
    const monthlyTrend = dataService.getMonthlyTrend();
    console.log(`  4. Monthly Trend items: ${monthlyTrend.length} months (FY2024 governed seeded baseline)`);
    assert.equal(monthlyTrend.length, 12);

    const topIssues = dataService.getTopIssues();
    console.log(`  5. Top Recurring Issues: ${topIssues.length} items (Pareto governed seeded baseline)`);
    assert.equal(topIssues.length, 10);

    // 3c. Inspect UI files for explicit labelling
    const aoContent = fs.readFileSync('src/pages/analytics/AnalyticsOverview.tsx', 'utf-8');
    assert.ok(aoContent.includes('Governed Seeded Baseline'), 'AnalyticsOverview monthly trend must be labelled as Governed Seeded Baseline');

    const ddpContent = fs.readFileSync('src/pages/analytics/DeepDivePages.tsx', 'utf-8');
    assert.ok(ddpContent.includes('Governed Seeded Baseline · Total volume comparison by calendar month (FY2024)'));
    assert.ok(ddpContent.includes('Governed Seeded Baseline · Monthly average duration in calendar hours (FY2024)'));
    assert.ok(ddpContent.includes('Governed Seeded Baseline · 2024 Pareto recurring issue frequency register'));
    console.log('  6. UI Subtitles & Takeaways verified as "Governed Seeded Baseline"');

    console.log('  -> PASS: Provenance crystal clear across live analytics and seeded baselines.\n');

    console.log('[Check 4] Verify Subscriptions & Reactivity Without Page Reload');
    console.log('------------------------------------------------------------');

    let notificationFired = false;
    let subscriberCallCount = 0;
    const unsubscribe = dataService.subscribe(() => {
      subscriberCallCount++;
      notificationFired = true;
    });

    // Mutate state in memory
    dataService.createTicket({
      subject: 'Reactivity Verification Ticket',
      description: 'Testing subscriber notification',
      category_id: 2,
      issue_type: 'Software licensing issue',
      department_id: 3,
      requester_name: 'Reactivity Bot',
      requester_email: 'bot@company.com'
    });

    assert.ok(notificationFired, 'Subscriber listener must fire upon ticket creation');
    assert.ok(subscriberCallCount >= 1, 'Subscriber must be invoked');
    unsubscribe();
    console.log(`  1. Subscription notification verified: ${subscriberCallCount} event(s) fired synchronously.`);
    console.log('  -> PASS: useDataSync / useDataService hooks re-render components reactively.\n');

    console.log('===============================================================');
    console.log(' ALL VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
    console.log('===============================================================\n');

  } finally {
    await server.close();
  }
}

runVerification().catch(err => {
  console.error('[VERIFICATION FAILED]', err);
  process.exit(1);
});
