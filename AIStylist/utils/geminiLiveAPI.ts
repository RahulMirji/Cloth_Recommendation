/**
 * Gemini Live API Integration
 * Real-time multimodal conversation with Gemini 2.5 Flash
 * Supports audio + video streaming for outfit scoring and styling advice
 */

import { Platform } from 'react-native';

// Audio/Image encoding utilities
export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function createAudioBlob(data: Float32Array, sampleRate: number): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encodeBase64(new Uint8Array(int16.buffer)),
    mimeType: `audio/pcm;rate=${sampleRate}`,
  };
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read blob as base64 string.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Gemini Live API Configuration
export const GEMINI_LIVE_CONFIG = {
  MODEL: 'gemini-2.5-flash-native-audio-preview-09-2025',
  SYSTEM_INSTRUCTION: `You are a professional AI stylist and outfit scorer. Help users improve their fashion sense by:
- Analyzing their outfit in real-time through video
- Asking contextual questions about where they're going and the occasion
- Providing friendly, natural feedback like a fashion-savvy buddy
- Using emotions and enthusiasm in your responses
- Giving practical styling tips and suggestions
- Scoring outfits on a scale of 1-10 with detailed reasoning

Be conversational, supportive, and encouraging. Keep responses concise but helpful.`,
  FRAME_RATE: 2, // Send 2 frames per second
  JPEG_QUALITY: 0.7,
  INPUT_SAMPLE_RATE: 16000,
  OUTPUT_SAMPLE_RATE: 24000,
  VOICE_NAME: 'Zephyr',
};

export interface GeminiLiveSession {
  isActive: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  userTranscription: string;
  modelTranscription: string;
  error: string | null;
}

export interface GeminiLiveCallbacks {
  onSessionUpdate: (session: Partial<GeminiLiveSession>) => void;
  onError: (error: string) => void;
  onAudioData: (audioData: Uint8Array) => void;
  onTranscription: (type: 'user' | 'model', text: string) => void;
}

/**
 * Gemini Live API Manager
 * Handles WebSocket connection, audio/video streaming, and real-time responses
 */
export class GeminiLiveManager {
  private session: any = null;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private frameInterval: number | null = null;
  private mediaStream: MediaStream | null = null;
  private callbacks: GeminiLiveCallbacks | null = null;
  private isMuted: boolean = false;
  
  private audioPlayback = {
    nextStartTime: 0,
    sources: new Set<AudioBufferSourceNode>(),
  };

  constructor(private apiKey: string) {}

  async startSession(
    mediaStream: MediaStream,
    callbacks: GeminiLiveCallbacks
  ): Promise<void> {
    if (Platform.OS !== 'web') {
      throw new Error('Gemini Live API is only supported on web platform');
    }

    this.callbacks = callbacks;
    this.mediaStream = mediaStream;
    
    callbacks.onSessionUpdate({ isConnecting: true, error: null });

    try {
      // Initialize audio contexts
      this.inputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({
        sampleRate: GEMINI_LIVE_CONFIG.INPUT_SAMPLE_RATE,
      });
      
      this.outputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({
        sampleRate: GEMINI_LIVE_CONFIG.OUTPUT_SAMPLE_RATE,
      });

      const outputNode = this.outputAudioContext.createGain();
      outputNode.connect(this.outputAudioContext.destination);

      let currentInputTranscription = '';
      let currentOutputTranscription = '';

      // Import Gemini SDK dynamically (web only)
      const { GoogleGenAI, Modality } = await import('@google/genai');
      
      const ai = new GoogleGenAI({ apiKey: this.apiKey });

      this.sessionPromise = ai.live.connect({
        model: GEMINI_LIVE_CONFIG.MODEL,
        config: {
          systemInstruction: GEMINI_LIVE_CONFIG.SYSTEM_INSTRUCTION,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: GEMINI_LIVE_CONFIG.VOICE_NAME },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log('✅ Gemini Live session opened');
            callbacks.onSessionUpdate({ isConnecting: false, isActive: true });
            this.startAudioStreaming();
            this.startVideoStreaming();
          },
          onmessage: async (message: any) => {
            // Handle transcriptions
            if (message.serverContent?.inputTranscription) {
              currentInputTranscription += message.serverContent.inputTranscription.text;
              callbacks.onTranscription('user', currentInputTranscription);
            }
            
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscription += message.serverContent.outputTranscription.text;
              callbacks.onTranscription('model', currentOutputTranscription);
            }
            
            if (message.serverContent?.turnComplete) {
              currentInputTranscription = '';
              currentOutputTranscription = '';
            }

            // Handle audio playback
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && this.outputAudioContext) {
              await this.playAudioResponse(base64Audio, outputNode);
            }

            // Handle interruptions
            if (message.serverContent?.interrupted) {
              this.stopAllAudioSources();
            }
          },
          onerror: (e: any) => {
            console.error('❌ Gemini Live API Error:', e);
            const message = e.error?.message || e.message || 'An unknown error occurred.';
            callbacks.onError(`API Error: ${message}`);
            this.stopSession();
          },
          onclose: () => {
            console.log('🔌 Gemini Live session closed');
            this.stopSession();
          },
        },
      });

      this.session = await this.sessionPromise;
    } catch (error) {
      console.error('❌ Failed to start Gemini Live session:', error);
      const message = error instanceof Error ? error.message : 'Failed to connect';
      callbacks.onError(message);
      this.cleanup();
    }
  }

  private startAudioStreaming(): void {
    if (!this.inputAudioContext || !this.mediaStream) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
    this.mediaStreamSource = source;
    
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    this.scriptProcessor = scriptProcessor;

    scriptProcessor.onaudioprocess = (event) => {
      if (this.isMuted) return;
      
      const inputData = event.inputBuffer.getChannelData(0);
      const pcmBlob = createAudioBlob(inputData, GEMINI_LIVE_CONFIG.INPUT_SAMPLE_RATE);
      
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(this.inputAudioContext.destination);
  }

  private startVideoStreaming(): void {
    // Start streaming video frames at configured frame rate
    this.frameInterval = window.setInterval(() => {
      this.captureAndSendFrame();
    }, 1000 / GEMINI_LIVE_CONFIG.FRAME_RATE);
  }

  private async captureAndSendFrame(): Promise<void> {
    if (!this.mediaStream) return;

    const videoTrack = this.mediaStream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      // Create ImageCapture to get frame from video track
      const imageCapture = new (window as any).ImageCapture(videoTrack);
      const bitmap = await imageCapture.grabFrame();
      
      // Convert to canvas and then to JPEG blob
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0);
        canvas.toBlob(
          async (blob) => {
            if (blob) {
              const base64Data = await blobToBase64(blob);
              this.sessionPromise?.then((session) => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'image/jpeg' },
                });
              });
            }
          },
          'image/jpeg',
          GEMINI_LIVE_CONFIG.JPEG_QUALITY
        );
      }
    } catch (error) {
      console.warn('Failed to capture video frame:', error);
    }
  }

  private async playAudioResponse(base64Audio: string, outputNode: GainNode): Promise<void> {
    if (!this.outputAudioContext) return;

    const audioContext = this.outputAudioContext;
    this.audioPlayback.nextStartTime = Math.max(
      this.audioPlayback.nextStartTime,
      audioContext.currentTime
    );

    const audioBuffer = await decodeAudioData(
      decodeBase64(base64Audio),
      audioContext,
      GEMINI_LIVE_CONFIG.OUTPUT_SAMPLE_RATE,
      1
    );

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputNode);

    source.addEventListener('ended', () => {
      this.audioPlayback.sources.delete(source);
    });

    source.start(this.audioPlayback.nextStartTime);
    this.audioPlayback.nextStartTime += audioBuffer.duration;
    this.audioPlayback.sources.add(source);
  }

  private stopAllAudioSources(): void {
    for (const source of this.audioPlayback.sources.values()) {
      source.stop();
      this.audioPlayback.sources.delete(source);
    }
    this.audioPlayback.nextStartTime = 0;
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.callbacks?.onSessionUpdate({ isMuted: muted });
  }

  async stopSession(): Promise<void> {
    if (this.sessionPromise) {
      try {
        const session = await this.sessionPromise;
        session.close();
      } catch (e) {
        console.warn('Error closing session:', e);
      }
    }
    
    this.cleanup();
    this.callbacks?.onSessionUpdate({ isActive: false, isConnecting: false });
  }

  private cleanup(): void {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }

    if (this.inputAudioContext && this.inputAudioContext.state !== 'closed') {
      this.inputAudioContext.close();
    }

    if (this.outputAudioContext && this.outputAudioContext.state !== 'closed') {
      this.outputAudioContext.close();
    }

    this.stopAllAudioSources();
    this.sessionPromise = null;
    this.session = null;
  }
}
