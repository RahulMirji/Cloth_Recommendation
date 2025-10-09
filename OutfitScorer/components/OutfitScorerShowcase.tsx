/**
 * Outfit Scorer Showcase Component
 * 
 * Displays sample outfit scoring results to showcase how the Outfit Scorer works.
 * Shows two example analyses (one for women's formal wear, one for men's formal wear)
 * with scores and brief summaries.
 * 
 * Features:
 * - Two showcase cards displayed vertically
 * - Score badges with color coding
 * - Summary text for each outfit
 * - Dark mode support
 * - Consistent styling with other info cards
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  useColorScheme,
  ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, User } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';

interface ShowcaseData {
  id: string;
  imageUri?: ImageSourcePropType;
  score: number;
  category: string;
  summary: string;
  gender: 'women' | 'men';
  gradientColors: [string, string];
}

const showcaseData: ShowcaseData[] = [
  {
    id: '1',
    imageUri: require('../images/women.jpg'),
    score: 83,
    category: 'Excellent',
    summary: 'This outfit presents a clean and classic office-appropriate silhouette, with a sharp contrast between the white blouse and black skirt.',
    gender: 'women',
    gradientColors: ['#EC4899', '#8B5CF6'], // Pink to Purple gradient for women
  },
  {
    id: '2',
    imageUri: require('../images/Men.jpeg'),
    score: 89,
    category: 'Outstanding',
    summary: 'Impeccably tailored navy suit with crisp white shirt creates a powerful professional presence. The fit is excellent across shoulders and torso, with proper sleeve length and trouser break.',
    gender: 'men',
    gradientColors: ['#3B82F6', '#1E40AF'], // Blue gradient for men
  },
];

export function OutfitScorerShowcase() {
  const { settings } = useApp();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  const getScoreColor = (score: number): string => {
    if (score >= 85) return Colors.success;
    if (score >= 70) return Colors.primary;
    return Colors.warning;
  };

  const handleImageError = (itemId: string) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isDarkMode && styles.titleDark]}>
        See It In Action
      </Text>
      <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
        Real examples of our AI-powered outfit analysis
      </Text>

      {showcaseData.map((item) => {
        const hasImage = item.imageUri && !imageErrors[item.id];
        
        return (
          <View 
            key={item.id} 
            style={[
              styles.showcaseCard, 
              isDarkMode && styles.showcaseCardDark
            ]}
          >
            {/* Image Container */}
            <View style={styles.imageContainer}>
              {hasImage ? (
                <Image 
                  source={item.imageUri!}
                  style={styles.showcaseImage}
                  resizeMode="cover"
                  onError={() => handleImageError(item.id)}
                />
              ) : (
                <LinearGradient
                  colors={item.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.placeholderGradient}
                >
                  <User size={80} color="rgba(255,255,255,0.4)" strokeWidth={1.5} />
                  <Text style={styles.placeholderLabel}>
                    {item.gender === 'women' ? "Women's Formal" : "Men's Formal"}
                  </Text>
                  <Text style={styles.placeholderHint}>
                    Add image to showcase
                  </Text>
                </LinearGradient>
              )}
              
              {/* Score Badge Overlay */}
              <View style={[
                styles.scoreBadge,
                { backgroundColor: getScoreColor(item.score) }
              ]}>
                <Star size={16} color={Colors.white} fill={Colors.white} />
                <Text style={styles.scoreText}>{item.score}</Text>
              </View>
            </View>

            {/* Content Container */}
            <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text style={[styles.category, isDarkMode && styles.categoryDark]}>
                {item.category}
              </Text>
              <View style={styles.genderBadge}>
                <Text style={styles.genderText}>
                  {item.gender === 'women' ? "Women's Formal" : "Men's Formal"}
                </Text>
              </View>
            </View>

            <Text style={[styles.summary, isDarkMode && styles.summaryDark]}>
              {item.summary}
            </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 8,
  },
  titleDark: {
    color: Colors.white,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  subtitleDark: {
    color: Colors.textLight,
  },
  showcaseCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  showcaseCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  imageContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: Colors.border,
  },
  showcaseImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  imagePlaceholderDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  placeholderGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLabel: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    marginTop: 16,
  },
  placeholderHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  placeholderText: {
    marginTop: 12,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    color: 'rgba(0, 0, 0, 0.3)',
  },
  placeholderTextDark: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  scoreBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  contentContainer: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  category: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  categoryDark: {
    color: Colors.white,
  },
  genderBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genderText: {
    fontSize: 12,
    fontWeight: FontWeights.semibold,
    color: Colors.white,
  },
  summary: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  summaryDark: {
    color: Colors.textLight,
  },
});
