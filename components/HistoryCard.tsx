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
              {/* Thumbnail */}
              {(data.outfitImage || entry.image_url) && (
                <Image
                  source={{ uri: data.outfitImage || entry.image_url || '' }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              )}

              {/* Content */}
              <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                  <View style={styles.scoreContainer}>
                    <Star size={18} color={Colors.primary} fill={Colors.primary} />
                    <Text style={[styles.scoreText, isDarkMode && styles.scoreTextDark]}>
                      {score}/100
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
                      <Trash2 size={18} color={isDarkMode ? Colors.white : Colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                <Text
                  style={[styles.cardSubtitle, isDarkMode && styles.cardSubtitleDark]}
                  numberOfLines={2}
                >
                  {summary.substring(0, 100)}
                  {summary.length > 100 ? '...' : ''}
                </Text>

                <View style={styles.dateContainer}>
                  <Clock size={12} color={isDarkMode ? Colors.white : Colors.textSecondary} />
                  <Text style={[styles.dateText, isDarkMode && styles.dateTextDark]}>
                    {formattedDate} • {formattedTime}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
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
                <MessageSquare size={28} color={Colors.primary} />
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
                      <Trash2 size={18} color={isDarkMode ? Colors.white : Colors.textSecondary} />
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

                <View style={styles.dateContainer}>
                  <Clock size={12} color={isDarkMode ? Colors.white : Colors.textSecondary} />
                  <Text style={[styles.dateText, isDarkMode && styles.dateTextDark]}>
                    {formattedDate} • {formattedTime}
                  </Text>
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
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 14,
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
