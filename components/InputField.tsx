/**
 * Input Field Component
 * 
 * Reusable styled input field with icon support.
 * Automatically adapts to light/dark mode.
 * 
 * Usage:
 * <InputField
 *   icon={<User size={20} />}
 *   placeholder="Your name"
 *   value={name}
 *   onChangeText={setName}
 * />
 */

import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';

interface InputFieldProps extends TextInputProps {
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function InputField({
  icon,
  containerStyle,
  style,
  ...textInputProps
}: InputFieldProps) {
  const { settings } = useApp();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;

  return (
    <View
      style={[
        styles.container,
        isDarkMode && styles.containerDark,
        containerStyle,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <TextInput
        style={[
          styles.input,
          style,
        ]}
        placeholderTextColor={'#6B7280'}
        selectionColor={'#8B5CF6'}
        cursorColor={'#000000'}
        {...textInputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  containerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#000000', // Always black text for maximum readability
    fontWeight: '500', // Medium weight for better visibility
  },
});
