/**
 * Profile Card Component
 * 
 * Displays a single profile field in a glassmorphism card.
 * Used in the profile screen to show/edit user information.
 * 
 * Usage:
 * <ProfileCard
 *   icon={<User size={20} color={Colors.primary} />}
 *   label="Name"
 *   value={profile.name}
 *   isEditing={isEditing}
 *   onChangeText={(text) => setProfile({ ...profile, name: text })}
 * />
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { GlassContainer } from './GlassContainer';
import { useIsDarkMode } from '@/store/authStore';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';

interface ProfileCardProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  placeholder?: string;
  isEditing?: boolean;
  onChangeText?: (text: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function ProfileCard({
  icon,
  label,
  value,
  placeholder,
  isEditing = false,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: ProfileCardProps) {
  const isDarkMode = useIsDarkMode();

  return (
    <GlassContainer style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
          {icon}
        </View>
        <View style={styles.content}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>
            {label}
          </Text>
          {isEditing ? (
            <TextInput
              style={[
                styles.input,
                multiline && styles.inputMultiline,
                isDarkMode && styles.inputDark,
              ]}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={Colors.textLight}
              multiline={multiline}
              numberOfLines={multiline ? 3 : 1}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
            />
          ) : (
            <Text style={[styles.value, isDarkMode && styles.valueDark]}>
              {value || placeholder || 'Not provided'}
            </Text>
          )}
        </View>
      </View>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconContainerDark: {
    backgroundColor: Colors.primary + '30',
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: FontSizes.small,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  labelDark: {
    color: Colors.textLight,
  },
  value: {
    fontSize: FontSizes.body,
    color: Colors.text,
    paddingVertical: 4,
  },
  valueDark: {
    color: Colors.white,
  },
  input: {
    fontSize: FontSizes.body,
    color: Colors.text,
    paddingVertical: 4,
  },
  inputDark: {
    color: Colors.white,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
