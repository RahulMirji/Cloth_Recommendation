/**
 * Virtual Try-On Constants
 * 
 * Configuration constants for the Virtual Try-On feature
 */

export const PI_API_CONFIG = {
  API_KEY: '247423cdf4ab3e0ecf6937fb1c3d1424cb625bb53f2cce9ad0b697eca7308dc8',
  ENDPOINT: 'https://api.piapi.ai/api/v1/task',
  MODEL: 'gemini',
  TASK_TYPE: 'gemini-2.5-flash-image',
  MAX_POLL_ATTEMPTS: 60,
  POLL_INTERVAL: 2000,
  TIMEOUT: 30000,
} as const;

export const VIRTUAL_TRY_ON_PROMPT = `Create a photorealistic image showing the person from the first image wearing the exact clothing from the second image. Preserve the person's facial features, skin tone, hair, and body proportions. Apply the outfit naturally with proper fit, realistic fabric texture, appropriate shadows and highlights. Maintain the original background and lighting conditions. Ensure the clothing fits the person's body shape realistically.`;

