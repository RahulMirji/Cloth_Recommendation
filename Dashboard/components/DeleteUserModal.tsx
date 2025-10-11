/**
 * DeleteUserModal Component
 * 
 * Confirmation modal for user deletion.
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  warning: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  deleteButton: {},
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
