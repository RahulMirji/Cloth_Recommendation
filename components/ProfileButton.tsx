/**
 * Profile Button Component
 * 
 * Circular avatar button displayed in the navigation bar.
 * Shows user's profile image or a placeholder icon.
 * Opens the profile modal when tapped.
 * 
 * Usage:
 * <ProfileButton />
 */

import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { User } from 'lucide-react-native';
import { useUserProfile, useIsDarkMode } from '@/store/authStore';
import Colors from '@/constants/colors';

export function ProfileButton() {
  const router = useRouter();
  const userProfile = useUserProfile();
  const isDarkMode = useIsDarkMode();

  const handlePress = () => {
    router.push('/profile' as any);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {userProfile.profileImage ? (
        <Image
          source={{ uri: userProfile.profileImage }}
          style={styles.image}
        />
      ) : (
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={styles.placeholder}
        >
          <User
            size={20}
            color={isDarkMode ? Colors.white : Colors.primary}
          />
        </BlurView>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '20',
  },
});
