const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/context/(.*)$': '<rootDir>/context/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
  },
  testMatch: [
    '<rootDir>/**/*.test.js',
    '<rootDir>/**/*.test.jsx',
  ],
  collectCoverageFrom: [
    'components/**/*.{js,jsx}',
    'context/**/*.{js,jsx}',
    'pages/**/*.{js,jsx}',
    '!pages/_app.js',
    '!pages/_document.js',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 