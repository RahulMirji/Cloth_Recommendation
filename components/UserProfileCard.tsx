/**
 * User Profile Card Component
 * 
 * Displays user profile information in a beautiful card format
 * Shows user avatar, name, email, and other profile details
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import { User, Mail, Phone, Calendar } from 'lucide-react-native';
import { GlassContainer } from './GlassContainer';
import { useUserProfile, useIsDarkMode } from '@/store/authStore';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';

interface UserProfileCardProps {
  onPress?: () => void;
}

export function UserProfileCard({ onPress }: UserProfileCardProps) {
  const userProfile = useUserProfile();
  const isDarkMode = useIsDarkMode();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <GlassContainer style={styles.container}>
        <View style={styles.content}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {userProfile.profileImage ? (
              <Image
                source={{ uri: userProfile.profileImage }}
                style={styles.avatar}
              />
            ) : (
              <View style={[
                styles.avatarPlaceholder,
                isDarkMode && styles.avatarPlaceholderDark
              ]}>
                <User size={32} color={isDarkMode ? Colors.white : Colors.primary} />
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={styles.infoContainer}>
            <Text style={[
              styles.name,
              isDarkMode && styles.textDark
            ]}>
              {userProfile.name || 'Guest User'}
            </Text>
            
            {userProfile.email && (
              <View style={styles.infoRow}>
                <Mail size={14} color={isDarkMode ? Colors.textLight : Colors.textSecondary} />
                <Text style={[
                  styles.infoText,
                  isDarkMode && styles.infoTextDark
                ]}>
                  {userProfile.email}
                </Text>
              </View>
            )}

            {userProfile.phone && (
              <View style={styles.infoRow}>
                <Phone size={14} color={isDarkMode ? Colors.textLight : Colors.textSecondary} />
                <Text style={[
                  styles.infoText,
                  isDarkMode && styles.infoTextDark
                ]}>
                  {userProfile.phone}
                </Text>
              </View>
            )}

            {userProfile.age && (
              <View style={styles.infoRow}>
                <Calendar size={14} color={isDarkMode ? Colors.textLight : Colors.textSecondary} />
                <Text style={[
                  styles.infoText,
                  isDarkMode && styles.infoTextDark
                ]}>
                  {userProfile.age} years old
                </Text>
              </View>
            )}
          </View>
        </View>
      </GlassContainer>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold as any,
    color: Colors.text,
    marginBottom: 8,
  },
  textDark: {
    color: Colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  infoTextDark: {
    color: Colors.textLight,
  },
});
