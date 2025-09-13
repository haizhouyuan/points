import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// Mock global fetch for API calls
global.fetch = vi.fn();

// Mock environment variables
process.env.NODE_ENV = 'test';

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});