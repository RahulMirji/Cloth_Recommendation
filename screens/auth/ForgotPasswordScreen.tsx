/**
 * Forgot Password Screen
 * 
 * Password reset screen where users can request a reset link.
 * Integrates with Supabase authentication.
 */

import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { showCustomAlert } from '@/utils/customAlert';

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const insets = useSafeAreaInsets();

  const validateEmail = (emailAddress: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  const handleResetPassword = async () => {
    // Validation
    if (!email.trim()) {
      showCustomAlert('warning', 'Required Field', 'Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      showCustomAlert('error', 'Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'aidryer://reset-password', // Deep link for mobile app
      });

      if (error) throw error;

      setEmailSent(true);
      showCustomAlert(
        'success',
        'Check Your Email',
        'We have sent you a password reset link. Please check your inbox.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      showCustomAlert(
        'error',
        'Reset Error',
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.end]}
        style={StyleSheet.absoluteFill}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            disabled={isLoading}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your
              password
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {!emailSent ? (
              <>
                <InputField
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  icon={<Mail size={20} color={Colors.text} />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />

                <PrimaryButton
                  title={isLoading ? 'Sending...' : 'Send Reset Link'}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  style={styles.resetButton}
                />
              </>
            ) : (
              <View style={styles.successContainer}>
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successText}>
                  Check your inbox for the password reset link. If you don't see
                  it, check your spam folder.
                </Text>
                <PrimaryButton
                  title="Back to Sign In"
                  onPress={() => router.replace('/auth/sign-in' as any)}
                  style={styles.backToSignInButton}
                />
              </View>
            )}

            {/* Sign In Link */}
            {!emailSent && (
              <TouchableOpacity
                onPress={() => router.replace('/auth/sign-in' as any)}
                disabled={isLoading}
                style={styles.linkContainer}
              >
                <Text style={styles.linkText}>
                  Remember your password?{' '}
                  <Text style={styles.linkBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 20,
    padding: 8,
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: FontSizes.hero,
    fontWeight: FontWeights.bold as any,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  formContainer: {
    padding: 24,
    gap: 16,
    backgroundColor: 'rgba(225, 195, 245, 1)', // Rich vibrant pinkish-lavender
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  resetButton: {
    marginTop: 8,
  },
  successContainer: {
    alignItems: 'center',
    gap: 16,
  },
  successTitle: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold as any,
    color: Colors.success,
    textAlign: 'center',
  },
  successText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  backToSignInButton: {
    marginTop: 8,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
  },
  linkBold: {
    fontWeight: FontWeights.bold as any,
    color: Colors.primary,
  },
});
