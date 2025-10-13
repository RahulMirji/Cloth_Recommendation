/**
 * Credit Display Component
 * Shows remaining credits for Outfit Scorer feature
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';

interface CreditDisplayProps {
  credits: number;
  maxCredits: number;
  onUpgradePress: () => void;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({
  credits,
  maxCredits,
  onUpgradePress,
}) => {
  const isLow = credits <= 1;
  const isPro = maxCredits === 100; // Pro users have 100 max credits
  const percentage = (credits / maxCredits) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isLow ? ['#EF4444', '#DC2626'] : ['#8B5CF6', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <Sparkles size={16} color="#fff" />
            <Text style={styles.label}>Credits</Text>
            <Text style={styles.creditText}>
              {credits}/{maxCredits}
            </Text>
          </View>

          {isPro ? (
            <View style={styles.proBadge}>
              <Text style={styles.proText}>Pro</Text>
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

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${percentage}%` }
            ]} 
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  gradient: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  creditText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '800',
  },
  upgradeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  upgradeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  proBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  proText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1.5,
  },
});
