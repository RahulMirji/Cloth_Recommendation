/**
 * Enhanced audio utilities for the AI stylist app
 */

import { Platform } from 'react-native';
// On-device TTS
import * as ExpoSpeech from 'expo-speech';
// Dynamically import native Voice to avoid web bundling issues
let Voice: any = null;

// Initialize Voice only on native platforms
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Voice = require('@react-native-voice/voice').default;
    console.log('🎤 Voice module loaded:', typeof Voice);
  } catch (error) {
    console.warn('⚠️ Failed to load Voice module:', error);
    Voice = null;
  }
}
// Use the legacy API for downloadAsync to avoid the new File/Directory migration
// and to prevent the deprecation runtime error in older SDK usage.
import * as FileSystem from 'expo-file-system/legacy';

export interface SpeechRecognitionOptions {
  autoStart?: boolean;
  timeout?: number;
  continuous?: boolean;
}

export interface SpeechRecognitionResult {
  text: string;
  confidence: number;
  isFinal?: boolean;
}

export class SpeechToTextService {
  private isListening = false;
  private voiceHandlersSet = false;
  private pendingTimeout: any = null;
  private static instance: SpeechToTextService;

  static getInstance(): SpeechToTextService {
    if (!this.instance) {
      this.instance = new SpeechToTextService();
    }
    return this.instance;
  }

  async startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError?: (error: Error) => void,
    options: SpeechRecognitionOptions = {}
  ): Promise<void> {
    try {
      if (this.isListening) {
        throw new Error('Speech recognition is already running');
      }
      this.isListening = true;
      const useContinuous = options.continuous || false;

      if (Platform.OS === 'web') {
        // Use Web Speech API for web platform
        const recognition = new (window as any).webkitSpeechRecognition() || new (window as any).SpeechRecognition();

        recognition.continuous = useContinuous;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const result = event.results[event.results.length - 1];
          onResult({
            text: result[0].transcript,
            confidence: result[0].confidence || 0.8,
            isFinal: result.isFinal
          });
        };

        recognition.onerror = (event: any) => {
          onError?.(new Error(`Speech recognition error: ${event.error}`));
          this.isListening = false;
        };

        recognition.onend = () => {
          this.isListening = false;
        };

        recognition.start();
        (window as any).currentSpeechRecognition = recognition;
      } else {
        if (!Voice) {
          this.isListening = false;
          console.error('❌ Voice module not available');
          throw new Error('Voice recognition not available. Using fallback audio recording.');
        }

        console.log('🎤 Initializing Voice recognition...');
        console.log('🎤 Voice methods:', Object.keys(Voice));

        // Clean up any previous session
        try {
          await Voice.destroy();
          console.log('🎤 Previous Voice session destroyed');
        } catch (e) {
          console.log('🎤 No previous session to destroy');
        }

        if (!this.voiceHandlersSet) {
          Voice.onSpeechError = (e: any) => {
            console.error('🎤 Speech error:', e);
            onError?.(new Error(e?.error?.message || 'Speech error'));
          };
          Voice.onSpeechResults = (e: any) => {
            console.log('🎤 Speech results:', e);
            const values: string[] = e?.value || [];
            const text = values[0] || '';
            if (text) onResult({ text, confidence: 0.9, isFinal: true });
          };
          Voice.onSpeechPartialResults = (e: any) => {
            const values: string[] = e?.value || [];
            const text = values[0] || '';
            if (text) onResult({ text, confidence: 0.6, isFinal: false });
          };
          this.voiceHandlersSet = true;
          console.log('🎤 Voice handlers set');
        }

        console.log('🎤 Starting Voice recognition...');
        await Voice.start('en-US', {
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 500,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 500,
          EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 300,
        });
        console.log('🎤 Voice recognition started successfully');

        if (options.timeout && options.timeout > 0) {
          this.pendingTimeout = setTimeout(async () => {
            try { await Voice.stop(); } catch { }
            this.isListening = false;
          }, options.timeout);
        }
      }
    } catch (error) {
      this.isListening = false;
      throw error;
    }
  }

  stopListening(): void {
    this.isListening = false;
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
    if (Platform.OS === 'web') {
      const recognition = (window as any).currentSpeechRecognition;
      if (recognition) {
        recognition.stop();
        (window as any).currentSpeechRecognition = null;
      }
    } else if (Voice) {
      try { Voice.stop(); } catch { }
      try { Voice.destroy().then(() => { }); } catch { }
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

/**
 * Generate audio response using Pollinations AI curl endpoint
 * Equivalent to: curl -o output_audio.mp3 "https://text.pollinations.ai/$(echo -n 'text' | jq -sRr @uri)?model=openai-audio&voice=nova&token=-GCuD_ey-sBxfDW7"
 * 
 * @param text - The text to convert to speech
 * @param voice - Voice model to use: alloy, echo, fable, onyx, nova (default), shimmer
 */
export async function generateSpeakBackAudio(
  text: string, 
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'
): Promise<{
  uri: string;
  localPath: string;
}> {
  try {
    // Encode text directly without system prompt for more natural TTS
    const encodedText = encodeURIComponent(text);
    const url = `https://text.pollinations.ai/${encodedText}?model=openai-audio&voice=${voice}&token=-GCuD_ey-sBxfDW7`;

    // Low-latency: return the remote URL directly so the player can stream it.
    // Perform a lightweight HEAD request with timeout to fail fast if unreachable.
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      await fetch(url, { method: 'HEAD', signal: controller.signal }).catch(() => {
        // Some CDNs may not support HEAD; ignore and rely on player fetch.
      });
      clearTimeout(timeout);
    } catch (_e) {
      // Ignore network probe errors; the audio player will attempt to stream the URL.
    }

    return {
      uri: url,
      localPath: url,
    };
  } catch (error) {
    console.error('🎵 Error generating speak-back audio:', error);
    throw new Error(`Audio generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert audio to text using speech-to-text service with retry logic
 * This can be integrated with various STT APIs
 * 
 * @param audioUri - URI of the audio file to transcribe
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 */
export async function convertAudioToText(
  audioUri: string,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🎵 STT Attempt ${attempt}/${maxRetries}`);

      // Fast STT via OpenAI Whisper if API key is provided (works on web and native)
      const apiKey = (process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY) as string | undefined;

      if (apiKey) {
        // Fetch audio as Blob/File across platforms
        const response = await fetch(audioUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch recorded audio: ${response.status}`);
        }
        const audioBlob = await response.blob();

        const form = new FormData();
        const fileName = `speech_${Date.now()}.webm`;
        form.append('file', (Platform.OS === 'web'
          ? new File([audioBlob], fileName, { type: audioBlob.type || 'audio/webm' })
          : ({ uri: audioUri, name: fileName, type: 'audio/webm' } as any)) as any);
        form.append('model', 'whisper-1');
        form.append('response_format', 'json');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        
        try {
          const sttResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            body: form,
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (!sttResp.ok) {
            const errText = await sttResp.text().catch(() => '');
            throw new Error(`STT failed: ${sttResp.status} ${sttResp.statusText} ${errText}`);
          }
          
          const data = await sttResp.json();
          const text: string = data.text || '';
          
          if (text.trim().length === 0) {
            throw new Error('Empty transcription');
          }
          
          console.log(`✅ STT Success on attempt ${attempt}`);
          return text;
        } catch (fetchError) {
          clearTimeout(timeout);
          throw fetchError;
        }
      }

      // Fallback behavior without API key
      if (Platform.OS === 'web') {
        // Defer to on-device recognition where available (handled by startListening);
        // here, for recorded audio on web, return a short prompt fallback.
        return 'Please analyze my outfit and suggest improvements.';
      }

      // Native fallback
      return 'Please describe my outfit and give styling advice.';

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ STT Attempt ${attempt}/${maxRetries} failed:`, lastError.message);

      // If this isn't the last attempt, wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // All retries failed
  console.error(`❌ All ${maxRetries} STT attempts failed:`, lastError);
  throw new Error(`Speech transcription failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Alternative: Google Speech-to-Text integration (when you have API key)
 * Uncomment and configure when ready to use real STT service
 */
/*
export async function convertAudioToTextGoogle(audioBlob: Blob): Promise<string> {
  const GOOGLE_API_KEY = 'your-google-api-key';
  
  // Convert blob to base64
  const base64Audio = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(audioBlob);
  });
  
  const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
      },
      audio: {
        content: base64Audio,
      },
    }),
  });
  
  const result = await response.json();
  
  if (result.results && result.results.length > 0) {
    return result.results[0].alternatives[0].transcript;
  }
  
  throw new Error('No transcription result');
}
*/

/**
 * Chunk text into sentences for streaming TTS
 */
function chunkTextIntoSentences(text: string): string[] {
  // Split by sentence boundaries (., !, ?)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Filter empty and merge very short sentences
  const chunks: string[] = [];
  let buffer = '';
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    
    // If sentence is very short (< 10 chars), buffer it
    if (trimmed.length < 10) {
      buffer += ' ' + trimmed;
    } else {
      // If we have buffered text, combine it
      if (buffer) {
        chunks.push((buffer + ' ' + trimmed).trim());
        buffer = '';
      } else {
        chunks.push(trimmed);
      }
    }
  }
  
  // Add remaining buffer
  if (buffer) {
    chunks.push(buffer.trim());
  }
  
  return chunks.filter(c => c.length > 0);
}

/**
 * Speak text locally with sentence chunking for streaming effect
 * @param text - Text to speak
 * @param enableChunking - Whether to chunk into sentences (default: true)
 */
export async function speakTextLocal(text: string, enableChunking: boolean = true): Promise<void> {
  if (Platform.OS === 'web') {
    return Promise.resolve();
  }

  try {
    // Stop any ongoing speech
    await ExpoSpeech.stop();

    if (!enableChunking || text.length < 50) {
      // Short text, speak all at once
      return new Promise<void>((resolve) => {
        ExpoSpeech.speak(text, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.95,
          onDone: () => resolve(),
          onStopped: () => resolve(),
          onError: () => resolve(),
        } as any);
      });
    }

    // 🚀 STREAMING TTS: Chunk into sentences and speak progressively
    const chunks = chunkTextIntoSentences(text);
    console.log(`🎵 Chunked response into ${chunks.length} parts for streaming TTS`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`🎵 Speaking chunk ${i + 1}/${chunks.length}: "${chunk.substring(0, 30)}..."`);
      
      await new Promise<void>((resolve) => {
        ExpoSpeech.speak(chunk, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.95,
          onDone: () => {
            console.log(`✅ Chunk ${i + 1} done`);
            resolve();
          },
          onStopped: () => resolve(),
          onError: (error: any) => {
            console.warn(`⚠️ Chunk ${i + 1} error:`, error);
            resolve();
          },
        } as any);
      });

      // Small delay between chunks for natural pacing
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log('✅ All TTS chunks complete');
  } catch (error) {
    console.error('❌ TTS error:', error);
  }
}


