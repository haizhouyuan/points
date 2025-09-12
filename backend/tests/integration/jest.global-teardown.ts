export default async function globalTeardown() {
  console.log('🧹 Cleaning up integration test environment...');
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  console.log('✅ Integration test cleanup complete');
}