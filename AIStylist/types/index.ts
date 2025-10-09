/**
 * AI Stylist Types
 * Central export point for all type definitions
 */

// Audio types
export type {
  SpeechRecognitionOptions,
  SpeechRecognitionResult,
} from '../utils/audioUtils';

// Chat types
export type {
  ChatMessage,
  ChatSession,
} from '../utils/chatUtils';

// Context types
export type {
  ConversationExchange,
  ContextMemory,
} from '../utils/contextManager';

// Pollinations AI types
export type {
  TextGenerationMessage,
  TextGenerationOptions,
} from '../utils/pollinationsAI';

// Storage types
export type {
  ImageUploadResult,
} from '../utils/storageService';

export type {
  StoragePath,
  ImageUploadOptions,
} from '../utils/supabaseStorage';

// Streaming types
export type {
  QuickResponse,
} from '../utils/streamingResponseHandler';

// Vision API types
export type {
  VisionMessage,
  VisionResponse,
  VisionAPIRequest,
} from '../utils/visionAPI';

// VAD types
export type {
  VADConfig,
  VADEvent,
} from '../utils/voiceActivityDetection';
