/**
 * Credits Card Component
 * Reusable card for displaying feature credits in profile
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';

interface CreditsCardProps {
  icon: React.ReactNode;
  title: string;
  credits: number;
  maxCredits: number;
  gradientColors: [string, string];
  onUpgradePress: () => void;
  isDarkMode?: boolean;
}

export const CreditsCard: React.FC<CreditsCardProps> = ({
  icon,
  title,
  credits,
  maxCredits,
  gradientColors,
  onUpgradePress,
  isDarkMode = false,
}) => {
  const isLow = credits <= 1;
  const isPro = maxCredits === 100; // Pro users have 100 max credits
  const percentage = (credits / maxCredits) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isLow ? ['#EF4444', '#DC2626'] : gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <View style={styles.iconContainer}>
              {icon}
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>

          {isPro ? (
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={onUpgradePress}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.creditsRow}>
          <Text style={styles.creditsLabel}>Credits</Text>
          <Text style={styles.creditsText}>
            {credits}/{maxCredits}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${percentage}%` }
            ]} 
          />
        </View>

        {isLow && !isPro && (
          <Text style={styles.warningText}>
            ⚠️ Low credits remaining
          </Text>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 12,
  },
  gradient: {
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
    color: '#fff',
  },
  upgradeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  upgradeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: FontWeights.bold,
  },
  proBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  proText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
  creditsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  creditsLabel: {
    fontSize: FontSizes.small,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: FontWeights.medium,
  },
  creditsText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: FontWeights.bold,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  warningText: {
    fontSize: 11,
    color: '#fff',
    marginTop: 6,
    fontWeight: FontWeights.semibold,
  },
});
