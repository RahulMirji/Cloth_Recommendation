/**
 * Virtual Try-On Constants
 * 
 * Configuration constants for the Virtual Try-On feature
 */

import Constants from 'expo-constants';

// Gemini API Configuration
export const GEMINI_API_CONFIG = {
  ENDPOINT: process.env.EXPO_PUBLIC_GEMINI_API_ENDPOINT 
    ? `${process.env.EXPO_PUBLIC_GEMINI_API_ENDPOINT}/gemini-2.5-flash-image:generateContent`
    : 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
  API_KEY: Constants.expoConfig?.extra?.geminiApiKey || 
           process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
  TIMEOUT: 60000, // 60 seconds timeout
} as const;

export const VIRTUAL_TRY_ON_PROMPT = `Create a virtual try on where the person from the first image is wearing the clothing from the second image. **Absolutely preserve the person's face, facial features, hair, and head exactly as they are in the first image. Keep the person's body shape and background also exactly the same, only changing the clothing they are wearing.**`;
