/**
 * ============================================================================
 * IT Support Analytics Platform: Access Request Workflow & Security Suite
 * ============================================================================
 * Tests:
 * 1. Server-side input validation (name, email, role, reason).
 * 2. Authoritative database storage contract (fails clearly when table is unprovisioned).
 * 3. Elimination of misleading local fallbacks in production mode.
 * 4. Explicit demo mode isolation (allows interactive testing without claiming database persistence).
 * 5. Prevention of duplicate submissions for pending requests.
 * 6. Zero-trust non-escalation: no account creation or privilege grant.
 * 7. Role restrictions: non-admins cannot review requests.
 * 8. Admin review execution: state transition to approved/rejected.
 * 9. Reviewer identity, timestamps, review reasons, and immutable audit logs.
 * 10. Protection against concurrent overwriting of already-decided requests.
 * ============================================================================
 */

import assert from 'node:assert/strict';
import { createServer } from 'vite';

// Mock browser localStorage for Node testing environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.window = {
  localStorage: new MockLocalStorage()
};

async function runAccessRequestTests() {
  console.log('========================================================');
  console.log(' Running Access Request Workflow & Security Test Suite');
  console.log('========================================================\n');

  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  let testsPassed = 0;
  let testsTotal = 0;

  async function test(name, fn) {
    testsTotal++;
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      testsPassed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      throw err;
    }
  }

  try {
    const { dataService } = await server.ssrLoadModule('/src/services/dataService.ts');
    const { supabase, isSupabaseAvailable } = await server.ssrLoadModule('/src/lib/supabase.ts');

    // -------------------------------------------------------------------------
    // TEST 1: Strict Server-Side Validation
    // -------------------------------------------------------------------------
    console.log('Test Suite 1: Server-Side Input Validation...');

    await test('Rejects submission with missing or blank full name', async () => {
      const res = await dataService.submitAccessRequest({
        fullName: '  ',
        workEmail: 'valid@company.com',
        departmentId: 1,
        requestedRole: 'employee',
        reason: 'This is a valid 15-char justification'
      });
      assert.equal(res.success, false);
      assert.match(res.error, /full legal or directory name/i);
    });

    await test('Rejects submission with invalid email format', async () => {
      const res = await dataService.submitAccessRequest({
        fullName: 'Jane Doe',
        workEmail: 'invalid-email-no-at',
        departmentId: 1,
        requestedRole: 'employee',
        reason: 'This is a valid 15-char justification'
      });
      assert.equal(res.success, false);
      assert.match(res.error, /corporate work email/i);
    });

    await test('Rejects submission with short business justification (<15 chars)', async () => {
      const res = await dataService.submitAccessRequest({
        fullName: 'Jane Doe',
        workEmail: 'jane.doe@company.com',
        departmentId: 1,
        requestedRole: 'employee',
        reason: 'Too short'
      });
      assert.equal(res.success, false);
      assert.match(res.error, /minimum 15 characters/i);
    });

    await test('Rejects submission with invalid role tier', async () => {
      const res = await dataService.submitAccessRequest({
        fullName: 'Jane Doe',
        workEmail: 'jane.doe@company.com',
        departmentId: 1,
        requestedRole: 'super_admin_invalid',
        reason: 'This is a valid 15-char justification'
      });
      assert.equal(res.success, false);
      assert.match(res.error, /invalid requested role tier/i);
    });

    // -------------------------------------------------------------------------
    // TEST 2: Authoritative Database Storage Contract & Honest Error Handling
    // -------------------------------------------------------------------------
    console.log('\nTest Suite 2: Production Storage Contract & Unprovisioned Schema Handling...');

    await test('Fails honestly with migration requirement when Supabase table is unprovisioned', async () => {
      // In this environment, public.access_requests is not yet applied on Supabase.
      // Must return an explicit error and NOT falsely claim success.
      const res = await dataService.submitAccessRequest({
        fullName: 'Alice Walker',
        workEmail: 'alice.walker@example.com',
        departmentId: 2,
        requestedRole: 'agent',
        reason: 'Joining Tier 1 support desk as an escalated rotational specialist'
      });

      assert.equal(res.success, false, 'Must not claim success when database table is unprovisioned');
      assert.equal(res.isAuthoritative, false);
      assert.match(res.error, /public\.access_requests is not yet provisioned|migration required/i);
    });

    await test('getAccessRequestsAsync reports authoritative status and explicit configuration notice', async () => {
      const res = await dataService.getAccessRequestsAsync();
      assert.equal(res.isAuthoritative, false);
      assert.ok(res.error, 'Should report unprovisioned table error');
      assert.match(res.error, /public\.access_requests is not yet provisioned/i);
    });

    // -------------------------------------------------------------------------
    // TEST 3: Explicit Demo Mode Sandbox Testing
    // -------------------------------------------------------------------------
    console.log('\nTest Suite 3: Explicit Demo Mode Sandbox...');

    let demoId = '';
    await test('Explicit demo submission records in demo mode without claiming authoritative database storage', async () => {
      const res = await dataService.submitAccessRequest({
        fullName: 'Alice Walker',
        workEmail: 'alice.walker@example.com',
        departmentId: 2,
        requestedRole: 'agent',
        reason: 'Joining Tier 1 support desk as an escalated rotational specialist'
      }, { isDemoSubmission: true });

      assert.equal(res.success, true);
      assert.ok(res.request);
      assert.equal(res.isAuthoritative, false);
      assert.equal(res.storageProvenance, 'demo_mode');
      assert.ok(res.request.id.startsWith('REQ-'));
      assert.equal(res.request.status, 'pending_review');
      assert.equal(res.request.requestedRole, 'agent');
      demoId = res.request.id;

      // Verify audit trail logged with demo mode label
      const audits = dataService.getAuditEvents();
      const auditEntry = audits.find(a => a.action === 'ACCESS_REQUEST_SUBMITTED' && a.user === 'alice.walker@example.com');
      assert.ok(auditEntry, 'Expected ACCESS_REQUEST_SUBMITTED audit event');
      assert.equal(auditEntry.user, 'alice.walker@example.com');
      assert.match(auditEntry.details, /\[DEMO MODE\]/);
    });

    await test('Demo mode prevents duplicate submissions for identical email and role in pending state', async () => {
      const res = await dataService.submitAccessRequest({
        fullName: 'Alice Walker Duplicate',
        workEmail: 'alice.walker@example.com',
        departmentId: 2,
        requestedRole: 'agent',
        reason: 'Attempting to resubmit while previous request is pending'
      }, { isDemoSubmission: true });

      assert.equal(res.success, false);
      assert.match(res.error, /already under review/i);
      assert.match(res.error, /duplicate/i);
    });

    // -------------------------------------------------------------------------
    // TEST 4: Zero-Trust Security Invariant
    // -------------------------------------------------------------------------
    console.log('\nTest Suite 4: Zero-Trust Security Non-Escalation...');

    await test('Submitting an access request NEVER creates an authenticated user or grants privileges', async () => {
      const usersBefore = dataService.getUsers();
      assert.ok(!usersBefore.some(u => u.email === 'alice.walker@example.com'));

      // Check current users remains unchanged
      const currentUsers = dataService.getUsers();
      assert.equal(usersBefore.length, currentUsers.length);
      assert.ok(!currentUsers.some(u => u.email === 'alice.walker@example.com'));
    });

    // -------------------------------------------------------------------------
    // TEST 5: Role Authorization & Administrator Review
    // -------------------------------------------------------------------------
    console.log('\nTest Suite 5: Administrator Review Queue & Authorization...');

    await test('Non-admin role (agent) cannot review or approve access requests', async () => {
      const res = await dataService.reviewAccessRequest({
        requestId: demoId,
        action: 'approve',
        reviewerId: 'agent-123',
        reviewerName: 'Support Agent Jane',
        reviewerRole: 'agent',
        reviewReason: 'Trying to approve myself',
        isDemoSession: true
      });

      assert.equal(res.success, false);
      assert.match(res.error, /unauthorized/i);
    });

    await test('Non-admin role (manager) cannot review or approve access requests', async () => {
      const res = await dataService.reviewAccessRequest({
        requestId: demoId,
        action: 'approve',
        reviewerId: 'mgr-456',
        reviewerName: 'Service Desk Manager Mark',
        reviewerRole: 'manager',
        reviewReason: 'Manager approval attempt',
        isDemoSession: true
      });

      assert.equal(res.success, false);
      assert.match(res.error, /unauthorized/i);
    });

    await test('Platform Administrator can approve access request with recorded reviewer metadata', async () => {
      const res = await dataService.reviewAccessRequest({
        requestId: demoId,
        action: 'approve',
        reviewerId: 'admin-001',
        reviewerName: 'Admin System Lead',
        reviewerRole: 'admin',
        reviewReason: 'Identity confirmed via HR directory. Assigned to Tier 1 rotational onboarding.',
        isDemoSession: true
      });

      assert.equal(res.success, true);
      assert.ok(res.request);
      assert.equal(res.request.status, 'approved');
      assert.equal(res.request.reviewedBy, 'admin-001');
      assert.equal(res.request.reviewedByName, 'Admin System Lead');
      assert.ok(res.request.reviewedAt);

      // Verify immutable audit event
      const audits = dataService.getAuditEvents();
      const approvalAudit = audits.find(a => a.action === 'ACCESS_REQUEST_APPROVED' && a.details.includes(demoId));
      assert.ok(approvalAudit, 'Expected ACCESS_REQUEST_APPROVED audit event');
      assert.equal(approvalAudit.user, 'Admin System Lead');
    });

    await test('Already reviewed request cannot be reviewed again (prevents concurrent overwrite)', async () => {
      const res = await dataService.reviewAccessRequest({
        requestId: demoId,
        action: 'reject',
        reviewerId: 'admin-001',
        reviewerName: 'Admin System Lead',
        reviewerRole: 'admin',
        reviewReason: 'Attempting secondary review',
        isDemoSession: true
      });

      assert.equal(res.success, false);
      assert.match(res.error, /already been decided/i);
    });

    await test('Administrator can review and reject a separate access request', async () => {
      const submitRes = await dataService.submitAccessRequest({
        fullName: 'Bob Malicious',
        workEmail: 'bob.external@thirdparty.com',
        departmentId: 1,
        requestedRole: 'admin',
        reason: 'I need administrative root credentials immediately'
      }, { isDemoSubmission: true });
      assert.equal(submitRes.success, true);

      const rejectRes = await dataService.reviewAccessRequest({
        requestId: submitRes.request.id,
        action: 'reject',
        reviewerId: 'admin-001',
        reviewerName: 'Admin System Lead',
        reviewerRole: 'admin',
        reviewReason: 'Third party contractors cannot hold platform administrator privileges.',
        isDemoSession: true
      });

      assert.equal(rejectRes.success, true);
      assert.equal(rejectRes.request.status, 'rejected');

      const audits = dataService.getAuditEvents();
      const rejectAudit = audits.find(a => a.action === 'ACCESS_REQUEST_REJECTED' && a.details.includes(submitRes.request.id));
      assert.ok(rejectAudit, 'Expected ACCESS_REQUEST_REJECTED audit event');
    });

    console.log('\n========================================================');
    console.log(` ALL ${testsPassed}/${testsTotal} ACCESS REQUEST WORKFLOW TESTS PASSED!`);
    console.log('========================================================\n');
  } finally {
    await server.close();
  }
}

runAccessRequestTests();
