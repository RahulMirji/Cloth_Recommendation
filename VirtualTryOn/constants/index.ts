/**
 * Virtual Try-On Constants
 * 
 * Configuration constants for the Virtual Try-On feature
 */

// Gemini API Configuration
export const GEMINI_API_CONFIG = {
  ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
  API_KEY: 'AIzaSyCKoT-NcXhlNskt86_8YV4s_Vf1sJV-Mxs',
  TIMEOUT: 60000, // 60 seconds timeout
} as const;

export const VIRTUAL_TRY_ON_PROMPT = `Virtually try this outfit from the second image on the person in the first image.`;
