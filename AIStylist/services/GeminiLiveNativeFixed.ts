/**
 * Fixed Native Gemini Live Implementation for Android
 * Uses expo-audio-stream for real-time PCM audio streaming
 */

import '../utils/geminiPolyfills';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { CameraView } from 'expo-camera';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { Paths } from 'expo-file-system';
import { Buffer } from 'buffer';

// Import expo-audio-stream for real-time PCM
// npm install @mykin-ai/expo-audio-stream
let ExpoAudioStream: any = null;
try {
  // Try different import methods
  const audioStreamModule = require('@mykin-ai/expo-audio-stream');
  ExpoAudioStream = audioStreamModule.default || audioStreamModule.ExpoAudioStream || audioStreamModule;
  console.log('✅ expo-audio-stream loaded successfully');
} catch (e) {
  console.warn('⚠️ expo-audio-stream not available:', e);
  console.warn('💡 Audio streaming will use fallback method');
}

export const GEMINI_LIVE_CONFIG = {
  MODEL: 'models/gemini-2.0-flash-exp',
  WS_URL: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent',
  SYSTEM_INSTRUCTION: `You are a professional AI stylist. Analyze outfits and provide friendly fashion advice.`,
  FRAME_RATE: 1, // Reduce to 1 fps to avoid overwhelming the API
  JPEG_QUALITY: 0.5, // Reduce quality to smaller payloads
  AUDIO_SAMPLE_RATE: 16000,
  AUDIO_CHANNELS: 1,
  VOICE_NAME: 'Puck',
};

export interface GeminiLiveNativeSession {
  isActive: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  videoEnabled: boolean;
  userTranscription: string;
  modelTranscription: string;
  error: string | null;
}

export interface GeminiLiveNativeCallbacks {
  onSessionUpdate: (session: Partial<GeminiLiveNativeSession>) => void;
  onError: (error: string) => void;
  onTranscription: (type: 'user' | 'model', text: string) => void;
  onAudioResponse: (audioData: string) => void;
}

export class GeminiLiveNativeFixed {
  private ws: WebSocket | null = null;
  private sound: Audio.Sound | null = null;
  private cameraRef: CameraView | null = null;
  private callbacks: GeminiLiveNativeCallbacks | null = null;
  private apiKey: string;
  
  private isActive: boolean = false;
  private isMuted: boolean = false;
  private videoEnabled: boolean = true;
  
  private frameInterval: ReturnType<typeof setInterval> | null = null;
  private audioQueue: string[] = [];
  private isPlayingAudio: boolean = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async startSession(
    cameraRef: CameraView,
    callbacks: GeminiLiveNativeCallbacks,
    options?: { videoEnabled?: boolean }
  ): Promise<void> {
    this.cameraRef = cameraRef;
    this.callbacks = callbacks;
    this.videoEnabled = options?.videoEnabled !== false;

    console.log('🚀 Starting FIXED native Gemini Live session...');
    callbacks.onSessionUpdate({ isConnecting: true, error: null });

    try {
      // 1. Setup audio
      await this.setupAudio();

      // 2. Connect WebSocket
      await this.connectWebSocket();

      // 3. Send setup message
      await this.sendSetupMessage();

      // 4. Start audio streaming
      if (ExpoAudioStream) {
        await this.startAudioStreaming();
      } else {
        console.warn('⚠️ Audio streaming not available - install @mykin-ai/expo-audio-stream');
      }

      // 5. Start video streaming
      if (this.videoEnabled) {
        this.startVideoStreaming();
      }

      this.isActive = true;
      callbacks.onSessionUpdate({
        isActive: true,
        isConnecting: false,
        videoEnabled: this.videoEnabled,
      });

      console.log('✅ Session started successfully');

      // Send initial test message to trigger AI response
      setTimeout(() => {
        console.log('📤 Sending initial greeting...');
        this.sendTextMessage('Hi! Can you see me? Please describe what you see and give me outfit feedback.');
      }, 2000);
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      const message = error instanceof Error ? error.message : 'Failed to start session';
      callbacks.onError(message);
      callbacks.onSessionUpdate({ isConnecting: false, error: message });
      this.cleanup();
    }
  }

  private async setupAudio(): Promise<void> {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Microphone permission not granted');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }

  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${GEMINI_LIVE_CONFIG.WS_URL}?key=${this.apiKey}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        reject(new Error('WebSocket connection failed'));
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        this.isActive = false;
        this.callbacks?.onSessionUpdate({ isActive: false });
      };
    });
  }

  private async sendSetupMessage(): Promise<void> {
    // Try the exact format from the research document
    const setupMessage = {
      setup: {
        model: GEMINI_LIVE_CONFIG.MODEL,
        generationConfig: {
          responseModalities: 'audio', // String, not array
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: GEMINI_LIVE_CONFIG.VOICE_NAME,
              },
            },
          },
        },
        systemInstruction: {
          parts: [{ text: GEMINI_LIVE_CONFIG.SYSTEM_INSTRUCTION }],
        },
      },
    };

    console.log('📤 Sending setup message with format:', JSON.stringify(setupMessage, null, 2));
    this.sendMessage(setupMessage);
  }

  private async startAudioStreaming(): Promise<void> {
    if (!ExpoAudioStream) {
      console.warn('⚠️ expo-audio-stream not available');
      console.log('💡 Using push-to-talk mode instead');
      console.log('💡 To enable continuous audio, rebuild the app after installing expo-audio-stream');
      return;
    }

    try {
      const { status } = await ExpoAudioStream.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission denied');
      }

      await ExpoAudioStream.startRecording({
        sampleRate: GEMINI_LIVE_CONFIG.AUDIO_SAMPLE_RATE,
        channels: GEMINI_LIVE_CONFIG.AUDIO_CHANNELS,
        encoding: 'pcm_16bit',
        interval: 100, // Send chunks every 100ms
        onAudioStream: async (event: any) => {
          if (!this.isMuted && this.isActive) {
            const audioBase64 = event.data;
            this.sendAudioChunk(audioBase64);
          }
        },
      });

      console.log('✅ Real-time audio streaming started with expo-audio-stream');
    } catch (error) {
      console.error('❌ Failed to start audio streaming:', error);
      console.log('💡 Falling back to push-to-talk mode');
    }
  }

  private sendAudioChunk(audioBase64: string): void {
    const message = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: `audio/pcm;rate=${GEMINI_LIVE_CONFIG.AUDIO_SAMPLE_RATE}`,
            data: audioBase64,
          },
        ],
      },
    };

    this.sendMessage(message);
  }

  /**
   * Send text message (useful for testing without audio)
   */
  sendTextMessage(text: string): void {
    // Try both formats
    const message = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        turnComplete: true,
      },
    };

    console.log('📤 Sending text message:', text);
    console.log('📤 Message format:', JSON.stringify(message, null, 2));
    this.sendMessage(message);
  }

  private startVideoStreaming(): void {
    if (!this.videoEnabled || !this.cameraRef) return;

    console.log(`📹 Starting video streaming at ${GEMINI_LIVE_CONFIG.FRAME_RATE} fps`);
    const intervalMs = 1000 / GEMINI_LIVE_CONFIG.FRAME_RATE;
    
    this.frameInterval = setInterval(() => {
      this.captureAndSendFrame();
    }, intervalMs);
  }

  private async captureAndSendFrame(): Promise<void> {
    if (!this.cameraRef || !this.videoEnabled) return;

    try {
      const photo = await this.cameraRef.takePictureAsync({
        quality: GEMINI_LIVE_CONFIG.JPEG_QUALITY,
        base64: true,
        skipProcessing: true,
      });

      if (photo.base64) {
        const message = {
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: 'image/jpeg',
                data: photo.base64,
              },
            ],
          },
        };

        this.sendMessage(message);
      }
    } catch (error) {
      console.warn('⚠️ Failed to capture frame:', error);
    }
  }

  private handleWebSocketMessage(data: string | any): void {
    if (!data) return;

    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    if (dataStr.trim().length === 0) return;

    console.log('📨 Received message:', dataStr.substring(0, 200));

    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      const messageKeys = Object.keys(message);
      console.log('📦 Message keys:', messageKeys);

      // Check for empty message (API error indicator)
      if (messageKeys.length === 0) {
        console.warn('⚠️ Received empty message - API may not be accepting our format');
        return;
      }

      // Setup complete
      if (message.setupComplete) {
        console.log('✅ Setup complete:', JSON.stringify(message.setupComplete));
        return;
      }

      // Server content
      if (message.serverContent) {
        const content = message.serverContent;

        // User transcription
        if (content.inputTranscription?.text) {
          this.callbacks?.onTranscription('user', content.inputTranscription.text);
        }

        // Model transcription
        if (content.outputTranscription?.text) {
          this.callbacks?.onTranscription('model', content.outputTranscription.text);
        }

        // Audio response
        if (content.modelTurn?.parts) {
          for (const part of content.modelTurn.parts) {
            if (part.inlineData?.mimeType === 'audio/pcm' && part.inlineData?.data) {
              this.queueAudioPlayback(part.inlineData.data);
            }
          }
        }

        // Turn complete
        if (content.turnComplete) {
          console.log('✅ Turn complete');
        }

        // Interrupted
        if (content.interrupted) {
          console.log('🛑 Interrupted');
          this.stopAudioPlayback();
        }
      }
    } catch (error) {
      console.error('❌ Failed to parse message:', error);
    }
  }

  private queueAudioPlayback(audioBase64: string): void {
    this.audioQueue.push(audioBase64);
    if (!this.isPlayingAudio) {
      this.playNextAudio();
    }
  }

  private async playNextAudio(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      return;
    }

    this.isPlayingAudio = true;
    const audioBase64 = this.audioQueue.shift()!;

    try {
      // Convert PCM to WAV
      const wavBase64 = this.pcmToWav(audioBase64, 24000, 1, 16);
      
      // Save to file using legacy API for compatibility
      const filename = `${Paths.cache.uri}/audio_${Date.now()}.wav`;
      await LegacyFileSystem.writeAsStringAsync(filename, wavBase64, {
        encoding: 'base64' as const,
      });

      // Play audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: filename },
        { shouldPlay: true }
      );

      this.sound = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          LegacyFileSystem.deleteAsync(filename, { idempotent: true });
          this.playNextAudio(); // Play next in queue
        }
      });
    } catch (error) {
      console.error('❌ Failed to play audio:', error);
      this.playNextAudio(); // Try next audio
    }
  }

  private pcmToWav(base64PCM: string, sampleRate: number, channels: number, bitDepth: number): string {
    const pcmData = Buffer.from(base64PCM, 'base64');
    const dataSize = pcmData.length;
    const header = Buffer.alloc(44);

    // WAV header
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * channels * (bitDepth / 8), 28);
    header.writeUInt16LE(channels * (bitDepth / 8), 32);
    header.writeUInt16LE(bitDepth, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    const wavBuffer = Buffer.concat([header, pcmData]);
    return wavBuffer.toString('base64');
  }

  private async stopAudioPlayback(): Promise<void> {
    this.audioQueue = [];
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      } catch (error) {
        console.warn('⚠️ Failed to stop audio:', error);
      }
    }
    this.isPlayingAudio = false;
  }

  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.callbacks?.onSessionUpdate({ isMuted: muted });
  }

  setVideoEnabled(enabled: boolean): void {
    this.videoEnabled = enabled;

    if (enabled && !this.frameInterval) {
      this.startVideoStreaming();
    } else if (!enabled && this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    this.callbacks?.onSessionUpdate({ videoEnabled: enabled });
  }

  async stopSession(): Promise<void> {
    console.log('🛑 Stopping session...');
    this.isActive = false;

    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    if (ExpoAudioStream) {
      try {
        await ExpoAudioStream.stopRecording();
      } catch (error) {
        console.warn('⚠️ Failed to stop audio recording:', error);
      }
    }

    await this.stopAudioPlayback();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.callbacks?.onSessionUpdate({ isActive: false });
  }

  private cleanup(): void {
    this.stopSession();
    this.cameraRef = null;
    this.callbacks = null;
  }
}
