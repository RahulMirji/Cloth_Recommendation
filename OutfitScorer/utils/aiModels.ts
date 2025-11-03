/**
 * AI Vision Models Configuration
 * 
 * All models are FREE and OPEN-SOURCE with no API keys required.
 * Models are provided through Pollinations AI and Hugging Face Inference API.
 */

export interface AIModel {
  id: string;
  name: string;
  provider: 'pollinations' | 'huggingface';
  description: string;
  quality: 1 | 2 | 3 | 4 | 5; // 5 stars rating
  speed: 'slow' | 'medium' | 'fast' | 'very-fast';
  modelName: string; // Actual model identifier for API
  endpoint: string;
  isRecommended?: boolean;
  tier: 1 | 2; // Tier 1: Best quality, Tier 2: Backup
}

export const AI_MODELS: AIModel[] = [
  // DEFAULT: Gemini 1.5 Flash (Pollinations AI)
  {
    id: 'gemini-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'pollinations',
    description: 'Google\'s latest vision model. Excellent for fashion analysis with fast responses.',
    quality: 5,
    speed: 'fast',
    modelName: 'gemini',
    endpoint: 'https://text.pollinations.ai/openai',
    isRecommended: true,
    tier: 1,
  },
  
  // CUSTOM FINE-TUNED MODEL (Add your AWS endpoint here after training)
  {
    id: 'finetuned-llava',
    name: 'Fine-tuned LLaVA (Custom)',
    provider: 'pollinations', // Will be changed to 'custom' after deployment
    description: 'Custom LLaVA model fine-tuned on Indian fashion dataset. Optimized for accurate outfit analysis.',
    quality: 5,
    speed: 'fast',
    modelName: 'gemini', // Temporary fallback to Gemini until your model is ready
    endpoint: 'https://text.pollinations.ai/openai', // REPLACE WITH: https://your-api.amazonaws.com/analyze
    tier: 1,
  },
];

// Get default/recommended model
export function getDefaultModel(): AIModel {
  return AI_MODELS.find(m => m.isRecommended) || AI_MODELS[0];
}

// Get model by ID
export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find(m => m.id === id);
}

// Get models by tier
export function getModelsByTier(tier: 1 | 2): AIModel[] {
  return AI_MODELS.filter(m => m.tier === tier);
}

// Format speed for display
export function formatSpeed(speed: AIModel['speed']): string {
  const speedMap = {
    'slow': '🐢 Slow',
    'medium': '🚶 Medium',
    'fast': '🏃 Fast',
    'very-fast': '⚡ Very Fast',
  };
  return speedMap[speed];
}

// Format quality stars
export function formatQuality(quality: number): string {
  return '⭐'.repeat(quality);
}
