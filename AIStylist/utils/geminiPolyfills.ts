/**
 * Polyfills for @google/genai SDK on React Native
 */

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Polyfill for WebSocket if needed
if (typeof global.WebSocket === 'undefined') {
  // @ts-ignore
  global.WebSocket = require('react-native').WebSocket;
}

console.log('✅ Gemini polyfills loaded');
