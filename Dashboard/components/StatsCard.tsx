/**
 * StatsCard Component
 * 
 * Display card for dashboard statistics.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
          borderColor: isDarkMode ? colors.borderDark : colors.border,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
