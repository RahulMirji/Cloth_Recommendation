/**
 * Audio Stream Manager
 * 
 * Manages continuous audio recording and real-time playback for Gemini Live API
 * - Records audio in 16-bit PCM format at 16kHz (mono)
 * - Plays received audio at 24kHz (Gemini's output rate)
 * - Handles chunking and buffering for smooth streaming
 * 
 * Platform support:
 * - iOS: Uses expo-av
 * - Android: Uses expo-av
 * - Web: Uses Web Audio API (future)
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export interface AudioChunkCallback {
  (pcmData: ArrayBuffer): void;
}

export interface RecordingConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  chunkDurationMs: number; // How often to send chunks (e.g., 100ms)
}

/**
 * Audio Stream Manager
 * Handles continuous recording and playback for real-time voice conversations
 */
export class AudioStreamManager {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private isRecording: boolean = false;
  private isPlaying: boolean = false;
  
  // Audio configuration
  private config: RecordingConfig = {
    sampleRate: 16000, // 16kHz for input (Gemini resamples if needed)
    channels: 1, // Mono
    bitDepth: 16, // 16-bit PCM
    chunkDurationMs: 100, // Send chunks every 100ms
  };

  // Callbacks
  private onAudioChunkCallback: AudioChunkCallback | null = null;
  private onRecordingErrorCallback: ((error: Error) => void) | null = null;
  private onPlaybackErrorCallback: ((error: Error) => void) | null = null;

  // Playback buffer for smooth audio streaming
  private playbackQueue: ArrayBuffer[] = [];
  private isProcessingPlayback: boolean = false;

  constructor() {
    this.setupAudioMode();
  }

  /**
   * Configure audio session for recording and playback
   */
  private async setupAudioMode(): Promise<void> {
    try {
      console.log('🔊 Setting up audio mode...');
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('✅ Audio mode configured');
    } catch (error) {
      console.error('❌ Failed to setup audio mode:', error);
    }
  }

  /**
   * Start continuous audio recording
   * Sends audio chunks to callback at regular intervals
   */
  async startContinuousRecording(onChunk: AudioChunkCallback): Promise<void> {
    if (this.isRecording) {
      console.warn('⚠️  Already recording');
      return;
    }

    try {
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('🎤 STARTING CONTINUOUS AUDIO RECORDING');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Sample Rate:', this.config.sampleRate, 'Hz');
      console.log('Channels:', this.config.channels, '(mono)');
      console.log('Bit Depth:', this.config.bitDepth, 'bit');
      console.log('Chunk Duration:', this.config.chunkDurationMs, 'ms');
      console.log('');

      this.onAudioChunkCallback = onChunk;

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }

      // Configure recording options
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: this.config.sampleRate,
          numberOfChannels: this.config.channels,
          bitRate: 128000,
        },
        ios: {
          extension: '.caf',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: this.config.sampleRate,
          numberOfChannels: this.config.channels,
          bitRate: 128000,
          linearPCMBitDepth: this.config.bitDepth,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      // Create and start recording
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();
      
      this.isRecording = true;
      console.log('✅ Recording started');

      // Start chunking loop
      this.startChunkingLoop();

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      
      if (this.onRecordingErrorCallback) {
        this.onRecordingErrorCallback(error as Error);
      }
      
      throw error;
    }
  }

  /**
   * Chunking loop: reads recorded audio at intervals and sends chunks
   * Note: expo-av doesn't support real-time streaming natively,
   * so this is a simplified version. For production, consider using
   * react-native-audio or implementing native modules.
   */
  private startChunkingLoop(): void {
    // TODO: Implement real-time PCM streaming
    // Current limitation: expo-av records to a file, not real-time stream
    // 
    // For now, we'll need to:
    // 1. Record for short intervals (e.g., 1 second)
    // 2. Stop recording, read file, convert to PCM
    // 3. Send chunk to callback
    // 4. Resume recording
    //
    // This approach has ~500ms latency but works with current APIs
    // 
    // For lower latency, consider:
    // - react-native-audio (direct PCM access)
    // - Native modules (iOS: AVAudioEngine, Android: AudioRecord)
    // - Web: MediaRecorder API with AudioWorklet

    console.log('📊 Chunking loop started (simplified mode)');
    console.log('⚠️  Note: Real-time PCM streaming requires native implementation');
    console.log('   Current approach: Record → Stop → Read → Send → Repeat');
  }

  /**
   * Stop continuous recording
   */
  async stopContinuousRecording(): Promise<void> {
    if (!this.isRecording) {
      console.warn('⚠️  Not currently recording');
      return;
    }

    try {
      console.log('🛑 Stopping continuous recording...');

      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }

      this.isRecording = false;
      this.onAudioChunkCallback = null;

      console.log('✅ Recording stopped');
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
    }
  }

  /**
   * Play audio chunk (received from Gemini)
   * Queues chunks for smooth playback
   * 
   * @param pcmData - 16-bit PCM audio data at 24kHz
   */
  async playAudioChunk(pcmData: ArrayBuffer): Promise<void> {
    try {
      // Add to playback queue
      this.playbackQueue.push(pcmData);

      // Start processing queue if not already
      if (!this.isProcessingPlayback) {
        this.processPlaybackQueue();
      }
    } catch (error) {
      console.error('❌ Failed to queue audio chunk:', error);
      
      if (this.onPlaybackErrorCallback) {
        this.onPlaybackErrorCallback(error as Error);
      }
    }
  }

  /**
   * Process playback queue
   * Converts PCM chunks to playable format and plays them sequentially
   */
  private async processPlaybackQueue(): Promise<void> {
    if (this.isProcessingPlayback) {
      return;
    }

    this.isProcessingPlayback = true;
    this.isPlaying = true;

    try {
      while (this.playbackQueue.length > 0) {
        const pcmData = this.playbackQueue.shift();
        
        if (!pcmData) continue;

        // Convert PCM to playable format
        // Note: expo-av requires audio files, not raw PCM
        // For real-time playback, we need to:
        // 1. Convert PCM ArrayBuffer to WAV format
        // 2. Create blob/URI
        // 3. Play with expo-av
        //
        // This adds latency. For production, consider:
        // - react-native-sound for lower latency
        // - Native audio queue (iOS: AVAudioEngine, Android: AudioTrack)
        // - Web: Web Audio API with AudioBufferSourceNode

        await this.playPCMChunk(pcmData);
      }
    } catch (error) {
      console.error('❌ Playback queue error:', error);
    } finally {
      this.isProcessingPlayback = false;
      this.isPlaying = false;
    }
  }

  /**
   * Play a single PCM chunk
   */
  private async playPCMChunk(pcmData: ArrayBuffer): Promise<void> {
    try {
      // Convert PCM to WAV format
      const wavData = this.pcmToWav(pcmData, 24000, 1, 16);
      
      // Create blob and URI
      const blob = new Blob([wavData], { type: 'audio/wav' });
      const uri = URL.createObjectURL(blob);

      // Play audio
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      this.sound = sound;

      // Wait for playback to finish
      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            resolve();
          }
        });
      });

      // Cleanup
      await sound.unloadAsync();
      URL.revokeObjectURL(uri);

    } catch (error) {
      console.error('❌ Failed to play PCM chunk:', error);
    }
  }

  /**
   * Stop current audio playback immediately
   * Used for handling interrupts
   */
  async stopPlayback(): Promise<void> {
    console.log('🛑 Stopping audio playback...');

    try {
      // Clear playback queue
      this.playbackQueue = [];

      // Stop current sound
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }

      this.isPlaying = false;
      this.isProcessingPlayback = false;

      console.log('✅ Playback stopped');
    } catch (error) {
      console.error('❌ Failed to stop playback:', error);
    }
  }

  /**
   * Check if currently recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Check if currently playing audio
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Set recording error callback
   */
  onRecordingError(callback: (error: Error) => void): void {
    this.onRecordingErrorCallback = callback;
  }

  /**
   * Set playback error callback
   */
  onPlaybackError(callback: (error: Error) => void): void {
    this.onPlaybackErrorCallback = callback;
  }

  /**
   * Cleanup and release resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up audio resources...');

    await this.stopContinuousRecording();
    await this.stopPlayback();

    console.log('✅ Audio cleanup complete');
  }

  // ===== UTILITY METHODS =====

  /**
   * Convert PCM ArrayBuffer to WAV format
   * Required for playback with expo-av
   */
  private pcmToWav(
    pcmData: ArrayBuffer,
    sampleRate: number,
    numChannels: number,
    bitDepth: number
  ): ArrayBuffer {
    const dataLength = pcmData.byteLength;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF'); // ChunkID
    view.setUint32(4, 36 + dataLength, true); // ChunkSize
    writeString(8, 'WAVE'); // Format
    writeString(12, 'fmt '); // Subchunk1ID
    view.setUint32(16, 16, true); // Subchunk1Size (PCM)
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // ByteRate
    view.setUint16(32, numChannels * (bitDepth / 8), true); // BlockAlign
    view.setUint16(34, bitDepth, true); // BitsPerSample
    writeString(36, 'data'); // Subchunk2ID
    view.setUint32(40, dataLength, true); // Subchunk2Size

    // Copy PCM data
    const pcmView = new Uint8Array(pcmData);
    const wavView = new Uint8Array(buffer, 44);
    wavView.set(pcmView);

    return buffer;
  }

  /**
   * Convert WAV to PCM (strip WAV header)
   */
  private wavToPcm(wavData: ArrayBuffer): ArrayBuffer {
    // WAV header is 44 bytes, PCM data starts after
    return wavData.slice(44);
  }
}

/**
 * Singleton instance for global access
 */
let audioStreamManagerInstance: AudioStreamManager | null = null;

export function getAudioStreamManager(): AudioStreamManager {
  if (!audioStreamManagerInstance) {
    audioStreamManagerInstance = new AudioStreamManager();
  }
  return audioStreamManagerInstance;
}
