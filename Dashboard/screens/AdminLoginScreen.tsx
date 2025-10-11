/**
 * AdminLoginScreen Component
 * 
 * Login screen for admin dashboard access.
 * Shown after 3-second long press on settings button.
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminAuthContext } from '../contexts/AdminAuthContext';
import { ADMIN_CONFIG } from '../constants/config';
import { useApp } from '@/contexts/AppContext';

export default function AdminLoginScreen() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔵 ADMIN LOGIN SCREEN RENDERED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const router = useRouter();
  const { login, isLoading } = useAdminAuthContext();
  const { settings } = useApp();
  const isDarkMode = settings.isDarkMode;

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
      Alert.alert('Error', 'Please enter both email and password');
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
        Alert.alert('Login Failed', result.error || 'Invalid credentials');
      }
    } catch (error) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ EXCEPTION IN LOGIN HANDLER');
      console.log('Error:', error);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const colors = isDarkMode ? ADMIN_CONFIG.COLORS : ADMIN_CONFIG.COLORS;

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? colors.backgroundDark : colors.background },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close"
              size={28}
              color={isDarkMode ? colors.textDark : colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Logo/Icon */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.primary + '20' },
            ]}
          >
            <Ionicons name="shield-checkmark" size={50} color={colors.primary} />
          </View>
        </View>

        {/* Title */}
        <Text
          style={[
            styles.title,
            { color: isDarkMode ? colors.textDark : colors.text },
          ]}
        >
          Admin Access
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
          ]}
        >
          Enter your admin credentials to continue
        </Text>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text
              style={[
                styles.label,
                { color: isDarkMode ? colors.textDark : colors.text },
              ]}
            >
              Admin Email
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDarkMode ? colors.cardDark : colors.card,
                  borderColor: isDarkMode ? colors.borderDark : colors.border,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: isDarkMode ? colors.textDark : colors.text },
                ]}
                placeholder="admin@example.com"
                placeholderTextColor={
                  isDarkMode ? colors.textSecondaryDark : colors.textSecondary
                }
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
          <View style={styles.inputContainer}>
            <Text
              style={[
                styles.label,
                { color: isDarkMode ? colors.textDark : colors.text },
              ]}
            >
              Password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDarkMode ? colors.cardDark : colors.card,
                  borderColor: isDarkMode ? colors.borderDark : colors.border,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: isDarkMode ? colors.textDark : colors.text },
                ]}
                placeholder="Enter password"
                placeholderTextColor={
                  isDarkMode ? colors.textSecondaryDark : colors.textSecondary
                }
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
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
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
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View style={styles.warning}>
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning }]}>
            Authorized access only
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  loginButton: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
