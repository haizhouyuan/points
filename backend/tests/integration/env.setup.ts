// Environment variables for integration tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-integration-tests';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.API_PREFIX = '/api/v1';

// Disable external services
process.env.DISABLE_REDIS = 'true';
process.env.DISABLE_EMAIL = 'true';
process.env.DISABLE_PUSH_NOTIFICATIONS = 'true';

// Test-specific settings
process.env.RATE_LIMIT_DISABLED = 'true';
process.env.LOG_LEVEL = 'error';
process.env.TEST_MODE = 'true';