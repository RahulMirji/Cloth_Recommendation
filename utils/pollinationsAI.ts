import { Platform } from 'react-native';

export interface TextGenerationMessage {
  role: 'user' | 'assistant';
  content: string | ({ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } })[];
}

export interface TextGenerationOptions {
  messages: TextGenerationMessage[];
  stream?: boolean;
}

export interface AudioGenerationOptions {
  text: string;
  model?: string;
  voice?: string;
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

    const initialUrl = 'https://text.pollinations.ai/openai';
    const initialBody = {
      model: 'gemini',
      messages: options.messages,
      stream: shouldStream,
    };

    console.log('[pollinations] POST', initialUrl, 'body:', safeMessagesForLog(options.messages));

    const response = await fetch(initialUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer -GCuD_ey-sBxfDW7',
      },
      body: JSON.stringify(initialBody),
    });

    if (!response.ok) {
      // Capture server response for debugging
      const errorText = await response.text();
      console.error('[pollinations] Initial API Error Response:', errorText);

      // Try a safe retry: use token query param and simplify message shapes to plain text
      try {
        const token = '-GCuD_ey-sBxfDW7';
        const retryUrl = `https://text.pollinations.ai/openai?token=${encodeURIComponent(token)}`;

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

        console.log('[pollinations] Retrying POST', retryUrl, 'body:', JSON.stringify(retryBody));

        const retryResp = await fetch(retryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(retryBody),
        });

        if (!retryResp.ok) {
          const retryText = await retryResp.text();
          console.error('[pollinations] Retry API Error Response:', retryText);
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
        console.error('[pollinations] Retry failed:', retryError);
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
            console.log('Error parsing chunk:', e);
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

export async function generateAudioResponse(options: AudioGenerationOptions): Promise<string> {
  try {
    const encodedText = encodeURIComponent(options.text);
    const model = options.model || 'openai-audio';
    const voice = options.voice || 'nova';
    
    const url = `https://text.pollinations.ai/${encodedText}?model=${model}&voice=${voice}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Audio generation failed: ${response.status}`);
    }

    const blob = await response.blob();
    
    if (Platform.OS === 'web') {
      return URL.createObjectURL(blob);
    } else {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.error('Error generating audio:', error);
    throw error;
  }
}

export async function convertImageToBase64(uri: string): Promise<string> {
  try {
    if (uri.startsWith('data:')) {
      return uri;
    }

    console.log('Converting image from URI:', uri);

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
