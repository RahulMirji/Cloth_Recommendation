/**
 * History Card Component
 * 
 * Displays a single chat history entry card for either
 * Outfit Score or AI Stylist conversation.
 * 
 * Created: October 4, 2025
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, MessageSquare, Star, Trash2 } from 'lucide-react-native';
import { ChatHistoryEntry, OutfitScoreConversationData, AIStylistConversationData } from '../types/chatHistory.types';
import Colors from '../constants/colors';

const { width } = Dimensions.get('window');

interface HistoryCardProps {
  entry: ChatHistoryEntry;
  isDarkMode: boolean;
  onPress: () => void;
  onDelete?: () => void;
}

export function HistoryCard({ entry, isDarkMode, onPress, onDelete }: HistoryCardProps) {
  const conversationData = entry.conversation_data as any;
  const date = new Date(entry.created_at);
  
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isOutfitScore = entry.type === 'outfit_score';

  const renderOutfitScoreCard = () => {
    const data = conversationData as OutfitScoreConversationData;
    const score = data.overallScore || entry.score || 0;
    const summary = data.feedback?.summary || '';
    const imageUrl = data.outfitImage || entry.image_url;

    // Debug logging
    console.log('🖼️ HistoryCard - Outfit Score:', {
      hasOutfitImage: !!data.outfitImage,
      hasEntryImageUrl: !!entry.image_url,
      imageUrl: imageUrl,
      score: score
    });

    // Get score color based on value
    const getScoreColor = (score: number) => {
      if (score >= 80) return '#10B981'; // Green
      if (score >= 60) return '#F59E0B'; // Orange
      return '#EF4444'; // Red
    };

    const scoreColor = getScoreColor(score);

    return (
      <TouchableOpacity
        style={[styles.card, isDarkMode && styles.cardDark]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View style={[styles.cardInner, isDarkMode && styles.cardInnerDark]}>
            <View style={styles.cardContent}>
              {/* Thumbnail - Square Image */}
              <View style={styles.thumbnailContainer}>
                <Image
                  source={{ 
                    uri: imageUrl && imageUrl.startsWith('http') 
                      ? imageUrl 
                      : 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop'
                  }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </View>

              {/* Content */}
              <View style={styles.cardInfo}>
                {/* Score Badge - Matching original design */}
                <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}15` }]}>
                  <Star size={16} color={scoreColor} fill={scoreColor} />
                  <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>
                    {score}/100
                  </Text>
                </View>

                {/* Summary Text */}
                <Text
                  style={[styles.cardSubtitle, isDarkMode && styles.cardSubtitleDark]}
                  numberOfLines={2}
                >
                  {summary.substring(0, 100)}
                  {summary.length > 100 ? '...' : ''}
                </Text>

                {/* Date and Delete Button Row */}
                <View style={styles.bottomRow}>
                  <View style={styles.dateContainer}>
                    <Clock size={12} color={isDarkMode ? Colors.white : Colors.textSecondary} />
                    <Text style={[styles.dateText, isDarkMode && styles.dateTextDark]}>
                      {isToday(date) ? 'Today' : formattedDate}
                    </Text>
                  </View>
                  {onDelete && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      style={styles.deleteButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={16} color={isDarkMode ? Colors.white : Colors.textSecondary} opacity={0.6} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Helper function to check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const renderAIStylistCard = () => {
    const data = conversationData as AIStylistConversationData;
    const messageCount = data.messages?.length || 0;
    const lastMessage = data.messages?.[data.messages.length - 1]?.content || '';
    const firstUserMessage = data.messages?.find(m => m.role === 'user')?.content || 'AI Stylist Chat';

    return (
      <TouchableOpacity
        style={[styles.card, isDarkMode && styles.cardDark]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View style={[styles.cardInner, isDarkMode && styles.cardInnerDark]}>
            <View style={styles.cardContent}>
              {/* Icon */}
              <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
                <MessageSquare size={32} color={Colors.primary} />
              </View>

              {/* Content */}
              <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                  <Text
                    style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}
                    numberOfLines={1}
                  >
                    {firstUserMessage.substring(0, 40)}
                    {firstUserMessage.length > 40 ? '...' : ''}
                  </Text>
                  {onDelete && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      style={styles.deleteButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={16} color={isDarkMode ? Colors.white : Colors.textSecondary} opacity={0.6} />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={[styles.messageCountText, isDarkMode && styles.messageCountTextDark]}>
                  {messageCount} message{messageCount !== 1 ? 's' : ''}
                </Text>

                <Text
                  style={[styles.cardSubtitle, isDarkMode && styles.cardSubtitleDark]}
                  numberOfLines={2}
                >
                  {lastMessage.substring(0, 80)}
                  {lastMessage.length > 80 ? '...' : ''}
                </Text>

                <View style={styles.bottomRow}>
                  <View style={styles.dateContainer}>
                    <Clock size={12} color={isDarkMode ? Colors.white : Colors.textSecondary} />
                    <Text style={[styles.dateText, isDarkMode && styles.dateTextDark]}>
                      {isToday(date) ? 'Today' : formattedDate}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return isOutfitScore ? renderOutfitScoreCard() : renderAIStylistCard();
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  cardDark: {
    // Dark mode handled by gradient and inner card
  },
  gradientBorder: {
    borderRadius: 20,
    padding: 2,
  },
  cardInner: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: 'hidden',
  },
  cardInnerDark: {
    backgroundColor: '#1E293B',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  thumbnailContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  thumbnailPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholderDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  cardTitleDark: {
    color: Colors.white,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  scoreBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  scoreTextDark: {
    color: Colors.primary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  messageCountTextDark: {
    color: Colors.primary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardSubtitleDark: {
    color: Colors.white,
    opacity: 0.7,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dateTextDark: {
    color: Colors.white,
    opacity: 0.5,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
});
