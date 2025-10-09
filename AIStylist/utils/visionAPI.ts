/**
 * Vision API Service for Pollinations AI
 * Handles image analysis and vision-based AI interactions
 */

export interface VisionMessage {
  role: 'user' | 'assistant';
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

export interface VisionResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export interface VisionAPIRequest {
  model: string;
  messages: VisionMessage[];
  max_tokens: number;
}

class VisionAPIService {
  private readonly pollinationsUrl = 'https://text.pollinations.ai/openai';
  private readonly openaiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly defaultModel = 'openai';
  private readonly openaiModel = 'gpt-4-vision-preview';
  private readonly defaultMaxTokens = 300;
  
  /**
   * Get the appropriate API endpoint and headers
   */
  private getApiConfig(): { url: string; headers: Record<string, string>; model: string } {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    
    if (apiKey) {
      console.log('🔑 Using OpenAI official API');
      return {
        url: this.openaiUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        model: this.openaiModel,
      };
    }
    
    console.log('🌐 Using Pollinations AI API');
    return {
      url: this.pollinationsUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      model: this.defaultModel,
    };
  }

  /**
   * Analyze an image with optional text prompt (with retry logic)
   * @param imageUrl - URL of the image to analyze
   * @param textPrompt - Optional text prompt for context
   * @param maxTokens - Maximum tokens for response
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   */
  async analyzeImage(
    imageUrl: string,
    textPrompt: string = "What do you see in this image? Describe the clothing, style, colors, and overall fashion aesthetic.",
    maxTokens: number = this.defaultMaxTokens,
    maxRetries: number = 3
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Vision API attempt ${attempt}/${maxRetries}...`);
        
        const requestBody: VisionAPIRequest = {
          model: this.defaultModel,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: textPrompt },
                { 
                  type: 'image_url', 
                  image_url: { url: imageUrl } 
                }
              ]
            }
          ],
          max_tokens: maxTokens
        };

        if (attempt === 1) {
          console.log('Making vision API request with:', {
            imageUrl: imageUrl.substring(0, 50) + '...',
            textPrompt: textPrompt.substring(0, 100) + '...',
            maxTokens
          });
        }

        console.log('📤 Sending request to Vision API...');
        
        // Get API configuration (Pollinations or OpenAI)
        const apiConfig = this.getApiConfig();
        
        // Update model in request if using OpenAI
        if (apiConfig.model !== this.defaultModel) {
          requestBody.model = apiConfig.model;
        }
        
        // 🚀 OPTIMIZED TIMEOUT: 10s, 15s, 20s (much faster!)
        const timeout = 10000 + (attempt - 1) * 5000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(apiConfig.url, {
            method: 'POST',
            headers: apiConfig.headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          console.log('📥 Response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Vision API error response:', errorText);
            throw new Error(`Vision API request failed: ${response.status} ${response.statusText}`);
          }

          console.log('🔄 Parsing JSON response...');
          const data: VisionResponse = await response.json();
          console.log('✅ Response parsed successfully');
          
          if (!data.choices || data.choices.length === 0) {
            console.error('❌ No choices in response');
            throw new Error('No response from vision API');
          }

          const content = data.choices[0].message.content;
          console.log(`✅ Vision API success on attempt ${attempt}`);
          console.log('📝 Response preview:', content.substring(0, 150) + '...');

          return content;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            const timeoutSeconds = timeout / 1000;
            console.error(`❌ Vision API request timed out after ${timeoutSeconds} seconds`);
            throw new Error(`Vision API request timed out after ${timeoutSeconds}s`);
          }
          throw fetchError;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ Vision API attempt ${attempt}/${maxRetries} failed:`, lastError.message);

        // Check if it's a 502 Bad Gateway error
        const is502Error = lastError.message.includes('502') || 
                          lastError.message.includes('Bad Gateway') ||
                          lastError.message.includes('cloudflared');

        if (is502Error && attempt === maxRetries) {
          // Service is down - return friendly fallback message
          console.warn('⚠️ Vision API service unavailable (502), returning offline fallback');
          return "I'm having trouble connecting right now. Your outfit looks great! The colors and style work well together. Try asking me again in a moment when the connection is better.";
        }

        // If this isn't the last attempt, wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = is502Error ? 5000 : Math.min(2000 * Math.pow(2, attempt - 1), 8000);
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed - check if we should return fallback
    const errorMessage = lastError?.message || 'Unknown error';
    const is502Error = errorMessage.includes('502') || 
                      errorMessage.includes('Bad Gateway') ||
                      errorMessage.includes('cloudflared');
    
    if (is502Error) {
      console.warn('⚠️ Vision API service unavailable, returning offline fallback');
      return "I'm having trouble connecting to my AI service right now. Your outfit looks great! Try asking me again in a moment when the connection is better.";
    }

    console.error(`❌ All ${maxRetries} Vision API attempts failed:`, lastError);
    throw new Error(`Failed to analyze image after ${maxRetries} attempts: ${errorMessage}`);
  }

  /**
   * Analyze outfit for style recommendations
   * @param imageUrl - URL of the outfit image
   */
  async analyzeOutfit(imageUrl: string): Promise<string> {
    const prompt = `Analyze this outfit image and provide:
1. Description of clothing items and colors
2. Style assessment (casual, formal, trendy, etc.)
3. What works well in this outfit
4. Suggestions for improvement or alternatives
5. Occasion recommendations
Please be specific and constructive in your feedback.`;

    return this.analyzeImage(imageUrl, prompt, 400);
  }

  /**
   * Get fashion advice based on image
   * @param imageUrl - URL of the fashion image
   * @param specificQuestion - Specific question about the outfit
   */
  async getFashionAdvice(imageUrl: string, specificQuestion?: string): Promise<string> {
    const basePrompt = "As a fashion stylist, analyze this outfit and provide professional styling advice.";
    const prompt = specificQuestion 
      ? `${basePrompt} ${specificQuestion}`
      : `${basePrompt} Focus on color coordination, fit, style appropriateness, and suggest improvements.`;

    return this.analyzeImage(imageUrl, prompt, 350);
  }

  /**
   * Continuous chat with vision - for live chat feature
   * @param imageUrl - Current image URL
   * @param userMessage - User's spoken message converted to text
   * @param conversationContext - Previous conversation context
   */
  async continuousVisionChat(
    imageUrl: string,
    userMessage: string,
    conversationContext?: string
  ): Promise<string> {
    const contextPrompt = conversationContext 
      ? `Previous conversation: ${conversationContext}\n\n` 
      : '';
    
    const prompt = `${contextPrompt}User says: "${userMessage}"

CRITICAL RULES:
1. Keep response under 30 words (5-8 seconds of speech)
2. Answer ONLY what was asked
3. Be conversational and natural
4. Use 2-3 short sentences maximum

Respond as a helpful fashion AI assistant. Look at the image and respond to the user's question.`;

    // 🚀 OPTIMIZED: 60 tokens max (was 80), 2 retries only (was 3)
    return this.analyzeImage(imageUrl, prompt, 60, 2);
  }

  /**
   * Quick outfit rating
   * @param imageUrl - URL of the outfit image
   */
  async rateOutfit(imageUrl: string): Promise<string> {
    const prompt = `Rate this outfit on a scale of 1-10 and explain why. Consider:
- Color coordination
- Fit and proportions  
- Style coherence
- Overall aesthetic appeal
Give a brief, friendly rating with key points.`;

    return this.analyzeImage(imageUrl, prompt, 150);
  }
}

export const visionAPI = new VisionAPIService();
export default visionAPI;