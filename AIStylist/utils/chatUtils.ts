/**
 * Chat utilities for handling conversations and summaries
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import { generateTextWithImage } from '@/utils/pollinationsAI';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  audioUri?: string;
  timestamp: string;
  imageBase64?: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  imageBase64?: string;
  createdAt: string;
}

export async function saveChatSession(chatSession: Omit<ChatSession, 'id'>, userId?: string): Promise<string> {
  try {
    // Create analysis history entry for this chat session
    const { data, error } = await supabase
      .from('analysis_history')
      .insert({
        user_id: userId,
        type: 'ai_stylist',
        image_url: null, // We'll store images separately if needed
        result: JSON.stringify({
          messages: chatSession.messages,
          session_id: generateSessionId()
        }),
        score: null,
        feedback: {
          message_count: chatSession.messages.length,
          session_duration: chatSession.messages.length > 0 
            ? (new Date(chatSession.messages[chatSession.messages.length - 1].timestamp).getTime() - 
               new Date(chatSession.messages[0].timestamp).getTime()) / 1000
            : 0
        },
        metadata: {
          image_provided: !!chatSession.imageBase64,
          chat_type: 'continuous_conversation'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving chat session:', error);
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('Error saving chat session to Supabase:', error);
    throw error;
  }
}

export async function generateChatSummary(chatSession: ChatSession): Promise<string> {
  try {
    let prompt = `You are a fashion stylist AI assistant. Generate a concise conversation summary for this chat session. The conversation was between you (the stylist) and a user about their outfit.

Here are the conversation messages:
`;

    chatSession.messages.forEach((msg, index) => {
      prompt += `${index + 1}. ${msg.role}: "${msg.text}"\n`;
    });

    prompt += `\nBased on this conversation, provide a brief summary that includes:
1. Main topics discussed (outfit analysis, style advice, etc.)
2. Key recommendations given
3. User's main questions or concerns
4. Overall conversation flow

Keep the summary professional but friendly, under 200 words. Focus on the substance of the fashion advice given.`;

    // Use the same text generation but without image for summary
    const summary = await generateTextWithImage('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', prompt);
    
    return summary;
  } catch (error) {
    console.error('Error generating chat summary:', error);
    return `Chat session summary: This conversation included ${chatSession.messages.length} messages about fashion styling and outfit analysis.`;
  }
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function createChatMessage(
  role: 'user' | 'assistant',
  text: string,
  audioUri?: string,
  imageBase64?: string
): ChatMessage {
  return {
    role,
    text,
    audioUri,
    timestamp: getCurrentTimestamp(),
    imageBase64
  };
}
