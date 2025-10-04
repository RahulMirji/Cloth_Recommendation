/**
 * Animated Score Card Component
 * 
 * Displays an animated score with category badge.
 * Used in the Outfit Scorer feature to show AI analysis results.
 * Uses spring animation for smooth score reveal.
 * 
 * Usage:
 * <AnimatedScoreCard
 *   score={85}
 *   category="Excellent"
 * />
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { GlassContainer } from './GlassContainer';
import { useIsDarkMode } from '@/store/authStore';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';

interface AnimatedScoreCardProps {
  score: number;
  category: string;
}

export function AnimatedScoreCard({ score, category }: AnimatedScoreCardProps) {
  const isDarkMode = useIsDarkMode();
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Animate score from 0 to actual value
    scoreAnim.setValue(0);
    
    // Listen to animation value changes
    const listenerId = scoreAnim.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });

    // Start spring animation
    Animated.spring(scoreAnim, {
      toValue: score,
      tension: 20,
      friction: 7,
      useNativeDriver: false,
    }).start();

    // Cleanup listener on unmount
    return () => {
      scoreAnim.removeListener(listenerId);
    };
  }, [score, scoreAnim]);

  // Get color based on score
  const getScoreColor = (scoreValue: number): string => {
    if (scoreValue >= 85) return Colors.success;
    if (scoreValue >= 70) return Colors.primary;
    return Colors.warning;
  };

  const scoreColor = getScoreColor(score);

  return (
    <GlassContainer style={styles.container}>
      <View style={styles.scoreCircle}>
        <Text style={[styles.scoreNumber, { color: scoreColor }]}>
          {displayScore}
        </Text>
        <Text style={[styles.scoreLabel, isDarkMode && styles.textDark]}>
          / 100
        </Text>
      </View>
      <View style={styles.badge}>
        <TrendingUp size={20} color={scoreColor} />
        <Text style={[styles.categoryText, { color: scoreColor }]}>
          {category}
        </Text>
      </View>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 72,
    fontWeight: FontWeights.bold,
    lineHeight: 80,
  },
  scoreLabel: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  textDark: {
    color: Colors.textLight,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
  },
});
