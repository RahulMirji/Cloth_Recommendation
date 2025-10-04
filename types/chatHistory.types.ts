/**
 * Chat History Types
 * 
 * Type definitions for storing and retrieving chat conversation history
 * for both Outfit Scorer and AI Stylist features.
 * 
 * Created: October 4, 2025
 */

/**
 * Conversation types that can be stored in history
 */
export type ConversationType = 'outfit_score' | 'ai_stylist';

/**
 * Base interface for all conversation data
 */
export interface BaseConversationData {
  type: ConversationType;
  timestamp: string;
  userInput?: string;
  images?: string[]; // URLs of images used in the conversation
}

/**
 * Outfit Score conversation data structure
 * Contains all information needed to reproduce the outfit scoring result
 */
export interface OutfitScoreConversationData extends BaseConversationData {
  type: 'outfit_score';
  
  // User's outfit image
  outfitImage: string;
  
  // Scoring results
  overallScore: number;
  
  // Individual category scores (if available)
  categoryScores?: {
    colorHarmony?: number;
    styleCoherence?: number;
    fitAndProportion?: number;
    occasionAppropriate?: number;
    accessorizing?: number;
  };
  
  // AI-generated feedback
  feedback: {
    strengths: string[];
    improvements: string[];
    summary: string;
  };
  
  // Recommendations
  recommendations?: {
    colorSuggestions?: string[];
    styleTips?: string[];
    accessoryRecommendations?: string[];
  };
  
  // Optional metadata
  metadata?: {
    occasion?: string;
    weatherCondition?: string;
    userPreferences?: any;
  };
}

/**
 * AI Stylist conversation data structure
 * Contains complete chat conversation with AI stylist
 */
export interface AIStylistConversationData extends BaseConversationData {
  type: 'ai_stylist';
  
  // Complete chat messages
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    image?: string; // Optional image URL in message
  }[];
  
  // Final recommendations (if provided)
  recommendations?: {
    outfitSuggestions?: string[];
    shoppingSuggestions?: string[];
    styleTips?: string[];
  };
  
  // Context of the conversation
  context?: {
    userQuery?: string;
    occasion?: string;
    season?: string;
    preferences?: any;
  };
}

/**
 * Union type for all conversation data types
 */
export type ConversationData = OutfitScoreConversationData | AIStylistConversationData;

/**
 * Chat history entry as stored in Supabase
 */
export interface ChatHistoryEntry {
  id: string;
  user_id: string;
  type: ConversationType;
  conversation_data: ConversationData;
  created_at: string;
  updated_at?: string;
  
  // Legacy fields (kept for backwards compatibility)
  image_url?: string | null;
  result?: string;
  score?: number | null;
  feedback?: any;
}

/**
 * Options for saving chat history
 */
export interface SaveHistoryOptions {
  userId: string;
  type: ConversationType;
  conversationData: ConversationData;
}

/**
 * Options for retrieving chat history
 */
export interface GetHistoryOptions {
  userId: string;
  type?: ConversationType; // Optional: filter by type
  limit?: number; // Maximum number of entries to retrieve
  offset?: number; // For pagination
  startDate?: string; // Filter by date range
  endDate?: string;
}

/**
 * Response from history retrieval
 */
export interface HistoryResponse {
  success: boolean;
  data?: ChatHistoryEntry[];
  error?: string;
  total?: number; // Total count (for pagination)
}

/**
 * Response from saving history
 */
export interface SaveHistoryResponse {
  success: boolean;
  data?: ChatHistoryEntry;
  error?: string;
}
