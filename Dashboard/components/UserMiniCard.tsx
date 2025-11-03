/**
 * User Mini Card Component
 * 
 * Compact user card for displaying in age group lists.
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserMiniCardProps } from '../types/demographics.types';
import { getThemedAdminColors } from '../constants/config';

export const UserMiniCard: React.FC<UserMiniCardProps> = ({
  user,
  isDarkMode,
}) => {
  const colors = getThemedAdminColors(isDarkMode);
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDarkMode ? colors.cardDark : colors.card,
        borderColor: isDarkMode ? colors.borderDark : colors.border,
      }
    ]}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {user.profile_image ? (
          <Image source={{ uri: user.profile_image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      
      {/* User Info */}
      <View style={styles.infoContainer}>
        <View style={styles.row}>
          <Text style={[
            styles.name,
            { color: isDarkMode ? colors.textDark : colors.text }
          ]} numberOfLines={1}>
            {user.name}
          </Text>
          {user.age && (
            <View style={[styles.ageBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.ageText, { color: colors.primary }]}>
                {user.age}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.metaRow}>
          <Ionicons 
            name="mail-outline" 
            size={11} 
            color={isDarkMode ? colors.textSecondaryDark : colors.textSecondary} 
          />
          <Text style={[
            styles.metaText,
            { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary }
          ]} numberOfLines={1}>
            {user.email}
          </Text>
        </View>
        
        <View style={styles.metaRow}>
          <Ionicons 
            name="calendar-outline" 
            size={11} 
            color={isDarkMode ? colors.textSecondaryDark : colors.textSecondary} 
          />
          <Text style={[
            styles.metaText,
            { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary }
          ]}>
            Joined {formatDate(user.created_at)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  ageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ageText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    flex: 1,
  },
});
