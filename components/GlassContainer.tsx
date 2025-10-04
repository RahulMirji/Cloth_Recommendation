/**
 * Glass Container Component
 * 
 * Reusable wrapper that applies the liquid prism glassmorphism effect.
 * Automatically adapts blur and colors based on light/dark mode.
 * 
 * Usage:
 * <GlassContainer intensity={80}>
 *   <Text>Content here</Text>
 * </GlassContainer>
 */

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useIsDarkMode } from '@/store/authStore';

interface GlassContainerProps {
  children: React.ReactNode;
  intensity?: number; // Blur intensity (0-100)
  style?: ViewStyle;
  borderRadius?: number;
}

export function GlassContainer({
  children,
  intensity = 80,
  style,
  borderRadius = 20,
}: GlassContainerProps) {
  const isDarkMode = useIsDarkMode();

  return (
    <BlurView
      intensity={intensity}
      tint={isDarkMode ? 'dark' : 'light'}
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(255, 255, 255, 0.7)',
          borderColor: isDarkMode
            ? 'rgba(255, 255, 255, 0.2)'
            : 'rgba(255, 255, 255, 0.5)',
          borderRadius,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
  },
});
