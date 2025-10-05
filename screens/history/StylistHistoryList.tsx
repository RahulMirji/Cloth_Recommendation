/**
 * Stylist History List
 * 
 * Displays a list of past AI Stylist conversations.
 * Each entry shows a summary and can be tapped to view the full conversation.
 * 
 * Features:
 * - Fetches stylist history from local storage and Supabase
 * - Displays conversation preview and date
 * - Tap to open full conversation view
 * - Empty state when no history
 * - Dark mode support
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MessageSquare, Calendar, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';

interface StylistHistoryEntry {
  id: string;
  result: string;
  created_at: string;
  image_url?: string;
}

interface StylistHistoryListProps {
  isDarkMode: boolean;
}

export function StylistHistoryList({ isDarkMode }: StylistHistoryListProps) {
  const router = useRouter();
  const { session } = useApp();
  const [history, setHistory] = useState<StylistHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);

      // Try to load from Supabase first if user is authenticated
      if (session?.user) {
        const { data, error } = await supabase
          .from('analysis_history')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('type', 'ai_stylist')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data && data.length > 0) {
          const mappedHistory = data.map(item => ({
            id: item.id,
            result: item.result,
            created_at: item.created_at || new Date().toISOString(),
            image_url: item.image_url || undefined,
          }));
          setHistory(mappedHistory);
          setIsLoading(false);
          return;
        } else if (error) {
          console.error('Error loading AI stylist history from Supabase:', error);
        }
      }

      // Fallback to local storage
      const storedHistory = await AsyncStorage.getItem('analysis_history');
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        const stylistHistory = parsed
          .filter((entry: any) => entry.type === 'stylist')
          .map((entry: any) => ({
            id: entry.id,
            result: entry.result || '',
            created_at: new Date(entry.timestamp).toISOString(),
          }));
        setHistory(stylistHistory);
      }
    } catch (error) {
      console.error('Error loading stylist history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPreviewText = (fullText: string) => {
    // Extract first meaningful line from AI response
    const lines = fullText.split('\n').filter(line => line.trim().length > 0);
    const firstLine = lines[0] || fullText;
    return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
  };

  const handleItemPress = (item: StylistHistoryEntry) => {
    // Navigate to AI stylist with the historical data
    router.push({
      pathname: '/ai-stylist',
      params: {
        historyData: JSON.stringify({
          result: item.result,
          date: item.created_at,
          imageUrl: item.image_url,
        }),
      },
    } as any);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, isDarkMode && styles.emptyIconContainerDark]}>
          <MessageSquare size={48} color={isDarkMode ? Colors.textLight : Colors.textSecondary} />
        </View>
        <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>
          No AI Stylist Conversations
        </Text>
        <Text style={[styles.emptyDescription, isDarkMode && styles.emptyDescriptionDark]}>
          Chat with the AI Stylist to see your conversation history here
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: StylistHistoryEntry }) => (
    <TouchableOpacity
      style={[styles.historyCard, isDarkMode && styles.historyCardDark]}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
          <MessageSquare size={20} color={Colors.primary} />
        </View>
        <View style={styles.dateContainer}>
          <Calendar size={14} color={isDarkMode ? Colors.textLight : Colors.textSecondary} />
          <Text style={[styles.dateText, isDarkMode && styles.dateTextDark]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>

      <Text
        style={[styles.resultPreview, isDarkMode && styles.resultPreviewDark]}
        numberOfLines={3}
      >
        {getPreviewText(item.result)}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={[styles.tapToView, isDarkMode && styles.tapToViewDark]}>
          View conversation
        </Text>
        <ChevronRight size={16} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={history}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 80,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIconContainerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyTitle: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyTitleDark: {
    color: Colors.white,
  },
  emptyDescription: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyDescriptionDark: {
    color: Colors.textLight,
  },
  listContent: {
    gap: 16,
  },
  historyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  historyCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerDark: {
    backgroundColor: Colors.primary + '30',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  dateTextDark: {
    color: Colors.textLight,
  },
  resultPreview: {
    fontSize: FontSizes.body,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  resultPreviewDark: {
    color: Colors.white,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  tapToView: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
  },
  tapToViewDark: {
    color: Colors.primary,
  },
});
