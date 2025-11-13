/**
 * Virtual Try-On Models Configuration
 * 
 * Defines available AI models for virtual try-on image generation.
 * Currently using Gemini 2.5 Flash Image model.
 */

export interface VirtualTryOnModel {
  id: string;
  name: string;
  provider: 'gemini' | 'huggingface' | 'custom';
  description: string;
  quality: 1 | 2 | 3 | 4 | 5; // 5 stars rating
  speed: 'slow' | 'medium' | 'fast' | 'very-fast';
  modelName: string; // Actual model identifier for API
  endpoint: string;
  isRecommended?: boolean;
  tier: 1 | 2; // Tier 1: Best quality, Tier 2: Backup
}

export const VIRTUAL_TRYON_MODELS: VirtualTryOnModel[] = [
  // DEFAULT: Gemini 2.5 Flash Image (Currently working)
  {
    id: 'gemini-2.5-flash-image',
    name: 'Nano Banana',
    provider: 'gemini',
    description: 'Google\'s Gemini 2.5 Flash Image model. Fast and reliable virtual try-on generation.',
    quality: 5,
    speed: 'fast',
    modelName: 'gemini-2.5-flash-image',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    isRecommended: true,
    tier: 1,
  },
];

// Get default/recommended model
export function getDefaultVirtualTryOnModel(): VirtualTryOnModel {
  return VIRTUAL_TRYON_MODELS.find(m => m.isRecommended) || VIRTUAL_TRYON_MODELS[0];
}

// Get model by ID
export function getVirtualTryOnModelById(id: string): VirtualTryOnModel | undefined {
  return VIRTUAL_TRYON_MODELS.find(m => m.id === id);
}
