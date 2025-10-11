/**
 * LogoutConfirmModal Component
 * 
 * Beautiful custom confirmation modal for logout
 * Matches main app aesthetic
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ADMIN_CONFIG } from '../constants/config';

interface LogoutConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

export function LogoutConfirmModal({
  visible,
  onConfirm,
  onCancel,
  isDarkMode,
}: LogoutConfirmModalProps) {
  const colors = ADMIN_CONFIG.COLORS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <BlurView intensity={20} style={styles.blurView}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: isDarkMode
                    ? 'rgba(55, 65, 81, 0.98)'
                    : 'rgba(249, 250, 251, 0.98)',
                },
              ]}
            >
              {/* Icon Header */}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[colors.danger + '20', colors.danger + '10']}
                  style={styles.iconCircle}
                >
                  <Ionicons name="log-out-outline" size={40} color={colors.danger} />
                </LinearGradient>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text
                  style={[
                    styles.title,
                    { color: isDarkMode ? colors.textDark : colors.text },
                  ]}
                >
                  Logout Confirmation
                </Text>
                <Text
                  style={[
                    styles.message,
                    { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
                  ]}
                >
                  Are you sure you want to logout from the admin dashboard?
                </Text>
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    {
                      backgroundColor: isDarkMode ? colors.cardDark : colors.card,
                      borderColor: isDarkMode ? colors.borderDark : colors.border,
                    },
                  ]}
                  onPress={onCancel}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: isDarkMode ? colors.textDark : colors.text },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={onConfirm}
                >
                  <LinearGradient
                    colors={[colors.danger, '#DC2626']}
                    style={styles.confirmButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.confirmButtonText}>Logout</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </BlurView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
