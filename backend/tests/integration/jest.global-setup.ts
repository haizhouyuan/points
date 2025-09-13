import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  console.log('🚀 Setting up integration test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-integration-tests';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
  process.env.API_PREFIX = '/api/v1';
  
  // Disable console output during tests unless explicitly enabled
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }

  console.log('✅ Integration test environment ready');
}