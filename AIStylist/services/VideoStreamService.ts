/**
 * Video Stream Service
 * Handles continuous video frame capture and streaming for Gemini Live API
 * Optimized for React Native with expo-camera
 */

import { CameraView } from 'expo-camera';
import { Platform } from 'react-native';

export interface VideoStreamConfig {
  frameRate: number; // Frames per second (1-10 recommended)
  quality: number; // JPEG quality (0.1-1.0)
  enabled: boolean;
}

export type FrameCallback = (frameBase64: string) => void;

class VideoStreamService {
  private cameraRef: CameraView | null = null;
  private isStreaming: boolean = false;
  private frameInterval: ReturnType<typeof setInterval> | null = null;
  private onFrameReady: FrameCallback | null = null;
  private lastFrameTime: number = 0;
  
  private config: VideoStreamConfig = {
    frameRate: 2, // Default: 2 fps for balanced performance
    quality: 0.7, // Default: 70% quality
    enabled: false,
  };

  /**
   * Set the camera reference for frame capture
   */
  setupCamera(cameraRef: CameraView | null): void {
    this.cameraRef = cameraRef;
    console.log('📹 VideoStreamService: Camera reference set');
  }

  /**
   * Start streaming video frames
   */
  startStreaming(onFrameReady: FrameCallback, config?: Partial<VideoStreamConfig>): void {
    if (this.isStreaming) {
      console.warn('⚠️ VideoStreamService: Already streaming');
      return;
    }

    // Update config if provided
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.onFrameReady = onFrameReady;
    this.isStreaming = true;
    this.config.enabled = true;

    console.log('🎬 VideoStreamService: Starting video stream', {
      frameRate: this.config.frameRate,
      quality: this.config.quality,
      intervalMs: 1000 / this.config.frameRate,
    });

    // Start frame capture interval
    const intervalMs = 1000 / this.config.frameRate;
    this.frameInterval = setInterval(() => {
      this.captureAndSendFrame();
    }, intervalMs);
  }

  /**
   * Stop streaming video frames
   */
  stopStreaming(): void {
    if (!this.isStreaming) {
      return;
    }

    console.log('🛑 VideoStreamService: Stopping video stream');

    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    this.isStreaming = false;
    this.config.enabled = false;
    this.onFrameReady = null;
  }

  /**
   * Update streaming configuration
   */
  updateConfig(config: Partial<VideoStreamConfig>): void {
    const oldFrameRate = this.config.frameRate;
    this.config = { ...this.config, ...config };

    console.log('⚙️ VideoStreamService: Config updated', this.config);

    // Restart streaming if frame rate changed
    if (this.isStreaming && oldFrameRate !== this.config.frameRate && this.onFrameReady) {
      this.stopStreaming();
      this.startStreaming(this.onFrameReady, this.config);
    }
  }

  /**
   * Set frame rate (frames per second)
   */
  setFrameRate(fps: number): void {
    if (fps < 0.5 || fps > 30) {
      console.warn('⚠️ VideoStreamService: Frame rate must be between 0.5 and 30 fps');
      return;
    }
    this.updateConfig({ frameRate: fps });
  }

  /**
   * Set JPEG quality (0.1 to 1.0)
   */
  setQuality(quality: number): void {
    if (quality < 0.1 || quality > 1.0) {
      console.warn('⚠️ VideoStreamService: Quality must be between 0.1 and 1.0');
      return;
    }
    this.updateConfig({ quality });
  }

  /**
   * Capture current frame and send to callback
   */
  private async captureAndSendFrame(): Promise<void> {
    if (!this.isStreaming || !this.onFrameReady || !this.cameraRef) {
      return;
    }

    const currentTime = Date.now();
    
    // Throttle to prevent too frequent captures
    const minInterval = 1000 / this.config.frameRate;
    if (currentTime - this.lastFrameTime < minInterval * 0.9) {
      return;
    }

    try {
      // Capture photo from camera
      const photo = await this.cameraRef.takePictureAsync({
        quality: this.config.quality,
        base64: true,
        skipProcessing: true, // Skip processing for faster capture
      });

      if (photo.base64) {
        this.lastFrameTime = currentTime;
        
        // Send base64 frame to callback (without data URI prefix)
        this.onFrameReady(photo.base64);
        
        // Log frame capture (throttled logging)
        if (currentTime % 5000 < minInterval) {
          console.log('📸 VideoStreamService: Frame captured', {
            size: Math.round(photo.base64.length / 1024) + 'KB',
            fps: this.config.frameRate,
          });
        }
      }
    } catch (error) {
      console.error('❌ VideoStreamService: Frame capture error:', error);
      // Don't stop streaming on single frame error
    }
  }

  /**
   * Get current streaming status
   */
  getStatus(): {
    isStreaming: boolean;
    config: VideoStreamConfig;
  } {
    return {
      isStreaming: this.isStreaming,
      config: { ...this.config },
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopStreaming();
    this.cameraRef = null;
    console.log('🧹 VideoStreamService: Cleaned up');
  }
}

// Export singleton instance
export const videoStreamService = new VideoStreamService();
