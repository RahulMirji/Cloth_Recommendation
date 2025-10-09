/**
 * AI Stylist Module
 * Self-contained module for AI-powered fashion styling with voice interaction
 * 
 * Features:
 * - Voice-activated conversational AI stylist
 * - Real-time image analysis using vision API
 * - Streaming responses for instant feedback
 * - Context-aware multi-turn conversations
 * - Voice activity detection
 * - Camera integration for outfit analysis
 * - Hands-free operation mode
 */

// Main Screen
export { default as AIStylistScreen } from './screens/AIStylistScreen';

// Components
export { Footer } from './components/Footer';

// Utilities
export { 
  SpeechToTextService,
  convertAudioToText,
  speakTextLocal,
  generateSpeakBackAudio,
} from './utils/audioUtils';

export {
  saveChatHistory,
  getChatHistory,
  getChatHistoryById,
  deleteChatHistory,
  deleteAllChatHistory,
} from './utils/chatHistory';

export {
  generateChatSummary,
  saveChatSession,
  generateSessionId,
  createChatMessage,
} from './utils/chatUtils';

export {
  contextManager,
} from './utils/contextManager';

export {
  generateTextWithImage,
  convertImageToBase64,
} from './utils/pollinationsAI';

export {
  storageService,
} from './utils/storageService';

export {
  uploadImageToStorage,
  deleteImageFromStorage,
  getFallbackImageUrl,
  validateImageUrl,
  initializeStorageBucket,
  STORAGE_CONFIG,
} from './utils/supabaseStorage';

export {
  StreamingResponseHandler,
  streamingHandler,
} from './utils/streamingResponseHandler';

export {
  visionAPI,
} from './utils/visionAPI';

export {
  vadDetector,
} from './utils/voiceActivityDetection';

// Types
export * from './types';
