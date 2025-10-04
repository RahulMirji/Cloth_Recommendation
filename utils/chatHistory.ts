/**
 * Chat History Utility Functions
 * 
 * Functions for saving and retrieving chat conversation history
 * from Supabase database. Respects user's "Save History" setting.
 * 
 * Created: October 4, 2025
 */

import { supabase } from '../lib/supabase';
import {
  ConversationType,
  ConversationData,
  ChatHistoryEntry,
  SaveHistoryOptions,
  GetHistoryOptions,
  HistoryResponse,
  SaveHistoryResponse,
} from '../types/chatHistory.types';

/**
 * Check if user has enabled "Save History" setting
 * @param userId - User's UUID
 * @returns Promise<boolean> - True if history saving is enabled
 */
export async function isHistorySavingEnabled(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('save_history')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking history setting:', error);
      return true; // Default to enabled if can't fetch setting
    }

    return data?.save_history ?? true;
  } catch (error) {
    console.error('Exception checking history setting:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Save a chat conversation to history
 * Only saves if user has enabled "Save History" setting
 * 
 * @param options - Save options including userId, type, and conversation data
 * @returns Promise<SaveHistoryResponse>
 */
export async function saveChatHistory(
  options: SaveHistoryOptions
): Promise<SaveHistoryResponse> {
  const { userId, type, conversationData } = options;

  try {
    // Check if history saving is enabled
    const isEnabled = await isHistorySavingEnabled(userId);
    
    if (!isEnabled) {
      console.log('History saving is disabled for this user');
      return {
        success: false,
        error: 'History saving is disabled',
      };
    }

    // Prepare the data for insertion
    const historyEntry = {
      user_id: userId,
      type: type,
      conversation_data: conversationData as any, // Cast to Json type
      // Legacy fields for backwards compatibility
      result: JSON.stringify(conversationData),
      image_url: conversationData.images?.[0] || null,
      score: type === 'outfit_score' 
        ? (conversationData as any).overallScore 
        : null,
      feedback: type === 'outfit_score'
        ? (conversationData as any).feedback
        : null,
    };

    // Insert into database
    const { data, error } = await supabase
      .from('analysis_history')
      .insert(historyEntry)
      .select()
      .single();

    if (error) {
      console.error('Error saving chat history:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('Chat history saved successfully');
    return {
      success: true,
      data: data as unknown as ChatHistoryEntry,
    };
  } catch (error: any) {
    console.error('Exception saving chat history:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Retrieve chat history for a user
 * 
 * @param options - Get options including userId, type filter, pagination
 * @returns Promise<HistoryResponse>
 */
export async function getChatHistory(
  options: GetHistoryOptions
): Promise<HistoryResponse> {
  const { 
    userId, 
    type, 
    limit = 50, 
    offset = 0,
    startDate,
    endDate,
  } = options;

  try {
    // Build query
    let query = supabase
      .from('analysis_history')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply type filter if specified
    if (type) {
      query = query.eq('type', type);
    }

    // Apply date range filters if specified
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching chat history:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data as unknown as ChatHistoryEntry[],
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Exception fetching chat history:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Get a single chat history entry by ID
 * 
 * @param historyId - History entry UUID
 * @param userId - User's UUID (for security check)
 * @returns Promise<ChatHistoryEntry | null>
 */
export async function getChatHistoryById(
  historyId: string,
  userId: string
): Promise<ChatHistoryEntry | null> {
  try {
    const { data, error } = await supabase
      .from('analysis_history')
      .select('*')
      .eq('id', historyId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching chat history by ID:', error);
      return null;
    }

    return data as unknown as ChatHistoryEntry;
  } catch (error) {
    console.error('Exception fetching chat history by ID:', error);
    return null;
  }
}

/**
 * Delete a chat history entry
 * 
 * @param historyId - History entry UUID
 * @param userId - User's UUID (for security check)
 * @returns Promise<boolean> - True if deletion was successful
 */
export async function deleteChatHistory(
  historyId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('analysis_history')
      .delete()
      .eq('id', historyId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting chat history:', error);
      return false;
    }

    console.log('Chat history deleted successfully');
    return true;
  } catch (error) {
    console.error('Exception deleting chat history:', error);
    return false;
  }
}

/**
 * Delete all chat history for a user (optionally filtered by type)
 * 
 * @param userId - User's UUID
 * @param type - Optional: Only delete specific conversation type
 * @returns Promise<boolean> - True if deletion was successful
 */
export async function deleteAllChatHistory(
  userId: string,
  type?: ConversationType
): Promise<boolean> {
  try {
    let query = supabase
      .from('analysis_history')
      .delete()
      .eq('user_id', userId);

    if (type) {
      query = query.eq('type', type);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting all chat history:', error);
      return false;
    }

    console.log('All chat history deleted successfully');
    return true;
  } catch (error) {
    console.error('Exception deleting all chat history:', error);
    return false;
  }
}

/**
 * Get count of history entries by type
 * Useful for showing badges/counts in UI
 * 
 * @param userId - User's UUID
 * @returns Promise<{ outfit_score: number; ai_stylist: number }>
 */
export async function getHistoryCounts(
  userId: string
): Promise<{ outfit_score: number; ai_stylist: number }> {
  try {
    // Get outfit score count
    const { count: outfitCount, error: outfitError } = await supabase
      .from('analysis_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'outfit_score');

    // Get AI stylist count
    const { count: stylistCount, error: stylistError } = await supabase
      .from('analysis_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'ai_stylist');

    if (outfitError || stylistError) {
      console.error('Error getting history counts:', outfitError || stylistError);
      return { outfit_score: 0, ai_stylist: 0 };
    }

    return {
      outfit_score: outfitCount || 0,
      ai_stylist: stylistCount || 0,
    };
  } catch (error) {
    console.error('Exception getting history counts:', error);
    return { outfit_score: 0, ai_stylist: 0 };
  }
}
