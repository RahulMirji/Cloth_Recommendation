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
  private readonly baseUrl = 'https://text.pollinations.ai/openai';
  private readonly defaultModel = 'openai';
  private readonly defaultMaxTokens = 300;

  /**
   * Analyze an image with optional text prompt
   * @param imageUrl - URL of the image to analyze
   * @param textPrompt - Optional text prompt for context
   * @param maxTokens - Maximum tokens for response
   */
  async analyzeImage(
    imageUrl: string,
    textPrompt: string = "What do you see in this image? Describe the clothing, style, colors, and overall fashion aesthetic.",
    maxTokens: number = this.defaultMaxTokens
  ): Promise<string> {
    try {
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

      console.log('Making vision API request with:', {
        imageUrl,
        textPrompt,
        maxTokens
      });

      console.log('📤 Sending request to Vision API...');
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
        console.log('📊 Response data:', JSON.stringify(data, null, 2));
        
        if (!data.choices || data.choices.length === 0) {
          console.error('❌ No choices in response');
          throw new Error('No response from vision API');
        }

        const content = data.choices[0].message.content;
        console.log('✅ Vision API response content:', content.substring(0, 200) + '...');

        return content;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('❌ Vision API request timed out after 30 seconds');
          throw new Error('Vision API request timed out');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Vision API Error:', error);
      throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    
    const prompt = `${contextPrompt}User says: "${userMessage}"\n\nPlease respond as a helpful fashion AI assistant. Look at the current image and respond to what the user is asking about the outfit, clothing, or style. Keep responses conversational and friendly, as this is a live voice chat.`;

    return this.analyzeImage(imageUrl, prompt, 200);
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