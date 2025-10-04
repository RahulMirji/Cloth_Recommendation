/**
 * Profile Screen
 * 
 * User profile management screen displayed as a modal.
 * Allows viewing and editing profile information.
 * 
 * Features:
 * - Profile photo upload with glowing gradient effect
 * - Edit/save modes
 * - All profile fields (name, email, phone, age, gender, bio)
 * - Logout functionality
 * - Full dark/light theme support
 * - Glassmorphism UI with gradient accents
 * - Enhanced visual hierarchy
 */

import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Camera, User, Mail, Phone, Calendar, Users, Edit3, LogOut } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Modal,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { useAuthStore, useUserProfile } from '@/store/authStore';
import { useApp } from '@/contexts/AppContext';
import { Strings } from '@/constants/strings';
import { FontSizes, FontWeights } from '@/constants/fonts';

export function ProfileScreen() {
  const userProfile = useUserProfile();
  const { settings } = useApp();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  const { updateUserProfile, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(userProfile);
  const insets = useSafeAreaInsets();

  /**
   * Pick profile image from gallery
   */
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert(
        Strings.profile.permissions.title,
        Strings.profile.permissions.message
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const updates = { ...editedProfile, profileImage: result.assets[0].uri };
      setEditedProfile(updates);
      if (!isEditing) {
        await updateUserProfile(updates);
      }
    }
  };

  /**
   * Save profile edits
   */
  const handleSave = async () => {
    if (!editedProfile.name.trim()) {
      Alert.alert('Required Field', Strings.profile.alerts.nameRequired);
      return;
    }
    if (!editedProfile.email.trim()) {
      Alert.alert('Required Field', Strings.profile.alerts.emailRequired);
      return;
    }

    await updateUserProfile(editedProfile);
    setIsEditing(false);
  };

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    setEditedProfile(userProfile);
    setIsEditing(false);
  };

  /**
   * Handle logout with confirmation
   */
  const handleLogout = () => {
    Alert.alert(
      Strings.profile.alerts.logoutTitle,
      Strings.profile.alerts.logoutMessage,
      [
        { text: Strings.profile.alerts.logoutCancel, style: 'cancel' },
        {
          text: Strings.profile.alerts.logoutConfirm,
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/onboarding' as any);
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => router.back()}
    >
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <BlurView
          intensity={80}
          tint={isDarkMode ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={28} color={isDarkMode ? Colors.white : Colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>
            {Strings.profile.title}
          </Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Text style={[styles.editButtonText, isEditing && styles.editButtonTextActive]}>
              {isEditing ? Strings.profile.saveButton : Strings.profile.editButton}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo with Glowing Effect */}
          <View style={styles.profileHeader}>
            <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
              {/* Glowing Ring Effect */}
              <LinearGradient
                colors={[Colors.primary, Colors.secondary, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glowRing}
              >
                <View style={styles.avatarInnerContainer}>
                  {editedProfile.profileImage ? (
                    <Image source={{ uri: editedProfile.profileImage }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, isDarkMode && styles.avatarPlaceholderDark]}>
                      <User size={48} color={isDarkMode ? Colors.white : Colors.primary} />
                    </View>
                  )}
                </View>
              </LinearGradient>
              {/* Camera Icon with Gradient */}
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cameraIcon}
              >
                <Camera size={18} color={Colors.white} strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={[styles.profileName, isDarkMode && styles.textDark]}>
              {userProfile.name || 'User'}
            </Text>
            {userProfile.email && (
              <Text style={[styles.profileEmail, isDarkMode && styles.profileEmailDark]}>
                {userProfile.email}
              </Text>
            )}
          </View>

          {/* Name Field */}
          <View style={styles.section}>
            <View style={[styles.glassCard, isDarkMode && styles.glassCardDark]}>
              <View style={styles.inputRow}>
                <View style={[styles.inputIconContainer, isDarkMode && styles.inputIconContainerDark]}>
                  <User size={20} color={Colors.primary} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={[styles.inputLabel, isDarkMode && styles.textDark]}>
                    {Strings.profile.nameLabel}
                  </Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, isDarkMode && styles.inputDark]}
                      value={editedProfile.name}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
                      placeholder="Your name"
                      placeholderTextColor={Colors.textLight}
                    />
                  ) : (
                    <Text style={[styles.inputValue, isDarkMode && styles.textDark]}>
                      {userProfile.name}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Email Field */}
            <View style={[styles.glassCard, isDarkMode && styles.glassCardDark]}>
              <View style={styles.inputRow}>
                <View style={[styles.inputIconContainer, isDarkMode && styles.inputIconContainerDark]}>
                  <Mail size={20} color={Colors.primary} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={[styles.inputLabel, isDarkMode && styles.textDark]}>
                    {Strings.profile.emailLabel}
                  </Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, isDarkMode && styles.inputDark]}
                      value={editedProfile.email}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, email: text })}
                      placeholder="your@email.com"
                      placeholderTextColor={Colors.textLight}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  ) : (
                    <Text style={[styles.inputValue, isDarkMode && styles.textDark]}>
                      {userProfile.email}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Phone Field */}
            <View style={[styles.glassCard, isDarkMode && styles.glassCardDark]}>
              <View style={styles.inputRow}>
                <View style={[styles.inputIconContainer, isDarkMode && styles.inputIconContainerDark]}>
                  <Phone size={20} color={Colors.primary} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={[styles.inputLabel, isDarkMode && styles.textDark]}>
                    {Strings.profile.phoneLabel}
                  </Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, isDarkMode && styles.inputDark]}
                      value={editedProfile.phone}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, phone: text })}
                      placeholder={Strings.profile.placeholders.phone}
                      placeholderTextColor={Colors.textLight}
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={[styles.inputValue, isDarkMode && styles.textDark]}>
                      {userProfile.phone || Strings.profile.notProvided}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Age Field */}
            <View style={[styles.glassCard, isDarkMode && styles.glassCardDark]}>
              <View style={styles.inputRow}>
                <View style={[styles.inputIconContainer, isDarkMode && styles.inputIconContainerDark]}>
                  <Calendar size={20} color={Colors.primary} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={[styles.inputLabel, isDarkMode && styles.textDark]}>
                    {Strings.profile.ageLabel}
                  </Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, isDarkMode && styles.inputDark]}
                      value={editedProfile.age}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, age: text })}
                      placeholder={Strings.profile.placeholders.age}
                      placeholderTextColor={Colors.textLight}
                      keyboardType="number-pad"
                    />
                  ) : (
                    <Text style={[styles.inputValue, isDarkMode && styles.textDark]}>
                      {userProfile.age || Strings.profile.notProvided}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Gender Field */}
            <View style={[styles.glassCard, isDarkMode && styles.glassCardDark]}>
              <View style={styles.inputRow}>
                <View style={[styles.inputIconContainer, isDarkMode && styles.inputIconContainerDark]}>
                  <Users size={20} color={Colors.primary} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={[styles.inputLabel, isDarkMode && styles.textDark]}>
                    {Strings.profile.genderLabel}
                  </Text>
                  {isEditing ? (
                    <View style={styles.genderOptions}>
                      {(['male', 'female', 'other'] as const).map((gender) => (
                        <TouchableOpacity
                          key={gender}
                          style={[
                            styles.genderButton,
                            editedProfile.gender === gender && styles.genderButtonActive,
                          ]}
                          onPress={() => setEditedProfile({ ...editedProfile, gender })}
                        >
                          <Text
                            style={[
                              styles.genderButtonText,
                              editedProfile.gender === gender && styles.genderButtonTextActive,
                            ]}
                          >
                            {Strings.profile.genderOptions[gender]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.inputValue, isDarkMode && styles.textDark]}>
                      {userProfile.gender
                        ? Strings.profile.genderOptions[userProfile.gender as 'male' | 'female' | 'other']
                        : Strings.profile.notProvided}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Bio Field */}
            <View style={[styles.glassCard, isDarkMode && styles.glassCardDark]}>
              <View style={styles.inputRow}>
                <View style={[styles.inputIconContainer, isDarkMode && styles.inputIconContainerDark]}>
                  <Edit3 size={20} color={Colors.primary} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={[styles.inputLabel, isDarkMode && styles.textDark]}>
                    {Strings.profile.bioLabel}
                  </Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, styles.textArea, isDarkMode && styles.inputDark]}
                      value={editedProfile.bio}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
                      placeholder={Strings.profile.placeholders.bio}
                      placeholderTextColor={Colors.textLight}
                      multiline
                      numberOfLines={3}
                    />
                  ) : (
                    <Text style={[styles.inputValue, isDarkMode && styles.textDark]}>
                      {userProfile.bio || Strings.profile.notProvided}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Cancel Button (Edit Mode) */}
          {isEditing && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>
                {Strings.profile.cancelButton}
              </Text>
            </TouchableOpacity>
          )}

          {/* Logout Button (View Mode Only) */}
          {!isEditing && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={22} color={Colors.error} strokeWidth={2.5} />
              <Text style={styles.logoutButtonText}>
                {Strings.profile.logoutButton}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerDark: {
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  textDark: {
    color: Colors.white,
  },
  editButton: {
    width: 70,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
  },
  editButtonTextActive: {
    color: Colors.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  glowRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    padding: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarInnerContainer: {
    width: 132,
    height: 132,
    borderRadius: 66,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileName: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    fontWeight: FontWeights.regular,
  },
  profileEmailDark: {
    color: Colors.textLight,
  },
  section: {
    gap: 12,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  glassCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputIconContainerDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: FontSizes.small,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    fontSize: FontSizes.body,
    color: Colors.text,
    padding: 0,
  },
  inputDark: {
    color: Colors.white,
  },
  inputValue: {
    fontSize: FontSizes.body,
    color: Colors.text,
    fontWeight: FontWeights.medium,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  genderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  genderButtonActive: {
    backgroundColor: Colors.primary,
  },
  genderButtonText: {
    fontSize: FontSizes.small,
    color: Colors.text,
    fontWeight: FontWeights.medium,
  },
  genderButtonTextActive: {
    color: Colors.white,
  },
  cancelButton: {
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutButtonText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    color: Colors.error,
  },
});
