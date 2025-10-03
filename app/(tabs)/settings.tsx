import React from 'react';
import { StyleSheet, Text, View, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Cloud, Smartphone, Shield, Info } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function SettingsScreen() {
  const { settings, updateSettings, clearAllData } = useApp();

  const handleCloudAIToggle = (value: boolean) => {
    updateSettings({ useCloudAI: value });
  };

  const handleHistoryToggle = (value: boolean) => {
    updateSettings({ saveHistory: value });
  };

  const handleVoiceToggle = (value: boolean) => {
    updateSettings({ voiceEnabled: value });
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all saved data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Model</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '20' }]}>
                <Cloud size={20} color={Colors.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Use Cloud AI</Text>
                <Text style={styles.settingDescription}>
                  {settings.useCloudAI ? 'Using cloud-based AI model' : 'Using local AI model'}
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
        </View>
        <Text style={styles.sectionNote}>
          Cloud AI provides more accurate results but requires internet connection
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: Colors.secondary + '20' }]}>
                <Shield size={20} color={Colors.secondary} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Save History</Text>
                <Text style={styles.settingDescription}>
                  {settings.saveHistory ? 'Recommendations are saved' : 'History is not saved'}
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
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice Interaction</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: Colors.success + '20' }]}>
                <Smartphone size={20} color={Colors.success} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Enable Voice</Text>
                <Text style={styles.settingDescription}>
                  {settings.voiceEnabled ? 'Voice interaction enabled' : 'Voice interaction disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.voiceEnabled}
              onValueChange={handleVoiceToggle}
              trackColor={{ false: Colors.border, true: Colors.success }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
          <Text style={styles.dangerButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Info size={16} color={Colors.textLight} />
        <Text style={styles.infoText}>
          Version 1.0.0 • AI Fashion Assistant
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  sectionNote: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 8,
    lineHeight: 18,
  },
  settingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  dangerButton: {
    backgroundColor: Colors.error,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textLight,
  },
});
