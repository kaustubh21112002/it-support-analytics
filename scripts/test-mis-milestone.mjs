import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';

async function runMisMilestoneTests() {
  console.log('===============================================================');
  console.log(' Running MIS Reporting Milestone 1A Verification Suite');
  console.log(' (Local Controlled Totals, Formulas & Provenance Integrity)');
  console.log('===============================================================\n');

  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  try {
    const { dataService } = await server.ssrLoadModule('/src/services/dataService.ts');
    const norm = await server.ssrLoadModule('/src/services/dataNormalizer.ts');

    // -------------------------------------------------------------------------
    // Test 1: Ground-Truth CSV Controlled Totals & Status Distribution
    // -------------------------------------------------------------------------
    console.log('Test 1: Ground-Truth Dataset (8,000 Records) Reconciliation...');
    const rawCsv = fs.readFileSync('it_support_analytics_dataset/data/tickets.csv', 'utf-8');
    const csvLines = rawCsv.trim().split('\n');
    const headerCols = csvLines[0].trim().split(',');
    const statusColIdx = headerCols.indexOf('status');
    const priorityColIdx = headerCols.indexOf('priority');
    const resHoursColIdx = headerCols.indexOf('resolution_time_hours');
    const slaRuleColIdx = headerCols.indexOf('sla_rule_id');

    const csvStatusCounts = {};
    const parsedTickets = [];

    for (let i = 1; i < csvLines.length; i++) {
      const parts = csvLines[i].split(',');
      const status = parts[statusColIdx];
      const priority = parts[priorityColIdx];
      const resHrsStr = parts[resHoursColIdx];
      const slaRuleId = Number(parts[slaRuleColIdx]);
      csvStatusCounts[status] = (csvStatusCounts[status] || 0) + 1;

      parsedTickets.push({
        ticket_id: parts[0],
        status,
        priority,
        sla_rule_id: slaRuleId,
        resolution_time_hours: resHrsStr ? parseFloat(resHrsStr) : null
      });
    }

    console.log('  1. Source Dataset Status Counts:', csvStatusCounts);
    assert.equal(csvLines.length - 1, 8000, 'Source dataset must contain exactly 8,000 tickets');
    assert.equal(csvStatusCounts['Open'], 552, 'Open (Awaiting triage): 552');
    assert.equal(csvStatusCounts['In Progress'], 523, 'In Progress: 523');
    assert.equal(csvStatusCounts['Pending'], 313, 'Pending: 313');
    assert.equal(csvStatusCounts['Resolved'], 4882, 'Resolved: 4,882');
    assert.equal(csvStatusCounts['Closed'], 1730, 'Closed: 1,730');

    // Aggregate Active Backlog
    const activeBacklog = csvStatusCounts['Open'] + csvStatusCounts['In Progress'] + csvStatusCounts['Pending'];
    assert.equal(activeBacklog, 1388, 'Active Backlog must equal 1,388');

    // Aggregate Resolved Outcomes
    const resolvedOutcomes = csvStatusCounts['Resolved'] + csvStatusCounts['Closed'];
    assert.equal(resolvedOutcomes, 6612, 'Total Resolved Outcomes must equal 6,612');

    // Full Balance Reconciliation
    assert.equal(activeBacklog + resolvedOutcomes, 8000, 'Backlog (1,388) + Resolved (6,612) = 8,000 total');
    console.log('  -> PASS: Ground-truth controlled totals confirmed with zero discrepancy.\n');

    // -------------------------------------------------------------------------
    // Test 2: Governed SLA Compliance Derivation
    // -------------------------------------------------------------------------
    console.log('Test 2: SLA Denominator & Compliance Arithmetic...');
    const slaRules = [
      { sla_rule_id: 1, priority: 'Critical', target_resolution_hours: 4 },
      { sla_rule_id: 2, priority: 'High', target_resolution_hours: 8 },
      { sla_rule_id: 3, priority: 'Medium', target_resolution_hours: 24 },
      { sla_rule_id: 4, priority: 'Low', target_resolution_hours: 72 }
    ];

    const computedMetrics = norm.computeLiveSummaryMetrics(parsedTickets, slaRules);
    console.log('  Computed Metrics from 8,000 Dataset:', {
      total: computedMetrics.totalTickets,
      openTickets: computedMetrics.openTickets,
      resolvedTickets: computedMetrics.resolvedTickets,
      slaCompliantCount: computedMetrics.slaCompliantCount,
      slaBreachedCount: computedMetrics.slaBreachedCount,
      slaCompliancePct: computedMetrics.slaCompliancePct,
      avgResolutionHours: computedMetrics.avgResolutionHours
    });

    assert.equal(computedMetrics.totalTickets, 8000);
    assert.equal(computedMetrics.openTickets, 1388);
    assert.equal(computedMetrics.resolvedTickets, 6612);
    assert.equal(computedMetrics.slaCompliantCount, 5814, 'Compliant count must equal 5,814');
    assert.equal(computedMetrics.slaBreachedCount, 798, 'Breached count must equal 798');
    assert.equal(computedMetrics.slaCompliancePct, 87.9, 'Compliance rate: 5814 / 6612 = 87.9%');
    assert.equal(computedMetrics.avgResolutionHours, 14.9, 'Average resolution turnaround: 14.9 hrs');
    console.log('  -> PASS: SLA arithmetic verifies 5,814 compliant / 6,612 resolved = 87.9%.\n');

    // -------------------------------------------------------------------------
    // Test 3: Governed Baseline Fallback Metrics (Governed Reference Totals)
    // -------------------------------------------------------------------------
    console.log('Test 3: Initial Governed Offline State & Benchmark Reconciliation...');
    const provInitial = dataService.getDataProvenance();
    assert.equal(provInitial.dataSource, 'seeded');
    assert.equal(provInitial.totalTickets, 250, 'Offline in-memory ticket sample is 250 records');

    const initialMetrics = dataService.getSummaryMetrics();
    // In seeded fallback mode, summary metrics reflect the governed 8,000 benchmark
    assert.equal(initialMetrics.totalTickets, 8000, 'Governed summary total is 8,000');
    assert.equal(initialMetrics.openTickets, 1388, 'Governed open backlog is 1,388');
    assert.equal(initialMetrics.resolvedTickets, 6612, 'Governed resolved outcomes is 6,612');
    assert.equal(
      initialMetrics.openTickets + initialMetrics.resolvedTickets,
      initialMetrics.totalTickets,
      'Seeded fallback must reconcile open + resolved = total'
    );
    assert.equal(initialMetrics.slaCompliancePct, 87.9);
    assert.equal(initialMetrics.slaCompliantCount, 5814);
    assert.equal(initialMetrics.slaBreachedCount, 798);
    console.log('  -> PASS: Offline fallback metrics reconcile with governed 8,000 benchmark.\n');

    // -------------------------------------------------------------------------
    // Test 4: RFC 4180 CSV Export Structure
    // -------------------------------------------------------------------------
    console.log('Test 4: CSV Export Formatting & Header Schema...');
    const csvExport = dataService.exportTicketsToCsv();
    const exportLines = csvExport.trim().split('\n');
    assert.ok(exportLines.length >= 251, 'Export must include header and rows');
    const headerColsExport = exportLines[0].split(',');
    assert.equal(headerColsExport[0], 'ticket_id');
    assert.equal(headerColsExport[3], 'status');
    assert.equal(headerColsExport[4], 'priority');
    assert.equal(headerColsExport[12], 'resolution_time_hours');
    console.log('  -> PASS: CSV export matches canonical 13-column fact schema.\n');

    // -------------------------------------------------------------------------
    // Test 5: Print Stylesheet Presence
    // -------------------------------------------------------------------------
    console.log('Test 5: Print Stylesheet Validation...');
    const indexCss = fs.readFileSync('src/index.css', 'utf-8');
    assert.ok(indexCss.includes('@media print'), 'src/index.css must declare @media print rules');
    assert.ok(indexCss.includes('print:hidden') || indexCss.includes('display: none !important'), 'Print styles must hide non-printable chrome');
    console.log('  -> PASS: Print media rules are declared for paper/PDF generation.\n');

    console.log('===============================================================');
    console.log(' ALL 5 MIS REPORTING MILESTONE 1A CHECKS PASSED PERFECTLY!');
    console.log('===============================================================\n');
  } finally {
    await server.close();
  }
}

runMisMilestoneTests().catch(err => {
  console.error('[MIS TEST FAILED]', err);
  process.exit(1);
});
