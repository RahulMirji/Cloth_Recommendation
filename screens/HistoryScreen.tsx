/**
 * History Screen
 * 
 * Displays conversation history for both Outfit Scores and AI Stylist chats.
 * Features two tabs with proper theme support and pull-to-refresh.
 * 
 * Created: October 4, 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { History, Clock, Trash2 } from 'lucide-react-native';
import { useApp } from '../contexts/AppContext';
import { useAuthStore } from '../store/authStore';
import { getChatHistory, getHistoryCounts, deleteChatHistory } from '../utils/chatHistory';
import { ChatHistoryEntry } from '../types/chatHistory.types';
import { HistoryCard } from '../components/HistoryCard';
import Colors from '../constants/colors';

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const { settings } = useApp();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  const session = useAuthStore((state) => state.session);
  const user = session?.user;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'outfit_score' | 'ai_stylist'>('outfit_score');
  const [outfitHistory, setOutfitHistory] = useState<ChatHistoryEntry[]>([]);
  const [stylistHistory, setStylistHistory] = useState<ChatHistoryEntry[]>([]);
  const [counts, setCounts] = useState({ outfit_score: 0, ai_stylist: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Load both types of history
      const [outfitResult, stylistResult, countsResult] = await Promise.all([
        getChatHistory({ userId: user.id, type: 'outfit_score', limit: 50 }),
        getChatHistory({ userId: user.id, type: 'ai_stylist', limit: 50 }),
        getHistoryCounts(user.id),
      ]);

      if (outfitResult.success && outfitResult.data) {
        setOutfitHistory(outfitResult.data);
      }

      if (stylistResult.success && stylistResult.data) {
        setStylistHistory(stylistResult.data);
      }

      setCounts(countsResult);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, [user]);

  const handleHistoryItemPress = (entry: ChatHistoryEntry) => {
    if (entry.type === 'outfit_score') {
      // Navigate to outfit scorer with history data
      router.push({
        pathname: '/outfit-scorer',
        params: { historyId: entry.id },
      });
    } else {
      // Navigate to AI stylist with history data
      router.push({
        pathname: '/ai-stylist',
        params: { historyId: entry.id },
      });
    }
  };

  const handleDeleteHistoryItem = async (entry: ChatHistoryEntry) => {
    if (!user) return;

    Alert.alert(
      'Delete History',
      'Are you sure you want to delete this history entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteChatHistory(entry.id, user.id);
            if (success) {
              // Remove from local state
              if (entry.type === 'outfit_score') {
                setOutfitHistory(prev => prev.filter(item => item.id !== entry.id));
                setCounts(prev => ({ ...prev, outfit_score: prev.outfit_score - 1 }));
              } else {
                setStylistHistory(prev => prev.filter(item => item.id !== entry.id));
                setCounts(prev => ({ ...prev, ai_stylist: prev.ai_stylist - 1 }));
              }
            }
          },
        },
      ]
    );
  };

  const currentHistory = activeTab === 'outfit_score' ? outfitHistory : stylistHistory;
  const currentCount = activeTab === 'outfit_score' ? counts.outfit_score : counts.ai_stylist;

  if (!user) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={styles.emptyContainer}>
          <History size={64} color={isDarkMode ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>
            Sign in to view history
          </Text>
          <Text style={[styles.emptySubtitle, isDarkMode && styles.emptySubtitleDark]}>
            Your conversation history will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <History size={28} color={isDarkMode ? Colors.white : Colors.primary} />
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
            History
          </Text>
        </View>
        <Text style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}>
          Your past conversations and analyses
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'outfit_score' && styles.tabActive,
            isDarkMode && styles.tabDark,
            activeTab === 'outfit_score' && isDarkMode && styles.tabActiveDark,
          ]}
          onPress={() => setActiveTab('outfit_score')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'outfit_score' && styles.tabTextActive,
              isDarkMode && activeTab !== 'outfit_score' && styles.tabTextDark,
            ]}
          >
            Outfit Scores
          </Text>
          {counts.outfit_score > 0 && (
            <View style={[
              styles.badge,
              activeTab === 'outfit_score' && styles.badgeActive
            ]}>
              <Text style={[
                styles.badgeText,
                activeTab === 'outfit_score' && styles.badgeTextActive
              ]}>
                {counts.outfit_score}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'ai_stylist' && styles.tabActive,
            isDarkMode && styles.tabDark,
            activeTab === 'ai_stylist' && isDarkMode && styles.tabActiveDark,
          ]}
          onPress={() => setActiveTab('ai_stylist')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'ai_stylist' && styles.tabTextActive,
              isDarkMode && activeTab !== 'ai_stylist' && styles.tabTextDark,
            ]}
          >
            AI Stylist
          </Text>
          {counts.ai_stylist > 0 && (
            <View style={[
              styles.badge,
              activeTab === 'ai_stylist' && styles.badgeActive
            ]}>
              <Text style={[
                styles.badgeText,
                activeTab === 'ai_stylist' && styles.badgeTextActive
              ]}>
                {counts.ai_stylist}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* History List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
            Loading history...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.historyList}
          contentContainerStyle={styles.historyListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDarkMode ? Colors.white : Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {currentHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Clock size={64} color={isDarkMode ? Colors.white : Colors.textSecondary} />
              <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>
                No {activeTab === 'outfit_score' ? 'outfit scores' : 'AI stylist chats'} yet
              </Text>
              <Text style={[styles.emptySubtitle, isDarkMode && styles.emptySubtitleDark]}>
                Start a new {activeTab === 'outfit_score' ? 'outfit analysis' : 'conversation'} to see it here
              </Text>
            </View>
          ) : (
            currentHistory.map((entry) => (
              <HistoryCard
                key={`${entry.id}-${entry.updated_at || entry.created_at}`}
                entry={entry}
                isDarkMode={isDarkMode}
                onPress={() => handleHistoryItemPress(entry)}
                onDelete={() => handleDeleteHistoryItem(entry)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  containerDark: {
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerTitleDark: {
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  headerSubtitleDark: {
    color: Colors.white,
    opacity: 0.7,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
  },
  tabDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabActiveDark: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextDark: {
    color: Colors.white,
  },
  tabTextActive: {
    color: Colors.white,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  badgeTextActive: {
    color: Colors.white,
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    padding: 20,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loadingTextDark: {
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyTitleDark: {
    color: Colors.white,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptySubtitleDark: {
    color: Colors.white,
    opacity: 0.6,
  },
});
