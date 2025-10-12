/**
 * Credit Management Service
 * Handles credit tracking, deduction, and subscription management
 * Uses existing Supabase RPC functions and feature_credits table
 */

import { supabase } from '@/lib/supabase';

export interface UserCredits {
  credits_remaining: number;
  credits_cap: number;
  plan_status: 'free' | 'pro';
  expires_at: string | null;
}

/**
 * Get user's current credits for outfit_scorer feature
 * Uses existing feature_credits table
 * Automatically initializes credits if user doesn't have them
 */
export const getUserCredits = async (userId: string): Promise<UserCredits> => {
  try {
    const { data, error } = await supabase
      .from('feature_credits' as any)
      .select('credits_remaining, credits_cap, plan_status, expires_at')
      .eq('user_id', userId)
      .eq('feature', 'outfit_scorer')
      .single();

    if (error) {
      // If user doesn't have credits row, initialize it
      if (error.code === 'PGRST116') {
        console.log('User credits not found, initializing...');
        await initializeUserCredits(userId);
        
        // Retry fetching after initialization
        const { data: retryData, error: retryError } = await supabase
          .from('feature_credits' as any)
          .select('credits_remaining, credits_cap, plan_status, expires_at')
          .eq('user_id', userId)
          .eq('feature', 'outfit_scorer')
          .single();
        
        if (retryError) {
          console.error('Error after initialization:', retryError);
          return getDefaultCredits();
        }
        
        return {
          credits_remaining: (retryData as any)?.credits_remaining ?? 5,
          credits_cap: (retryData as any)?.credits_cap ?? 5,
          plan_status: (retryData as any)?.plan_status ?? 'free',
          expires_at: (retryData as any)?.expires_at ?? null,
        };
      }
      
      console.error('Error fetching user credits:', error);
      return getDefaultCredits();
    }

    return {
      credits_remaining: (data as any)?.credits_remaining ?? 5,
      credits_cap: (data as any)?.credits_cap ?? 5,
      plan_status: (data as any)?.plan_status ?? 'free',
      expires_at: (data as any)?.expires_at ?? null,
    };
  } catch (error) {
    console.error('getUserCredits error:', error);
    return getDefaultCredits();
  }
};

/**
 * Get default credits for new users
 */
const getDefaultCredits = (): UserCredits => {
  return {
    credits_remaining: 5,
    credits_cap: 5,
    plan_status: 'free',
    expires_at: null,
  };
};

/**
 * Initialize credits for a user using RPC function
 */
const initializeUserCredits = async (userId: string): Promise<void> => {
  try {
    // Call the initialize_feature_credits RPC function
    const { error } = await (supabase.rpc as any)('initialize_feature_credits');
    
    if (error) {
      console.error('Error initializing credits via RPC:', error);
      
      // Fallback: Direct insert if RPC fails
      await supabase
        .from('feature_credits' as any)
        .insert({
          user_id: userId,
          feature: 'outfit_scorer',
          plan_status: 'free',
          credits_remaining: 5,
          credits_cap: 5,
          expires_at: null,
        });
      
      console.log('Credits initialized via direct insert');
    } else {
      console.log('Credits initialized via RPC');
    }
  } catch (error) {
    console.error('initializeUserCredits error:', error);
  }
};

/**
 * Check if user has credits available
 */
export const hasCreditsAvailable = async (userId: string): Promise<boolean> => {
  try {
    const credits = await getUserCredits(userId);
    
    // Check if plan expired
    if (credits.expires_at && new Date(credits.expires_at) < new Date()) {
      return false;
    }
    
    return credits.credits_remaining > 0;
  } catch (error) {
    console.error('hasCreditsAvailable error:', error);
    return false;
  }
};

/**
 * Deduct one credit from user's account using RPC function
 * Uses existing consume_feature_credit RPC
 */
export const deductCredit = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await (supabase.rpc as any)('consume_feature_credit', {
      p_feature: 'outfit_scorer',
    });

    if (error) {
      console.error('Error deducting credit:', error);
      
      // Handle specific error codes
      if (error.message.includes('PLAN_EXPIRED')) {
        console.log('Plan expired');
        return false;
      }
      if (error.message.includes('INSUFFICIENT_CREDITS')) {
        console.log('Insufficient credits');
        return false;
      }
      
      return false;
    }

    console.log('Credit deducted successfully:', data);
    return true;
  } catch (error) {
    console.error('deductCredit error:', error);
    return false;
  }
};

/**
 * Get max credits based on plan (for display purposes)
 */
export const getMaxCredits = async (userId: string): Promise<number> => {
  try {
    const credits = await getUserCredits(userId);
    return credits.credits_cap;
  } catch (error) {
    console.error('getMaxCredits error:', error);
    return 5; // Default free plan
  }
};

/**
 * Check if subscription is expired
 */
export const isSubscriptionExpired = (expiryDate: string | null): boolean => {
  if (!expiryDate) return false;
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  
  return now > expiry;
};

