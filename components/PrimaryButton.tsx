/**
 * Primary Button Component
 * 
 * Reusable gradient button with loading state support.
 * Used for primary actions throughout the app.
 * 
 * Usage:
 * <PrimaryButton
 *   title="Continue"
 *   onPress={handleContinue}
 *   loading={isSubmitting}
 * />
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary';
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  variant = 'primary',
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  // Different gradient colors for variants
  const gradientColors: [string, string] =
    variant === 'primary'
      ? [Colors.gradient.start, Colors.gradient.end]
      : [Colors.secondary, Colors.secondaryLight];

  return (
    <TouchableOpacity
      style={[styles.container, isDisabled && styles.containerDisabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={[styles.text, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  containerDisabled: {
    opacity: 0.6,
  },
  gradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
});
