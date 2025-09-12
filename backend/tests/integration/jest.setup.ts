import 'reflect-metadata';

// Increase test timeouts for integration tests
jest.setTimeout(60000);

// Global test setup
beforeAll(async () => {
  // Any global setup that needs to run before all tests
});

afterAll(async () => {
  // Any global cleanup that needs to run after all tests
});

// Mock external services that shouldn't be called during tests
jest.mock('@shared/services/external-api', () => ({
  ExternalAPIService: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
    sendPush: jest.fn().mockResolvedValue({ success: true }),
    uploadToCloud: jest.fn().mockResolvedValue({ url: 'http://example.com/uploaded.jpg' })
  }))
}));

// Suppress console warnings for known test issues
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  // Suppress MongoDB memory server warnings
  if (args[0]?.includes?.('MongoMemoryServer')) return;
  if (args[0]?.includes?.('DeprecationWarning')) return;
  originalConsoleWarn.apply(console, args);
};