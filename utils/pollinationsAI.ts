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
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer -GCuD_ey-sBxfDW7',
      },
      body: JSON.stringify({
        model: 'gemini',
        messages: options.messages,
        stream: options.stream ?? false,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    if (options.stream) {
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
    stream: true,
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
