/**
 * Virtual Try-On Constants
 * 
 * Configuration constants for the Virtual Try-On feature
 */

// PI API Configuration
export const PI_API_CONFIG = {
  ENDPOINT: 'https://api.piapi.ai/api/v1/task',
  API_KEY: process.env.EXPO_PUBLIC_PI_API_KEY || '',
  TIMEOUT: 30000, // 30 seconds timeout for initial request
} as const;

export const VIRTUAL_TRY_ON_PROMPT = `Create a photorealistic image showing the person from the first image wearing the exact clothing from the second image. Preserve the person's facial features, skin tone, hair, and body proportions. Apply the outfit naturally with proper fit, realistic fabric texture, appropriate shadows and highlights. Maintain the original background and lighting conditions. Ensure the clothing fits the person's body shape realistically.`;

