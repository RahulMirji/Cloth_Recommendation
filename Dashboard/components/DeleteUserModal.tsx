/**
 * DeleteUserModal Component
 * 
 * Confirmation modal for user deletion with modern styling.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import type { DashboardUser } from '../types';
import { ADMIN_CONFIG } from '../constants/config';

interface DeleteUserModalProps {
  visible: boolean;
  user: DashboardUser | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  visible,
  user,
  isDeleting,
  onConfirm,
  onCancel,
  isDarkMode,
}) => {
  const colors = ADMIN_CONFIG.COLORS;

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            {
              backgroundColor: isDarkMode ? colors.cardDark : colors.card,
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.danger + '20' }]}>
            <Ionicons name="warning" size={40} color={colors.danger} />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: isDarkMode ? colors.textDark : colors.text },
            ]}
          >
            Delete User?
          </Text>

          {/* Message */}
          <Text
            style={[
              styles.message,
              { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
            ]}
          >
            Are you sure you want to delete{' '}
            <Text style={{ fontWeight: '600' }}>{user.name}</Text>?
          </Text>
          <Text
            style={[
              styles.warning,
              { color: colors.danger },
            ]}
          >
            This action cannot be undone. All user data will be permanently removed.
          </Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: isDarkMode ? colors.backgroundDark : colors.background,
                  borderColor: isDarkMode ? colors.borderDark : colors.border,
                },
              ]}
              onPress={onCancel}
              disabled={isDeleting}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: isDarkMode ? colors.textDark : colors.text },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.deleteButton,
                { backgroundColor: colors.danger },
                isDeleting && styles.deleteButtonDisabled,
              ]}
              onPress={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  Delete
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 24,
    fontWeight: '500',
  },
  warning: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 21,
    fontWeight: '600',
  },
  buttons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    borderWidth: 2,
  },
  deleteButton: {
    shadowColor: '#EF4444',
    shadowOpacity: 0.3,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
