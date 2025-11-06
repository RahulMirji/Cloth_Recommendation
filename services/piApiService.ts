import axios from 'axios';

const PI_API_KEY = '0216505f2a6a8d23e3be11b9648b5d52abcc76da2ce9467b3bb6910f833291e9';
const API_ENDPOINT = 'https://api.piapi.ai/api/v1/task';

interface GenerateTryOnResponse {
  success: boolean;
  data?: any;
  imageUrl?: string | null;
  error?: string;
}

interface TaskResponse {
  code: number;
  data: {
    task_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    output?: {
      image_urls?: string[];
    };
    error?: {
      message?: string;
    };
  };
  message: string;
}

/**
 * Poll task status until completion
 */
const pollTaskStatus = async (taskId: string, maxAttempts = 60): Promise<string> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await axios.get<TaskResponse>(
        `${API_ENDPOINT}/${taskId}`,
        {
          headers: {
            'X-API-Key': PI_API_KEY,
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
        const errorMsg = error?.message || error?.raw_message || response.data.data.detail || 'Task failed';
        console.error('❌ Task failed with error:', errorMsg);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        throw new Error(errorMsg);
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
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
    
    // Step 1: Create task
    const createResponse = await axios.post<TaskResponse>(
      API_ENDPOINT,
      {
        model: 'gemini',
        task_type: 'gemini-2.5-flash-image',
        input: {
          prompt: `Create a photorealistic image showing the person from the first image wearing the exact clothing from the second image. Preserve the person's facial features, skin tone, hair, and body proportions. Apply the outfit naturally with proper fit, realistic fabric texture, appropriate shadows and highlights. Maintain the original background and lighting conditions. Ensure the clothing fits the person's body shape realistically.`,
          image_urls: [userImageUrl, outfitImageUrl],
          num_images: 1,
          output_format: 'png',
        },
        config: {
          webhook_config: {
            endpoint: '',
            secret: '',
          },
        },
      },
      {
        headers: {
          'X-API-Key': PI_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout for task creation
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
