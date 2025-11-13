/**
 * Vertex AI Service
 * 
 * Service for interacting with Google Cloud Vertex AI Virtual Try-On API via Supabase Edge Function
 * 
 * Features:
 * - Calls Supabase Edge Function 'virtual-tryon'
 * - Edge Function handles Google Cloud authentication
 * - Vertex AI preserves user's face and body with PRESERVE_PERSON parameter
 * - Returns public URL from Supabase Storage
 * 
 * Flow:
 * 1. Convert local images to base64
 * 2. Send to Supabase Edge Function
 * 3. Edge Function calls Vertex AI
 * 4. Edge Function uploads result to Supabase Storage
 * 5. Receive public URL
 * 
 * Last updated: 2025-11-13
 */

import { File } from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { GenerateTryOnResponse } from '../types';

/**
 * Convert ArrayBuffer to base64 string
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Convert image URI to base64
 */
const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    const file = new File(uri);
    const arrayBuffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Generate virtual try-on image using Vertex AI via Supabase Edge Function
 */
export const generateTryOnImage = async (
  userImageUri: string,
  outfitImageUri: string
): Promise<GenerateTryOnResponse> => {
  try {
    console.log('🚀 Creating virtual try-on with Vertex AI...');
    console.log('👤 User image:', userImageUri);
    console.log('👕 Outfit image:', outfitImageUri);
    
    // Convert images to base64
    console.log('📸 Converting images to base64...');
    const userImageBase64 = await imageToBase64(userImageUri);
    const outfitImageBase64 = await imageToBase64(outfitImageUri);
    
    console.log('✅ Images converted successfully');
    console.log('📊 Image sizes:', {
      userImageSize: `${(userImageBase64.length / 1024).toFixed(2)} KB`,
      outfitImageSize: `${(outfitImageBase64.length / 1024).toFixed(2)} KB`,
      totalPayload: `${((userImageBase64.length + outfitImageBase64.length) / 1024).toFixed(2)} KB`
    });
    
  console.log('📤 Calling Supabase Edge Function: virtual-tryon...');

  // Create timeout promise (2 minutes)
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('⏱️ Request timed out after 2 minutes. The Edge Function did not respond in time.'));
    }, 120000); // 120 seconds = 2 minutes
  });

  // Call Supabase Edge Function with timeout
  const invokePromise = supabase.functions.invoke('virtual-tryon', {
    body: {
      userImageBase64,
      outfitImageBase64,
    },
  });

  // Race between timeout and actual call
  const { data, error } = await Promise.race([
    invokePromise,
    timeoutPromise,
  ]) as any;    if (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ Edge Function Error Details:');
      console.error('Error Message:', error.message || 'Unknown error');
      console.error('Error Object:', JSON.stringify(error, null, 2));
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      throw new Error(`Edge Function failed: ${error.message || JSON.stringify(error)}`);
    }
    
    if (!data.success) {
      console.error('❌ Vertex AI error:', data.error);
      throw new Error(data.error || 'Failed to generate virtual try-on');
    }
    
    console.log('✅ Virtual try-on generated successfully!');
    console.log('🖼️ Image URL:', data.imageUrl);
    console.log('📁 File path:', data.filePath);
    
    return {
      success: true,
      imageUrl: data.imageUrl,
      fileName: data.fileName,
      filePath: data.filePath,
    };
  } catch (error: any) {
    console.error('❌ Vertex AI service error:', error);
    throw error;
  }
};
