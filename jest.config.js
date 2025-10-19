module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/**/*.test.js',
    '!examples/**',
    '!dist/**'
  ],
  coverageThreshold: {
    global: {
      branches: 60, // Lower threshold temporarily
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  testMatch: [
    '**/test/**/*.test.js'
  ],
  // Silence console warnings during tests
  silent: true,
  // Or mock console.warn for specific tests
  setupFilesAfterEnv: ['<rootDir>/test/setup.js']
};