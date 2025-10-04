/**
 * Profile Management Hook
 * 
 * Custom hook that provides convenient access to profile-related operations.
 * Wraps the Zustand store with additional utilities and helpers.
 * 
 * Usage:
 * const { profile, updateProfile, logout, isAuthenticated } = useProfile();
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuthStore, UserProfile } from '@/store/authStore';
import { Strings } from '@/constants/strings';

export function useProfile() {
  const router = useRouter();
  
  // Get state and actions from store
  const {
    userProfile,
    isAuthenticated,
    isLoading,
    updateUserProfile,
    logout: logoutAction,
  } = useAuthStore();

  /**
   * Update profile with error handling
   */
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      try {
        await updateUserProfile(updates);
      } catch (error) {
        console.error('Error updating profile:', error);
        Alert.alert(
          Strings.common.error,
          'Failed to update profile. Please try again.'
        );
        throw error;
      }
    },
    [updateUserProfile]
  );

  /**
   * Logout with confirmation and navigation
   */
  const logout = useCallback(async () => {
    Alert.alert(
      Strings.profile.alerts.logoutTitle,
      Strings.profile.alerts.logoutMessage,
      [
        {
          text: Strings.profile.alerts.logoutCancel,
          style: 'cancel',
        },
        {
          text: Strings.profile.alerts.logoutConfirm,
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutAction();
              // Navigate to onboarding after logout
              router.replace('/onboarding' as any);
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert(
                Strings.common.error,
                'Failed to logout. Please try again.'
              );
            }
          },
        },
      ]
    );
  }, [logoutAction, router]);

  /**
   * Pick profile image from gallery
   */
  const pickProfileImage = useCallback(
    async (currentProfile: UserProfile) => {
      try {
        // Request permissions
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (!permissionResult.granted) {
          Alert.alert(
            Strings.profile.permissions.title,
            Strings.profile.permissions.message
          );
          return null;
        }

        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          return result.assets[0].uri;
        }

        return null;
      } catch (error) {
        console.error('Error picking image:', error);
        Alert.alert(
          Strings.common.error,
          'Failed to select image. Please try again.'
        );
        return null;
      }
    },
    []
  );

  /**
   * Validate profile data before saving
   */
  const validateProfile = useCallback((profile: Partial<UserProfile>) => {
    if (profile.name !== undefined && !profile.name.trim()) {
      Alert.alert(
        'Required Field',
        Strings.profile.alerts.nameRequired
      );
      return false;
    }

    if (profile.email !== undefined && !profile.email.trim()) {
      Alert.alert(
        'Required Field',
        Strings.profile.alerts.emailRequired
      );
      return false;
    }

    // Email format validation
    if (profile.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        Alert.alert(
          'Invalid Email',
          'Please enter a valid email address'
        );
        return false;
      }
    }

    return true;
  }, []);

  /**
   * Get display name (with fallback to "Guest")
   */
  const getDisplayName = useCallback(() => {
    return userProfile.name || Strings.common.guest;
  }, [userProfile.name]);

  return {
    // State
    profile: userProfile,
    isAuthenticated,
    isLoading,
    
    // Actions
    updateProfile,
    logout,
    pickProfileImage,
    validateProfile,
    
    // Utilities
    getDisplayName,
  };
}

/**
 * Settings Hook
 * 
 * Provides access to app settings with convenience methods
 */
export function useSettings() {
  const { settings, updateSettings } = useAuthStore();

  const toggleDarkMode = useCallback(async () => {
    await updateSettings({ isDarkMode: !settings.isDarkMode });
  }, [settings.isDarkMode, updateSettings]);

  const toggleCloudAI = useCallback(async () => {
    await updateSettings({ useCloudAI: !settings.useCloudAI });
  }, [settings.useCloudAI, updateSettings]);

  const toggleSaveHistory = useCallback(async () => {
    await updateSettings({ saveHistory: !settings.saveHistory });
  }, [settings.saveHistory, updateSettings]);

  const toggleVoice = useCallback(async () => {
    await updateSettings({ voiceEnabled: !settings.voiceEnabled });
  }, [settings.voiceEnabled, updateSettings]);

  return {
    settings,
    toggleDarkMode,
    toggleCloudAI,
    toggleSaveHistory,
    toggleVoice,
    updateSettings,
  };
}
