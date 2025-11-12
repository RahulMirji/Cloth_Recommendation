/**
 * Gemini API Service
 * 
 * Service for interacting with Gemini API for virtual try-on image generation
 * Using Gemini 2.5 Flash Image model directly
 * 
 * Features:
 * - Direct integration with Google's Gemini 2.5 Flash Image model
 * - Converts local images to base64 for API submission
 * - Receives generated image as base64 and saves to local cache
 * - No intermediate API wrapper needed
 * 
 * Last updated: 2025-11-11
 */

import axios from 'axios';
import { File, Paths } from 'expo-file-system';
import { GenerateTryOnResponse } from '../types';
import { GEMINI_API_CONFIG, VIRTUAL_TRY_ON_PROMPT } from '../constants';

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
 * Determine MIME type from URI
 */
const getMimeType = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
};

/**
 * Generate virtual try-on image using Gemini API
 * Uses Gemini 2.5 Flash Image model directly
 */
export const generateTryOnImage = async (
  userImageUri: string,
  outfitImageUri: string
): Promise<GenerateTryOnResponse> => {
  try {
    console.log('🚀 Creating virtual try-on with Gemini API...');
    console.log('👤 User image:', userImageUri);
    console.log('👕 Outfit image:', outfitImageUri);
    console.log('🔑 API Key:', GEMINI_API_CONFIG.API_KEY ? 'Set ✅' : 'Missing ❌');
    
    // Convert images to base64
    console.log('📸 Converting images to base64...');
    const userImageBase64 = await imageToBase64(userImageUri);
    const outfitImageBase64 = await imageToBase64(outfitImageUri);
    
    const userMimeType = getMimeType(userImageUri);
    const outfitMimeType = getMimeType(outfitImageUri);
    
    console.log('✅ Images converted successfully');
    console.log('📤 Sending request to Gemini API...');
    
    const response = await axios.post(
      `${GEMINI_API_CONFIG.ENDPOINT}?key=${GEMINI_API_CONFIG.API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: VIRTUAL_TRY_ON_PROMPT,
              },
              {
                inlineData: {
                  mimeType: userMimeType,
                  data: userImageBase64,
                },
              },
              {
                inlineData: {
                  mimeType: outfitMimeType,
                  data: outfitImageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: GEMINI_API_CONFIG.TIMEOUT,
      }
    );

    console.log('📥 Response received from Gemini API');
    
    // Log the full response for debugging
    console.log('🔍 Full response:', JSON.stringify(response.data, null, 2));
    
    // Extract the generated image from response
    const candidates = response.data.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates in response');
    }
    
    const parts = candidates[0].content.parts;
    let imageBase64 = null;
    
    // Find the image data in the parts array
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        imageBase64 = part.inlineData.data;
        break;
      }
    }
    
    if (!imageBase64) {
      throw new Error('No image data found in response');
    }
    
    // Save the image to file system
    const fileName = `tryon_${Date.now()}.png`;
    const file = new File(Paths.cache, fileName);
    
    console.log('💾 Saving generated image...');
    
    // Convert base64 to Uint8Array
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const writer = file.writableStream().getWriter();
    await writer.write(bytes);
    await writer.close();
    
    const fileUri = file.uri;
    console.log('✅ Image saved successfully:', fileUri);

    return {
      success: true,
      data: response.data,
      imageUrl: fileUri,
    };
  } catch (error: any) {
    console.error('❌ Gemini API Error:', error);
    console.error('❌ Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || 'Failed to generate image',
    };
  }
};
