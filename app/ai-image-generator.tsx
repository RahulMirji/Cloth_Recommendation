/**
 * AI Image Generator Screen
 * 
 * Dedicated screen for AI-powered image generation
 * Users can enter any prompt and generate custom images using Pollinations API
 */

import React from 'react';
import {
  StyleSheet,
  View,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ExploreSection } from '@/components/ExploreSection';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';

export default function AIImageGeneratorScreen() {
  const { settings } = useApp();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {isDarkMode && (
        <LinearGradient
          colors={['#0F172A', '#0F172A']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ExploreSection />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerDark: {
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
});
