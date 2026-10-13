import { createServer } from 'vite';

async function main() {
  console.log('=====================================================');
  console.log(' IT Support Analytics: Supabase Connection Test');
  console.log('=====================================================');
  console.log('Initializing test runner via Vite environment...\n');

  // Initialize a lightweight Vite instance to resolve Vite aliases and import.meta.env
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true }
  });

  try {
    const { testSupabaseConnection } = await server.ssrLoadModule('/src/lib/testConnection.ts');
    const result = await testSupabaseConnection();

    if (result.success) {
      console.log('[SUCCESS]', result.message);
      console.log(`Total Records: ${result.count}`);
      console.log('\nDepartment Records in Database:');
      result.departments?.forEach((dept, index) => {
        console.log(`  ${index + 1}. [ID: ${dept.department_id}] ${dept.department_name}`);
      });
      console.log('\nResult: Connection test PASSED successfully.');
    } else {
      console.error('[FAILURE]', result.message);
      if (result.error) {
        console.error('Error Details:', result.error);
      }
      console.log('\nResult: Connection test FAILED.');
      process.exitCode = 1;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[UNEXPECTED ERROR]', msg);
    process.exitCode = 1;
  } finally {
    await server.close();
  }
}

main();
