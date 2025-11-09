/**
 * Official Google Gemini API Integration
 * 
 * This module handles direct communication with Google's Gemini API
 * (not via Pollinations proxy). Provides vision capabilities for outfit analysis.
 * 
 * API Documentation: https://ai.google.dev/api/rest
 * Models: gemini-flash-lite-latest, gemini-1.5-flash, gemini-1.5-pro
 */

import Constants from 'expo-constants';

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiRequest {
  contents: Array<{
    parts: GeminiPart[];
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}

/**
 * Call official Google Gemini API for vision tasks
 * 
 * @param modelName - Gemini model name (e.g., 'gemini-2.0-flash-exp')
 * @param prompt - Text prompt for analysis
 * @param imageBase64 - Optional base64-encoded image (with or without data URI prefix)
 * @returns AI-generated text response
 */
export async function callGeminiAPI(
  modelName: string,
  prompt: string,
  imageBase64?: string
): Promise<string> {
  // Get API key from environment
  const apiKey = Constants.expoConfig?.extra?.geminiApiKey || 
                 process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Gemini API key not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.\n\n' +
      'Get a free API key at: https://aistudio.google.com/app/apikey'
    );
  }

  // Construct API endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  // Build request parts (text + optional image)
  const parts: GeminiPart[] = [{ text: prompt }];

  if (imageBase64) {
    // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data,
      },
    });
  }

  // Configure generation parameters
  const requestBody: GeminiRequest = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.4,        // Lower = more consistent, Higher = more creative
      topK: 32,                // Consider top 32 tokens
      topP: 1,                 // Nucleus sampling threshold
      maxOutputTokens: 2048,   // Max response length
    },
  };

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔵 OFFICIAL GEMINI API CALL STARTING');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🤖 Model:', modelName);
  console.log('📸 Image included:', !!imageBase64);
  console.log('🌐 Endpoint:', url.substring(0, 80) + '...');
  console.log('📝 Prompt length:', prompt.length, 'characters');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // Set timeout for long-running requests
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const startTime = Date.now();
    console.log('⏳ Sending request to Google Gemini API...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    const fetchTime = Date.now() - startTime;
    console.log(`⚡ Response received in ${fetchTime}ms`);
    
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error response:', errorText);
      
      // Parse error for better user feedback
      let errorMessage = `Gemini API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {
        // Use raw error text if not JSON
        errorMessage = errorText;
      }
      
      throw new Error(errorMessage);
    }

    const data: GeminiResponse = await response.json();

    // Extract text from Gemini's response format
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      // Check if response was blocked
      if (data.promptFeedback?.blockReason) {
        throw new Error(`Content blocked by Gemini: ${data.promptFeedback.blockReason}`);
      }
      
      console.error('❌ Empty response from Gemini:', JSON.stringify(data, null, 2));
      throw new Error('Empty response from Gemini API. The model may have refused to respond.');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ OFFICIAL GEMINI API SUCCESS');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Response length:', text.length, 'characters');
    console.log('⏱️  Total time:', Date.now() - startTime, 'ms');
    console.log('🎯 Source: Google Gemini API (DIRECT)');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    
    return text;

  } catch (error) {
    clearTimeout(timeout);
    
    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'Gemini API timeout - request took too long (>60s).\n\n' +
        'Try with a smaller image or check your internet connection.'
      );
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'Network error connecting to Gemini API.\n\n' +
        'Please check your internet connection and try again.'
      );
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Test the Gemini API connection (text-only, no image)
 * Useful for verifying API key and connectivity
 */
export async function testGeminiConnection(modelName: string = 'gemini-flash-lite-latest'): Promise<boolean> {
  try {
    const response = await callGeminiAPI(modelName, 'Say "Hello, I am working!" in exactly those words.');
    return response.toLowerCase().includes('working');
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
}
