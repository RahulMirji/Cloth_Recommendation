/**
 * Gemini Live API WebSocket Manager
 * 
 * Handles real-time bidirectional streaming for:
 * - Audio input (16-bit PCM, 16kHz)
 * - Audio output (16-bit PCM, 24kHz)
 * - Vision context (image analysis)
 * - Interrupts (Voice Activity Detection)
 * 
 * Model: gemini-2.5-flash-native-audio-preview-09-2025
 * Docs: https://ai.google.dev/gemini-api/docs/live
 */

import Constants from 'expo-constants';

export interface LiveSessionConfig {
  model: string;
  responseModalities: ('AUDIO' | 'TEXT')[];
  systemInstruction?: string;
  voiceConfig?: {
    voiceName?: string; // 'Kore', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'
  };
  automaticVAD?: boolean;
  realtimeInputConfig?: {
    automaticActivityDetection?: {
      disabled?: boolean;
      startOfSpeechSensitivity?: 'LOW' | 'MEDIUM' | 'HIGH';
      endOfSpeechSensitivity?: 'LOW' | 'MEDIUM' | 'HIGH';
      prefixPaddingMs?: number;
      silenceDurationMs?: number;
    };
  };
  inputAudioTranscription?: boolean;
  outputAudioTranscription?: boolean;
  thinkingConfig?: {
    thinkingBudget?: number;
    includeThoughts?: boolean;
  };
}

export interface AudioChunk {
  data: ArrayBuffer;
  mimeType: string;
}

export interface TranscriptionEvent {
  text: string;
  isFinal: boolean;
}

export interface InterruptEvent {
  interrupted: boolean;
  reason?: string;
}

export interface ServerContentEvent {
  modelTurn?: {
    parts: Array<{
      inlineData?: {
        mimeType: string;
        data: string; // base64
      };
      text?: string;
    }>;
  };
  turnComplete?: boolean;
  interrupted?: boolean;
  inputTranscription?: {
    text: string;
  };
  outputTranscription?: {
    text: string;
  };
}

/**
 * Gemini Live API Session Manager
 * Manages WebSocket connection lifecycle and message handling
 */
export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private sessionActive: boolean = false;
  private apiKey: string;
  private config: LiveSessionConfig;
  
  // Event handlers
  private audioReceivedCallback: ((chunk: AudioChunk) => void) | null = null;
  private interruptCallback: (() => void) | null = null;
  private inputTranscriptCallback: ((event: TranscriptionEvent) => void) | null = null;
  private outputTranscriptCallback: ((event: TranscriptionEvent) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private connectedCallback: (() => void) | null = null;
  private disconnectedCallback: (() => void) | null = null;

  constructor() {
    // Get Gemini API key from environment
    this.apiKey = Constants.expoConfig?.extra?.geminiApiKey || 
                  process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      console.error('❌ Gemini API key not configured');
      throw new Error(
        'Gemini API key not found. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.\n' +
        'Get a free API key at: https://aistudio.google.com/app/apikey'
      );
    }

    this.config = {
      model: 'models/gemini-2.0-flash-exp', // Correct format with models/ prefix
      responseModalities: ['AUDIO'],
      automaticVAD: true,
    };
  }

  /**
   * Connect to Gemini Live API
   */
  async connect(customConfig?: Partial<LiveSessionConfig>): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('');
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔵 GEMINI LIVE API - CONNECTION STARTING');
        console.log('═══════════════════════════════════════════════════════');
        
        // Merge config
        this.config = {
          ...this.config,
          ...customConfig,
        };

        console.log('📋 Configuration:');
        console.log('   Model:', this.config.model);
        console.log('   Response Modalities:', this.config.responseModalities);
        console.log('   VAD Enabled:', this.config.automaticVAD);
        console.log('   Voice:', this.config.voiceConfig?.voiceName || 'default');
        console.log('');

        // Construct WebSocket URL
        // Note: In production, use server-to-server or ephemeral tokens
        const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;

        console.log('🌐 Connecting to WebSocket...');
        this.ws = new WebSocket(wsUrl);

        // Connection opened
        this.ws.onopen = () => {
          console.log('✅ WebSocket connected!');
          this.sessionActive = true;

          // Send setup message
          this.sendSetupMessage();

          if (this.connectedCallback) {
            this.connectedCallback();
          }

          resolve();
        };

        // Message received
        this.ws.onmessage = (event) => {
          this.handleServerMessage(event.data);
        };

        // Connection closed
        this.ws.onclose = (event) => {
          console.log('');
          console.log('═══════════════════════════════════════════════════════');
          console.log('🔴 GEMINI LIVE API - CONNECTION CLOSED');
          console.log('═══════════════════════════════════════════════════════');
          console.log('Code:', event.code);
          console.log('Reason:', event.reason || 'No reason provided');
          
          // Provide helpful error messages
          if (event.code === 1008) {
            if (event.reason.includes('quota')) {
              console.log('');
              console.log('💡 QUOTA EXCEEDED');
              console.log('The Gemini API free tier has limits. Solutions:');
              console.log('   1. Wait for quota reset (usually 24 hours)');
              console.log('   2. Upgrade to paid tier at: https://ai.google.dev/pricing');
              console.log('   3. Try a different model (models/gemini-1.5-flash)');
            } else if (event.reason.includes('not found')) {
              console.log('');
              console.log('💡 MODEL NOT FOUND');
              console.log('The model may not be available for Live API.');
              console.log('Try: models/gemini-2.0-flash-exp (requires quota)');
            }
          }
          console.log('');

          this.sessionActive = false;
          
          if (this.disconnectedCallback) {
            this.disconnectedCallback();
          }
        };

        // Error handler
        this.ws.onerror = (error: any) => {
          console.error('❌ WebSocket error:', error);
          
          const err = new Error(`WebSocket error: ${error.message || 'Connection failed'}`);
          
          if (this.errorCallback) {
            this.errorCallback(err);
          }
          
          reject(err);
        };

      } catch (error) {
        console.error('❌ Failed to establish connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Send setup/configuration message to initialize session
   */
  private sendSetupMessage(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ Cannot send setup: WebSocket not open');
      return;
    }

    const setupMessage: any = {
      setup: {
        model: this.config.model,
        generationConfig: {
          responseModalities: this.config.responseModalities,
        },
      },
    };

    // Add system instruction if provided
    if (this.config.systemInstruction) {
      setupMessage.setup.systemInstruction = {
        parts: [{ text: this.config.systemInstruction }],
      };
    }

    // Add voice config
    if (this.config.voiceConfig) {
      setupMessage.setup.generationConfig.speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: this.config.voiceConfig.voiceName || 'Kore',
          },
        },
      };
    }

    // Add VAD config
    if (this.config.realtimeInputConfig) {
      setupMessage.setup.generationConfig.realtimeInputConfig = this.config.realtimeInputConfig;
    }

    // Note: Transcription is built-in for Gemini Live API
    // The inputAudioTranscription and outputAudioTranscription fields
    // are not valid configuration options - transcripts are automatically
    // provided in serverContent events when available

    // Add thinking config
    if (this.config.thinkingConfig) {
      setupMessage.setup.generationConfig.thinkingConfig = this.config.thinkingConfig;
    }

    console.log('📤 Sending setup message...');
    this.ws.send(JSON.stringify(setupMessage));
    console.log('✅ Setup message sent');
  }

  /**
   * Handle incoming server messages
   */
  private handleServerMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Setup acknowledgment
      if (message.setupComplete) {
        console.log('✅ Setup acknowledged by server');
        return;
      }

      // Server content (audio, transcription, interrupts)
      if (message.serverContent) {
        this.handleServerContent(message.serverContent);
      }

      // Usage metadata
      if (message.usageMetadata) {
        console.log('📊 Token usage:', message.usageMetadata.totalTokenCount);
      }

    } catch (error) {
      console.error('❌ Failed to parse server message:', error);
    }
  }

  /**
   * Handle server content events
   */
  private handleServerContent(content: ServerContentEvent): void {
    // Audio output
    if (content.modelTurn?.parts) {
      for (const part of content.modelTurn.parts) {
        if (part.inlineData?.mimeType.startsWith('audio/')) {
          // Decode base64 audio data
          const audioData = this.base64ToArrayBuffer(part.inlineData.data);
          
          if (this.audioReceivedCallback) {
            this.audioReceivedCallback({
              data: audioData,
              mimeType: part.inlineData.mimeType,
            });
          }
        }
      }
    }

    // Input transcription (what user said)
    if (content.inputTranscription) {
      if (this.inputTranscriptCallback) {
        this.inputTranscriptCallback({
          text: content.inputTranscription.text,
          isFinal: true,
        });
      }
    }

    // Output transcription (what AI said)
    if (content.outputTranscription) {
      if (this.outputTranscriptCallback) {
        this.outputTranscriptCallback({
          text: content.outputTranscription.text,
          isFinal: true,
        });
      }
    }

    // Interrupt detected
    if (content.interrupted) {
      console.log('🛑 Interrupt detected - user started speaking');
      
      if (this.interruptCallback) {
        this.interruptCallback();
      }
    }

    // Turn complete
    if (content.turnComplete) {
      console.log('✅ AI turn complete');
    }
  }

  /**
   * Send audio chunk to Gemini
   * @param pcmData - 16-bit PCM audio data
   * @param sampleRate - Sample rate in Hz (default 16000)
   */
  async sendAudioChunk(pcmData: ArrayBuffer, sampleRate: number = 16000): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ Cannot send audio: WebSocket not open');
      return;
    }

    try {
      // Convert ArrayBuffer to base64
      const base64Audio = this.arrayBufferToBase64(pcmData);

      const message = {
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: `audio/pcm;rate=${sampleRate}`,
              data: base64Audio,
            },
          ],
        },
      };

      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('❌ Failed to send audio chunk:', error);
    }
  }

  /**
   * Send image for vision context
   * @param imageBase64 - Base64 encoded image (with or without data URI prefix)
   */
  async sendImage(imageBase64: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ Cannot send image: WebSocket not open');
      return;
    }

    try {
      // Remove data URI prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const message = {
        clientContent: {
          turns: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          turnComplete: false, // Don't trigger response yet
        },
      };

      console.log('📤 Sending image context...');
      this.ws.send(JSON.stringify(message));
      console.log('✅ Image context sent');
    } catch (error) {
      console.error('❌ Failed to send image:', error);
    }
  }

  /**
   * Send text message
   */
  async sendText(text: string, turnComplete: boolean = true): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ Cannot send text: WebSocket not open');
      return;
    }

    try {
      const message = {
        clientContent: {
          turns: [
            {
              role: 'user',
              parts: [{ text }],
            },
          ],
          turnComplete,
        },
      };

      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('❌ Failed to send text:', error);
    }
  }

  /**
   * Signal end of audio stream
   */
  async sendAudioStreamEnd(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const message = {
        realtimeInput: {
          audioStreamEnd: true,
        },
      };

      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('❌ Failed to send audio stream end:', error);
    }
  }

  /**
   * Request AI to stop current generation
   */
  requestStop(): void {
    // In Live API, interrupts are handled automatically by VAD
    // This method is a placeholder for manual stop requests
    console.log('⏹️  Stop requested');
  }

  /**
   * Disconnect from session
   */
  async disconnect(): Promise<void> {
    console.log('🔌 Disconnecting from Gemini Live API...');

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.sessionActive = false;
    console.log('✅ Disconnected');
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    return this.sessionActive && this.ws?.readyState === WebSocket.OPEN;
  }

  // ===== EVENT HANDLERS =====

  onAudioReceived(callback: (chunk: AudioChunk) => void): void {
    this.audioReceivedCallback = callback;
  }

  onInterrupt(callback: () => void): void {
    this.interruptCallback = callback;
  }

  onInputTranscript(callback: (event: TranscriptionEvent) => void): void {
    this.inputTranscriptCallback = callback;
  }

  onOutputTranscript(callback: (event: TranscriptionEvent) => void): void {
    this.outputTranscriptCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  onConnected(callback: () => void): void {
    this.connectedCallback = callback;
  }

  onDisconnected(callback: () => void): void {
    this.disconnectedCallback = callback;
  }

  // ===== UTILITY METHODS =====

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * Fashion Stylist System Instruction
 * Optimized for concise, natural conversation
 */
export const FASHION_STYLIST_SYSTEM_INSTRUCTION = `You are a professional AI fashion stylist assistant. Your role is to provide helpful, friendly, and specific fashion advice based on the user's outfit visible through their camera.

CRITICAL RULES:
1. **Keep responses CONCISE** - Aim for 15-20 seconds of speech maximum
2. **Answer the specific question** - Don't over-explain or go off-topic
3. **After each response**, ask: "Would you like any other outfit recommendations?" or similar
4. **If interrupted**, stop immediately and address the new question
5. **Before commenting on a specific item** (tie, shoes, watch, etc.), verify it's visible in the image
6. **If an item isn't visible**, politely say: "I don't see a [item] in your current outfit. Would you like to show it to me?"

CONVERSATION STYLE:
- Natural and conversational (like talking to a friend)
- Encouraging and constructive (build confidence)
- Specific and actionable (not generic advice)
- Brief and to the point (no long explanations)

EXAMPLE GOOD RESPONSES:
User: "How do my shoes look?"
You: "Your shoes complement your outfit nicely! The color matches well with your pants. Anything else I can help with?"

User: "Tell me about my tie"
You (if tie visible): "Your burgundy tie adds a nice pop of color! It pairs well with your navy suit. Want more suggestions?"
You (if no tie): "I don't see a tie in your current outfit. Would you like to show it to me or discuss other accessories?"

EXAMPLE BAD RESPONSES (TOO LONG):
"Well, let me tell you about shoes in general. Shoes are an extremely important part of any outfit because they can make or break your entire look. Throughout history, shoes have been... [continues for 90 seconds]"

Remember: Be helpful, be brief, be specific!`;
