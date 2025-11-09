/**
 * AI Models Configuration for AIStylist
 * 
 * Defines available AI models for real-time conversation and vision analysis.
 * Models must support:
 * - Text generation (chat responses)
 * - Vision analysis (analyze outfit from camera)
 * - Streaming (for real-time responses)
 * 
 * Note: Uses same interface as OutfitScorer for compatibility with multiModelAI
 */

export interface AIStylistAIModel {
  id: string;
  name: string;
  provider: 'pollinations' | 'gemini';
  modelName: string;
  description: string;
  isRecommended?: boolean;
  quality: 1 | 2 | 3 | 4 | 5; // 1-5 stars (matching OutfitScorer interface)
  speed: 'very-fast' | 'fast' | 'medium' | 'slow';
  supportsStreaming: boolean;
  supportsVision: boolean;
  endpoint: string; // Required for compatibility with multiModelAI
  tier: 1 | 2; // Tier 1: Best quality, Tier 2: Backup
}

/**
 * Available AI models for AIStylist
 * Sorted by recommendation
 */
export const AISTYLIST_AI_MODELS: AIStylistAIModel[] = [
  {
    id: 'gemini-1.5-flash-pollinations',
    name: 'Gemini 1.5 Flash (Pollinations)',
    provider: 'pollinations',
    modelName: 'openai',
    description: 'Fast, free, and reliable for real-time chat. Perfect for conversational AI.',
    isRecommended: true,
    quality: 4,
    speed: 'very-fast',
    supportsStreaming: true,
    supportsVision: true,
    endpoint: 'https://text.pollinations.ai/openai',
    tier: 1,
  },
  {
    id: 'gemini-2.0-flash-official',
    name: 'Gemini Flash Lite (Official)',
    provider: 'gemini',
    modelName: 'gemini-flash-lite-latest',
    description: 'Latest Google AI with enhanced conversational abilities and reasoning.',
    quality: 5,
    speed: 'fast',
    supportsStreaming: true,
    supportsVision: true,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',
    tier: 1,
  },
];

/**
 * Get the default/recommended model
 */
export function getDefaultAIStylistModel(): AIStylistAIModel {
  return AISTYLIST_AI_MODELS.find(m => m.isRecommended) || AISTYLIST_AI_MODELS[0];
}
