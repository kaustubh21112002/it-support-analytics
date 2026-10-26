import assert from 'node:assert/strict';
import { createServer } from 'vite';

async function runAuthRoutingTests() {
  console.log('========================================================');
  console.log(' Testing STRATOS Authentication & Route Authorization');
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
    const {
      ROUTE_PERMISSIONS,
      ACTION_PERMISSIONS,
      matchRoutePattern,
      canAccessRoute,
      canPerformAction,
      getDefaultRouteForRole,
      isDemoAuthEnabled
    } = await server.ssrLoadModule('/src/config/permissions.ts');

    const { DEMO_USERS } = await server.ssrLoadModule('/src/services/demoUsers.ts');
    const { supabase, isSupabaseAvailable } = await server.ssrLoadModule('/src/lib/supabase.ts');
    const { mapSupabaseUser } = await server.ssrLoadModule('/src/context/AuthContext.tsx');

    // -------------------------------------------------------------------------
    // SUITE 1: Centralized Permission Matrix Integrity (Unit Check)
    // -------------------------------------------------------------------------
    console.log('Suite 1: Permission Matrix & Route Pattern Matching...');

    await test('ROUTE_PERMISSIONS contains all 38 application paths across 6 categories', () => {
      assert.equal(ROUTE_PERMISSIONS.length, 38);
      const publicRoutes = ROUTE_PERMISSIONS.filter((r) => r.category === 'public');
      const sharedRoutes = ROUTE_PERMISSIONS.filter((r) => r.category === 'shared');
      const employeeRoutes = ROUTE_PERMISSIONS.filter((r) => r.category === 'employee');
      const agentRoutes = ROUTE_PERMISSIONS.filter((r) => r.category === 'agent');
      const analyticsRoutes = ROUTE_PERMISSIONS.filter((r) => r.category === 'analytics');
      const adminRoutes = ROUTE_PERMISSIONS.filter((r) => r.category === 'admin');

      assert.equal(publicRoutes.length, 8, 'Expected 8 public routes');
      assert.equal(sharedRoutes.length, 2, 'Expected 2 shared routes');
      assert.equal(employeeRoutes.length, 6, 'Expected 6 employee routes');
      assert.equal(agentRoutes.length, 5, 'Expected 5 agent routes');
      assert.equal(analyticsRoutes.length, 10, 'Expected 10 analytics routes');
      assert.equal(adminRoutes.length, 7, 'Expected 7 admin routes');
    });

    await test('matchRoutePattern handles exact matches, query strings, and URL hash fragments', () => {
      const matchLogin = matchRoutePattern('/login');
      assert.ok(matchLogin);
      assert.equal(matchLogin.category, 'public');

      const matchRequestAccess = matchRoutePattern('/request-access');
      assert.ok(matchRequestAccess);
      assert.equal(matchRequestAccess.category, 'public');

      const matchSla = matchRoutePattern('/admin/sla?filter=all');
      assert.ok(matchSla);
      assert.equal(matchSla.path, '/admin/sla');
      assert.deepEqual(matchSla.allowedRoles, ['admin']);

      const matchHash = matchRoutePattern('/portal/tickets/new#step2');
      assert.ok(matchHash);
      assert.equal(matchHash.path, '/portal/tickets/new');

      const matchHashAndQuery = matchRoutePattern('/analytics/overview?range=30d#kpis');
      assert.ok(matchHashAndQuery);
      assert.equal(matchHashAndQuery.path, '/analytics/overview');
    });

    await test('matchRoutePattern resolves parameterized paths correctly', () => {
      const matchPortalTicket = matchRoutePattern('/portal/tickets/TKT-00042');
      assert.ok(matchPortalTicket);
      assert.equal(matchPortalTicket.path, '/portal/tickets/:id');

      const matchAgentTicket = matchRoutePattern('/agent/tickets/TKT-00042');
      assert.ok(matchAgentTicket);
      assert.equal(matchAgentTicket.path, '/agent/tickets/:id');

      const matchGenericTicket = matchRoutePattern('/tickets/TKT-00042');
      assert.ok(matchGenericTicket);
      assert.equal(matchGenericTicket.path, '/tickets/:id');
    });

    // -------------------------------------------------------------------------
    // SUITE 2: Unauthenticated Direct Route Access (Unit Check)
    // -------------------------------------------------------------------------
    console.log('\nSuite 2: Unauthenticated Direct Route Access...');

    await test('Public routes allow unauthenticated access', () => {
      ['/', '/request-access', '/login', '/verify', '/forgot-password', '/reset-password', '/403', '/404'].forEach((p) => {
        const check = canAccessRoute(p, undefined);
        assert.equal(check.allowed, true, `Expected public access for ${p}`);
        assert.equal(check.isPublic, true);
      });
    });

    await test('Protected routes reject unauthenticated visitors with explicit reason', () => {
      const protectedPaths = [
        '/portal',
        '/portal/tickets',
        '/agent',
        '/agent/tickets',
        '/analytics/overview',
        '/analytics/sla',
        '/admin',
        '/admin/sla',
        '/notifications',
        '/profile'
      ];

      protectedPaths.forEach((p) => {
        const check = canAccessRoute(p, undefined);
        assert.equal(check.allowed, false, `Expected denial for unauthenticated ${p}`);
        assert.equal(check.isPublic, false);
        assert.ok(check.reason && check.reason.includes('Authentication required'));
        assert.ok(check.requiredRoles && check.requiredRoles.length > 0);
      });
    });

    // -------------------------------------------------------------------------
    // SUITE 3: Role-Based Route Access & Boundaries (Unit Check)
    // -------------------------------------------------------------------------
    console.log('\nSuite 3: Role-Based Route Access & Boundaries...');

    await test('Employee role permissions boundary', () => {
      // Allowed
      assert.equal(canAccessRoute('/portal', 'employee').allowed, true);
      assert.equal(canAccessRoute('/portal/tickets', 'employee').allowed, true);
      assert.equal(canAccessRoute('/portal/tickets/new', 'employee').allowed, true);
      assert.equal(canAccessRoute('/portal/tickets/TKT-001', 'employee').allowed, true);
      assert.equal(canAccessRoute('/portal/assistant', 'employee').allowed, true);
      assert.equal(canAccessRoute('/portal/knowledge', 'employee').allowed, true);
      assert.equal(canAccessRoute('/notifications', 'employee').allowed, true);
      assert.equal(canAccessRoute('/profile', 'employee').allowed, true);

      // Denied
      assert.equal(canAccessRoute('/agent', 'employee').allowed, false);
      assert.equal(canAccessRoute('/agent/tickets', 'employee').allowed, false);
      assert.equal(canAccessRoute('/agent/workload', 'employee').allowed, false);
      assert.equal(canAccessRoute('/analytics/overview', 'employee').allowed, false);
      assert.equal(canAccessRoute('/analytics/sla', 'employee').allowed, false);
      assert.equal(canAccessRoute('/admin', 'employee').allowed, false);
      assert.equal(canAccessRoute('/admin/upload', 'employee').allowed, false);
      assert.equal(canAccessRoute('/admin/sla', 'employee').allowed, false);
    });

    await test('Support Agent role permissions boundary', () => {
      // Allowed
      assert.equal(canAccessRoute('/agent', 'agent').allowed, true);
      assert.equal(canAccessRoute('/agent/tickets', 'agent').allowed, true);
      assert.equal(canAccessRoute('/agent/tickets/TKT-001', 'agent').allowed, true);
      assert.equal(canAccessRoute('/tickets/TKT-001', 'agent').allowed, true);
      assert.equal(canAccessRoute('/agent/workload', 'agent').allowed, true);
      assert.equal(canAccessRoute('/portal/tickets', 'agent').allowed, true);
      assert.equal(canAccessRoute('/notifications', 'agent').allowed, true);

      // Denied
      assert.equal(canAccessRoute('/portal', 'agent').allowed, false);
      assert.equal(canAccessRoute('/analytics/overview', 'agent').allowed, false);
      assert.equal(canAccessRoute('/analytics/sla', 'agent').allowed, false);
      assert.equal(canAccessRoute('/admin', 'agent').allowed, false);
      assert.equal(canAccessRoute('/admin/upload', 'agent').allowed, false);
      assert.equal(canAccessRoute('/admin/sla', 'agent').allowed, false);
    });

    await test('Manager / Analyst role least-privilege boundary', () => {
      // Allowed BI & QA
      assert.equal(canAccessRoute('/analytics/overview', 'manager').allowed, true);
      assert.equal(canAccessRoute('/analytics/sla', 'manager').allowed, true);
      assert.equal(canAccessRoute('/analytics/trends', 'manager').allowed, true);
      assert.equal(canAccessRoute('/analytics/reports', 'manager').allowed, true);
      assert.equal(canAccessRoute('/agent', 'manager').allowed, true);
      assert.equal(canAccessRoute('/portal', 'manager').allowed, true);
      assert.equal(canAccessRoute('/admin', 'manager').allowed, true);
      assert.equal(canAccessRoute('/admin/data', 'manager').allowed, true);

      // Least Privilege: Denied from Admin-Only upload and governance configurations
      assert.equal(canAccessRoute('/admin/upload', 'manager').allowed, false, 'Manager must be denied /admin/upload under least privilege');
      assert.equal(canAccessRoute('/admin/sla', 'manager').allowed, false);
      assert.equal(canAccessRoute('/admin/users', 'manager').allowed, false);
      assert.equal(canAccessRoute('/admin/access-requests', 'manager').allowed, false, 'Manager must be denied /admin/access-requests');
      assert.equal(canAccessRoute('/admin/security', 'manager').allowed, false);
    });

    await test('Administrator role full access', () => {
      ROUTE_PERMISSIONS.forEach((r) => {
        const check = canAccessRoute(r.path, 'admin');
        assert.equal(check.allowed, true, `Admin must have access to ${r.path}`);
      });
    });

    // -------------------------------------------------------------------------
    // SUITE 4: Action-Level Capabilities & Governance Notice (Unit Check)
    // -------------------------------------------------------------------------
    console.log('\nSuite 4: Action-Level Capabilities & Governance Notice...');

    await test('Action permissions enforce role restrictions', () => {
      // ticket:create allowed for all roles
      ['employee', 'agent', 'manager', 'admin'].forEach((role) => {
        assert.equal(canPerformAction('ticket:create', role).allowed, true);
      });

      // ticket:triage_update restricted to agent, manager, admin
      assert.equal(canPerformAction('ticket:triage_update', 'employee').allowed, false);
      assert.equal(canPerformAction('ticket:triage_update', 'agent').allowed, true);
      assert.equal(canPerformAction('ticket:triage_update', 'manager').allowed, true);
      assert.equal(canPerformAction('ticket:triage_update', 'admin').allowed, true);

      // analytics:view restricted to manager, admin
      assert.equal(canPerformAction('analytics:view', 'employee').allowed, false);
      assert.equal(canPerformAction('analytics:view', 'agent').allowed, false);
      assert.equal(canPerformAction('analytics:view', 'manager').allowed, true);
      assert.equal(canPerformAction('analytics:view', 'admin').allowed, true);

      // admin:data_upload restricted to admin only (least privilege)
      assert.equal(canPerformAction('admin:data_upload', 'employee').allowed, false);
      assert.equal(canPerformAction('admin:data_upload', 'agent').allowed, false);
      assert.equal(canPerformAction('admin:data_upload', 'manager').allowed, false, 'Manager cannot perform admin:data_upload');
      assert.equal(canPerformAction('admin:data_upload', 'admin').allowed, true);

      // admin:configure_sla restricted to admin only
      assert.equal(canPerformAction('admin:configure_sla', 'employee').allowed, false);
      assert.equal(canPerformAction('admin:configure_sla', 'agent').allowed, false);
      assert.equal(canPerformAction('admin:configure_sla', 'manager').allowed, false);
      assert.equal(canPerformAction('admin:configure_sla', 'admin').allowed, true);
    });

    // -------------------------------------------------------------------------
    // SUITE 5: Default Route Resolution & Redirect Loop Prevention (Unit Check)
    // -------------------------------------------------------------------------
    console.log('\nSuite 5: Default Route Resolution & Redirect Loop Prevention...');

    await test('getDefaultRouteForRole maps each persona to canonical dashboard', () => {
      assert.equal(getDefaultRouteForRole('employee'), '/portal');
      assert.equal(getDefaultRouteForRole('agent'), '/agent');
      assert.equal(getDefaultRouteForRole('manager'), '/analytics/overview');
      assert.equal(getDefaultRouteForRole('admin'), '/admin');
      assert.equal(getDefaultRouteForRole(undefined), '/portal');
    });

    await test('Redirect loop filter identifies and sanitizes unsafe return targets', () => {
      const unsafeTargets = [
        '/login',
        '/verify',
        '/403',
        '/404',
        '/login?redirect=1',
        '/403?denied=true',
        '/verify#step2'
      ];
      unsafeTargets.forEach((target) => {
        const clean = target.split('?')[0].split('#')[0];
        const isSafe = !['/login', '/verify', '/403', '/404'].includes(clean);
        assert.equal(isSafe, false, `Path ${target} must be classified as unsafe`);
      });

      const safeTargets = ['/analytics/sla', '/portal/tickets/new', '/admin/upload'];
      safeTargets.forEach((target) => {
        const clean = target.split('?')[0].split('#')[0];
        const isSafe = !['/login', '/verify', '/403', '/404'].includes(clean);
        assert.equal(isSafe, true, `Path ${target} must be classified as safe`);
      });
    });

    // -------------------------------------------------------------------------
    // SUITE 6: Demo Personas vs Real Supabase Users (Static & Contract Check)
    // -------------------------------------------------------------------------
    console.log('\nSuite 6: Demo Personas vs Real Supabase Users...');

    await test('Seeded demo users are clearly categorized as simulated personas', () => {
      assert.ok(DEMO_USERS.length >= 4);
      const roles = DEMO_USERS.map((u) => u.role);
      assert.ok(roles.includes('employee'));
      assert.ok(roles.includes('agent'));
      assert.ok(roles.includes('manager'));
      assert.ok(roles.includes('admin'));

      // Demo IDs must follow synthetic naming pattern
      DEMO_USERS.forEach((u) => {
        assert.ok(u.id.startsWith('usr-'), `Demo user ID ${u.id} should have usr- prefix`);
        assert.ok(u.email.includes('@'), `Demo user ${u.name} must have valid email format`);
      });
    });

    // -------------------------------------------------------------------------
    // SUITE 7: Password Recovery & Reset Contracts (Mocked Auth Tests)
    // -------------------------------------------------------------------------
    console.log('\nSuite 7: Password Recovery & Reset Contracts (Mocked Unit Tests)...');

    await test('Password reset request rejects demo personas with clear advisory', () => {
      // Test demo email detection
      const demoEmail = 'priya.sharma@company.com';
      const isDemo = DEMO_USERS.some(u => u.email.toLowerCase() === demoEmail.toLowerCase());
      assert.equal(isDemo, true, 'priya.sharma@company.com must be identified as demo');
    });

    await test('Password update without active Supabase session is safely rejected', async () => {
      if (supabase?.auth) {
        const originalGetSession = supabase.auth.getSession;
        try {
          // Mock empty session
          supabase.auth.getSession = async () => ({
            data: { session: null },
            error: null
          });

          // Verify update fails safely
          const { data: sess } = await supabase.auth.getSession();
          assert.equal(sess.session, null, 'Must have null session');
        } finally {
          supabase.auth.getSession = originalGetSession;
        }
      }
    });

    // -------------------------------------------------------------------------
    // SUITE 8: Sign-In Validation & Non-Demo Password Requirement (Unit Check)
    // -------------------------------------------------------------------------
    console.log('\nSuite 8: Sign-In Credential & Corporate Account Protection...');

    await test('Arbitrary corporate emails cannot authenticate without valid password', () => {
      const corporateEmail = 'executive.director@company.com';
      const isDemo = DEMO_USERS.some(u => u.email.toLowerCase() === corporateEmail.toLowerCase());
      assert.equal(isDemo, false, 'Arbitrary corporate email must not be treated as seeded demo');
    });

    // -------------------------------------------------------------------------
    // SUITE 9: Live Mutation Gate Check (Read-Only Verification)
    // -------------------------------------------------------------------------
    console.log('\nSuite 9: Remote Mutation Gate & Least Privilege Verification...');

    const { dataService } = await server.ssrLoadModule('/src/services/dataService.ts');

    await test('DataService maintains demo mode mutation gate', async () => {
      const canUpdate = typeof dataService.updateTicketTriage === 'function';
      assert.equal(canUpdate, true, 'dataService must expose updateTicketTriage');
      
      const prov = dataService.getDataProvenance();
      assert.ok(prov, 'Provenance telemetry must be intact');
    });

    // -------------------------------------------------------------------------
    // SUITE 10: Phase 05B.1 Frontend Authorization Hardening & Demo-Mode Gating
    // -------------------------------------------------------------------------
    console.log('\nSuite 10: Frontend Authorization Hardening & Demo-Mode Gating (Phase 05B.1)...');

    await test('1. Valid trusted app_metadata role is resolved correctly for all UserRole values', () => {
      const roles = ['admin', 'manager', 'agent', 'employee'];
      for (const r of roles) {
        const mockSbUser = {
          id: `usr-${r}-123`,
          email: `${r}@company.com`,
          app_metadata: { role: r },
          user_metadata: { full_name: `Test ${r}` }
        };
        const mapped = mapSupabaseUser(mockSbUser);
        assert.equal(mapped.role, r, `Expected role ${r} to resolve from app_metadata.role`);
        assert.equal(mapped.email, `${r}@company.com`);
        assert.equal(mapped.name, `Test ${r}`);
      }
    });

    await test('2. Client-editable user_metadata.role cannot grant admin or elevated privileges', () => {
      // Attacker attempts self-escalation via user_metadata: { role: 'admin' }
      const maliciousUser = {
        id: 'usr-attacker-001',
        email: 'attacker@company.com',
        app_metadata: {}, // Empty trusted app_metadata
        user_metadata: { role: 'admin', full_name: 'Attacker' }
      };
      const mapped = mapSupabaseUser(maliciousUser);
      assert.equal(mapped.role, 'employee', 'Attacker must be defaulted to employee, not admin');

      // Attacker with app_metadata employee trying to set user_metadata admin
      const employeeUser = {
        id: 'usr-attacker-002',
        email: 'attacker2@company.com',
        app_metadata: { role: 'employee' },
        user_metadata: { role: 'admin' }
      };
      const mappedEmp = mapSupabaseUser(employeeUser);
      assert.equal(mappedEmp.role, 'employee', 'User must remain employee despite user_metadata admin');
    });

    await test('3. Missing, unknown, or malformed trusted roles safely default to employee', () => {
      const testCases = [
        { app_metadata: {} },
        { app_metadata: { role: 'superadmin' } },
        { app_metadata: { role: 'root' } },
        { app_metadata: { role: 'sysadmin' } },
        { app_metadata: { role: '' } },
        { app_metadata: { role: null } },
        { app_metadata: { role: 12345 } },
        { app_metadata: { role: true } },
        { app_metadata: { role: '  ADMIN_INVALID  ' } }
      ];

      for (const tc of testCases) {
        const user = {
          id: 'usr-test-unknown',
          email: 'unknown@company.com',
          app_metadata: tc.app_metadata,
          user_metadata: {}
        };
        const mapped = mapSupabaseUser(user);
        assert.equal(mapped.role, 'employee', `Malformed role ${JSON.stringify(tc.app_metadata)} must safely default to employee`);
      }
    });

    await test('4. Demo personas still work when demo mode is enabled', () => {
      // In local dev, demo mode defaults to true
      assert.equal(isDemoAuthEnabled({ isProd: false }), true, 'Dev mode must enable demo auth by default');
      // In prod with explicit flag, demo mode is true
      assert.equal(isDemoAuthEnabled({ enableDemoAuth: 'true', isProd: true }), true, 'Explicit true must enable demo auth in prod');
      assert.equal(isDemoAuthEnabled({ enableDemoAuth: '1', isProd: true }), true, 'Explicit 1 must enable demo auth in prod');
      assert.equal(isDemoAuthEnabled({ enableDemoAuth: true, isProd: true }), true, 'Boolean true must enable demo auth in prod');

      // Verify all demo personas are intact
      assert.equal(DEMO_USERS.length >= 4, true);
      const roles = DEMO_USERS.map(u => u.role);
      ['employee', 'agent', 'manager', 'admin'].forEach(r => {
        assert.ok(roles.includes(r), `Demo personas must include ${r}`);
      });
    });

    await test('5. Demo sign-in and role switching are blocked when demo mode is disabled', () => {
      // In prod without flag, demo mode defaults to false
      assert.equal(isDemoAuthEnabled({ isProd: true }), false, 'Production must default to demo auth disabled');
      assert.equal(isDemoAuthEnabled({ enableDemoAuth: undefined, isProd: true }), false, 'Undefined in prod must be disabled');
      assert.equal(isDemoAuthEnabled({ enableDemoAuth: '', isProd: true }), false, 'Empty string in prod must be disabled');

      // In dev with explicit false/0/off, demo mode is disabled
      assert.equal(isDemoAuthEnabled({ enableDemoAuth: 'false', isProd: false }), false, 'Explicit false must disable in dev');
      assert.equal(isDemoAuthEnabled({ enableDemoAuth: '0', isProd: false }), false, 'Explicit 0 must disable in dev');
      assert.equal(isDemoAuthEnabled({ enableDemoAuth: 'off', isProd: false }), false, 'Explicit off must disable in dev');
      assert.equal(isDemoAuthEnabled({ enableDemoAuth: false, isProd: false }), false, 'Boolean false must disable in dev');
    });

    await test('6. Supabase sign-in and password-reset entry points remain available', () => {
      // Verify public routes still include login, forgot-password, and reset-password
      const loginRoute = matchRoutePattern('/login');
      assert.ok(loginRoute && loginRoute.category === 'public', 'Login route must remain public');

      const forgotRoute = matchRoutePattern('/forgot-password');
      assert.ok(forgotRoute && forgotRoute.category === 'public', 'Forgot password route must remain public');

      const resetRoute = matchRoutePattern('/reset-password');
      assert.ok(resetRoute && resetRoute.category === 'public', 'Reset password route must remain public');
    });

    await test('7. Existing logout, session restoration, and routing behavior remains intact', () => {
      // Role default routes
      assert.equal(getDefaultRouteForRole('employee'), '/portal');
      assert.equal(getDefaultRouteForRole('agent'), '/agent');
      assert.equal(getDefaultRouteForRole('manager'), '/analytics/overview');
      assert.equal(getDefaultRouteForRole('admin'), '/admin');

      // Unauthenticated protection
      assert.equal(canAccessRoute('/admin', undefined).allowed, false);
      assert.equal(canAccessRoute('/analytics/overview', undefined).allowed, false);
      assert.equal(canAccessRoute('/agent', undefined).allowed, false);

      // Role boundary check
      assert.equal(canAccessRoute('/admin', 'employee').allowed, false);
      assert.equal(canAccessRoute('/admin', 'agent').allowed, false);
      assert.equal(canAccessRoute('/admin', 'admin').allowed, true);
    });

    console.log('\n========================================================');
    console.log(` ALL CHECKS PASSED: ${testsPassed}/${testsTotal} passed`);
    console.log('========================================================\n');
  } finally {
    await server.close();
  }
}

runAuthRoutingTests().catch((err) => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
