import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

async function runTests() {
  console.log('===============================================================');
  console.log(' Running Data Normalizer, Canonical Agents & Integrity Tests');
  console.log('===============================================================\n');

  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  try {
    const norm = await server.ssrLoadModule('/src/services/dataNormalizer.ts');

    // -------------------------------------------------------------
    // Test 1: Verify all 24 canonical agent name mappings against agents.csv and seededData.json
    // -------------------------------------------------------------
    console.log('Test 1: Canonical Agent Mapping Integrity (24 Agents)...');
    const csvPath = 'C:/Users/kaust/OneDrive/Desktop/ticket/it_support_analytics_dataset/data/agents.csv';
    const seededPath = 'C:/Users/kaust/OneDrive/Desktop/ticket/src/data/seededData.json';

    const csvLines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1);
    const seededAgents = JSON.parse(fs.readFileSync(seededPath, 'utf8')).agents;

    assert.equal(csvLines.length, 24, 'agents.csv must have exactly 24 records');
    assert.equal(seededAgents.length, 24, 'seededData.json must have exactly 24 agents');

    for (let i = 0; i < 24; i++) {
      const [idStr, code, csvName, teamStr, expBand] = csvLines[i].trim().split(',');
      const seeded = seededAgents[i];

      // Cross-check CSV vs Seeded
      assert.equal(code, seeded.agent_code, `Mismatch in agent code at index ${i}`);
      assert.equal(csvName, seeded.agent_name, `Mismatch in agent name between CSV and seeded at ${code}`);
      assert.equal(Number(idStr), seeded.agent_id);
      assert.equal(Number(teamStr), seeded.team_id);
      assert.equal(expBand, seeded.experience_band);

      // Verify dataNormalizer lookup
      const resolvedName = norm.CANONICAL_AGENT_NAMES[code];
      assert.equal(resolvedName, csvName, `CANONICAL_AGENT_NAMES mismatch for ${code}: expected "${csvName}", got "${resolvedName}"`);

      // Verify normalizeAgent output
      const normalizedAgent = norm.normalizeAgent({
        agent_id: idStr,
        agent_code: code,
        team_id: teamStr,
        experience_band: expBand
      });

      assert.equal(normalizedAgent.agent_id, Number(idStr));
      assert.equal(normalizedAgent.agent_code, code);
      assert.equal(normalizedAgent.agent_name, csvName);
      assert.equal(normalizedAgent.team_id, Number(teamStr));
      assert.equal(normalizedAgent.experience_band, expBand);
    }

    // Verify unknown fallback
    const unknownAgent = norm.normalizeAgent({
      agent_id: '99',
      agent_code: 'AGT-999',
      team_id: '1',
      experience_band: 'Junior'
    });
    assert.equal(unknownAgent.agent_name, 'Agent AGT-999');
    console.log('  -> PASS: All 24 canonical agent names verified against source of truth.\n');

    // -------------------------------------------------------------
    // Test 2: Defensive ID parsing & boundary validation
    // -------------------------------------------------------------
    console.log('Test 2: Numeric ID Parsing & Non-Finite Number Rejection...');
    assert.equal(norm.parsePositiveInteger(1, 'id'), 1);
    assert.equal(norm.parsePositiveInteger('42', 'id'), 42);
    assert.throws(() => norm.parsePositiveInteger('abc', 'id'), norm.NormalizationError);
    assert.throws(() => norm.parsePositiveInteger('-5', 'id'), norm.NormalizationError);
    assert.throws(() => norm.parsePositiveInteger(0, 'id'), norm.NormalizationError);
    assert.throws(() => norm.parsePositiveInteger(null, 'id'), norm.NormalizationError);
    assert.throws(() => norm.parsePositiveInteger(NaN, 'id'), norm.NormalizationError);
    assert.throws(() => norm.parsePositiveInteger(Infinity, 'id'), norm.NormalizationError);

    // Nullable IDs
    assert.equal(norm.parseNullablePositiveInteger(null, 'agent_id'), null);
    assert.equal(norm.parseNullablePositiveInteger(undefined, 'agent_id'), null);
    assert.equal(norm.parseNullablePositiveInteger('', 'agent_id'), null);
    assert.equal(norm.parseNullablePositiveInteger('12', 'agent_id'), 12);
    assert.throws(() => norm.parseNullablePositiveInteger('invalid', 'agent_id'), norm.NormalizationError);
    console.log('  -> PASS: Numeric ID parsing enforces positive finite integers.\n');

    // -------------------------------------------------------------
    // Test 3: Business metric ranges (CSAT 1-5, Resolution Hours >= 0)
    // -------------------------------------------------------------
    console.log('Test 3: Satisfaction Rating & Resolution Hours Range Checks...');
    assert.equal(norm.parseNullableBoundedNumber(null, 'csat', 1.0, 5.0), null);
    assert.equal(norm.parseNullableBoundedNumber('4.25', 'csat', 1.0, 5.0), 4.25);
    assert.equal(norm.parseNullableBoundedNumber(5.0, 'csat', 1.0, 5.0), 5.0);
    assert.throws(() => norm.parseNullableBoundedNumber('0.5', 'csat', 1.0, 5.0), norm.NormalizationError);
    assert.throws(() => norm.parseNullableBoundedNumber('5.5', 'csat', 1.0, 5.0), norm.NormalizationError);
    assert.throws(() => norm.parseNullableBoundedNumber(NaN, 'csat', 1.0, 5.0), norm.NormalizationError);
    assert.throws(() => norm.parseNullableBoundedNumber(Infinity, 'csat', 1.0, 5.0), norm.NormalizationError);

    // Resolution hours (>= 0.0)
    assert.equal(norm.parseNullableBoundedNumber('14.2', 'hours', 0.0), 14.2);
    assert.equal(norm.parseNullableBoundedNumber(0, 'hours', 0.0), 0);
    assert.throws(() => norm.parseNullableBoundedNumber('-1.5', 'hours', 0.0), norm.NormalizationError);
    console.log('  -> PASS: CSAT rating and resolution hours adhere to governed boundary ranges.\n');

    // -------------------------------------------------------------
    // Test 4: Temporal validity (resolved_at >= created_at)
    // -------------------------------------------------------------
    console.log('Test 4: Temporal Validity Enforcement...');
    assert.equal(norm.parseIsoTimestamp('2024-09-05T15:53:23+00:00', 'created_at'), '2024-09-05T15:53:23+00:00');
    assert.throws(() => norm.parseIsoTimestamp('not-a-date', 'created_at'), norm.NormalizationError);

    const lookups = norm.buildDimensionLookups(
      [{ department_id: 1, department_name: 'Corporate IT' }],
      [{ team_id: 1, team_name: 'Service Desk Tier 1', department_id: 1 }],
      [{ agent_id: 1, agent_code: 'AGT-001', agent_name: 'Arjun Mehta', team_id: 1, experience_band: 'Senior' }],
      [{ category_id: 1, category_name: 'Access & Permissions', subcategory_name: 'SSO' }],
      [{ sla_rule_id: 1, priority: 'Critical', target_resolution_hours: 4 }]
    );

    // Inverted timestamp should throw NormalizationError
    assert.throws(() => {
      norm.normalizeTicket({
        ticket_id: 'TKT-TEST-INV',
        created_at: '2024-09-10T12:00:00Z',
        resolved_at: '2024-09-09T12:00:00Z', // 1 day earlier!
        status: 'Resolved',
        priority: 'Critical',
        category_id: 1,
        issue_type: 'Test Issue',
        department_id: 1,
        team_id: 1,
        agent_id: 1,
        sla_rule_id: 1,
        satisfaction_rating: 4.0,
        resolution_time_hours: 5.0
      }, lookups);
    }, norm.NormalizationError);

    // Open ticket with resolved_at should throw NormalizationError
    assert.throws(() => {
      norm.normalizeTicket({
        ticket_id: 'TKT-TEST-OPEN',
        created_at: '2024-09-10T12:00:00Z',
        resolved_at: '2024-09-10T13:00:00Z',
        status: 'Open', // Inconsistent: status is Open but resolved_at is set!
        priority: 'Critical',
        category_id: 1,
        issue_type: 'Test Issue',
        department_id: 1,
        team_id: 1,
        agent_id: null,
        sla_rule_id: 1
      }, lookups);
    }, norm.NormalizationError);
    console.log('  -> PASS: Inverted timestamps and state inconsistencies rejected.\n');

    // -------------------------------------------------------------
    // Test 5: Foreign-key validation
    // -------------------------------------------------------------
    console.log('Test 5: Foreign-Key Reference Enforcement...');
    assert.throws(() => {
      norm.normalizeTicket({
        ticket_id: 'TKT-TEST-FK',
        created_at: '2024-09-10T12:00:00Z',
        resolved_at: null,
        status: 'Open',
        priority: 'Critical',
        category_id: 999, // Unknown category
        issue_type: 'Test Issue',
        department_id: 1,
        team_id: 1,
        agent_id: null,
        sla_rule_id: 1
      }, lookups);
    }, norm.NormalizationError);
    console.log('  -> PASS: Orphan foreign keys rejected with NormalizationError.\n');

    // -------------------------------------------------------------
    // Test 6: Clean separation of real fields from synthetic presentation data
    // -------------------------------------------------------------
    console.log('Test 6: Real Field Preservation (No Fabricated Requester or Comments)...');
    const liveRawTicket = {
      ticket_id: 'TKT-00001',
      created_at: '2024-09-05T15:53:23+00:00',
      resolved_at: null,
      status: 'Pending',
      priority: 'High',
      category_id: '1',
      issue_type: 'S3 bucket read latency',
      department_id: '1',
      team_id: '1',
      agent_id: '1',
      sla_rule_id: '1',
      satisfaction_rating: null,
      resolution_time_hours: null
    };

    const normalizedLive = norm.normalizeTicket(liveRawTicket, lookups);
    assert.equal(normalizedLive.ticket_id, 'TKT-00001');
    assert.equal(normalizedLive.subject, 'S3 bucket read latency');
    assert.equal(normalizedLive.requester_name, undefined, 'Must not fabricate requester_name on live tickets');
    assert.equal(normalizedLive.requester_email, undefined, 'Must not fabricate requester_email on live tickets');
    assert.equal(normalizedLive.resolution_notes, undefined, 'Must not fabricate resolution_notes on live tickets');
    assert.deepEqual(normalizedLive.comments, [], 'Must not fabricate historical discussion logs on live tickets');
    console.log('  -> PASS: Live records preserve actual database fields without fabrication.\n');

    console.log('===============================================================');
    console.log(' ALL 6 DATA NORMALIZER & INTEGRITY TESTS PASSED!');
    console.log('===============================================================\n');
  } finally {
    await server.close();
  }
}

runTests().catch(err => {
  console.error('[TEST FAILED]', err);
  process.exit(1);
});
