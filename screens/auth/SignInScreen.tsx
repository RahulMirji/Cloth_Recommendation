/**
 * Sign In Screen
 * 
 * User login screen with email and password.
 * Integrates with Supabase authentication.
 */

import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
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
import { BlurView } from 'expo-blur';

import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { showCustomAlert } from '@/utils/customAlert';

export function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const validateEmail = (emailAddress: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  const handleSignIn = async () => {
    // Validation
    if (!email.trim()) {
      showCustomAlert('warning', 'Required Field', 'Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      showCustomAlert('error', 'Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!password) {
      showCustomAlert('warning', 'Required Field', 'Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.log('⚠️ Sign in error:', error);
        throw error;
      }

      if (data.session) {
        // Navigation will be handled by AppContext session listener
        // The app will automatically redirect to home when session is detected
        
        // Add a small delay and fallback navigation just in case
        setTimeout(() => {
          try {
            router.replace('/(tabs)' as any);
          } catch (error) {
            console.log('⚠️ Navigation error:', error);
          }
        }, 1000);
      }
    } catch (error: any) {
      console.log('⚠️ Sign in catch:', error);
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before signing in.';
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showCustomAlert('error', 'Sign In Error', errorMessage);
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue with AI Fashion Assistant
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <InputField
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              icon={<Mail size={20} color={Colors.text} />}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />

            <View>
              <InputField
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                icon={<Lock size={20} color={Colors.text} />}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={() => router.push('/auth/forgot-password' as any)}
              disabled={isLoading}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <PrimaryButton
              title={isLoading ? 'Signing In...' : 'Sign In'}
              onPress={handleSignIn}
              disabled={isLoading}
              style={styles.signInButton}
            />

            {/* Sign Up Link */}
            <TouchableOpacity
              onPress={() => router.replace('/auth/sign-up' as any)}
              disabled={isLoading}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                Don't have an account?{' '}
                <Text style={styles.linkBold}>Sign Up</Text>
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
    color: '#1a1a2e', // Deep navy-charcoal - sophisticated and readable
    lineHeight: 22,
    fontWeight: FontWeights.medium as any,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    fontWeight: FontWeights.semibold as any,
  },
  signInButton: {
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
