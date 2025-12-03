/**
 * Gemini Live Mode Screen
 * - Web: Uses iframe with embedded HTML (WebView not supported on web)
 * - Android/iOS: Uses native implementation with expo-camera + WebSocket
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { X, Send, Phone, Mic } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import Constants from 'expo-constants';

import Colors from '@/constants/colors';
import { getGeminiLiveHTML } from '@/AIStylist/utils/geminiLiveHTML';
import { GeminiLiveNative, GeminiLiveNativeSession } from '@/AIStylist/services/GeminiLiveNative';

// Conditionally import WebView only on native platforms
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

// Use WebView on mobile for better compatibility with Gemini Live API
// The native implementation has issues with the @google/genai SDK in React Native
const USE_NATIVE_ON_MOBILE = false;

export default function GeminiLiveScreen() {
  const insets = useSafeAreaInsets();
  const isNative = USE_NATIVE_ON_MOBILE && Platform.OS !== 'web';

  console.log('🎨 Gemini Live Screen');
  console.log('📱 Platform:', Platform.OS);
  console.log('🔧 Mode:', isNative ? 'Native' : 'WebView');

  const apiKey = Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  
  // Native mode state
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [session, setSession] = useState<Partial<GeminiLiveNativeSession>>({
    isActive: false,
    isConnecting: false,
    isMuted: false,
    videoEnabled: true,
    userTranscription: '',
    modelTranscription: '',
    error: null,
  });
  const [transcriptions, setTranscriptions] = useState<Array<{ type: 'user' | 'model'; text: string }>>([]);
  const [textInput, setTextInput] = useState('');
  
  const cameraRef = useRef<CameraView>(null);
  const geminiLiveRef = useRef<GeminiLiveNative | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (geminiLiveRef.current) {
        geminiLiveRef.current.stopSession();
      }
    };
  }, []);

  // Request permissions on mount for native mode
  useEffect(() => {
    if (isNative) {
      if (!cameraPermission?.granted) {
        requestCameraPermission();
      }
      if (!micPermission?.granted) {
        requestMicPermission();
      }
    }
  }, [isNative]);

  const startNativeSession = useCallback(async () => {
    if (!cameraRef.current || !apiKey) {
      Alert.alert('Error', 'Camera not ready or API key missing');
      return;
    }

    console.log('🚀 Starting native Gemini Live session...');
    
    geminiLiveRef.current = new GeminiLiveNative(apiKey);
    
    try {
      await geminiLiveRef.current.startSession(cameraRef.current, {
        onSessionUpdate: (update) => {
          setSession(prev => ({ ...prev, ...update }));
        },
        onError: (error) => {
          console.error('❌ Gemini Live error:', error);
          Alert.alert('Error', error);
        },
        onTranscription: (type, text) => {
          console.log(`📝 ${type}: ${text}`);
          setTranscriptions(prev => {
            const last = prev[prev.length - 1];
            if (last && last.type === type) {
              // Update last transcription of same type
              return [...prev.slice(0, -1), { type, text }];
            }
            return [...prev, { type, text }];
          });
        },
        onAudioResponse: (audioData) => {
          console.log('🔊 Audio response received');
        },
      });
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      Alert.alert('Error', 'Failed to start Gemini Live session');
    }
  }, [apiKey]);

  const stopNativeSession = useCallback(async () => {
    if (geminiLiveRef.current) {
      await geminiLiveRef.current.stopSession();
      geminiLiveRef.current = null;
    }
    setTranscriptions([]);
  }, []);

  const sendMessage = useCallback(() => {
    if (geminiLiveRef.current && textInput.trim()) {
      const message = textInput.trim();
      geminiLiveRef.current.sendTextMessage(message);
      setTranscriptions(prev => [...prev, { type: 'user', text: message }]);
      setTextInput('');
    }
  }, [textInput]);
  
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

  // Native implementation for Android/iOS
  if (isNative) {
    // Check permissions
    if (!cameraPermission?.granted || !micPermission?.granted) {
      return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>📷 Permissions Required</Text>
            <Text style={styles.errorMessage}>
              Camera and microphone access are required for Gemini Live.
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={async () => {
                await requestCameraPermission();
                await requestMicPermission();
              }}
            >
              <Text style={styles.backButtonText}>Grant Permissions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.backButton, { marginTop: 12, backgroundColor: '#666' }]}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
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
          mode="picture"
        />

        {/* Header */}
        <View style={[styles.webViewHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              stopNativeSession();
              router.back();
            }}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.titlePill}>
            <Text style={styles.webViewTitle}>🎨 AI Stylist Live</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Transcriptions */}
        {transcriptions.length > 0 && (
          <ScrollView
            ref={scrollViewRef}
            style={styles.transcriptionContainer}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
          >
            {transcriptions.map((t, i) => (
              <View key={i} style={[styles.transcriptionBox, t.type === 'model' && styles.modelBox]}>
                <Text style={[styles.transcriptionLabel, t.type === 'model' && styles.modelLabel]}>
                  {t.type === 'user' ? 'You' : 'Gemini'}:
                </Text>
                <Text style={styles.transcriptionText}>{t.text}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Overlay for start button */}
        {!session.isActive && !session.isConnecting && (
          <View style={styles.overlay}>
            <Text style={styles.title}>Gemini Live Stylist</Text>
            <Text style={styles.subtitle}>Real-time outfit scoring & styling advice</Text>
            <TouchableOpacity style={styles.startButton} onPress={startNativeSession}>
              <Mic size={24} color="#fff" />
              <Text style={styles.startButtonText}>Start Live Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Connecting overlay */}
        {session.isConnecting && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.connectingText}>Connecting to Gemini...</Text>
          </View>
        )}

        {/* Error overlay */}
        {session.error && (
          <View style={styles.overlay}>
            <Text style={styles.errorTitle}>Connection Failed</Text>
            <Text style={styles.subtitle}>{session.error}</Text>
            <TouchableOpacity style={styles.startButton} onPress={startNativeSession}>
              <Text style={styles.startButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Controls */}
        {session.isActive && (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputContainer}
          >
            {/* Text Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={textInput}
                onChangeText={setTextInput}
                placeholder="Describe your outfit..."
                placeholderTextColor="#999"
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity 
                style={[styles.sendButton, !textInput.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!textInput.trim()}
              >
                <Send size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* End Call Button */}
            <TouchableOpacity style={styles.endCallButtonSmall} onPress={stopNativeSession}>
              <Phone size={24} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              <Text style={styles.endCallText}>End</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        )}
      </View>
    );
  }

  // Web platform - use iframe with embedded HTML
  if (Platform.OS === 'web') {
    const html = getGeminiLiveHTML(apiKey);
    console.log('✅ Web platform - using iframe with embedded HTML');

    return (
      <View style={styles.container}>
        <View style={[styles.webViewHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.titlePill}>
            <Text style={styles.webViewTitle}>🎨 AI Stylist Live</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
        
        {/* Use iframe for web platform */}
        <iframe
          srcDoc={html}
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#000',
          }}
          allow="camera; microphone; autoplay"
          sandbox="allow-scripts allow-same-origin allow-modals"
        />
      </View>
    );
  }

  // Native platforms (iOS/Android) - use WebView
  const html = getGeminiLiveHTML(apiKey);
  console.log('✅ Native platform - using WebView');

  if (!WebView) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorTitle}>WebView Not Available</Text>
        <Text style={styles.errorMessage}>
          WebView component is not available on this platform.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.webViewHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.titlePill}>
          <Text style={styles.webViewTitle}>🎨 AI Stylist Live</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>
      
      <WebView
        source={{ html, baseUrl: 'https://generativelanguage.googleapis.com/' }}
        style={styles.webView}
        originWhitelist={['*']}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        mediaCapturePermissionGrantType="grant"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
        allowsProtectedMedia={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        cacheEnabled={true}
        incognito={false}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        onPermissionRequest={(request: any) => {
          // Auto-grant camera and microphone permissions
          console.log('📷 Permission requested:', request.nativeEvent?.resources);
          request.nativeEvent?.grant?.();
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading Gemini Live...</Text>
          </View>
        )}
        onLoadStart={() => console.log('🔄 WebView loading...')}
        onLoadEnd={() => console.log('✅ WebView loaded')}
        onMessage={(event: any) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('📨 WebView message:', data);
            if (data.type === 'close') {
              router.back();
            }
            if (data.type === 'error') {
              console.error('❌ WebView error:', data.message);
            }
          } catch (e) {
            console.log('📄 Raw message:', event.nativeEvent.data);
          }
        }}
        onError={(syntheticEvent: any) => {
          console.error('❌ WebView error:', syntheticEvent.nativeEvent);
          Alert.alert('Error', 'Failed to load. Please check your internet connection.');
        }}
        onHttpError={(syntheticEvent: any) => {
          console.error('❌ HTTP error:', syntheticEvent.nativeEvent);
        }}
      />
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
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webViewHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  titlePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  webViewTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  backButton: {
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
  // Native mode styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  connectingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
  },
  transcriptionContainer: {
    position: 'absolute',
    top: 100,
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: 'transparent',
  },
  transcriptionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  modelBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.4)',
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
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 16,
    paddingBottom: 32,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(99, 102, 241, 0.4)',
  },
  endCallButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'center',
  },
  endCallText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
