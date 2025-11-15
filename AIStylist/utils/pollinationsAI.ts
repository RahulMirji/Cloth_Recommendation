import { Platform } from 'react-native';

export interface TextGenerationMessage {
  role: 'user' | 'assistant';
  content: string | ({ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } })[];
}

export interface TextGenerationOptions {
  messages: TextGenerationMessage[];
  stream?: boolean;
}

export async function generateText(options: TextGenerationOptions): Promise<string> {
  try {
    // Disable streaming on mobile as ReadableStream is not supported in React Native
    const shouldStream = Platform.OS === 'web' && (options.stream ?? false);
    // Helper to safely stringify messages for logging (truncate large data URIs)
    const safeMessagesForLog = (msgs: TextGenerationMessage[]) => {
      try {
        return JSON.stringify(msgs, (key, value) => {
          if (typeof value === 'string' && value.startsWith && value.startsWith('data:image')) {
            // don't log full base64 image; truncate for diagnostics
            return `[DATA_URI length=${value.length} truncated]`;
          }
          return value;
        });
      } catch (e) {
        return '[unserializable messages]';
      }
    };

    const endpoint = process.env.EXPO_PUBLIC_POLLINATIONS_API_ENDPOINT || 'https://text.pollinations.ai/openai';
    const token = process.env.EXPO_PUBLIC_POLLINATIONS_API_TOKEN || '';
    
    const initialUrl = endpoint;
    const initialBody = {
      model: 'gemini',
      messages: options.messages,
      stream: shouldStream,
    };

    // Add timeout to detect service unavailability quickly
    // Increased timeout for image analysis (outfit scoring with vision takes longer)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for image analysis

    const response = await fetch(initialUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(initialBody),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      // Capture server response for debugging
      const errorText = await response.text();

      // Try a safe retry: use token query param and simplify message shapes to plain text
      try {
        const retryUrl = `${endpoint}?token=${encodeURIComponent(token)}`;

        // Simplify message shapes: convert any array/object content into a readable text
        const simplifyMessages = (msgs: TextGenerationMessage[]) => {
          return msgs.map(m => {
            let contentStr = '';
            if (Array.isArray(m.content)) {
              contentStr = m.content.map(c => {
                if (typeof c === 'string') return c;
                if ((c as any).type === 'text') return (c as any).text;
                if ((c as any).type === 'image_url') {
                  const url = (c as any).image_url?.url || '';
                  if (typeof url === 'string' && url.startsWith('data:image')) {
                    return `[image data URI length=${url.length} truncated]`;
                  }
                  return `[image: ${url}]`;
                }
                return '';
              }).join('\n');
            } else if (typeof m.content === 'string') {
              contentStr = m.content;
            } else {
              try {
                contentStr = JSON.stringify(m.content);
              } catch (e) {
                contentStr = String(m.content);
              }
            }

            return { role: m.role, content: contentStr };
          });
        };

        const retryBody = {
          model: 'gpt-3.5-turbo',
          messages: simplifyMessages(options.messages),
          stream: shouldStream,
        };

        const retryResp = await fetch(retryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(retryBody),
        });

        if (!retryResp.ok) {
          const retryText = await retryResp.text();
          throw new Error(`API request failed after retry: ${retryResp.status} - ${retryText}`);
        }

        // If streaming, fall back to non-stream parse in retry for simplicity
        if (shouldStream) {
          const data = await retryResp.json();
          return data.choices?.[0]?.message?.content || '';
        }

        const retryData = await retryResp.json();
        return retryData.choices?.[0]?.message?.content || '';
      } catch (retryError) {
        throw new Error(`API request failed: ${response.status} - ${errorText}; retry error: ${retryError instanceof Error ? retryError.message : String(retryError)}`);
      }
    }

    if (shouldStream) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

        for (const line of lines) {
          try {
            const jsonStr = line.replace('data:', '').trim();
            if (jsonStr === '[DONE]') continue;
            
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
            }
          } catch (e) {
            // Ignore parsing errors for invalid chunks
          }
        }
      }

      return fullText;
    } else {
      // Non-streaming mode (used on mobile)
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    }
  } catch (error) {
    console.error('Error generating text:', error);
    
    // Check if it's an abort error (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('⚠️ Request timed out - API is taking too long to respond');
      throw new Error('The AI is taking too long to respond. Please try again with a smaller image or check your internet connection.');
    }
    
    // Check if it's a 502 Bad Gateway or network error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway') || 
        errorMessage.includes('cloudflared') || errorMessage.includes('aborted')) {
      // Service is down - return friendly offline message
      console.warn('⚠️ Pollinations AI service appears to be down, returning offline fallback');
      return "I'm having trouble connecting to my AI service right now. The outfit looks great! Try asking me again in a moment when the connection is better.";
    }
    
    throw error;
  }
}

export async function generateTextWithImage(
  imageBase64: string,
  prompt: string
): Promise<string> {
  const imageUrl = imageBase64.startsWith('data:') 
    ? imageBase64 
    : `data:image/jpeg;base64,${imageBase64}`;

  // Stream only on web, use non-streaming on mobile
  const shouldStream = Platform.OS === 'web';

  return generateText({
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
