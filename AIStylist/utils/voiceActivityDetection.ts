/**
 * Voice Activity Detection (VAD) for React Native
 * Detects when user is speaking vs silence
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export interface VADConfig {
  sampleRate: number;
  energyThreshold: number;
  silenceDuration: number; // ms of silence before stopping
  minSpeechDuration: number; // ms of speech to trigger
  updateInterval: number; // polling interval
}

export interface VADEvent {
  type: 'speech_start' | 'speech_end' | 'speech_active';
  timestamp: number;
  duration?: number;
  averageVolume?: number;
}

type VADCallback = (event: VADEvent) => void;

class VoiceActivityDetector {
  private recording: Audio.Recording | null = null;
  private isMonitoring = false;
  private callbacks: VADCallback[] = [];
  
  private config: VADConfig = {
    sampleRate: 16000,
    energyThreshold: -40, // dB threshold
    silenceDuration: 800, // 800ms silence = end
    minSpeechDuration: 300, // 300ms speech = start
    updateInterval: 50, // check every 50ms
  };

  private speechStartTime = 0;
  private lastSpeechTime = 0;
  private isSpeaking = false;
  private volumeHistory: number[] = [];
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Start VAD monitoring
   */
  async startMonitoring(callback: VADCallback): Promise<boolean> {
    if (this.isMonitoring) {
      console.warn('VAD already monitoring');
      return false;
    }

    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('❌ Microphone permission denied');
        return false;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording with metering enabled
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: this.config.sampleRate,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: this.config.sampleRate,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await this.recording.startAsync();

      this.callbacks.push(callback);
      this.isMonitoring = true;
      this.isSpeaking = false;
      this.volumeHistory = [];

      // Start polling for audio levels
      this.checkInterval = setInterval(() => {
        this.checkAudioLevel();
      }, this.config.updateInterval);

      console.log('🎤 VAD monitoring started');
      return true;

    } catch (error) {
      console.error('❌ VAD start error:', error);
      return false;
    }
  }

  /**
   * Stop VAD monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }

      this.isMonitoring = false;
      this.callbacks = [];
      this.volumeHistory = [];
      
      console.log('🔇 VAD monitoring stopped');

    } catch (error) {
      console.error('❌ VAD stop error:', error);
    }
  }

  /**
   * Update VAD configuration
   */
  updateConfig(newConfig: Partial<VADConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ VAD config updated:', newConfig);
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Get current speech duration
   */
  getSpeechDuration(): number {
    if (!this.isSpeaking || this.speechStartTime === 0) {
      return 0;
    }
    return Date.now() - this.speechStartTime;
  }

  // Private methods

  private async checkAudioLevel(): Promise<void> {
    if (!this.recording || !this.isMonitoring) {
      return;
    }

    try {
      const status = await this.recording.getStatusAsync();
      
      if (!status.isRecording || !status.metering) {
        return;
      }

      // Get current volume in dB
      const currentVolume = status.metering;
      this.volumeHistory.push(currentVolume);

      // Keep only last 10 samples
      if (this.volumeHistory.length > 10) {
        this.volumeHistory.shift();
      }

      // Calculate average volume
      const avgVolume = this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length;

      // Check if speaking
      const isSpeechActive = avgVolume > this.config.energyThreshold;

      if (isSpeechActive) {
        this.lastSpeechTime = Date.now();

        // Start speech event
        if (!this.isSpeaking) {
          const duration = Date.now() - this.speechStartTime;
          
          if (this.speechStartTime === 0 || duration > this.config.minSpeechDuration) {
            this.isSpeaking = true;
            this.speechStartTime = Date.now();
            
            this.emitEvent({
              type: 'speech_start',
              timestamp: Date.now(),
              averageVolume: avgVolume,
            });
          }
        } else {
          // Ongoing speech
          this.emitEvent({
            type: 'speech_active',
            timestamp: Date.now(),
            duration: this.getSpeechDuration(),
            averageVolume: avgVolume,
          });
        }
      } else {
        // Check for end of speech
        if (this.isSpeaking) {
          const silenceDuration = Date.now() - this.lastSpeechTime;
          
          if (silenceDuration > this.config.silenceDuration) {
            const speechDuration = this.getSpeechDuration();
            this.isSpeaking = false;
            
            this.emitEvent({
              type: 'speech_end',
              timestamp: Date.now(),
              duration: speechDuration,
              averageVolume: avgVolume,
            });

            this.speechStartTime = 0;
          }
        }
      }

    } catch (error) {
      console.error('❌ VAD check error:', error);
    }
  }

  private emitEvent(event: VADEvent): void {
    this.callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('❌ VAD callback error:', error);
      }
    });
  }
}

export const vadDetector = new VoiceActivityDetector();
export default vadDetector;
