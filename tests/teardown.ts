/**
 * Test Environment Teardown
 * Cleans up after all tests complete
 */

import { closePool } from './setup';

/**
 * Global teardown - runs once after all test files
 */
export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');

  try {
    // Close database connections
    await closePool();

    console.log('✅ Test environment cleanup complete');
  } catch (error) {
    console.error('❌ Test environment cleanup failed:', error);
    throw error;
  }
}



