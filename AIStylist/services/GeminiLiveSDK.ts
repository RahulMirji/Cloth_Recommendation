/**
 * Gemini Live using @google/genai SDK on React Native
 * Attempts to use the official SDK with polyfills
 */

import '../utils/geminiPolyfills';
import { CameraView } from 'expo-camera';

export interface GeminiLiveSDKSession {
  isActive: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  videoEnabled: boolean;
  userTranscription: string;
  modelTranscription: string;
  error: string | null;
}

export interface GeminiLiveSDKCallbacks {
  onSessionUpdate: (session: Partial<GeminiLiveSDKSession>) => void;
  onError: (error: string) => void;
  onTranscription: (type: 'user' | 'model', text: string) => void;
  onAudioResponse: (audioData: string) => void;
}

/**
 * Gemini Live Manager using official SDK
 */
export class GeminiLiveSDK {
  private apiKey: string;
  private session: any = null;
  private cameraRef: CameraView | null = null;
  private callbacks: GeminiLiveSDKCallbacks | null = null;
  private videoEnabled: boolean = true;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async startSession(
    cameraRef: CameraView,
    callbacks: GeminiLiveSDKCallbacks,
    options?: { videoEnabled?: boolean }
  ): Promise<void> {
    this.cameraRef = cameraRef;
    this.callbacks = callbacks;
    this.videoEnabled = options?.videoEnabled !== false;

    console.log('🚀 Attempting to use @google/genai SDK on React Native...');
    callbacks.onSessionUpdate({ isConnecting: true, error: null });

    try {
      // Try to import the SDK
      const { GoogleGenAI } = await import('@google/genai');
      console.log('✅ @google/genai SDK loaded successfully!');

      const ai = new GoogleGenAI({ apiKey: this.apiKey });
      console.log('✅ GoogleGenAI instance created');

      // Check if live API is available
      if (!ai.live) {
        throw new Error('@google/genai SDK does not support live API on this platform');
      }

      console.log('✅ Live API available, attempting to connect...');

      // Try to connect
      this.session = await ai.live.connect({
        model: 'models/gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          systemInstruction: 'You are a professional AI stylist.',
          responseModalities: ['AUDIO'],
        },
        callbacks: {
          onopen: () => {
            console.log('✅ SDK session opened!');
            callbacks.onSessionUpdate({ isActive: true, isConnecting: false });
          },
          onmessage: (message: any) => {
            console.log('📨 SDK message:', message);
            // Handle messages
          },
          onerror: (error: any) => {
            console.error('❌ SDK error:', error);
            callbacks.onError(error.message || 'SDK error');
          },
          onclose: () => {
            console.log('🔌 SDK session closed');
            callbacks.onSessionUpdate({ isActive: false });
          },
        },
      });

      console.log('✅ SDK session established!');
    } catch (error) {
      console.error('❌ Failed to use SDK:', error);
      const message = error instanceof Error ? error.message : 'Failed to initialize SDK';
      
      if (message.includes('live') || message.includes('not support')) {
        callbacks.onError('The @google/genai SDK does not support live API on React Native. Using fallback WebSocket implementation.');
      } else {
        callbacks.onError(message);
      }
      
      callbacks.onSessionUpdate({ isConnecting: false, error: message });
    }
  }

  async stopSession(): Promise<void> {
    if (this.session) {
      try {
        await this.session.close();
      } catch (error) {
        console.warn('Error closing SDK session:', error);
      }
      this.session = null;
    }
  }
}
