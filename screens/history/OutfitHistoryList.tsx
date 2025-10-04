/**
 * Outfit History List
 * 
 * Displays a list of past outfit scoring results.
 * Each entry shows a summary and can be tapped to view the full details.
 * 
 * Features:
 * - Fetches outfit scores from local storage and Supabase
 * - Displays thumbnail, score, date
 * - Tap to open full detail view
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
import { Sparkles, Calendar, TrendingUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

interface OutfitHistoryEntry {
  id: string;
  score: number;
  result: string;
  created_at: string;
  image_url?: string;
  feedback?: any;
}

interface OutfitHistoryListProps {
  isDarkMode: boolean;
}

export function OutfitHistoryList({ isDarkMode }: OutfitHistoryListProps) {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const [history, setHistory] = useState<OutfitHistoryEntry[]>([]);
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
          .eq('type', 'outfit_score')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data && data.length > 0) {
          console.log('Loaded outfit history from Supabase:', data.length, 'entries');
          const mappedHistory = data.map(item => {
            // Try to get data from conversation_data if available (new format)
            let score = item.score || 0;
            let result = item.result || '';
            let feedback = item.feedback;
            let imageUrl = item.image_url;

            if (item.conversation_data && typeof item.conversation_data === 'object' && !Array.isArray(item.conversation_data)) {
              const convData = item.conversation_data as any;
              score = convData.overallScore || score;
              
              // Build a result string from feedback
              if (convData.feedback) {
                result = convData.feedback.summary || result;
                feedback = convData.feedback;
              }
              
              imageUrl = convData.outfitImage || imageUrl;
            }

            return {
              id: item.id,
              score: score,
              result: result,
              created_at: item.created_at || new Date().toISOString(),
              image_url: imageUrl || undefined,
              feedback: feedback,
            };
          });
          setHistory(mappedHistory);
          setIsLoading(false);
          return;
        } else if (error) {
          console.error('Error loading outfit history from Supabase:', error);
        } else {
          console.log('No outfit history found in Supabase');
        }
      }

      // Fallback to local storage
      const storedHistory = await AsyncStorage.getItem('analysis_history');
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        const outfitHistory = parsed
          .filter((entry: any) => entry.type === 'scorer')
          .map((entry: any) => ({
            id: entry.id,
            score: entry.score || 0,
            result: entry.result || '',
            created_at: new Date(entry.timestamp).toISOString(),
          }));
        setHistory(outfitHistory);
      }
    } catch (error) {
      console.error('Error loading outfit history:', error);
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
  };

  const handleItemPress = (item: OutfitHistoryEntry) => {
    // Navigate to outfit scorer with the history ID to load from database
    router.push({
      pathname: '/outfit-scorer',
      params: {
        historyId: item.id,
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
          <Sparkles size={48} color={isDarkMode ? Colors.textLight : Colors.textSecondary} />
        </View>
        <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>
          No Outfit Scores Yet
        </Text>
        <Text style={[styles.emptyDescription, isDarkMode && styles.emptyDescriptionDark]}>
          Score your first outfit to see your history here
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: OutfitHistoryEntry }) => (
    <TouchableOpacity
      style={[styles.historyCard, isDarkMode && styles.historyCardDark]}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.scoreContainer, { backgroundColor: getScoreColor(item.score) + '20' }]}>
          <TrendingUp size={20} color={getScoreColor(item.score)} />
          <Text style={[styles.scoreText, { color: getScoreColor(item.score) }]}>
            {item.score}/100
          </Text>
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
        numberOfLines={2}
      >
        {item.result || 'Outfit analysis'}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={[styles.tapToView, isDarkMode && styles.tapToViewDark]}>
          Tap to view details
        </Text>
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
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
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
