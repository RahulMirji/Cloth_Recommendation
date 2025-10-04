/**
 * User Info Screen
 * 
 * Collects user's name and email after tutorial slides.
 * This is the final step of the onboarding flow.
 * 
 * Features:
 * - Name and email input fields
 * - Email validation
 * - Saves to AsyncStorage via Zustand store
 * - Redirects to home screen
 * - Beautiful glassmorphism design
 */

import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, User, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassContainer } from '@/components/GlassContainer';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import { Strings } from '@/constants/strings';
import { FontSizes, FontWeights } from '@/constants/fonts';

export function UserInfoScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateUserProfile } = useAuthStore();
  const insets = useSafeAreaInsets();

  /**
   * Validate email format using regex
   */
  const validateEmail = (emailAddress: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  /**
   * Handle form submission
   * Validates inputs and saves to store
   */
  const handleGetStarted = async () => {
    // Validate name
    if (!name.trim()) {
      Alert.alert('Required Field', Strings.onboarding.nameRequired);
      return;
    }

    // Validate email
    if (!email.trim()) {
      Alert.alert('Required Field', Strings.onboarding.emailRequired);
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', Strings.onboarding.emailInvalid);
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to store (which saves to AsyncStorage)
      await updateUserProfile({ 
        name: name.trim(), 
        email: email.trim() 
      });
      
      // Navigate to home
      router.replace('/(tabs)' as any);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(
        Strings.onboarding.errorTitle,
        Strings.onboarding.errorMessage
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Sparkles size={48} color={Colors.white} strokeWidth={2.5} />
            </View>
            <Text style={styles.title}>{Strings.onboarding.title}</Text>
            <Text style={styles.subtitle}>{Strings.onboarding.subtitle}</Text>
          </View>

          {/* Form Section with Glass Effect */}
          <GlassContainer style={styles.formContainer}>
            <View style={styles.formInner}>
              <Text style={styles.formTitle}>
                {Strings.onboarding.formTitle}
              </Text>

              {/* Name Input */}
              <InputField
                icon={<User size={20} color={Colors.primary} />}
                placeholder={Strings.onboarding.namePlaceholder}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                containerStyle={styles.inputContainer}
              />

              {/* Email Input */}
              <InputField
                icon={<Mail size={20} color={Colors.primary} />}
                placeholder={Strings.onboarding.emailPlaceholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleGetStarted}
                containerStyle={styles.inputContainer}
              />

              {/* Get Started Button */}
              <PrimaryButton
                title={
                  isSubmitting
                    ? Strings.onboarding.loadingButton
                    : Strings.onboarding.continueButton
                }
                onPress={handleGetStarted}
                loading={isSubmitting}
                style={styles.continueButton}
              />

              {/* Disclaimer */}
              <Text style={styles.disclaimer}>
                {Strings.onboarding.disclaimer}
              </Text>
            </View>
          </GlassContainer>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  title: {
    fontSize: FontSizes.hero,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  formInner: {
    padding: 28,
  },
  formTitle: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  continueButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: FontSizes.caption,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 18,
  },
});
