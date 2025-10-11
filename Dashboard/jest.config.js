module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  testMatch: [
    '**/__tests__/**/*.test.tsx',
    '**/__tests__/**/*.test.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'contexts/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'screens/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/types/**',
  ],
};
