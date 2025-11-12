/**
 * Gemini Live Mode Screen
 * Real-time outfit scoring and styling conversation with Gemini 2.5 Flash
 * Features:
 * - Live video streaming to AI
 * - Real-time audio conversation
 * - Instant outfit feedback
 * - Natural, buddy-like interaction
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Mic, MicOff, X, PhoneOff, RotateCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

import Colors from '@/constants/colors';
import { GeminiLiveManager, GeminiLiveSession } from '@/AIStylist/utils/geminiLiveAPI';
import { getGeminiLiveHTMLSimple } from '@/AIStylist/utils/geminiLiveHTMLSimple';

export default function GeminiLiveScreen() {
  const insets = useSafeAreaInsets();

  console.log('🎨 GeminiLiveScreen rendered');
  console.log('📱 Platform:', Platform.OS);

  // Use WebView for mobile platforms
  if (Platform.OS !== 'web') {
    const apiKey = Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    console.log('🔑 API Key present:', !!apiKey);
    
    if (!apiKey) {
      return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>⚠️ Configuration Required</Text>
            <Text style={styles.errorMessage}>
              Gemini API key not found. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const html = getGeminiLiveHTMLSimple(apiKey);
    console.log('📄 HTML length:', html.length);
    console.log('📄 HTML preview:', html.substring(0, 100));

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity
            style={styles.closeButtonMobile}
            onPress={() => {
              console.log('❌ Close button pressed');
              router.back();
            }}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.webViewTitle}>Gemini Live Stylist</Text>
          <View style={{ width: 44 }} />
        </View>
        <WebView
          source={{ html }}
          style={styles.webView}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          mediaCapturePermissionGrantType="grant"
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          mixedContentMode="always"
          allowsProtectedMedia={true}
          renderLoading={() => {
            console.log('⏳ WebView loading...');
            return (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading Gemini Live...</Text>
              </View>
            );
          }}
          onLoadStart={() => console.log('🔄 WebView load started')}
          onLoadEnd={() => console.log('✅ WebView load ended')}
          onLoad={() => console.log('📱 WebView loaded')}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              console.log('📨 WebView message:', data);
              if (data.type === 'ready') {
                console.log('✅ WebView JavaScript is ready!');
              } else if (data.type === 'close') {
                console.log('🚪 Closing WebView');
                router.back();
              } else if (data.type === 'error') {
                console.log('❌ WebView error:', data.message);
                Alert.alert('Error', data.message);
              }
            } catch (e) {
              console.log('⚠️ WebView message parse error:', e);
              console.log('Raw message:', event.nativeEvent.data);
            }
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ WebView error:', nativeEvent);
            Alert.alert('Error', 'Failed to load Gemini Live. Please check your internet connection and try again.');
          }}
          onConsoleMessage={(event: any) => {
            console.log('🌐 WebView Console:', event.nativeEvent.message);
          }}
        />
      </View>
    );
  }

  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [session, setSession] = useState<GeminiLiveSession>({
    isActive: false,
    isConnecting: false,
    isMuted: false,
    userTranscription: '',
    modelTranscription: '',
    error: null,
  });

  const cameraRef = useRef<CameraView>(null);
  const liveManagerRef = useRef<GeminiLiveManager | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleStopCall();
    };
  }, []);

  const handleStartCall = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Web Only Feature',
        'Gemini Live mode is currently only available on web. Please use the standard AI Stylist mode on mobile.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera and microphone access is needed for live mode.');
        return;
      }
    }

    try {
      // Get API key from environment
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        setSession(prev => ({
          ...prev,
          error: 'API key not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY.',
        }));
        return;
      }

      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: facing === 'front' ? 'user' : 'environment' },
      });

      mediaStreamRef.current = stream;

      // Initialize Gemini Live Manager
      const manager = new GeminiLiveManager(apiKey);
      liveManagerRef.current = manager;

      // Start session with callbacks
      await manager.startSession(stream, {
        onSessionUpdate: (update) => {
          setSession(prev => ({ ...prev, ...update }));
        },
        onError: (error) => {
          setSession(prev => ({ ...prev, error, isActive: false, isConnecting: false }));
          Alert.alert('Error', error);
        },
        onAudioData: (audioData) => {
          // Audio data is handled internally by the manager
        },
        onTranscription: (type, text) => {
          if (type === 'user') {
            setSession(prev => ({ ...prev, userTranscription: text }));
          } else {
            setSession(prev => ({ ...prev, modelTranscription: text }));
          }
        },
      });
    } catch (error) {
      console.error('Failed to start Gemini Live session:', error);
      const message = error instanceof Error ? error.message : 'Failed to start session';
      setSession(prev => ({ ...prev, error: message, isConnecting: false }));
      Alert.alert('Error', message);
    }
  }, [permission, requestPermission, facing]);

  const handleStopCall = useCallback(async () => {
    if (liveManagerRef.current) {
      await liveManagerRef.current.stopSession();
      liveManagerRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    setSession({
      isActive: false,
      isConnecting: false,
      isMuted: false,
      userTranscription: '',
      modelTranscription: '',
      error: null,
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    if (liveManagerRef.current) {
      const newMuted = !session.isMuted;
      liveManagerRef.current.setMuted(newMuted);
    }
  }, [session.isMuted]);

  const toggleCameraFacing = useCallback(() => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }, []);

  const handleClose = useCallback(() => {
    handleStopCall();
    router.back();
  }, [handleStopCall]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera and microphone access is required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        />

        {/* Close Button */}
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 10 }]}
          onPress={handleClose}
        >
          <X size={24} color="#fff" />
        </TouchableOpacity>

        {/* Flip Camera Button */}
        {!session.isActive && (
          <TouchableOpacity
            style={[styles.flipButton, { top: insets.top + 10 }]}
            onPress={toggleCameraFacing}
          >
            <RotateCw size={24} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Overlay for non-active states */}
        {!session.isActive && !session.isConnecting && (
          <View style={styles.overlay}>
            <Text style={styles.title}>Gemini Live Stylist</Text>
            <Text style={styles.subtitle}>Real-time outfit scoring & styling advice</Text>
            <TouchableOpacity style={styles.startButton} onPress={handleStartCall}>
              <Mic size={24} color="#fff" />
              <Text style={styles.startButtonText}>Start Live Session</Text>
            </TouchableOpacity>
            {Platform.OS !== 'web' && (
              <Text style={styles.webOnlyText}>⚠️ Web only feature</Text>
            )}
          </View>
        )}

        {session.isConnecting && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.connectingText}>Connecting to Gemini...</Text>
          </View>
        )}

        {/* Transcription Display */}
        {session.isActive && (
          <View style={styles.transcriptionContainer}>
            {session.userTranscription && (
              <View style={styles.transcriptionBox}>
                <Text style={styles.transcriptionLabel}>You:</Text>
                <Text style={styles.transcriptionText}>{session.userTranscription}</Text>
              </View>
            )}
            {session.modelTranscription && (
              <View style={[styles.transcriptionBox, styles.modelTranscriptionBox]}>
                <Text style={[styles.transcriptionLabel, styles.modelLabel]}>Gemini:</Text>
                <Text style={styles.transcriptionText}>{session.modelTranscription}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Controls */}
      {session.isActive && (
        <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={[styles.controlButton, session.isMuted && styles.mutedButton]}
            onPress={handleToggleMute}
          >
            {session.isMuted ? <MicOff size={28} color="#fff" /> : <Mic size={28} color="#fff" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.endCallButton} onPress={handleStopCall}>
            <PhoneOff size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Error Display */}
      {session.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{session.error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  webViewTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButtonMobile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButton: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 32,
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  webOnlyText: {
    marginTop: 16,
    color: '#fbbf24',
    fontSize: 14,
  },
  connectingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 18,
  },
  transcriptionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
  },
  transcriptionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  modelTranscriptionBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  transcriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60a5fa',
    marginBottom: 4,
  },
  modelLabel: {
    color: '#a78bfa',
  },
  transcriptionText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 20,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(107, 114, 128, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedButton: {
    backgroundColor: 'rgba(251, 191, 36, 0.8)',
  },
  endCallButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#000',
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
