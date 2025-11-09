/**
 * Multi-Model AI Provider
 * 
 * Supports multiple free, open-source AI vision models.
 * Users can select their preferred model from the UI.
 * 
 * Providers:
 * - 'pollinations': Free proxy API (OpenAI-compatible format)
 * - 'gemini': Official Google Gemini API (Google format)
 * - 'huggingface': Hugging Face Inference API
 */

import { Platform } from 'react-native';
import { AIModel } from './aiModels';
import { callGeminiAPI } from './geminiAPI';

export interface TextGenerationMessage {
  role: 'user' | 'assistant';
  content: string | ({ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } })[];
}

export interface TextGenerationOptions {
  messages: TextGenerationMessage[];
  stream?: boolean;
  model?: string; // Model name to use
}

/**
 * Generate text with image using specified AI model
 */
export async function generateTextWithModel(
  model: AIModel,
  options: TextGenerationOptions
): Promise<string> {
  try {
    // Disable streaming on mobile as ReadableStream is not supported in React Native
    const shouldStream = Platform.OS === 'web' && (options.stream ?? false);

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🟢 POLLINATIONS API CALL STARTING');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`🤖 Model: ${model.name} (${model.modelName})`);
    console.log('🌐 Endpoint:', model.endpoint);
    console.log('📤 Provider: Pollinations Proxy');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout
    
    const startTime = Date.now();

    const requestBody = {
      model: model.modelName,
      messages: options.messages,
      stream: shouldStream,
    };

    console.log('⏳ Sending request to Pollinations API...');
    
    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer -GCuD_ey-sBxfDW7',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const fetchTime = Date.now() - startTime;
    console.log(`⚡ Response received in ${fetchTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Model ${model.name} failed:`, errorText);
      throw new Error(`${model.name} API error: ${response.status} - ${errorText}`);
    }

    // Handle streaming vs non-streaming
    if (shouldStream && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              fullText += content;
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      return fullText;
    } else {
      // Non-streaming response
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
      
      if (!content) {
        console.error('❌ Empty response data:', JSON.stringify(data, null, 2));
        throw new Error('Empty response from AI model');
      }

      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ POLLINATIONS API SUCCESS');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📊 Response length:', content.length, 'characters');
      console.log('⏱️  Total time:', Date.now() - startTime, 'ms');
      console.log('🎯 Source: Pollinations Proxy → Gemini');
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      
      return content;
    }
  } catch (error) {
    console.error(`❌ Error with ${model.name}:`, error);
    throw error;
  }
}

/**
 * Generate text with image using a specific model
 */
export async function generateTextWithImageModel(
  model: AIModel,
  imageBase64: string,
  prompt: string
): Promise<string> {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║           🚀 AI MODEL REQUEST ROUTING                ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📋 Model Info:');
  console.log('   Name:', model.name);
  console.log('   ID:', model.id);
  console.log('   Provider:', model.provider);
  console.log('   Model Name:', model.modelName);
  console.log('');
  
  // Route to official Gemini API if provider is 'gemini'
  if (model.provider === 'gemini') {
    console.log('🔀 ROUTING DECISION: Official Gemini API');
    console.log('   ✅ Provider is "gemini" - using Google\'s official API');
    console.log('   🌐 Direct connection to Google servers');
    console.log('');
    return callGeminiAPI(model.modelName, prompt, imageBase64);
  }

  // Otherwise use existing Pollinations/OpenAI-compatible flow
  console.log('🔀 ROUTING DECISION: Pollinations Proxy API');
  console.log('   ✅ Provider is "pollinations" - using free proxy');
  console.log('   🌐 Connection via Pollinations proxy');
  console.log('');
  
  const imageUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  // Stream only on web, use non-streaming on mobile
  const shouldStream = Platform.OS === 'web';

  return generateTextWithModel(model, {
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    stream: shouldStream,
  });
}

/**
 * Convert image to base64 (unchanged from original)
 */
export async function convertImageToBase64(uri: string): Promise<string> {
  try {
    if (uri.startsWith('data:')) {
      return uri;
    }

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image as base64'));
        reader.readAsDataURL(blob);
      });
    } else {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (!result) {
            reject(new Error('Failed to convert image to base64'));
            return;
          }
          resolve(result);
        };
        reader.onerror = () => reject(new Error('Failed to read image as base64'));
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error(`Image conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
