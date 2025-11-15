module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native|zustand|@nkzw/create-context-hook)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/android/', 
    '/ios/', 
    '/.expo/',
    '/supabase/functions/', // Exclude Deno edge function tests
  ],
  
  // ⭐ Co-located tests: Find tests ANYWHERE in the codebase
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',     // Centralized tests in __tests__/
    '**/*.(test|spec).[jt]s?(x)',                   // Co-located tests (e.g., Component.test.tsx)
  ],
  
  // Exclude test files and test directories from coverage
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js',
    '!**/jest.config.js',
    '!**/.expo/**',
    '!**/android/**',
    '!**/ios/**',
    '!**/__tests__/**',                             // Exclude __tests__ directory
    '!**/*.test.{js,jsx,ts,tsx}',                   // Exclude test files
    '!**/*.spec.{js,jsx,ts,tsx}',                   // Exclude spec files
  ],
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
      },
    },
  },
};
