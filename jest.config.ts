export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [ '**/test/**/*.test.ts', ],
  testTimeout: 30000,
  setupFiles: [ './test/setup.ts', ],
  testPathIgnorePatterns: [ '<rootDir>/dist/', ],
  modulePathIgnorePatterns: [ '<rootDir>/dist/', ],
};
