/**
 * Gemini Live Mode Screen - WebView Implementation
 * Works on ALL platforms by embedding a full browser environment
 * The browser runs the @google/genai SDK which handles the WebSocket protocol
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

import Colors from '@/constants/colors';
import { getGeminiLiveHTML } from '@/AIStylist/utils/geminiLiveHTML';

export default function GeminiLiveScreen() {
  const insets = useSafeAreaInsets();

  console.log('🎨 Gemini Live Screen - WebView Mode');
  console.log('📱 Platform:', Platform.OS);

  const apiKey = Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  
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

  const html = getGeminiLiveHTML(apiKey);
  console.log('✅ Full HTML with embedded @google/genai SDK loaded');

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
        source={{ html, baseUrl: 'https://localhost/' }}
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
        // Inject console.log bridge to see WebView logs in React Native console
        injectedJavaScript={`
          (function() {
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            
            console.log = function(...args) {
              originalLog.apply(console, args);
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'log',
                level: 'log',
                message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
              }));
            };
            
            console.error = function(...args) {
              originalError.apply(console, args);
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'log',
                level: 'error',
                message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
              }));
            };
            
            console.warn = function(...args) {
              originalWarn.apply(console, args);
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'log',
                level: 'warn',
                message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
              }));
            };
            
            console.log('✅ Console bridge initialized');
          })();
          true;
        `}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading Gemini Live...</Text>
          </View>
        )}
        onLoadStart={() => console.log('🔄 WebView loading...')}
        onLoadEnd={() => console.log('✅ WebView loaded')}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            
            // Handle console logs from WebView
            if (data.type === 'log') {
              const prefix = data.level === 'error' ? '❌ WebView' : 
                            data.level === 'warn' ? '⚠️ WebView' : 
                            '🌐 WebView';
              console.log(`${prefix}: ${data.message}`);
              return;
            }
            
            // Handle other messages
            console.log('📨 Message from WebView:', data.type);
            
            if (data.type === 'close') {
              console.log('🚪 Closing Gemini Live');
              router.back();
            } else if (data.type === 'error') {
              console.error('⚠️ WebView error:', data.message);
              if (data.stack) {
                console.error('Stack:', data.stack);
              }
            }
          } catch (e) {
            console.log('📄 Raw message:', event.nativeEvent.data);
          }
        }}
        onError={(syntheticEvent) => {
          console.error('❌ WebView error:', syntheticEvent.nativeEvent);
          Alert.alert('Error', 'Failed to load. Please check your internet connection.');
        }}
        onHttpError={(syntheticEvent) => {
          console.warn('⚠️ HTTP error:', syntheticEvent.nativeEvent.statusCode, syntheticEvent.nativeEvent.url);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    backdropFilter: 'blur(10px)',
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
});
