/**
 * Home Screen
 * 
 * Main landing screen after authentication.
 * Shows personalized greeting and feature cards for AI Stylist and Outfit Scorer.
 * 
 * Features:
 * - Dynamic greeting with user's name
 * - Gradient feature cards
 * - Navigation to AI Stylist and Outfit Scorer
 * - Dark mode support
 * - How it works section
 */

import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Sparkles } from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import { useUserProfile, useIsDarkMode } from '@/store/authStore';
import Colors from '@/constants/colors';
import { Strings } from '@/constants/strings';
import { FontSizes, FontWeights } from '@/constants/fonts';

export function HomeScreen() {
  const userProfile = useUserProfile();
  const isDarkMode = useIsDarkMode();

  // Get user name or default to 'Guest'
  const userName = userProfile?.name || 'Guest';

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
        {/* Header with Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, isDarkMode && styles.textDark]}>
              {Strings.home.greeting(userName)}
            </Text>
            <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
              {Strings.home.subtitle}
            </Text>
          </View>
        </View>


        {/* Feature Cards */}
        <View style={styles.cardsContainer}>
          {/* AI Stylist Card */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/ai-stylist')}
          >
            <LinearGradient
              colors={[Colors.gradient.start, Colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardIcon}>
                <Camera size={32} color={Colors.white} strokeWidth={2.5} />
              </View>
              <Text style={styles.cardTitle}>
                {Strings.home.aiStylist.title}
              </Text>
              <Text style={styles.cardDescription}>
                {Strings.home.aiStylist.description}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Outfit Scorer Card */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/outfit-scorer')}
          >
            <LinearGradient
              colors={[Colors.secondary, Colors.secondaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardIcon}>
                <Sparkles size={32} color={Colors.white} strokeWidth={2.5} />
              </View>
              <Text style={styles.cardTitle}>
                {Strings.home.outfitScorer.title}
              </Text>
              <Text style={styles.cardDescription}>
                {Strings.home.outfitScorer.description}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* How It Works Section */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, isDarkMode && styles.textDark]}>
            {Strings.home.howItWorks.title}
          </Text>
          <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
            <Text style={styles.infoStep}>
              {Strings.home.howItWorks.step1Title}
            </Text>
            <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
              {Strings.home.howItWorks.step1Text}
            </Text>
          </View>
          <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
            <Text style={styles.infoStep}>
              {Strings.home.howItWorks.step2Title}
            </Text>
            <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
              {Strings.home.howItWorks.step2Text}
            </Text>
          </View>
          <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
            <Text style={styles.infoStep}>
              {Strings.home.howItWorks.step3Title}
            </Text>
            <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
              {Strings.home.howItWorks.step3Text}
            </Text>
          </View>
        </View>
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
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: FontSizes.hero,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 8,
  },
  textDark: {
    color: Colors.white,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: FontWeights.regular,
  },
  subtitleDark: {
    color: Colors.textLight,
  },
  cardsContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 40,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardGradient: {
    padding: 28,
    minHeight: 200,
    justifyContent: 'center',
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: FontSizes.body,
    color: Colors.white,
    opacity: 0.9,
    lineHeight: 22,
  },
  infoSection: {
    paddingHorizontal: 24,
  },
  infoTitle: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  infoCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoStep: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  infoTextDark: {
    color: Colors.textLight,
  },
});
