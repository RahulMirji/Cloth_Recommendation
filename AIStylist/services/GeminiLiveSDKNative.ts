/**
 * Gemini Live Implementation using @google/genai SDK
 * This uses the official SDK which handles the WebSocket protocol correctly
 * Works on React Native with proper polyfills
 */

import '../utils/geminiPolyfills'; // Load polyfills first
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { CameraView } from 'expo-camera';
import { Paths, File } from 'expo-file-system';

// Configuration
export const GEMINI_LIVE_CONFIG = {
  MODEL: 'gemini-2.5-flash-native-audio-preview-09-2025',
  SYSTEM_INSTRUCTION: `You are a professional AI stylist and outfit scorer. Help users improve their fashion sense by:
- Analyzing their outfit in real-time through video
- Asking contextual questions about where they're going and the occasion
- Providing friendly, natural feedback like a fashion-savvy buddy
- Using emotions and enthusiasm in your responses
- Giving practical styling tips and suggestions
- Scoring outfits on a scale of 1-10 with detailed reasoning

Be conversational, supportive, and encouraging. Keep responses concise but helpful.
Start by greeting the user and asking them to show you their outfit.`,
  FRAME_RATE: 1,
  JPEG_QUALITY: 0.5,
  INPUT_SAMPLE_RATE: 16000,
  OUTPUT_SAMPLE_RATE: 24000,
  VOICE_NAME: 'Zephyr',
};

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
 * Gemini Live Manager using official @google/genai SDK
 */
export class GeminiLiveSDKNative {
  private session: any = null;
  private cameraRef: CameraView | null = null;
  private callbacks: GeminiLiveSDKCallbacks | null = null;
  private apiKey: string;
  
  private isActive: boolean = false;
  private isMuted: boolean = false;
  private videoEnabled: boolean = true;
  
  private frameInterval: ReturnType<typeof setInterval> | null = null;
  private audioContext: any = null;
  private scriptProcessor: any = null;
  private mediaStream: MediaStream | null = null;
  
  private currentUserTranscription: string = '';
  private currentModelTranscription: string = '';
  
  // Audio playback
  private audioQueue: string[] = [];
  private isPlayingAudio: boolean = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Start Gemini Live session using the SDK
   */
  async startSession(
    cameraRef: CameraView,
    callbacks: GeminiLiveSDKCallbacks,
    options?: { videoEnabled?: boolean }
  ): Promise<void> {
    this.cameraRef = cameraRef;
    this.callbacks = callbacks;
    this.videoEnabled = options?.videoEnabled !== false;

    console.log('🚀 Starting Gemini Live session with SDK...');
    console.log('📹 Video enabled:', this.videoEnabled);
    console.log('🎤 Audio enabled: true');

    callbacks.onSessionUpdate({ isConnecting: true, error: null });

    try {
      // Setup audio
      await this.setupAudio();
      
      // Import the SDK dynamically - use web version for Live API support
      console.log('📦 Loading @google/genai SDK (web dist)...');
      // @ts-ignore - Direct path import for Metro bundler compatibility
      const { GoogleGenAI, Modality } = await import('@google/genai/dist/web/index.mjs');
      console.log('✅ SDK loaded');
      
      // Create AI instance
      const ai = new GoogleGenAI({ apiKey: this.apiKey });
      console.log('✅ GoogleGenAI instance created');
      
      // Connect to Gemini Live
      console.log('🔌 Connecting to Gemini Live...');
      console.log('📤 Model:', GEMINI_LIVE_CONFIG.MODEL);
      
      this.session = await ai.live.connect({
        model: GEMINI_LIVE_CONFIG.MODEL,
        config: {
          systemInstruction: GEMINI_LIVE_CONFIG.SYSTEM_INSTRUCTION,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: GEMINI_LIVE_CONFIG.VOICE_NAME,
              },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log('✅ Session opened!');
            this.isActive = true;
            callbacks.onSessionUpdate({
              isActive: true,
              isConnecting: false,
              videoEnabled: this.videoEnabled,
            });
            
            // Start streaming
            this.startAudioStreaming();
            if (this.videoEnabled) {
              this.startVideoStreaming();
            }
          },
          onmessage: async (message: any) => {
            await this.handleMessage(message);
          },
          onerror: (error: any) => {
            console.error('❌ Session error:', error);
            const errorMsg = error?.error?.message || error?.message || 'Unknown error';
            callbacks.onError(errorMsg);
            this.stopSession();
          },
          onclose: () => {
            console.log('🔌 Session closed');
            this.isActive = false;
            callbacks.onSessionUpdate({ isActive: false });
          },
        },
      });
      
      console.log('✅ Gemini Live session established!');
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      const message = error instanceof Error ? error.message : 'Failed to start session';
      callbacks.onError(message);
      callbacks.onSessionUpdate({ isConnecting: false, error: message });
      this.cleanup();
    }
  }

  /**
   * Setup audio recording
   */
  private async setupAudio(): Promise<void> {
    console.log('🎤 Setting up audio...');
    
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

    console.log('✅ Audio setup complete');
  }

  /**
   * Start audio streaming to Gemini
   */
  private async startAudioStreaming(): Promise<void> {
    console.log('🎤 Starting audio streaming...');
    
    // For React Native, we need to use expo-av for audio recording
    // The SDK expects PCM audio data
    
    // TODO: Implement continuous audio streaming
    // For now, we'll use push-to-talk approach
    console.log('💡 Audio streaming ready (push-to-talk mode)');
  }

  /**
   * Start video streaming to Gemini
   */
  private startVideoStreaming(): void {
    if (!this.videoEnabled || !this.cameraRef) {
      console.log('📹 Video streaming disabled');
      return;
    }

    console.log(`📹 Starting video streaming at ${GEMINI_LIVE_CONFIG.FRAME_RATE} fps`);

    const intervalMs = 1000 / GEMINI_LIVE_CONFIG.FRAME_RATE;
    this.frameInterval = setInterval(() => {
      this.captureAndSendFrame();
    }, intervalMs);
  }

  /**
   * Capture and send video frame
   */
  private async captureAndSendFrame(): Promise<void> {
    if (!this.cameraRef || !this.videoEnabled || !this.session) return;

    try {
      const photo = await this.cameraRef.takePictureAsync({
        quality: GEMINI_LIVE_CONFIG.JPEG_QUALITY,
        base64: true,
        skipProcessing: true,
      });

      if (photo?.base64 && this.session) {
        // Send frame using SDK's sendRealtimeInput
        this.session.sendRealtimeInput({
          media: {
            data: photo.base64,
            mimeType: 'image/jpeg',
          },
        });
        
        // Log occasionally
        if (Math.random() < 0.2) {
          console.log('📸 Frame sent, size:', Math.round(photo.base64.length / 1024) + 'KB');
        }
      }
    } catch (error) {
      // Silently ignore frame capture errors
    }
  }

  /**
   * Handle incoming message from Gemini
   */
  private async handleMessage(message: any): Promise<void> {
    console.log('📨 Message received:', Object.keys(message));
    
    const serverContent = message.serverContent;
    if (!serverContent) return;

    // Handle user transcription
    if (serverContent.inputTranscription) {
      this.currentUserTranscription += serverContent.inputTranscription.text || '';
      console.log('🎤 User:', this.currentUserTranscription);
      this.callbacks?.onTranscription('user', this.currentUserTranscription);
    }

    // Handle model transcription
    if (serverContent.outputTranscription) {
      this.currentModelTranscription += serverContent.outputTranscription.text || '';
      console.log('🤖 AI:', this.currentModelTranscription);
      this.callbacks?.onTranscription('model', this.currentModelTranscription);
    }

    // Handle audio response
    if (serverContent.modelTurn?.parts) {
      for (const part of serverContent.modelTurn.parts) {
        if (part.inlineData?.data) {
          console.log('🔊 Audio received, size:', part.inlineData.data.length);
          await this.playAudioResponse(part.inlineData.data);
        }
        if (part.text) {
          console.log('💬 Text:', part.text);
          this.currentModelTranscription += part.text;
          this.callbacks?.onTranscription('model', this.currentModelTranscription);
        }
      }
    }

    // Handle turn complete
    if (serverContent.turnComplete) {
      console.log('✅ Turn complete');
      this.currentUserTranscription = '';
      this.currentModelTranscription = '';
    }

    // Handle interruption
    if (serverContent.interrupted) {
      console.log('🛑 Interrupted');
      this.stopAudioPlayback();
    }
  }

  /**
   * Play audio response
   */
  private async playAudioResponse(audioBase64: string): Promise<void> {
    try {
      // Queue the audio
      this.audioQueue.push(audioBase64);
      
      // If not already playing, start playback
      if (!this.isPlayingAudio) {
        this.processAudioQueue();
      }
    } catch (error) {
      console.error('❌ Failed to queue audio:', error);
    }
  }

  /**
   * Process audio queue
   */
  private async processAudioQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      return;
    }

    this.isPlayingAudio = true;
    const audioBase64 = this.audioQueue.shift()!;

    try {
      // Create a temporary file for the audio
      const audioFile = new File(Paths.cache, `gemini_audio_${Date.now()}.wav`);
      const fileUri = audioFile.uri;
      
      // Convert PCM to WAV format
      const wavBase64 = this.pcmToWav(audioBase64);
      
      // Decode base64 and write as binary
      const wavBytes = this.base64ToBytes(wavBase64);
      await audioFile.write(wavBytes);

      // Play the audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          // Clean up temp file
          try { audioFile.delete(); } catch {}
          // Process next in queue
          this.processAudioQueue();
        }
      });
    } catch (error) {
      console.error('❌ Failed to play audio:', error);
      // Continue with next audio
      this.processAudioQueue();
    }
  }

  /**
   * Convert PCM to WAV format
   */
  private pcmToWav(pcmBase64: string): string {
    // Decode base64 to bytes
    const pcmData = this.base64ToBytes(pcmBase64);
    
    // WAV header parameters
    const sampleRate = GEMINI_LIVE_CONFIG.OUTPUT_SAMPLE_RATE;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.length;
    const fileSize = 36 + dataSize;

    // Create WAV header
    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    // RIFF chunk
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize, true);
    this.writeString(view, 8, 'WAVE');

    // fmt chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Combine header and PCM data
    const wavData = new Uint8Array(44 + pcmData.length);
    wavData.set(new Uint8Array(header), 0);
    wavData.set(pcmData, 44);

    // Convert to base64
    return this.bytesToBase64(wavData);
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  private base64ToBytes(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Stop audio playback
   */
  private stopAudioPlayback(): void {
    this.audioQueue = [];
    this.isPlayingAudio = false;
  }

  /**
   * Send text message
   */
  sendTextMessage(text: string): void {
    if (!this.session) {
      console.warn('⚠️ Session not active');
      return;
    }

    console.log('📤 Sending text:', text);
    this.session.sendClientContent({
      turns: [{
        role: 'user',
        parts: [{ text }],
      }],
      turnComplete: true,
    });
  }

  /**
   * Set muted state
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.callbacks?.onSessionUpdate({ isMuted: muted });
    console.log(muted ? '🔇 Muted' : '🔊 Unmuted');
  }

  /**
   * Set video enabled state
   */
  setVideoEnabled(enabled: boolean): void {
    this.videoEnabled = enabled;

    if (enabled && !this.frameInterval) {
      this.startVideoStreaming();
    } else if (!enabled && this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
      console.log('📹 Video streaming stopped');
    }

    this.callbacks?.onSessionUpdate({ videoEnabled: enabled });
  }

  /**
   * Stop session
   */
  async stopSession(): Promise<void> {
    console.log('🛑 Stopping Gemini Live session...');

    this.isActive = false;

    // Stop video streaming
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    // Stop audio playback
    this.stopAudioPlayback();

    // Close session
    if (this.session) {
      try {
        this.session.close();
      } catch (error) {
        console.warn('⚠️ Error closing session:', error);
      }
      this.session = null;
    }

    this.callbacks?.onSessionUpdate({ isActive: false });
    console.log('✅ Session stopped');
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.stopSession();
    this.cameraRef = null;
    this.callbacks = null;
  }
}
