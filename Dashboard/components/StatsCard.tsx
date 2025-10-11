/**
 * StatsCard Component
 * 
 * Display card for dashboard statistics with modern styling.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ADMIN_CONFIG } from '../constants/config';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  isDarkMode: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  isDarkMode,
}) => {
  const colors = ADMIN_CONFIG.COLORS;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDarkMode ? colors.cardDark : colors.card,
          borderColor: isDarkMode ? colors.borderDark : colors.borderLight,
        },
      ]}
    >
      {/* Icon with Gradient Background */}
      <View style={styles.iconWrapper}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={26} color={color} />
        </View>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.value,
            { color: isDarkMode ? colors.textDark : colors.text },
          ]}
        >
          {value}
        </Text>
      </View>

      {/* Accent Line */}
      <View style={[styles.accentLine, { backgroundColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  iconWrapper: {
    marginRight: 14,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
});
