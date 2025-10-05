/**
 * History Screen
 * 
 * Main history screen with tabs for Outfit Scores and AI Stylist history.
 * 
 * Features:
 * - Tabbed interface (Outfit Scores / AI Stylist)
 * - Dark mode support
 * - Fetches history from local storage and Supabase
 * - Clean, modular design
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { OutfitHistoryList } from './OutfitHistoryList';
import { StylistHistoryList } from './StylistHistoryList';

type TabType = 'outfit' | 'stylist';

export function HistoryScreen() {
  const { settings } = useApp();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  
  const [activeTab, setActiveTab] = useState<TabType>('outfit');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading history data
    const loadData = async () => {
      setIsLoading(true);
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Tab Selector */}
      <View style={[styles.tabContainer, isDarkMode && styles.tabContainerDark]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'outfit' && styles.tabActive,
            activeTab === 'outfit' && (isDarkMode ? styles.tabActiveDark : styles.tabActiveLight),
          ]}
          onPress={() => setActiveTab('outfit')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              isDarkMode && styles.tabTextDark,
              activeTab === 'outfit' && styles.tabTextActive,
            ]}
          >
            Outfit Scores
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'stylist' && styles.tabActive,
            activeTab === 'stylist' && (isDarkMode ? styles.tabActiveDark : styles.tabActiveLight),
          ]}
          onPress={() => setActiveTab('stylist')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              isDarkMode && styles.tabTextDark,
              activeTab === 'stylist' && styles.tabTextActive,
            ]}
          >
            AI Stylist
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
            Loading history...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'outfit' ? (
            <OutfitHistoryList isDarkMode={isDarkMode} />
          ) : (
            <StylistHistoryList isDarkMode={isDarkMode} />
          )}
        </ScrollView>
      )}
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
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabContainerDark: {
    backgroundColor: '#0F172A',
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  tabActive: {
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabActiveLight: {
    backgroundColor: Colors.primary,
  },
  tabActiveDark: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  tabTextDark: {
    color: Colors.textLight,
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: FontWeights.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
  },
  loadingTextDark: {
    color: Colors.textLight,
  },
});
