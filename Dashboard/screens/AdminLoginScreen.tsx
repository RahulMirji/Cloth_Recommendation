/**
 * AdminLoginScreen Component
 * 
 * Login screen for admin dashboard access.
 * Shown after 3-second long press on settings button.
 * Redesigned to match main app aesthetic with gradient background and glassmorphism.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminAuthContext } from '../contexts/AdminAuthContext';
import { ADMIN_CONFIG } from '../constants/config';
import { useApp } from '@/contexts/AppContext';
import { showCustomAlert } from '@/utils/customAlert';

export default function AdminLoginScreen() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔵 ADMIN LOGIN SCREEN RENDERED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const router = useRouter();
  const { login, isLoading } = useAdminAuthContext();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  console.log('Login screen state:', { 
    email: email || 'empty', 
    password: password ? '***' : 'empty',
    isLoading 
  });

  const handleLogin = async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔵 LOGIN BUTTON CLICKED');
    console.log('📧 Email entered:', email);
    console.log('🔑 Password entered:', password ? '***' + password.slice(-3) : 'empty');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!email.trim() || !password.trim()) {
      console.log('❌ Validation failed: Email or password is empty');
      showCustomAlert('error', 'Error', 'Please enter both email and password');
      return;
    }

    console.log('✅ Validation passed, calling login function...');
    console.log('🔐 Attempting admin login with email:', email);
    
    try {
      const result = await login(email, password);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('� LOGIN RESULT RECEIVED');
      console.log('Result:', JSON.stringify(result, null, 2));
      console.log('Success?', result.success);
      console.log('Error?', result.error);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (result.success) {
        console.log('✅ Login successful, attempting navigation...');
        console.log('🧭 Calling router.replace("/(admin)/admin-dashboard")...');
        
        // Navigate to dashboard
        router.replace('/(admin)/admin-dashboard' as any);
        
        console.log('✅ Router.replace called successfully');
      } else {
        console.log('❌ Login failed with error:', result.error);
        showCustomAlert('error', 'Login Failed', result.error || 'Invalid credentials');
      }
    } catch (error) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ EXCEPTION IN LOGIN HANDLER');
      console.log('Error:', error);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      showCustomAlert('error', 'Error', 'An unexpected error occurred');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Always use light theme for admin login
  const colors = ADMIN_CONFIG.COLORS;

  return (
    <View style={styles.container}>
      {/* Gradient Background - Matching Main App */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            {/* Title */}
            <Text style={styles.title}>Admin Access</Text>
            <Text style={styles.subtitle}>
              Secure admin portal for AI Fashion Assistant
            </Text>
          </View>

          {/* Form Container - Glassmorphic Design */}
          <View style={[
            styles.formContainer,
            { 
              backgroundColor: colors.formContainer,
              borderColor: colors.formContainerBorder,
            }
          ]}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <View style={[styles.inputWrapper, { backgroundColor: colors.input }]}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.text}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Admin Email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={[styles.inputWrapper, { backgroundColor: colors.input }]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.text}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                { backgroundColor: colors.primary },
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login to Dashboard</Text>
              )}
            </TouchableOpacity>

            {/* Warning Badge */}
            <View style={styles.warningBadge}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>
                Authorized Personnel Only
              </Text>
            </View>
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Ionicons name="information-circle-outline" size={16} color="#1a1a2e" />
            <Text style={styles.footerText}>
              This is a protected admin area. All access is logged.
            </Text>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#1a1a2e',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  formContainer: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputGroup: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#1a1a2e',
    textAlign: 'center',
    fontWeight: '500',
    flex: 1,
  },
});
