module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'App.tsx',
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50,
    },
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/macos/',
    '/__tests__/setup.ts',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-mac|@react-native-macos|@react-native-community|react-native-macos)/)',
  ],
};
