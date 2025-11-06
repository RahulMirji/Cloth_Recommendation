/**
 * Virtual Try-On Constants
 * 
 * Configuration constants for the Virtual Try-On feature
 */

export const PI_API_CONFIG = {
  API_KEY: '0216505f2a6a8d23e3be11b9648b5d52abcc76da2ce9467b3bb6910f833291e9',
  ENDPOINT: 'https://api.piapi.ai/api/v1/task',
  MODEL: 'idm-vton',
  TASK_TYPE: 'idm-vton',
  MAX_POLL_ATTEMPTS: 60,
  POLL_INTERVAL: 2000,
  TIMEOUT: 30000,
} as const;

export const VIRTUAL_TRY_ON_PROMPT = `Create a photorealistic image showing the person from the first image wearing the exact clothing from the second image. Preserve the person's facial features, skin tone, hair, and body proportions. Apply the outfit naturally with proper fit, realistic fabric texture, appropriate shadows and highlights. Maintain the original background and lighting conditions. Ensure the clothing fits the person's body shape realistically.`;
