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
  // Native audio model for real-time voice conversation
  // Falls back to gemini-2.0-flash-exp for text-only mode
  MODEL_NATIVE_AUDIO: 'models/gemini-2.5-flash-native-audio-preview-09-2025',
  MODEL_TEXT: 'models/gemini-2.0-flash-exp',
  WS_URL: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent',
  SYSTEM_INSTRUCTION: `You are a professional AI stylist and outfit scorer. Help users improve their fashion sense by:
- Analyzing their outfit in real-time through video
- Asking contextual questions about where they're going and the occasion
- Providing friendly, natural feedback like a fashion-savvy buddy
- Using emotions and enthusiasm in your responses
- Giving practical styling tips and suggestions
- Scoring outfits on a scale of 1-10 with detailed reasoning

Be conversational, supportive, and encouraging. Keep responses concise but helpful.`,
  FRAME_RATE: 1, // 1 fps to avoid overwhelming the API
  JPEG_QUALITY: 0.5,
  AUDIO_SAMPLE_RATE: 16000,
  OUTPUT_SAMPLE_RATE: 24000,
  AUDIO_CHANNELS: 1,
  AUDIO_BIT_DEPTH: 16,
  VOICE_NAME: 'Zephyr',
  // Enable audio mode for real-time voice conversation
  USE_AUDIO_MODE: true,
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
  private setupComplete: boolean = false;

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

      // 5. Video streaming is disabled for gemini-2.0-flash-exp
      // The realtime_input format causes connection errors with this model
      // Video streaming requires a model that supports real-time media input
      console.log('📹 Video streaming disabled (not supported by current model)');
      this.videoEnabled = false;

      this.isActive = true;
      callbacks.onSessionUpdate({
        isActive: true,
        isConnecting: false,
        videoEnabled: this.videoEnabled,
      });

      console.log('✅ Native Gemini Live session started successfully');
      console.log('💡 Speak or send a text message to start the conversation');
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

      this.ws.onmessage = async (event) => {
        try {
          let messageText: string;
          
          // Handle different data types from WebSocket
          if (typeof event.data === 'string') {
            messageText = event.data;
          } else if (event.data instanceof Blob) {
            // Convert Blob to text
            messageText = await event.data.text();
          } else if (event.data instanceof ArrayBuffer) {
            // Convert ArrayBuffer to text
            const decoder = new TextDecoder('utf-8');
            messageText = decoder.decode(event.data);
          } else if (typeof event.data === 'object' && event.data !== null) {
            // Try to read as array buffer or blob
            if (event.data.arrayBuffer) {
              const buffer = await event.data.arrayBuffer();
              const decoder = new TextDecoder('utf-8');
              messageText = decoder.decode(buffer);
            } else {
              messageText = JSON.stringify(event.data);
            }
          } else {
            console.warn('⚠️ Unknown WebSocket data type:', typeof event.data);
            return;
          }
          
          // Only log non-empty messages
          if (messageText && messageText.trim().length > 0) {
            console.log('📨 WebSocket message:', messageText.substring(0, 200));
            this.handleWebSocketMessage(messageText);
          }
        } catch (error) {
          console.error('❌ Error processing WebSocket message:', error);
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
    const useAudio = GEMINI_LIVE_CONFIG.USE_AUDIO_MODE;
    const model = useAudio ? GEMINI_LIVE_CONFIG.MODEL_NATIVE_AUDIO : GEMINI_LIVE_CONFIG.MODEL_TEXT;
    
    const setupMessage = useAudio ? {
      // Native audio model setup with voice
      setup: {
        model: model,
        generation_config: {
          response_modalities: ['AUDIO', 'TEXT'],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: GEMINI_LIVE_CONFIG.VOICE_NAME,
              },
            },
          },
        },
        system_instruction: {
          parts: [{ text: GEMINI_LIVE_CONFIG.SYSTEM_INSTRUCTION }],
        },
      },
    } : {
      // Text-only model setup
      setup: {
        model: model,
        generation_config: {
          response_modalities: ['TEXT'],
        },
        system_instruction: {
          parts: [{ text: GEMINI_LIVE_CONFIG.SYSTEM_INSTRUCTION }],
        },
      },
    };

    console.log('📤 Sending setup message');
    console.log('📤 Model:', model);
    console.log('📤 Mode:', useAudio ? 'AUDIO + TEXT' : 'TEXT only');
    console.log('📤 Setup:', JSON.stringify(setupMessage).substring(0, 300) + '...');
    this.sendMessage(setupMessage);
    
    // Wait a bit for setup to complete before sending data
    await new Promise(resolve => setTimeout(resolve, 1000));
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
   * Note: We use a slower frame rate (1 fps) to avoid overwhelming the API
   * and to prevent camera shutter sounds on some devices
   */
  private startVideoStreaming(): void {
    if (!this.videoEnabled || !this.cameraRef) {
      console.log('📹 Video streaming disabled');
      return;
    }

    // Use 1 fps to reduce load and avoid rapid shutter sounds
    const fps = 1;
    console.log(`📹 Starting video streaming at ${fps} fps (silent mode)`);

    const intervalMs = 1000 / fps;
    this.frameInterval = setInterval(() => {
      if (this.setupComplete) {
        this.captureAndSendFrame();
      }
    }, intervalMs);
  }

  /**
   * Capture and send video frame
   * Uses skipProcessing and shutterSound: false to minimize disruption
   */
  private async captureAndSendFrame(): Promise<void> {
    if (!this.cameraRef || !this.videoEnabled || !this.setupComplete) return;

    try {
      // Capture photo from camera with minimal processing
      // Note: shutterSound option may not work on all devices
      const photo = await this.cameraRef.takePictureAsync({
        quality: 0.5, // Lower quality for faster capture
        base64: true,
        skipProcessing: true,
        // @ts-ignore - shutterSound might not be in types but works on some devices
        shutterSound: false,
      });

      if (photo?.base64) {
        // Only log occasionally to reduce console spam
        if (Math.random() < 0.2) {
          console.log('📸 Frame captured, size:', Math.round(photo.base64.length / 1024) + 'KB');
        }
        
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
      // Silently ignore frame capture errors to avoid spam
      // console.warn('⚠️ Failed to capture frame:', error);
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

    console.log('📨 Received WebSocket message:', dataStr.substring(0, 500) + '...');

    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      const messageKeys = Object.keys(message);
      console.log('📦 Parsed message keys:', messageKeys);

      // Check for empty message
      if (messageKeys.length === 0) {
        console.warn('⚠️ Received empty message object - this might indicate an API error');
        return;
      }

      // Handle setup complete (check both camelCase and snake_case)
      if (message.setupComplete !== undefined || message.setup_complete !== undefined) {
        console.log('✅ Setup complete! Ready to stream.');
        this.setupComplete = true;
        // Send initial greeting after setup
        setTimeout(() => {
          console.log('📤 Sending initial greeting...');
          this.sendTextMessage("Hello! I'm your AI stylist. Show me your outfit and I'll give you feedback!");
        }, 500);
        return;
      }

      // Handle server content (check both camelCase and snake_case)
      const serverContent = message.serverContent || message.server_content;
      if (serverContent) {
        const content = serverContent;
        console.log('📥 Server content keys:', Object.keys(content));

        // Handle user transcription
        const inputTranscription = content.inputTranscription || content.input_transcription;
        if (inputTranscription) {
          this.currentUserTranscription += inputTranscription.text || '';
          console.log('🎤 User transcription:', this.currentUserTranscription);
          this.callbacks?.onTranscription('user', this.currentUserTranscription);
        }

        // Handle model transcription
        const outputTranscription = content.outputTranscription || content.output_transcription;
        if (outputTranscription) {
          this.currentModelTranscription += outputTranscription.text || '';
          console.log('🤖 Model transcription:', this.currentModelTranscription);
          this.callbacks?.onTranscription('model', this.currentModelTranscription);
        }

        // Handle model response (text or audio)
        const modelTurn = content.modelTurn || content.model_turn;
        if (modelTurn?.parts) {
          console.log('🤖 Model turn parts:', modelTurn.parts.length);
          for (const part of modelTurn.parts) {
            console.log('📦 Part keys:', Object.keys(part));
            
            // Handle text response
            if (part.text) {
              console.log('💬 Model text response:', part.text);
              this.currentModelTranscription += part.text;
              this.callbacks?.onTranscription('model', this.currentModelTranscription);
            }
            
            // Handle audio response
            const inlineData = part.inlineData || part.inline_data;
            if (inlineData) {
              const mimeType = inlineData.mimeType || inlineData.mime_type;
              console.log('🎵 Inline data mime type:', mimeType);
              console.log('🎵 Inline data size:', inlineData.data?.length || 0);
              if (mimeType === 'audio/pcm' && inlineData.data) {
                console.log('🔊 Playing audio response, size:', inlineData.data.length);
                this.playAudioResponse(inlineData.data);
              }
            }
          }
        }

        // Handle turn complete
        const turnComplete = content.turnComplete || content.turn_complete;
        if (turnComplete) {
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

      // Handle error messages
      if (message.error) {
        console.error('❌ API Error:', JSON.stringify(message.error));
        this.callbacks?.onError(message.error.message || 'API error');
      }
    } catch (error) {
      // Log parse errors but don't crash
      console.error('❌ Failed to parse WebSocket message:', error);
      console.error('❌ Message data:', dataStr.substring(0, 500));
    }
  }

  // Audio queue for sequential playback
  private audioQueue: string[] = [];
  private isPlayingAudio: boolean = false;

  /**
   * Play audio response from Gemini
   */
  private async playAudioResponse(audioBase64: string): Promise<void> {
    // Queue the audio
    this.audioQueue.push(audioBase64);
    
    // If not already playing, start processing queue
    if (!this.isPlayingAudio) {
      this.processAudioQueue();
    }
  }

  /**
   * Process audio queue sequentially
   */
  private async processAudioQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      return;
    }

    this.isPlayingAudio = true;
    const audioBase64 = this.audioQueue.shift()!;

    try {
      console.log('🔊 Playing AI audio response...');
      
      // Stop current playback
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Convert PCM to WAV format
      const wavBase64 = this.pcmToWav(audioBase64);
      
      // Create data URI with WAV format
      const audioUri = `data:audio/wav;base64,${wavBase64}`;

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
            // Process next in queue
            this.processAudioQueue();
          }
        });
      } catch (playError) {
        console.warn('⚠️ Audio playback failed:', playError);
        // Continue with next audio
        this.processAudioQueue();
      }
    } catch (error) {
      console.error('❌ Failed to play audio response:', error);
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

    // Create WAV header (44 bytes)
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
  private async stopAudioPlayback(): Promise<void> {
    // Clear the queue
    this.audioQueue = [];
    this.isPlayingAudio = false;
    
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
    this.setupComplete = false;

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
