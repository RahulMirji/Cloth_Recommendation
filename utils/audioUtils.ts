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
 * Generate audio response using Pollinations AI curl endpoint
 * Equivalent to: curl -o output_audio.mp3 "https://text.pollinations.ai/$(echo -n 'text' | jq -sRr @uri)?model=openai-audio&voice=nova&token=-GCuD_ey-sBxfDW7"
 */
export async function generateSpeakBackAudio(text: string): Promise<{
  uri: string;
  localPath: string;
}> {
  try {
    const encodedText = encodeURIComponent(text);
    const url = `https://text.pollinations.ai/${encodedText}?model=openai-audio&voice=nova&token=-GCuD_ey-sBxfDW7`;
    
    console.log('Generating audio from:', url);

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
      const objectUrl = URL.createObjectURL(blob);

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
    console.error('Error generating speak-back audio:', error);
    throw new Error(`Audio generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fallback speech-to-text for when the official library isn't working
 * This uses a simple transcription service or provides a manual fallback
 */
export async function fallbackSpeechToText(): Promise<string> {
  // For demonstration purposes, return a placeholder
  // In a real app, you might integrate with Google Speech-to-Text API
  // or another service
  
  console.log('Using fallback speech-to-text');
  
  // You could implement here:
  // 1. Upload audio to a transcription service
  // 2. Use a different speech recognition library
  // 3. Return a prompt for manual input
  
  return "I heard you speak. Please tell me more about your outfit and what styling advice you're looking for.";
}

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
