/**
 * Product Recommendation Storage Utilities
 * 
 * Handles saving and loading product recommendations to/from Supabase
 * These recommendations are linked to analysis history entries
 */

import { supabase } from '@/lib/supabase';
import { ProductRecommendation } from './productRecommendations';

export interface StoredProductRecommendation {
  id: string;
  analysis_id: string;
  user_id: string;
  item_type: string;
  product_name: string;
  product_image_url: string;
  product_url: string;
  marketplace: 'flipkart' | 'amazon' | 'meesho';
  price?: string;
  rating?: number;
  missing_reason?: string;
  priority?: number;
  created_at: string;
}

/**
 * Save product recommendations to Supabase
 */
export async function saveProductRecommendations(
  analysisId: string,
  userId: string,
  recommendations: Map<string, ProductRecommendation[]>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Convert Map to array of records for insertion
    const recordsToInsert: any[] = [];
    
    recommendations.forEach((products, itemType) => {
      products.forEach((product) => {
        const record = {
          analysis_id: analysisId,
          user_id: userId,
          item_type: itemType,
          product_name: product.name,
          product_image_url: product.imageUrl,
          product_url: product.productUrl,
          marketplace: product.marketplace as 'flipkart' | 'amazon' | 'meesho',
          price: product.price || null,
          rating: product.rating || null,
          missing_reason: null, // Can be enhanced later
          priority: 1,
        };
        recordsToInsert.push(record);
      });
    });

    if (recordsToInsert.length === 0) {
      return { success: true };
    }

    // Insert all recommendations with timeout
    const insertPromise = supabase
      .from('product_recommendations')
      .insert(recordsToInsert)
      .select();

    // Add timeout to prevent hanging on mobile
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
    );

    const { data, error } = await Promise.race([
      insertPromise,
      timeoutPromise
    ]) as any;

    if (error) {
      console.error('Supabase error saving product recommendations:', error);
      
      // Provide user-friendly error message
      if (error.message?.includes('connect')) {
        return { 
          success: false, 
          error: 'Network connection error. Please check your internet connection and try again.' 
        };
      }
      
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception saving product recommendations:', error);
    
    // Handle timeout error
    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        success: false,
        error: 'Request timed out. Please check your internet connection.'
      };
    }
    
    // Handle network errors
    if (error instanceof Error && error.message.includes('Network')) {
      return {
        success: false,
        error: 'Network error. Please check your internet connection.'
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Load product recommendations from Supabase by analysis ID
 */
export async function loadProductRecommendations(
  analysisId: string,
  userId: string
): Promise<Map<string, ProductRecommendation[]> | null> {
  try {
    // Add timeout to prevent hanging on mobile
    const selectPromise = supabase
      .from('product_recommendations')
      .select('*')
      .eq('analysis_id', analysisId)
      .eq('user_id', userId)
      .order('item_type', { ascending: true })
      .order('priority', { ascending: true });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
    );

    const { data, error } = await Promise.race([
      selectPromise,
      timeoutPromise
    ]) as any;

    if (error) {
      console.error('Error loading product recommendations:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return new Map();
    }

    // Convert array to Map grouped by item type
    const recommendationsMap = new Map<string, ProductRecommendation[]>();

    data.forEach((record: any) => {
      const product: ProductRecommendation = {
        id: record.id,
        name: record.product_name,
        imageUrl: record.product_image_url,
        productUrl: record.product_url,
        marketplace: record.marketplace as 'flipkart' | 'amazon' | 'meesho',
        price: record.price || undefined,
        rating: record.rating || undefined,
      };

      const itemType = record.item_type;
      if (!recommendationsMap.has(itemType)) {
        recommendationsMap.set(itemType, []);
      }
      recommendationsMap.get(itemType)!.push(product);
    });

    return recommendationsMap;
  } catch (error) {
    console.error('Exception loading product recommendations:', error);
    return null;
  }
}


