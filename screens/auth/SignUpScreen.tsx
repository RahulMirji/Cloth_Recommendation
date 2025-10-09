/**
 * Sign Up Screen
 * 
 * User registration screen with name, email, and password.
 * Integrates with Supabase authentication.
 */

import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { GlassContainer } from '@/components/GlassContainer';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { showCustomAlert } from '@/utils/customAlert';

// Supabase configuration
const SUPABASE_URL = 'https://wmhiwieooqfwkrdcvqvb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaGl3aWVvb3Fmd2tyZGN2cXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Nzg3MTksImV4cCI6MjA3NTE1NDcxOX0.R-jk3IOAGVtRXvM2nLpB3gfMXcsrPO6WDLxY5TId6UA';

export function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Refs for OTP inputs
  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  
  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timer]);

  const validateEmail = (emailAddress: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  const handleSendOTP = async () => {
    // Validation
    if (!name.trim()) {
      showCustomAlert('warning', 'Required Field', 'Please enter your name');
      return;
    }

    if (!email.trim()) {
      showCustomAlert('warning', 'Required Field', 'Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      showCustomAlert('error', 'Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!password) {
      showCustomAlert('warning', 'Required Field', 'Please enter a password');
      return;
    }

    if (password.length < 6) {
      showCustomAlert('warning', 'Weak Password', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      showCustomAlert('error', 'Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Call Edge Function to send OTP
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/send-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: email.trim(),
            name: name.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      setTimer(60);
      setIsTimerActive(true);
      
      showCustomAlert('success', 'OTP Sent', data.message || 'A verification code has been sent to your email.');
      
      // Focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 500);
    } catch (error: any) {
      console.error('Send OTP error:', error);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      showCustomAlert('error', 'Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyPress = (key: string, index: number) => {
    // Handle backspace
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSignUp = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      showCustomAlert('warning', 'Invalid OTP', 'Please enter the complete 6-digit code.');
      return;
    }

    setIsLoading(true);

    try {
      // Call Edge Function to verify OTP and create account
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/verify-otp-signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
            name: name.trim(),
            otp: otpCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      // Success! Navigate to sign-in page
      showCustomAlert(
        'success',
        'Success!',
        data.message || 'Your account has been created successfully. Please sign in to continue.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/sign-in' as any),
          },
        ]
      );
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      let errorMessage = 'Failed to verify OTP. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      showCustomAlert('error', 'Verification Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call Edge Function to send new OTP
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/send-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: email.trim(),
            name: name.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      setOtp(['', '', '', '', '', '']);
      setTimer(60);
      setIsTimerActive(true);
      
      showCustomAlert('success', 'OTP Resent', data.message || 'A new verification code has been sent to your email.');
      
      // Focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 500);
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      
      let errorMessage = 'Failed to resend OTP. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      showCustomAlert('error', 'Error', errorMessage);
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Sign up to get started with AI Fashion Assistant
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <InputField
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              icon={<User size={20} color={Colors.text} />}
              autoCapitalize="words"
              editable={!isLoading && !otpSent}
            />

            <InputField
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              icon={<Mail size={20} color={Colors.text} />}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading && !otpSent}
            />

            <View>
              <InputField
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                icon={<Lock size={20} color={Colors.text} />}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading && !otpSent}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading || otpSent}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <View>
              <InputField
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                icon={<Lock size={20} color={Colors.text} />}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading && !otpSent}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading || otpSent}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
              {/* Green checkmark when passwords match */}
              {confirmPassword.length > 0 && password === confirmPassword && (
                <View style={styles.checkmarkIcon}>
                  <Check size={20} color={Colors.success} strokeWidth={3} />
                </View>
              )}
            </View>

            {/* OTP Section */}
            {otpSent && (
              <View style={styles.otpSection}>
                <Text style={styles.otpLabel}>Enter Verification Code</Text>
                <Text style={styles.otpSubtitle}>
                  We've sent a 6-digit code to {email}
                </Text>
                
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        otpInputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.otpInput,
                        digit ? styles.otpInputFilled : null,
                      ]}
                      value={digit}
                      onChangeText={(value) => handleOTPChange(value, index)}
                      onKeyPress={({ nativeEvent: { key } }) =>
                        handleOTPKeyPress(key, index)
                      }
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      editable={!isLoading}
                    />
                  ))}
                </View>

                <View style={styles.timerContainer}>
                  {timer > 0 ? (
                    <Text style={styles.timerText}>
                      Resend code in {timer}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOTP}>
                      <Text style={styles.resendText}>Resend Code</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <PrimaryButton
              title={
                isLoading
                  ? otpSent
                    ? 'Verifying...'
                    : 'Sending OTP...'
                  : otpSent
                  ? 'Sign Up'
                  : 'Send OTP'
              }
              onPress={otpSent ? handleSignUp : handleSendOTP}
              disabled={isLoading || (otpSent && otp.join('').length !== 6)}
              style={styles.signUpButton}
            />

            {/* Sign In Link */}
            <TouchableOpacity
              onPress={() => router.replace('/auth/sign-in' as any)}
              disabled={isLoading}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                Already have an account?{' '}
                <Text style={styles.linkBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
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
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  checkmarkIcon: {
    position: 'absolute',
    right: 56, // Position to the left of the eye icon
    top: 16,
    padding: 4,
  },
  signUpButton: {
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
  otpSection: {
    marginTop: 8,
  },
  otpLabel: {
    fontSize: FontSizes.subheading,
    fontWeight: FontWeights.semibold as any,
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  otpSubtitle: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    fontSize: FontSizes.hero,
    fontWeight: FontWeights.bold as any,
    color: Colors.text,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundSecondary,
  },
  timerContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  timerText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
  },
  resendText: {
    fontSize: FontSizes.body,
    color: Colors.primary,
    fontWeight: FontWeights.semibold as any,
  },
});
