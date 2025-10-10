/**
 * Settings Screen
 * 
 * App settings and preferences screen.
 * 
 * Features:
 * - Dark mode toggle
 * - Cloud AI vs local AI selection
 * - History save toggle
 * - Glassmorphism cards
 * - Dark mode adaptation
 */

import React from 'react';
import { StyleSheet, Text, View, Switch, ScrollView, useColorScheme, TouchableOpacity, Image } from 'react-native';
import { Cloud, Shield, Info, Moon, LogOut, User } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { useAlert } from '@/contexts/AlertContext';
import { Strings } from '@/constants/strings';
import { FontSizes, FontWeights } from '@/constants/fonts';

export function SettingsScreen() {
  const { settings, updateSettings, logout, userProfile } = useApp();
  const { showAlert } = useAlert();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;

  /**
   * Toggle Cloud AI setting
   */
  const handleCloudAIToggle = (value: boolean) => {
    updateSettings({ useCloudAI: value });
  };

  /**
   * Toggle save history setting
   */
  const handleHistoryToggle = (value: boolean) => {
    updateSettings({ saveHistory: value });
  };

  /**
   * Toggle dark mode setting
   */
  const handleDarkModeToggle = (value: boolean) => {
    updateSettings({ isDarkMode: value });
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    showAlert(
      'warning',
      'Logout',
      'Are you sure you want to sign out of your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/sign-in');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>
            {Strings.settings.appearance.title}
          </Text>
          <BlurView
            intensity={80}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.settingCard, isDarkMode && styles.settingCardDark]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.secondary + '20' }]}>
                  <Moon size={20} color={Colors.secondary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, isDarkMode && styles.textDark]}>
                    {Strings.settings.appearance.darkMode}
                  </Text>
                  <Text style={[styles.settingDescription, isDarkMode && styles.descriptionDark]}>
                    {isDarkMode
                      ? Strings.settings.appearance.darkModeEnabled
                      : Strings.settings.appearance.lightModeEnabled}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.isDarkMode}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: Colors.border, true: Colors.secondary }}
                thumbColor={Colors.white}
              />
            </View>
          </BlurView>
        </View>

        {/* AI Model Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>
            {Strings.settings.aiModel.title}
          </Text>
          <BlurView
            intensity={80}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.settingCard, isDarkMode && styles.settingCardDark]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '20' }]}>
                  <Cloud size={20} color={Colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, isDarkMode && styles.textDark]}>
                    {Strings.settings.aiModel.useCloudAI}
                  </Text>
                  <Text style={[styles.settingDescription, isDarkMode && styles.descriptionDark]}>
                    {settings.useCloudAI
                      ? Strings.settings.aiModel.cloudEnabled
                      : Strings.settings.aiModel.cloudDisabled}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.useCloudAI}
                onValueChange={handleCloudAIToggle}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </BlurView>
          <Text style={[styles.sectionNote, isDarkMode && styles.descriptionDark]}>
            {Strings.settings.aiModel.note}
          </Text>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>
            {Strings.settings.privacy.title}
          </Text>
          <BlurView
            intensity={80}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.settingCard, isDarkMode && styles.settingCardDark]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.secondary + '20' }]}>
                  <Shield size={20} color={Colors.secondary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, isDarkMode && styles.textDark]}>
                    {Strings.settings.privacy.saveHistory}
                  </Text>
                  <Text style={[styles.settingDescription, isDarkMode && styles.descriptionDark]}>
                    {settings.saveHistory
                      ? Strings.settings.privacy.historyEnabled
                      : Strings.settings.privacy.historyDisabled}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.saveHistory}
                onValueChange={handleHistoryToggle}
                trackColor={{ false: Colors.border, true: Colors.secondary }}
                thumbColor={Colors.white}
              />
            </View>
          </BlurView>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
            <BlurView
              intensity={80}
              tint={isDarkMode ? 'dark' : 'light'}
              style={[styles.settingCard, styles.logoutCard, isDarkMode && styles.settingCardDark]}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={[styles.profileImageContainer, { backgroundColor: Colors.error + '20' }]}>
                    {userProfile.profileImage ? (
                      <Image 
                        source={{ uri: userProfile.profileImage }} 
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.profileImagePlaceholder}>
                        <User size={24} color={Colors.error} />
                      </View>
                    )}
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, styles.logoutText]}>
                      Logout
                    </Text>
                    <Text style={[styles.settingDescription, isDarkMode && styles.descriptionDark]}>
                      Sign out of your account
                    </Text>
                  </View>
                </View>
                <LogOut size={22} color={Colors.error} />
              </View>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <View style={styles.infoSection}>
          <Info size={16} color={isDarkMode ? Colors.textLight : Colors.textLight} />
          <Text style={[styles.infoText, isDarkMode && styles.descriptionDark]}>
            {Strings.settings.version}
          </Text>
        </View>
      </ScrollView>
    </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: FontSizes.subheading,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 12,
  },
  textDark: {
    color: Colors.white,
  },
  settingCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  settingCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  descriptionDark: {
    color: Colors.textLight,
  },
  sectionNote: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  infoText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  logoutCard: {
    borderColor: Colors.error + '30',
  },
  logoutText: {
    color: Colors.error,
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.error + '40',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '20',
  },
});
