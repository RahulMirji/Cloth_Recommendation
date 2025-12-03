/**
 * Video Streaming Example
 * Demonstrates how to integrate video streaming with Gemini Live API
 */

import React, { useRef, useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { videoStreamService } from '@/AIStylist/services/VideoStreamService';
import { GeminiLiveManager } from '@/AIStylist/utils/geminiLiveAPI';

export default function VideoStreamingExample() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isStreaming, setIsStreaming] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const managerRef = useRef<GeminiLiveManager | null>(null);

  // Start video streaming session
  const startSession = useCallback(async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }

    try {
      // 1. Setup camera reference
      if (cameraRef.current) {
        videoStreamService.setupCamera(cameraRef.current);
      }

      // 2. Get media stream (web only)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: 'user' },
      });

      // 3. Initialize Gemini Live Manager
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;
      const manager = new GeminiLiveManager(apiKey);
      managerRef.current = manager;

      // 4. Start Gemini session with video enabled
      await manager.startSession(
        stream,
        {
          onSessionUpdate: (update) => {
            console.log('Session update:', update);
            if (update.isActive) {
              setIsStreaming(true);
            }
          },
          onError: (error) => {
            console.error('Session error:', error);
            setIsStreaming(false);
          },
          onAudioData: (audioData) => {
            // Handle audio playback
          },
          onTranscription: (type, text) => {
            console.log(`${type}: ${text}`);
          },
        },
        { videoEnabled: true } // Enable video streaming
      );

      // 5. Start video frame streaming
      videoStreamService.startStreaming(
        (frameBase64) => {
          // Frame captured - automatically sent to Gemini via manager
          console.log('Frame captured:', Math.round(frameBase64.length / 1024) + 'KB');
        },
        {
          frameRate: 2, // 2 fps for balanced performance
          quality: 0.7, // 70% quality
          enabled: true,
        }
      );

      console.log('✅ Video streaming session started');
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }, [permission, requestPermission]);

  // Stop video streaming session
  const stopSession = useCallback(async () => {
    // Stop video streaming
    videoStreamService.stopStreaming();

    // Stop Gemini session
    if (managerRef.current) {
      await managerRef.current.stopSession();
      managerRef.current = null;
    }

    setIsStreaming(false);
    console.log('🛑 Video streaming session stopped');
  }, []);

  // Adjust frame rate dynamically
  const changeFrameRate = useCallback((fps: number) => {
    videoStreamService.setFrameRate(fps);
    console.log(`📹 Frame rate changed to ${fps} fps`);
  }, []);

  if (!permission) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
      />

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isStreaming && styles.buttonActive]}
          onPress={isStreaming ? stopSession : startSession}
        >
          <Text style={styles.buttonText}>
            {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
          </Text>
        </TouchableOpacity>

        {isStreaming && (
          <View style={styles.frameRateControls}>
            <Text style={styles.text}>Frame Rate:</Text>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => changeFrameRate(1)}
            >
              <Text style={styles.buttonText}>1 fps</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => changeFrameRate(2)}
            >
              <Text style={styles.buttonText}>2 fps</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => changeFrameRate(5)}
            >
              <Text style={styles.buttonText}>5 fps</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  buttonActive: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  frameRateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 20,
  },
  smallButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
  },
  text: {
    color: '#fff',
    fontSize: 14,
  },
});
