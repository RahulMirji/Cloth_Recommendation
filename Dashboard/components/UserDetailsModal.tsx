/**
 * UserDetailsModal Component
 * 
 * Beautiful custom modal for displaying user details
 * Matches main app aesthetic with glassmorphism
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { DashboardUser } from '../types';
import { ADMIN_CONFIG } from '../constants/config';

interface UserDetailsModalProps {
  visible: boolean;
  user: DashboardUser | null;
  onClose: () => void;
  isDarkMode: boolean;
}

export function UserDetailsModal({
  visible,
  user,
  onClose,
  isDarkMode,
}: UserDetailsModalProps) {
  const colors = ADMIN_CONFIG.COLORS;

  // Debug logging
  React.useEffect(() => {
    if (visible && user) {
      console.log('🔍 UserDetailsModal - User Data:', {
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        bio: user.bio,
        user_id: user.user_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      });
    }
  }, [visible, user]);

  if (!user) return null;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        <Ionicons
          name={icon as any}
          size={18}
          color={colors.primary}
          style={styles.infoIcon}
        />
        <Text
          style={[
            styles.labelText,
            { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.valueText,
          { color: isDarkMode ? colors.textDark : colors.text },
        ]}
      >
        {value || 'N/A'}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDarkMode
                ? '#1F2937'
                : '#FFFFFF',
            },
          ]}
        >
          {/* Header with Gradient */}
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.avatarCircle}>
                  {user.profile_image ? (
                    <Image 
                      source={{ uri: user.profile_image }} 
                      style={styles.profileImage}
                    />
                  ) : (
                    <Ionicons name="person" size={28} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.headerTitle}>User Details</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.closeButtonCircle}>
                  <Ionicons name="close" size={20} color={colors.text} />
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            bounces={true}
            scrollEnabled={true}
          >
                {/* Personal Information */}
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: isDarkMode ? colors.textDark : colors.text },
                    ]}
                  >
                    Personal Information
                  </Text>
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: isDarkMode ? colors.cardDark : colors.card,
                        borderColor: isDarkMode ? colors.borderDark : colors.border,
                      },
                    ]}
                  >
                    <InfoRow icon="person-outline" label="Name" value={user.name} />
                    <InfoRow icon="mail-outline" label="Email" value={user.email} />
                    <InfoRow icon="call-outline" label="Phone" value={user.phone || 'N/A'} />
                    <InfoRow
                      icon="calendar-outline"
                      label="Age"
                      value={user.age ? `${user.age} years` : 'N/A'}
                    />
                    <InfoRow
                      icon={user.gender === 'male' ? 'man-outline' : 'woman-outline'}
                      label="Gender"
                      value={user.gender || 'N/A'}
                    />
                  </View>
                </View>

                {/* Bio */}
                {user.bio && (
                  <View style={styles.section}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: isDarkMode ? colors.textDark : colors.text },
                      ]}
                    >
                      Bio
                    </Text>
                    <View
                      style={[
                        styles.card,
                        {
                          backgroundColor: isDarkMode ? colors.cardDark : colors.card,
                          borderColor: isDarkMode ? colors.borderDark : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.bioText,
                          { color: isDarkMode ? colors.textDark : colors.text },
                        ]}
                      >
                        {user.bio}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Account Information */}
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: isDarkMode ? colors.textDark : colors.text },
                    ]}
                  >
                    Account Information
                  </Text>
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: isDarkMode ? colors.cardDark : colors.card,
                        borderColor: isDarkMode ? colors.borderDark : colors.border,
                      },
                    ]}
                  >
                    <InfoRow
                      icon="fingerprint-outline"
                      label="User ID"
                      value={user.user_id?.slice(0, 8) + '...' || 'N/A'}
                    />
                    <InfoRow
                      icon="calendar-outline"
                      label="Joined"
                      value={formatDate(user.created_at)}
                    />
                    <InfoRow
                      icon="time-outline"
                      label="Last Updated"
                      value={formatDate(user.updated_at)}
                    />
                  </View>
                </View>
              </ScrollView>

          {/* Footer Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.closeFooterButton, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <Text style={styles.closeFooterButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    height: 600,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    marginRight: 10,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  closeFooterButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  closeFooterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
