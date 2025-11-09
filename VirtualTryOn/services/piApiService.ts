/**
 * PI API Service
 * 
 * Service for interacting with PI API for virtual try-on image generation
 * Using Gemini 2.5 Flash Image via PI API
 * Last updated: 2025-11-09
 */

import axios from 'axios';
import { GenerateTryOnResponse, TaskResponse } from '../types';
import { PI_API_CONFIG, VIRTUAL_TRY_ON_PROMPT } from '../constants';

/**
 * Poll task status until completion
 * Polls every 3 seconds for up to 20 attempts (60 seconds total)
 */
const pollTaskStatus = async (taskId: string, maxAttempts = 20): Promise<string> => {
  const pollInterval = 3000; // 3 seconds between polls
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await axios.get<TaskResponse>(
        `${PI_API_CONFIG.ENDPOINT}/${taskId}`,
        {
          headers: {
            'X-API-Key': PI_API_CONFIG.API_KEY,
          },
        }
      );

      const { status, output, error } = response.data.data;

      console.log(`📊 Task status (attempt ${attempt + 1}/${maxAttempts}):`, status);
      
      // Only log full response on first and last attempts or when status changes
      if (attempt === 0 || attempt === maxAttempts - 1 || status !== 'pending') {
        console.log('📋 Full response:', JSON.stringify(response.data, null, 2));
      }

      if (status === 'completed' && output?.image_urls?.[0]) {
        console.log('✅ Task completed successfully!');
        console.log('🖼️ Image URL:', output.image_urls[0]);
        return output.image_urls[0];
      }

      if (status === 'failed') {
        const errorMsg = error?.message || (error as any)?.raw_message || (response.data.data as any).detail || 'Task failed';
        console.error('❌ Task failed with error:', errorMsg);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        throw new Error(errorMsg);
      }

      // Wait before next poll (don't wait after last attempt)
      if (attempt < maxAttempts - 1) {
        console.log(`⏳ Waiting ${pollInterval / 1000} seconds before next poll...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    } catch (error: any) {
      if (error.message && (error.message.includes('Task failed') || error.message.includes('failed with error'))) {
        throw error;
      }
      console.error('⚠️ Error polling task:', error.message);
      // Continue polling on network errors
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
  }

  throw new Error('Task timeout - generation took too long (exceeded 60 seconds)');
};

/**
 * Generate virtual try-on image using PI API
 * Uses Gemini 2.5 Flash Image model via PI API wrapper
 */
export const generateTryOnImage = async (
  userImageUrl: string,
  outfitImageUrl: string
): Promise<GenerateTryOnResponse> => {
  try {
    console.log('🚀 Creating virtual try-on task with PI API...');
    console.log('👤 User image:', userImageUrl);
    console.log('👕 Outfit image:', outfitImageUrl);
    console.log('🔑 API Key:', PI_API_CONFIG.API_KEY ? 'Set ✅' : 'Missing ❌');
    
    // Step 1: Create task with correct format matching the example
    const createResponse = await axios.post<TaskResponse>(
      PI_API_CONFIG.ENDPOINT,
      {
        model: 'gemini',
        task_type: 'gemini-2.5-flash-image',
        input: {
          prompt: VIRTUAL_TRY_ON_PROMPT,
          image_urls: [userImageUrl, outfitImageUrl],
          output_format: 'png',
          aspect_ratio: '1:1',
        },
      },
      {
        headers: {
          'X-API-Key': PI_API_CONFIG.API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: PI_API_CONFIG.TIMEOUT,
      }
    );

    console.log('📥 Create response:', JSON.stringify(createResponse.data, null, 2));

    if (createResponse.data.code !== 200) {
      throw new Error(createResponse.data.message || 'Failed to create task');
    }

    const taskId = createResponse.data.data.task_id;
    console.log('✅ Task created:', taskId);

    // Step 2: Poll for completion
    console.log('⏳ Waiting for task to complete (can take up to 60 seconds)...');
    const imageUrl = await pollTaskStatus(taskId);

    return {
      success: true,
      imageUrl,
      data: createResponse.data,
    };
  } catch (error: any) {
    console.error('❌ PI API Error:', error);
    console.error('❌ Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to generate image',
    };
  }
};
