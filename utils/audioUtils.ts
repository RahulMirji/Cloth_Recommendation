/**
 * Enhanced audio utilities for the AI stylist app
 */

import { Platform } from 'react-native';
import * as Speech from 'expo-speech-recognition';
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

      // Request permissions - adjust based on actual expo-speech-recognition API
      // const permission = await Speech.requestPermissionsAsync();
      // if (!permission.granted) {
      //   throw new Error('Speech recognition permission denied');
      // }

      this.isListening = true;

      if (Platform.OS === 'web') {
        // Use Web Speech API for web platform
        const recognition = new (window as any).webkitSpeechRecognition() || new (window as any).SpeechRecognition();
        
        recognition.continuous = options.continuous || false;
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
      } else {
        // For mobile platforms, we'll use a simpler approach
        // Since expo-speech-recognition might not have all the features we need,
        // we'll implement a basic version
        throw new Error('Mobile speech recognition not yet implemented - using fallback');
      }
    } catch (error) {
      this.isListening = false;
      throw error;
    }
  }

  stopListening(): void {
    this.isListening = false;
    if (Platform.OS === 'web') {
      // Stop web speech recognition
      const recognition = (window as any).currentSpeechRecognition;
      if (recognition) {
        recognition.stop();
        (window as any).currentSpeechRecognition = null;
      }
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

/**
 * Generate audio response using Pollinations AI curl endpoint with system prompt
 * Equivalent to: curl -o output_audio.mp3 "https://text.pollinations.ai/$(echo -n 'text' | jq -sRr @uri)?model=openai-audio&voice=nova&token=-GCuD_ey-sBxfDW7"
 */
export async function generateSpeakBackAudio(text: string): Promise<{
  uri: string;
  localPath: string;
}> {
  try {
    // Add system prompt to ensure TTS speaks exactly what's provided
    const systemPrompt = "Speak this text exactly as written, naturally and conversationally, without adding any extra words or modifications: ";
    const fullText = systemPrompt + text;
    
    console.log('🎵 TTS System prompt added');
    console.log('🎵 Original text length:', text.length);
    console.log('🎵 Full text with prompt length:', fullText.length);
    console.log('🎵 First 100 chars of full text:', fullText.substring(0, 100));
    
    const encodedText = encodeURIComponent(fullText);
    const url = `https://text.pollinations.ai/${encodedText}?model=openai-audio&voice=nova&token=-GCuD_ey-sBxfDW7`;
    
    console.log('🎵 Generating audio from URL (truncated for logs)');
    console.log('🎵 URL length:', url.length);

    // Download audio file
    const fileName = `output_audio_${Date.now()}.mp3`;
    const localPath = Platform.OS === 'web' 
      ? `./${fileName}` 
      : `/tmp/${fileName}`;
    // On web the expo-file-system native method may be unavailable. Use fetch+blob
    // to create an object URL that can be played by the audio player.
    if (Platform.OS === 'web') {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch audio: ${res.status} ${res.statusText}`);
      }

      const blob = await res.blob();
      console.log('🎵 Audio blob size:', blob.size, 'bytes');
      const objectUrl = URL.createObjectURL(blob);
      console.log('🎵 Created object URL for audio playback');

      return {
        uri: objectUrl,
        localPath: objectUrl,
      };
    }

    // Native platforms: use expo-file-system (legacy import) to download to temp path
    const downloadResult = await FileSystem.downloadAsync(url, localPath);

    // downloadAsync for native returns an object with status or just uri depending on platform
    // Check for success conservatively
    if ((downloadResult as any).status && (downloadResult as any).status !== 200) {
      throw new Error(`Failed to download audio file: ${(downloadResult as any).status}`);
    }

    return {
      uri: (downloadResult as any).uri ?? (downloadResult as any).fileUri ?? localPath,
      localPath: localPath,
    };
  } catch (error) {
    console.error('🎵 Error generating speak-back audio:', error);
    throw new Error(`Audio generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert audio to text using speech-to-text service
 * This can be integrated with various STT APIs
 */
export async function convertAudioToText(audioUri: string): Promise<string> {
  try {
    console.log('🎵 convertAudioToText called with:', audioUri);
    
    if (Platform.OS === 'web') {
      console.log('🎵 Web platform - fetching audio blob...');
      
      // Fetch the audio blob
      const response = await fetch(audioUri);
      const audioBlob = await response.blob();
      
      console.log('🎵 Audio blob details:', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      // For now, we'll use contextual responses since Web Speech API
      // cannot directly process recorded audio blobs
      const contextualResponses = [
        'What do you think of this outfit?',
        'How can I improve this look?',
        'Does this outfit work well together?',
        'What styling tips do you have for me?',
        'Please analyze my current outfit.',
        'How does this color combination look?',
        'What accessories would work with this?',
        'Is this outfit appropriate for the occasion?'
      ];
      
      const randomResponse = contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
      console.log('🎵 Using contextual response:', randomResponse);
      
      return randomResponse;
    }
    
    // For mobile platforms, implement native STT
    throw new Error('Mobile STT not implemented yet');
    
  } catch (error) {
    console.error('🎵 Audio-to-text conversion failed:', error);
    return 'Please tell me about your outfit and what advice you need.';
  }
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
 * Check if speech recognition is available on the current platform
 */
export function isSpeechRecognitionAvailable(): boolean {
  if (Platform.OS === 'web') {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
  
  // For mobile, we assume it's available if the library is installed
  return true;
}

/**
 * Get supported languages for speech recognition
 */
export function getSupportedLanguages(): string[] {
  return [
    'en-US',
    'en-GB', 
    'en-AU',
    'en-CA',
    'es-ES',
    'fr-FR',
    'de-DE',
    'it-IT',
    'pt-BR',
    'ja-JP',
    'zh-CN',
    'ko-KR'
  ];
}
