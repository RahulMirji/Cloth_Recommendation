/**
 * Model Management Card Component
 * 
 * Admin-only component to switch AI models globally.
 * All user requests will use the selected model.
 * Perfect for testing fine-tuned models vs Pollinations AI.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Check, Zap, Clock, Star } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIModel, AI_MODELS } from '@/OutfitScorer/utils/aiModels';

const STORAGE_KEY = '@admin_selected_model';

interface ModelManagementCardProps {
  onModelChange?: (model: AIModel) => void;
}

export function ModelManagementCard({ onModelChange }: ModelManagementCardProps) {
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Load saved model on mount
  useEffect(() => {
    loadSavedModel();
  }, []);

  const loadSavedModel = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const modelId = JSON.parse(saved);
        const model = AI_MODELS.find(m => m.id === modelId);
        if (model) {
          setSelectedModel(model);
          onModelChange?.(model);
        }
      }
    } catch (error) {
      console.error('Error loading saved model:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectModel = async (model: AIModel) => {
    try {
      setSelectedModel(model);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(model.id));
      onModelChange?.(model);
      
      // Show success feedback
      console.log(`✅ Switched to: ${model.name}`);
    } catch (error) {
      console.error('Error saving model:', error);
    }
  };

  const getQualityStars = (quality: number) => {
    return '⭐'.repeat(quality);
  };

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case 'very-fast':
        return '⚡';
      case 'fast':
        return '🏃';
      case 'medium':
        return '🚶';
      default:
        return '🐢';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.card, isDarkMode && styles.cardDark]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={[styles.card, isDarkMode && styles.cardDark]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={24} color="#8B5CF6" strokeWidth={2} />
          <View>
            <Text style={[styles.title, isDarkMode && styles.textDark]}>
              AI Model Control
            </Text>
            <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
              All users will use: <Text style={styles.activeModel}>{selectedModel.name}</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Current Model Info */}
      <View style={styles.currentModelCard}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.currentModelGradient}
        />
        <View style={styles.currentModelInfo}>
          <Text style={[styles.currentModelLabel, isDarkMode && styles.textDark]}>
            Active Model
          </Text>
          <Text style={[styles.currentModelName, isDarkMode && styles.textDark]}>
            {selectedModel.name}
          </Text>
          <View style={styles.currentModelMeta}>
            <Text style={styles.currentModelMetaText}>
              {getQualityStars(selectedModel.quality)} Quality
            </Text>
            <Text style={styles.currentModelMetaText}>
              {getSpeedIcon(selectedModel.speed)} {selectedModel.speed}
            </Text>
          </View>
        </View>
      </View>

      {/* Model Selection List */}
      <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>
        Switch Model:
      </Text>
      
      <View style={styles.modelList}>
        {AI_MODELS.map((model, index) => (
          <TouchableOpacity
            key={model.id}
            style={[
              styles.modelItem,
              isDarkMode && styles.modelItemDark,
              selectedModel.id === model.id && styles.modelItemActive,
              index === AI_MODELS.length - 1 && styles.modelItemLast,
            ]}
            onPress={() => handleSelectModel(model)}
            activeOpacity={0.7}
          >
            <View style={styles.modelItemLeft}>
              <View style={styles.modelItemHeader}>
                <Text style={[
                  styles.modelItemName,
                  isDarkMode && styles.textDark,
                  selectedModel.id === model.id && styles.modelItemNameActive,
                ]}>
                  {model.name}
                </Text>
                {model.isRecommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.modelItemDescription, isDarkMode && styles.subtitleDark]}>
                {model.description}
              </Text>
              <View style={styles.modelItemMeta}>
                <View style={styles.metaBadge}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.metaText}>{model.quality}/5</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Zap size={12} color="#10B981" />
                  <Text style={styles.metaText}>{model.speed}</Text>
                </View>
              </View>
            </View>
            {selectedModel.id === model.id && (
              <View style={styles.checkWrapper}>
                <Check size={20} color="#8B5CF6" strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Info Box */}
      <View style={[styles.infoBox, isDarkMode && styles.infoBoxDark]}>
        <Text style={[styles.infoText, isDarkMode && styles.textDark]}>
          💡 <Text style={styles.infoTextBold}>Tip:</Text> Switch to Pollinations (Gemini) during user testing. 
          Use your fine-tuned model for demo/evaluation.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#1F2937',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  subtitleDark: {
    color: '#9CA3AF',
  },
  activeModel: {
    color: '#8B5CF6',
    fontWeight: '700',
  },
  
  // Current Model Card
  currentModelCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  currentModelGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  currentModelInfo: {
    gap: 4,
  },
  currentModelLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  currentModelName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  currentModelMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  currentModelMetaText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  
  // Section
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Model List
  modelList: {
    gap: 0,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modelItemDark: {
    borderBottomColor: '#374151',
  },
  modelItemLast: {
    borderBottomWidth: 0,
  },
  modelItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  modelItemLeft: {
    flex: 1,
    gap: 6,
  },
  modelItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  modelItemNameActive: {
    color: '#8B5CF6',
  },
  recommendedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  modelItemDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  modelItemMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  checkWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Info Box
  infoBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  infoBoxDark: {
    backgroundColor: '#374151',
  },
  infoText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  infoTextBold: {
    fontWeight: '700',
    color: '#111827',
  },
  
  // Common
  textDark: {
    color: '#F9FAFB',
  },
});
