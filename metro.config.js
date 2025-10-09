// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ⭐ CRITICAL: Exclude test files from production bundle (APK/AAB)
// This ensures test files NEVER make it into your final build
config.resolver.blockList = [
  // Exclude all test files
  /.*\.test\.[jt]sx?$/,
  /.*\.spec\.[jt]sx?$/,
  // Exclude __tests__ directories
  /\/__tests__\/.*/,
  // Exclude test setup files
  /jest\.setup\.js$/,
  /jest\.config\.js$/,
];

// Optional: Explicitly exclude test files from being watched (performance improvement)
config.watchFolders = config.watchFolders || [];

module.exports = config;
