/**
 * UserListItem Component
 * 
 * Individual user card in the user list.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DashboardUser } from '../types';
import { ADMIN_CONFIG } from '../constants/config';

interface UserListItemProps {
  user: DashboardUser;
  onPress: () => void;
  onDelete: () => void;
  isDarkMode: boolean;
}

export const UserListItem: React.FC<UserListItemProps> = ({
  user,
  onPress,
  onDelete,
  isDarkMode,
}) => {
  const colors = ADMIN_CONFIG.COLORS;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGenderIcon = (gender: string | null) => {
    if (!gender) return 'person-outline';
    switch (gender.toLowerCase()) {
      case 'male':
        return 'man-outline';
      case 'female':
        return 'woman-outline';
      default:
        return 'person-outline';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? colors.cardDark : colors.card,
          borderColor: isDarkMode ? colors.borderDark : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
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
      <View style={styles.content}>
        <View style={styles.row}>
          <Text
            style={[
              styles.name,
              { color: isDarkMode ? colors.textDark : colors.text },
            ]}
            numberOfLines={1}
          >
            {user.name}
          </Text>
          <Ionicons
            name={getGenderIcon(user.gender)}
            size={16}
            color={isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
          />
        </View>
        
        <Text
          style={[
            styles.email,
            { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {user.email}
        </Text>
        
        <View style={styles.metaRow}>
          <Ionicons
            name="calendar-outline"
            size={12}
            color={isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
          />
          <Text
            style={[
              styles.date,
              { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
            ]}
          >
            Joined: {formatDate(user.created_at)}
          </Text>
        </View>

        {user.age && (
          <View style={styles.metaRow}>
            <Ionicons
              name="person-outline"
              size={12}
              color={isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
            />
            <Text
              style={[
                styles.date,
                { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
              ]}
            >
              Age: {user.age}
            </Text>
          </View>
        )}
      </View>

      {/* Delete Button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  email: {
    fontSize: 14,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  date: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
