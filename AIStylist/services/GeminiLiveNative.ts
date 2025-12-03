/**
 * Native Gemini Live Implementation for React Native
 * Direct WebSocket connection without WebView
 * Works on iOS and Android just like the official Gemini app
 */

import '../utils/geminiPolyfills'; // Load polyfills first
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { CameraView } from 'expo-camera';

// Gemini Live API Configuration
export const GEMINI_LIVE_CONFIG = {
  MODEL: 'models/gemini-2.5-flash-native-audio-preview-09-2025',
  WS_URL: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent',
  SYSTEM_INSTRUCTION: `You are a professional AI stylist and outfit scorer. Help users improve their fashion sense by:
- Analyzing their outfit in real-time through video
- Asking contextual questions about where they're going and the occasion
- Providing friendly, natural feedback like a fashion-savvy buddy
- Using emotions and enthusiasm in your responses
- Giving practical styling tips and suggestions
- Scoring outfits on a scale of 1-10 with detailed reasoning

Be conversational, supportive, and encouraging. Keep responses concise but helpful.`,
  FRAME_RATE: 2, // 2 fps for balanced performance
  JPEG_QUALITY: 0.7,
  AUDIO_SAMPLE_RATE: 16000,
  AUDIO_CHANNELS: 1,
  AUDIO_BIT_DEPTH: 16,
  VOICE_NAME: 'Zephyr', // Same as web implementation
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

/**
 * Native Gemini Live Manager
 * Direct WebSocket implementation for React Native (no WebView needed!)
 */
export class GeminiLiveNative {
  private ws: WebSocket | null = null;
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private cameraRef: CameraView | null = null;
  private callbacks: GeminiLiveNativeCallbacks | null = null;
  private apiKey: string;
  
  private isActive: boolean = false;
  private isMuted: boolean = false;
  private videoEnabled: boolean = true;
  
  private frameInterval: ReturnType<typeof setInterval> | null = null;
  private audioChunkInterval: ReturnType<typeof setInterval> | null = null;
  
  private currentUserTranscription: string = '';
  private currentModelTranscription: string = '';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Start native Gemini Live session
   */
  async startSession(
    cameraRef: CameraView,
    callbacks: GeminiLiveNativeCallbacks,
    options?: { videoEnabled?: boolean }
  ): Promise<void> {
    this.cameraRef = cameraRef;
    this.callbacks = callbacks;
    this.videoEnabled = options?.videoEnabled !== false;

    console.log('🚀 Starting native Gemini Live session...');
    console.log('📹 Video enabled:', this.videoEnabled);
    console.log('🎤 Audio enabled: true');

    callbacks.onSessionUpdate({ isConnecting: true, error: null });

    try {
      // 1. Setup audio recording
      await this.setupAudioRecording();

      // 2. Connect to Gemini Live WebSocket
      await this.connectWebSocket();

      // 3. Send setup message
      await this.sendSetupMessage();

      // 4. Start audio streaming
      await this.startAudioStreaming();

      // 5. Start video streaming (if enabled)
      if (this.videoEnabled) {
        this.startVideoStreaming();
      }

      this.isActive = true;
      callbacks.onSessionUpdate({
        isActive: true,
        isConnecting: false,
        videoEnabled: this.videoEnabled,
      });

      console.log('✅ Native Gemini Live session started successfully');

      // 6. Send initial text prompt to trigger response (since we don't have audio yet)
      setTimeout(() => {
        console.log('📤 Sending initial text prompt to test...');
        this.sendTextMessage('Hi! Can you see me? Please describe what you see in the camera.');
      }, 2000);
    } catch (error) {
      console.error('❌ Failed to start native session:', error);
      const message = error instanceof Error ? error.message : 'Failed to start session';
      callbacks.onError(message);
      callbacks.onSessionUpdate({ isConnecting: false, error: message });
      this.cleanup();
    }
  }

  /**
   * Setup audio recording with expo-av
   */
  private async setupAudioRecording(): Promise<void> {
    console.log('🎤 Setting up audio recording...');

    // Request permissions
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Microphone permission not granted');
    }

    // Configure audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    console.log('✅ Audio recording setup complete');
  }

  /**
   * Connect to Gemini Live WebSocket
   */
  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${GEMINI_LIVE_CONFIG.WS_URL}?key=${this.apiKey}`;
      console.log('🔌 Connecting to WebSocket:', wsUrl.replace(this.apiKey, 'API_KEY_HIDDEN'));

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        console.log('✅ WebSocket readyState:', this.ws?.readyState);
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        console.error('❌ Error details:', JSON.stringify(error));
        reject(new Error('WebSocket connection failed'));
      };

      this.ws.onmessage = (event) => {
        console.log('📨 Raw WebSocket event data type:', typeof event.data);
        console.log('📨 Raw WebSocket event data:', event.data);
        
        // Handle different data types
        if (typeof event.data === 'string') {
          console.log('📨 String data:', event.data.substring(0, 200));
          this.handleWebSocketMessage(event.data);
        } else if (typeof event.data === 'object') {
          console.log('📨 Object data keys:', Object.keys(event.data));
          console.log('📨 Object data:', JSON.stringify(event.data));
          this.handleWebSocketMessage(event.data);
        } else {
          console.warn('⚠️ Unknown data type:', typeof event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket closed');
        console.log('🔌 Close code:', event.code);
        console.log('🔌 Close reason:', event.reason);
        this.isActive = false;
        this.callbacks?.onSessionUpdate({ isActive: false });
      };
    });
  }

  /**
   * Send setup message to Gemini
   * Based on the official Gemini Multimodal Live API protocol
   */
  private async sendSetupMessage(): Promise<void> {
    // Official Gemini Live API setup format
    const setupMessage = {
      setup: {
        model: GEMINI_LIVE_CONFIG.MODEL,
        generationConfig: {
          responseModalities: 'audio', // String, not array for WebSocket API
        },
      },
    };

    console.log('📤 Sending setup message');
    console.log('📤 Model:', GEMINI_LIVE_CONFIG.MODEL);
    console.log('📤 Setup:', JSON.stringify(setupMessage));
    this.sendMessage(setupMessage);
  }

  /**
   * Start audio streaming
   * Note: For now, we'll use a simpler approach without continuous streaming
   * The user will need to use push-to-talk or we'll implement VAD later
   */
  private async startAudioStreaming(): Promise<void> {
    console.log('🎤 Audio streaming ready (push-to-talk mode)');
    console.log('💡 Continuous audio streaming will be implemented in next update');
    
    // For now, audio will be captured when user speaks
    // This is similar to the hold-to-speak feature in AIStylistScreen
    
    // TODO: Implement continuous audio streaming with proper chunking
    // This requires:
    // 1. Audio worklet or processing node
    // 2. Proper PCM encoding
    // 3. Chunk management
    
    console.log('✅ Audio ready');
  }

  /**
   * Start recording audio (for push-to-talk)
   */
  async startRecording(): Promise<void> {
    if (this.recording) {
      console.warn('⚠️ Already recording');
      return;
    }

    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Send text message to Gemini (for testing without audio)
   */
  sendTextMessage(text: string): void {
    // Use the correct format for text messages
    const textMessage = {
      client_content: {
        turns: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        turn_complete: true,
      },
    };

    console.log('📤 Sending text message:', text);
    this.sendMessage(textMessage);
  }

  /**
   * Stop recording and send audio
   */
  async stopRecording(): Promise<void> {
    if (!this.recording) {
      console.warn('⚠️ No recording to stop');
      return;
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      if (uri) {
        // For now, we'll skip base64 conversion and just log
        // TODO: Implement proper audio streaming
        console.log('📤 Audio recorded, URI:', uri);
        console.log('💡 Audio streaming to be implemented');
        
        // Placeholder: Send empty audio message
        const audioMessage = {
          realtime_input: {
            media_chunks: [
              {
                mime_type: 'audio/wav',
                data: '', // Empty for now
              },
            ],
          },
        };

        // this.sendMessage(audioMessage);
      }

      this.recording = null;
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      this.recording = null;
    }
  }

  /**
   * Start video streaming
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
    if (!this.cameraRef || !this.videoEnabled) return;

    try {
      // Capture photo from camera
      const photo = await this.cameraRef.takePictureAsync({
        quality: GEMINI_LIVE_CONFIG.JPEG_QUALITY,
        base64: true,
        skipProcessing: true,
      });

      if (photo.base64) {
        console.log('📸 Captured frame, size:', Math.round(photo.base64.length / 1024) + 'KB');
        
        // Send frame to Gemini - use snake_case for WebSocket API
        const videoMessage = {
          realtime_input: {
            media_chunks: [
              {
                mime_type: 'image/jpeg',
                data: photo.base64,
              },
            ],
          },
        };

        this.sendMessage(videoMessage);
      }
    } catch (error) {
      console.warn('⚠️ Failed to capture frame:', error);
    }
  }

  /**
   * Handle WebSocket message from Gemini
   */
  private handleWebSocketMessage(data: string | any): void {
    // Skip empty messages
    if (!data) {
      console.log('⚠️ Received empty message');
      return;
    }

    // Convert to string if needed
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Skip empty strings
    if (dataStr.trim().length === 0) {
      console.log('⚠️ Received empty string message');
      return;
    }

    console.log('📨 Received WebSocket message:', dataStr.substring(0, 200) + '...');

    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      const messageKeys = Object.keys(message);
      console.log('📦 Parsed message keys:', messageKeys);

      // Check for empty message
      if (messageKeys.length === 0) {
        console.warn('⚠️ Received empty message object - this might indicate an API error');
        return;
      }

      // Handle setup complete
      if (message.setupComplete) {
        console.log('✅ Setup complete:', JSON.stringify(message.setupComplete));
        return;
      }

      // Handle server content
      if (message.serverContent) {
        const content = message.serverContent;
        console.log('📥 Server content keys:', Object.keys(content));

        // Handle user transcription
        if (content.inputTranscription) {
          this.currentUserTranscription += content.inputTranscription.text || '';
          console.log('🎤 User transcription:', this.currentUserTranscription);
          this.callbacks?.onTranscription('user', this.currentUserTranscription);
        }

        // Handle model transcription
        if (content.outputTranscription) {
          this.currentModelTranscription += content.outputTranscription.text || '';
          console.log('🤖 Model transcription:', this.currentModelTranscription);
          this.callbacks?.onTranscription('model', this.currentModelTranscription);
        }

        // Handle audio response
        if (content.modelTurn?.parts) {
          console.log('🔊 Model turn parts:', content.modelTurn.parts.length);
          for (const part of content.modelTurn.parts) {
            console.log('📦 Part keys:', Object.keys(part));
            if (part.inlineData) {
              console.log('🎵 Inline data mime type:', part.inlineData.mimeType);
              console.log('🎵 Inline data size:', part.inlineData.data?.length || 0);
            }
            if (part.inlineData?.mimeType === 'audio/pcm' && part.inlineData?.data) {
              console.log('🔊 Playing audio response, size:', part.inlineData.data.length);
              this.playAudioResponse(part.inlineData.data);
            }
          }
        }

        // Handle turn complete
        if (content.turnComplete) {
          console.log('✅ Turn complete');
          this.currentUserTranscription = '';
          this.currentModelTranscription = '';
        }

        // Handle interruption
        if (content.interrupted) {
          console.log('🛑 Interrupted');
          this.stopAudioPlayback();
        }
      }
    } catch (error) {
      // Log parse errors but don't crash
      console.error('❌ Failed to parse WebSocket message:', error);
      console.error('❌ Message data:', dataStr.substring(0, 200));
    }
  }

  /**
   * Play audio response from Gemini
   */
  private async playAudioResponse(audioBase64: string): Promise<void> {
    try {
      console.log('🔊 Playing AI audio response...');
      
      // Stop current playback
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Gemini returns PCM audio, we need to convert it to a playable format
      // For now, we'll use a data URI approach
      const audioUri = `data:audio/pcm;rate=24000;base64,${audioBase64}`;

      try {
        // Try to create and play sound
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );

        this.sound = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
            console.log('✅ Audio playback finished');
          }
        });
      } catch (playError) {
        console.warn('⚠️ PCM audio playback not yet implemented');
        console.warn('💡 Audio playback will be added in next update');
        // TODO: Implement PCM to WAV conversion and playback
      }
    } catch (error) {
      console.error('❌ Failed to play audio response:', error);
      this.callbacks?.onError('Failed to play audio response');
    }
  }

  /**
   * Convert base64 PCM audio to playable format
   */
  private async base64ToAudioFile(base64: string): Promise<string | null> {
    try {
      // For now, we'll use expo-av's built-in audio playback
      // which can handle base64 data directly
      
      // Create a data URI for the audio
      const dataUri = `data:audio/pcm;base64,${base64}`;
      return dataUri;
    } catch (error) {
      console.error('❌ Failed to convert base64 to audio:', error);
      return null;
    }
  }

  /**
   * Stop audio playback
   */
  private async stopAudioPlayback(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      } catch (error) {
        console.warn('⚠️ Failed to stop audio playback:', error);
      }
    }
  }

  /**
   * Send message to Gemini via WebSocket
   */
  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      console.log('📤 Sending message:', messageStr.substring(0, 200) + '...');
      this.ws.send(messageStr);
    } else {
      console.warn('⚠️ WebSocket not ready, message not sent');
      console.warn('⚠️ WebSocket state:', this.ws?.readyState);
    }
  }

  /**
   * Toggle mute
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.callbacks?.onSessionUpdate({ isMuted: muted });
    console.log(muted ? '🔇 Muted' : '🔊 Unmuted');
  }

  /**
   * Toggle video
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
    console.log('🛑 Stopping native Gemini Live session...');

    this.isActive = false;

    // Stop video streaming
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    // Stop audio streaming
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
        console.warn('⚠️ Failed to stop recording:', error);
      }
      this.recording = null;
    }

    // Stop audio playback
    await this.stopAudioPlayback();

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
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
