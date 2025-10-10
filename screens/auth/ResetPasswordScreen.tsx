/**
 * Reset Password Screen
 * 
 * Handles password reset via deep link with token validation
 * Shows password strength indicator and confirmation
 */

import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { showCustomAlert } from '@/utils/customAlert';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Weak',
    color: Colors.error,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  });
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Extract token and email from deep link params
    if (params.token && params.email) {
      setToken(params.token as string);
      setEmail(decodeURIComponent(params.email as string));
    } else {
      showCustomAlert(
        'error',
        'Invalid Link',
        'This password reset link is invalid. Please request a new one.',
        [{ text: 'OK', onPress: () => router.replace('/auth/forgot-password' as any) }]
      );
    }
  }, [params]);

  useEffect(() => {
    calculatePasswordStrength(newPassword);
  }, [newPassword]);

  const calculatePasswordStrength = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const satisfiedCount = Object.values(requirements).filter(Boolean).length;
    let score = 0;
    let label = 'Weak';
    let color = Colors.error;

    if (satisfiedCount >= 5) {
      score = 100;
      label = 'Very Strong';
      color = '#10B981'; // green
    } else if (satisfiedCount >= 4) {
      score = 75;
      label = 'Strong';
      color = '#3B82F6'; // blue
    } else if (satisfiedCount >= 3) {
      score = 50;
      label = 'Medium';
      color = '#F59E0B'; // orange
    } else if (satisfiedCount >= 1) {
      score = 25;
      label = 'Weak';
      color = Colors.error;
    }

    setPasswordStrength({ score, label, color, requirements });
  };

  const handleResetPassword = async () => {
    // Validation
    if (!newPassword || !confirmPassword) {
      showCustomAlert('warning', 'Required Fields', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      showCustomAlert('error', 'Password Mismatch', 'Passwords do not match');
      return;
    }

    if (passwordStrength.score < 50) {
      showCustomAlert(
        'warning',
        'Weak Password',
        'Please choose a stronger password. It should contain at least 3 of: uppercase, lowercase, numbers, and special characters.'
      );
      return;
    }

    if (!token || !email) {
      showCustomAlert('error', 'Invalid Request', 'Reset token or email is missing');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      showCustomAlert(
        'success',
        'Password Reset Successful!',
        'Your password has been changed. You can now sign in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => router.replace('/auth/sign-in' as any),
          },
        ]
      );
    } catch (error: any) {
      console.error('Reset error:', error);
      showCustomAlert(
        'error',
        'Reset Failed',
        error.message || 'Failed to reset password. Please try again or request a new reset link.'
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Enter a strong password for your account
            </Text>
            {email && (
              <Text style={styles.emailText}>For: {email}</Text>
            )}
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* New Password */}
            <View>
              <InputField
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                icon={<Lock size={20} color={Colors.text} />}
                secureTextEntry={!showNewPassword}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? (
                      <EyeOff size={20} color={Colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={Colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                }
                editable={!isLoading}
              />

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${passwordStrength.score}%`,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                  </Text>
                </View>
              )}

              {/* Requirements Checklist */}
              {newPassword.length > 0 && (
                <View style={styles.requirementsContainer}>
                  <RequirementItem
                    met={passwordStrength.requirements.length}
                    text="At least 8 characters"
                  />
                  <RequirementItem
                    met={passwordStrength.requirements.uppercase}
                    text="One uppercase letter"
                  />
                  <RequirementItem
                    met={passwordStrength.requirements.lowercase}
                    text="One lowercase letter"
                  />
                  <RequirementItem
                    met={passwordStrength.requirements.number}
                    text="One number"
                  />
                  <RequirementItem
                    met={passwordStrength.requirements.special}
                    text="One special character"
                  />
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <InputField
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              icon={<Lock size={20} color={Colors.text} />}
              secureTextEntry={!showConfirmPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={Colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>
              }
              editable={!isLoading}
            />

            {/* Submit Button */}
            <PrimaryButton
              title={isLoading ? 'Resetting Password...' : 'Reset Password'}
              onPress={handleResetPassword}
              disabled={isLoading}
              style={styles.resetButton}
            />

            {isLoading && (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Helper component for requirement items
function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={styles.requirementItem}>
      <CheckCircle
        size={16}
        color={met ? '#10B981' : Colors.textSecondary}
        fill={met ? '#10B981' : 'transparent'}
      />
      <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
        {text}
      </Text>
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
  emailText: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    marginTop: 8,
    fontWeight: FontWeights.semibold as any,
  },
  formContainer: {
    padding: 24,
    gap: 20,
    backgroundColor: 'rgba(225, 195, 245, 1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  strengthContainer: {
    marginTop: 12,
    gap: 8,
  },
  strengthBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: FontSizes.small,
    fontWeight: FontWeights.semibold as any,
    textAlign: 'right',
  },
  requirementsContainer: {
    marginTop: 12,
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  requirementTextMet: {
    color: '#10B981',
    fontWeight: FontWeights.medium as any,
  },
  resetButton: {
    marginTop: 8,
  },
  loader: {
    marginTop: 8,
  },
});
