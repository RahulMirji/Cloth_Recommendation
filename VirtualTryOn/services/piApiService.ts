/**
 * PI API Service
 * 
 * Service for interacting with PI API for virtual try-on image generation
 */

import axios from 'axios';
import { GenerateTryOnResponse, TaskResponse } from '../types';
import { PI_API_CONFIG, VIRTUAL_TRY_ON_PROMPT } from '../constants';

/**
 * Poll task status until completion
 */
const pollTaskStatus = async (taskId: string, maxAttempts = PI_API_CONFIG.MAX_POLL_ATTEMPTS): Promise<string> => {
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
      console.log('📋 Full response:', JSON.stringify(response.data, null, 2));

      if (status === 'completed' && output?.image_urls?.[0]) {
        console.log('✅ Task completed successfully!');
        return output.image_urls[0];
      }

      if (status === 'failed') {
        const errorMsg = error?.message || (error as any)?.raw_message || (response.data.data as any).detail || 'Task failed';
        console.error('❌ Task failed with error:', errorMsg);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        throw new Error(errorMsg);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, PI_API_CONFIG.POLL_INTERVAL));
    } catch (error: any) {
      if (error.message === 'Task failed') {
        throw error;
      }
      console.error('Error polling task:', error.message);
      // Continue polling on network errors
    }
  }

  throw new Error('Task timeout - generation took too long');
};

/**
 * Generate virtual try-on image using PI API
 */
export const generateTryOnImage = async (
  userImageUrl: string,
  outfitImageUrl: string
): Promise<GenerateTryOnResponse> => {
  try {
    console.log('🚀 Creating virtual try-on task...');
    
    // Step 1: Create task with IDM-VTON format
    const createResponse = await axios.post<TaskResponse>(
      PI_API_CONFIG.ENDPOINT,
      {
        model: PI_API_CONFIG.MODEL,
        task_type: PI_API_CONFIG.TASK_TYPE,
        input: {
          human_image: userImageUrl,
          cloth_image: outfitImageUrl,
          category: 'upper_body', // Options: upper_body, lower_body, dresses
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

    if (createResponse.data.code !== 200) {
      throw new Error(createResponse.data.message || 'Failed to create task');
    }

    const taskId = createResponse.data.data.task_id;
    console.log('✅ Task created:', taskId);

    // Step 2: Poll for completion
    console.log('⏳ Waiting for task to complete...');
    const imageUrl = await pollTaskStatus(taskId);

    return {
      success: true,
      imageUrl,
      data: createResponse.data,
    };
  } catch (error: any) {
    console.error('❌ PI API Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to generate image',
    };
  }
};
