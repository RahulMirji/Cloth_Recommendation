/**
 * Password Reset Web Redirect Handler
 * 
 * This page handles password reset links from emails on web.
 * It attempts to open the app via deep link, with fallback instructions.
 */

import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';

export default function ResetPasswordRedirect() {
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const token = params.token as string;
  const email = params.email as string;

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      return;
    }

    // If on mobile web, try to open the app
    if (Platform.OS === 'web') {
      const deepLink = `aidryer://reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      
      // Try to open the app
      window.location.href = deepLink;
      
      // Set timeout to show fallback instructions
      setTimeout(() => {
        setStatus('success');
      }, 2000);
    } else {
      // If somehow running native, just navigate directly
      router.push({
        pathname: '/auth/reset-password',
        params: { token, email },
      } as any);
    }
  }, [token, email]);

  if (Platform.OS !== 'web') {
    return null; // This should only render on web
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.end]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.content}>
        {status === 'loading' && (
          <View style={styles.section}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.title}>Opening AI Dresser...</Text>
            <Text style={styles.subtitle}>Please wait</Text>
          </View>
        )}

        {status === 'success' && (
          <View style={styles.section}>
            <Text style={styles.title}>Reset Your Password</Text>
            <Text style={styles.subtitle}>
              Click the button below to open the AI Dresser app and reset your password.
            </Text>
            
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                const deepLink = `aidryer://reset-password?token=${token}&email=${encodeURIComponent(email)}`;
                window.location.href = deepLink;
              }}
            >
              <Text style={styles.buttonText}>Open AI Dresser App</Text>
            </TouchableOpacity>

            <View style={styles.instructions}>
              <Text style={styles.instructionTitle}>App didn&apos;t open?</Text>
              <Text style={styles.instructionText}>
                1. Make sure the AI Dresser app is installed on your device
              </Text>
              <Text style={styles.instructionText}>
                2. Copy this token and paste it in the app:
              </Text>
              <View style={styles.tokenContainer}>
                <Text style={styles.tokenText} selectable>
                  {token}
                </Text>
              </View>
              <Text style={styles.instructionText}>
                3. Open the AI Dresser app manually
              </Text>
              <Text style={styles.instructionText}>
                4. Go to Forgot Password → Enter your email → Use the test button
              </Text>
            </View>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.section}>
            <Text style={styles.title}>Invalid Reset Link</Text>
            <Text style={styles.subtitle}>
              This password reset link is invalid or has expired.
              Please request a new password reset link from the app.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 32,
    maxWidth: 500,
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: FontSizes.hero,
    fontWeight: FontWeights.bold as any,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
  },
  buttonText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold as any,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  instructions: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    width: '100%',
    gap: 12,
  },
  instructionTitle: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold as any,
    color: Colors.text,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tokenContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  tokenText: {
    fontSize: FontSizes.small,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    color: Colors.text,
    textAlign: 'center',
  },
});
