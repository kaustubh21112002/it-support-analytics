import assert from 'node:assert/strict';
import { createServer } from 'vite';

async function runHydrationTest() {
  console.log('========================================================');
  console.log(' Testing Supabase Live-Data Hydration & Provenance');
  console.log('========================================================\n');

  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  try {
    const { dataService } = await server.ssrLoadModule('/src/services/dataService.ts');

    // 1. Initial Synchronous State
    console.log('Step 1: Inspecting Initial Synchronous Fallback State...');
    const provInitial = dataService.getDataProvenance();
    console.log('  Initial Provenance:', {
      dataSource: provInitial.dataSource,
      status: provInitial.hydrationStatus,
      tickets: provInitial.totalTickets
    });
    assert.equal(provInitial.dataSource, 'seeded');
    assert.equal(provInitial.totalTickets, 250);
    assert.equal(dataService.getDepartments().length, 5);
    assert.equal(dataService.getTeams().length, 8);
    assert.equal(dataService.getAgents().length, 24);
    assert.equal(dataService.getCategories().length, 6);
    assert.equal(dataService.getSlaRules().length, 4);
    console.log('  -> PASS (Instant fallback rendered with governed seeded data)\n');

    // 2. Trigger Asynchronous Hydration
    console.log('Step 2: Triggering Asynchronous Supabase Live Hydration...');
    const t0 = Date.now();
    const success = await dataService.hydrateFromSupabase({ force: true });
    console.log(`  Hydration completed in ${Date.now() - t0} ms. Result success: ${success}`);
    assert.equal(success, true, 'hydrateFromSupabase must return true');

    // 3. Post-Hydration State Verification
    console.log('\nStep 3: Verifying Hydrated State & Record Counts...');
    const provLive = dataService.getDataProvenance();
    console.log('  Live Provenance:', {
      dataSource: provLive.dataSource,
      hydrationStatus: provLive.hydrationStatus,
      totalTickets: provLive.totalTickets,
      hydratedAt: provLive.hydratedAt
    });

    assert.equal(provLive.dataSource, 'live');
    assert.equal(provLive.hydrationStatus, 'hydrated');
    assert.equal(provLive.totalTickets, 8000);
    assert.equal(provLive.departmentCount, 5);
    assert.equal(provLive.teamCount, 8);
    assert.equal(provLive.agentCount, 24);
    assert.equal(provLive.categoryCount, 6);
    assert.equal(provLive.slaRuleCount, 4);
    console.log('  -> PASS (Confirmed 8,000 tickets and all 5 dimension tables)\n');

    // 4. Validate Data Types & Canonical Agent Names across Hydrated Records
    console.log('Step 4: Validating Types & Canonical Agent Resolution...');
    const { tickets } = dataService.getTickets({ limit: 100 });
    assert.equal(tickets.length, 100);

    for (const t of tickets) {
      assert.equal(typeof t.ticket_id, 'string');
      assert.equal(typeof t.department_id, 'number');
      assert.equal(typeof t.team_id, 'number');
      assert.equal(typeof t.category_id, 'number');
      assert.equal(typeof t.sla_rule_id, 'number');
      assert.ok(t.agent_id === null || typeof t.agent_id === 'number');
      assert.ok(t.resolved_at === null || typeof t.resolved_at === 'string');
      assert.ok(t.resolution_time_hours === null || typeof t.resolution_time_hours === 'number');
      assert.ok(t.satisfaction_rating === null || typeof t.satisfaction_rating === 'number');

      // Check real fields vs synthetic separation
      assert.equal(t.requester_name, undefined, 'Live tickets must not have fabricated requester_name');
      assert.equal(t.requester_email, undefined, 'Live tickets must not have fabricated requester_email');
      assert.deepEqual(t.comments, [], 'Live tickets must not have fabricated historical comments');
    }

    const agents = dataService.getAgents();
    assert.equal(agents.length, 24);
    for (const a of agents) {
      assert.equal(typeof a.agent_id, 'number');
      assert.equal(typeof a.team_id, 'number');
      assert.ok(typeof a.agent_name === 'string' && a.agent_name.length > 0);
      assert.ok(!a.agent_name.startsWith('Agent AGT-'), `Agent ${a.agent_code} canonical name missing`);
    }
    console.log('  Agent 1:', agents[0].agent_code, '->', agents[0].agent_name);
    console.log('  Agent 24:', agents[23].agent_code, '->', agents[23].agent_name);
    console.log('  -> PASS (Numeric IDs confirmed, canonical names resolved, zero data fabrication)\n');

    // 5. Analytical Integrity & Core Live Summary Metrics
    console.log('Step 5: Verifying Live-Derived Analytical Summary Metrics...');
    const metrics = dataService.getSummaryMetrics();
    console.log('  Live Summary Metrics:', {
      totalTickets: metrics.totalTickets,
      openTickets: metrics.openTickets,
      resolvedTickets: metrics.resolvedTickets,
      avgResolutionHours: metrics.avgResolutionHours,
      medianResolutionHours: metrics.medianResolutionHours,
      slaCompliancePct: metrics.slaCompliancePct,
      slaCompliantCount: metrics.slaCompliantCount,
      slaBreachedCount: metrics.slaBreachedCount
    });

    assert.equal(metrics.totalTickets, 8000);
    assert.equal(metrics.openTickets, 1388);
    assert.equal(metrics.resolvedTickets, 6612);
    assert.equal(metrics.slaCompliantCount, 5814);
    assert.equal(metrics.slaBreachedCount, 798);
    assert.equal(metrics.slaCompliancePct, 87.9);
    assert.equal(metrics.avgResolutionHours, 14.9);
    console.log('  -> PASS (Computed metrics match governed controlled totals exactly)\n');

    // 6. Operational Filtering & Employee Requester Email Association
    console.log('Step 6: Testing Operational Filters & Requester Email Isolation...');
    const dept1Result = dataService.getTickets({ departmentId: 1 });
    console.log(`  Department 1 (Corporate IT) ticket count: ${dept1Result.total}`);
    assert.equal(dept1Result.total, 1555);

    const openResult = dataService.getTickets({ status: 'Open' });
    console.log(`  Open Status ticket count: ${openResult.total}`);
    assert.equal(openResult.total, 552);

    // Filter by employee email before any ticket created
    const emailFilterBefore = dataService.getTickets({ requesterEmail: 'engineer@company.com' });
    assert.equal(emailFilterBefore.total, 0, 'No live tickets should match unassociated requester email');

    // Session-created ticket
    const sessionTicket = dataService.createTicket({
      subject: 'VPN Split Tunnel Latency',
      description: 'Experiencing elevated latency on corporate VPN gateway',
      category_id: 4,
      issue_type: 'VPN connection issue',
      department_id: 2,
      requester_name: 'DevOps Engineer',
      requester_email: 'engineer@company.com'
    });

    assert.equal(sessionTicket.requester_email, 'engineer@company.com');
    assert.ok(sessionTicket.comments && sessionTicket.comments.length > 0);

    const emailFilterAfter = dataService.getTickets({ requesterEmail: 'engineer@company.com' });
    assert.equal(emailFilterAfter.total, 1, 'Only session-created ticket matching email should be returned');
    assert.equal(emailFilterAfter.tickets[0].ticket_id, sessionTicket.ticket_id);
    console.log('  -> PASS (Employee requester email filter isolates user tickets correctly)\n');

    // 7. Session In-Memory Mutation Testing (Non-destructive)
    console.log('Step 7: Testing In-Memory Lifecycle (Non-destructive to remote database)...');
    const updated = dataService.updateTicketStatus(sessionTicket.ticket_id, 'Resolved', 'Gateway re-routed');
    assert.ok(updated);
    assert.equal(updated.status, 'Resolved');
    assert.ok(updated.resolved_at !== null);

    const reassigned = dataService.updateTicketAssignee(sessionTicket.ticket_id, 1, 1);
    assert.ok(reassigned);
    assert.equal(reassigned.agent_id, 1);
    console.log('  -> PASS (Client session mutations work smoothly without remote database writes)\n');

    // 8. CSV Export
    console.log('Step 8: Testing CSV Export on Hydrated Dataset...');
    const csv = dataService.exportTicketsToCsv();
    const csvLines = csv.trim().split('\n');
    console.log(`  Exported CSV total rows: ${csvLines.length}`);
    assert.equal(csvLines.length, 8002); // 8000 live + 1 session + 1 header
    console.log('  -> PASS\n');

    // 9. Unauthenticated Browser Session Gate
    console.log('Step 9: Testing Unauthenticated Session Gate (Zero Anonymous Ticket Queries)...');
    dataService.resetToSeededDemo();
    // Simulate browser runtime environment where window is defined
    globalThis.window = {};
    try {
      const unauthResult = await dataService.hydrateFromSupabase();
      assert.equal(unauthResult, false, 'Unauthenticated browser caller must NOT query operational tickets');
      const provUnauth = dataService.getDataProvenance();
      assert.equal(provUnauth.dataSource, 'seeded');
      assert.equal(provUnauth.hydrationStatus, 'idle');
      assert.equal(provUnauth.totalTickets, 250);
      assert.equal(provUnauth.isLiveOperational, false);
      console.log('  -> PASS (Unauthenticated browser caller prevented from requesting operational tickets)\n');
    } finally {
      delete globalThis.window;
    }

    // 10. Authorization Denial Classification
    console.log('Step 10: Testing Authorization Denial Classification & Anti-Mislabling Protection...');
    dataService.simulateHydrationFailure('PostgreSQL error 42501: permission denied for table tickets');
    const provDenied = dataService.getDataProvenance();
    assert.equal(provDenied.hydrationStatus, 'denied');
    assert.equal(provDenied.errorType, 'authorization');
    assert.equal(provDenied.dataSource, 'seeded');
    assert.equal(provDenied.isLiveOperational, false);
    assert.match(provDenied.diagnosticMessage, /Access Denied/i);
    console.log('  -> PASS (Permission denial classified as "denied"; seeded data strictly NOT mislabeled as live)\n');

    // 11. Network Outage Classification
    console.log('Step 11: Testing Network Failure Classification...');
    dataService.simulateHydrationFailure('TypeError: Failed to fetch (Connection timeout)');
    const provNet = dataService.getDataProvenance();
    assert.equal(provNet.hydrationStatus, 'error');
    assert.equal(provNet.errorType, 'network');
    assert.equal(provNet.dataSource, 'seeded');
    assert.equal(provNet.isLiveOperational, false);
    assert.match(provNet.diagnosticMessage, /Synchronization Failure/i);
    console.log('  -> PASS (Network outage classified as distinct "error" state)\n');

    // 12. Reset to Clean Governed Demo Baseline
    console.log('Step 12: Testing Reset to Governed Demo Baseline...');
    dataService.resetToSeededDemo();
    const provReset = dataService.getDataProvenance();
    assert.equal(provReset.dataSource, 'seeded');
    assert.equal(provReset.hydrationStatus, 'idle');
    assert.equal(provReset.totalTickets, 250);
    assert.equal(provReset.errorType, null);
    console.log('  -> PASS (Cleanly restored 250-ticket synthetic demo baseline)\n');

    console.log('========================================================');
    console.log(' ALL 12 HYDRATION, SECURITY & ERROR-STATE CHECKS PASSED!');
    console.log('========================================================\n');
  } finally {
    await server.close();
  }
}

runHydrationTest().catch(err => {
  console.error('[HYDRATION TEST FAILED]', err);
  process.exit(1);
});
