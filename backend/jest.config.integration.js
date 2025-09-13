/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'node',

  // TypeScript compilation
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts'],

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.ts',
    '<rootDir>/tests/integration/**/*.integration.test.ts'
  ],

  // Module path mapping (same as main jest config)
  moduleNameMapping: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@gateway/(.*)$': '<rootDir>/src/gateway/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // Setup and teardown
  globalSetup: '<rootDir>/tests/integration/jest.global-setup.ts',
  globalTeardown: '<rootDir>/tests/integration/jest.global-teardown.ts',
  setupFilesAfterEnv: ['<rootDir>/tests/integration/jest.setup.ts'],

  // Test execution settings
  testTimeout: 60000, // 60 seconds for integration tests
  maxWorkers: 1, // Run tests sequentially to avoid DB conflicts
  forceExit: true,
  detectOpenHandles: true,

  // Coverage settings (optional for integration tests)
  collectCoverage: false,
  coverageDirectory: 'coverage-integration',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts'
  ],

  // Transform settings
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      isolatedModules: true,
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        }
      }
    }]
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    '<rootDir>/tests/unit/',
    '<rootDir>/tests/simple/',
    '<rootDir>/tests/standalone/'
  ],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Error handling
  errorOnDeprecated: false,
  bail: 0, // Continue running tests even if some fail

  // Environment variables for tests
  setupFiles: ['<rootDir>/tests/integration/env.setup.ts']
};