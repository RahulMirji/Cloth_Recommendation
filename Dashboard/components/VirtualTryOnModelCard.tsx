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
import { Shirt, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VirtualTryOnModel, VIRTUAL_TRYON_MODELS } from '@/VirtualTryOn/utils/tryonModels';

const STORAGE_KEY = '@admin_selected_tryon_model';

interface VirtualTryOnModelCardProps {
  onModelChange?: (model: VirtualTryOnModel) => void;
}

export function VirtualTryOnModelCard({ onModelChange }: VirtualTryOnModelCardProps) {
  const [selectedModel, setSelectedModel] = useState<VirtualTryOnModel>(VIRTUAL_TRYON_MODELS[0]);
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
        const model = VIRTUAL_TRYON_MODELS.find(m => m.id === modelId);
        if (model) {
          setSelectedModel(model);
          onModelChange?.(model);
        }
      }
    } catch (error) {
      console.error('Error loading saved Virtual Try-On model:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectModel = async (model: VirtualTryOnModel) => {
    try {
      setSelectedModel(model);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(model.id));
      onModelChange?.(model);
      
      console.log(`✅ Virtual Try-On switched to: ${model.name}`);
    } catch (error) {
      console.error('Error saving Virtual Try-On model:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <ActivityIndicator size="small" color="#F59E0B" />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Active Model Showcase */}
      <TouchableOpacity activeOpacity={1}>
        <LinearGradient
          colors={isDarkMode ? 
            ['rgba(245, 158, 11, 0.15)', 'rgba(59, 130, 246, 0.05)'] : 
            ['rgba(245, 158, 11, 0.08)', 'rgba(59, 130, 246, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeCard}
        >
          <View style={styles.activeCardHeader}>
            <Shirt size={18} color="#F59E0B" strokeWidth={2.5} />
            <Text style={[styles.activeLabel, isDarkMode && styles.textLight]}>ACTIVE</Text>
          </View>
          <Text style={[styles.activeName, isDarkMode && styles.textWhite]}>
            {selectedModel.name}
          </Text>
          <View style={styles.activeBadges}>
            <View style={[styles.badge, styles.badgeOrange]}>
              <Text style={styles.badgeText}>Quality {selectedModel.quality}/5</Text>
            </View>
            <View style={[styles.badge, styles.badgeBlue]}>
              <Text style={styles.badgeText}>{selectedModel.speed}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Model Options */}
      <View style={styles.optionsContainer}>
        {VIRTUAL_TRYON_MODELS.map((model) => {
          const isActive = selectedModel.id === model.id;
          
          return (
            <TouchableOpacity
              key={model.id}
              style={[
                styles.option,
                isDarkMode && styles.optionDark,
                isActive && styles.optionActive,
                isActive && (isDarkMode ? styles.optionActiveDark : styles.optionActiveLight),
              ]}
              onPress={() => handleSelectModel(model)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={[
                    styles.optionName,
                    isDarkMode && styles.textWhite,
                    isActive && styles.optionNameActive,
                  ]}>
                    {model.name}
                  </Text>
                  {model.isRecommended && (
                    <View style={styles.recommendedTag}>
                      <Text style={styles.recommendedText}>★</Text>
                    </View>
                  )}
                </View>
                <View style={styles.optionMeta}>
                  <Text style={[styles.optionMetaText, isDarkMode && styles.textMuted]}>
                    {model.quality}/5
                  </Text>
                  <Text style={[styles.optionMetaText, isDarkMode && styles.textMuted]}>•</Text>
                  <Text style={[styles.optionMetaText, isDarkMode && styles.textMuted]}>
                    {model.speed}
                  </Text>
                </View>
              </View>
              {isActive && (
                <View style={styles.checkCircle}>
                  <Check size={14} color="#F59E0B" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  containerDark: {
    backgroundColor: '#1F2937',
    shadowColor: '#000',
  },

  // Active Model Card
  activeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1.5,
  },
  activeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  activeBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeOrange: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  badgeBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Options
  optionsContainer: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionDark: {
    backgroundColor: '#374151',
  },
  optionActive: {
    borderColor: '#F59E0B',
  },
  optionActiveLight: {
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  optionActiveDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  optionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  optionNameActive: {
    color: '#F59E0B',
  },
  recommendedTag: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  optionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  // Text Colors
  textWhite: {
    color: '#F9FAFB',
  },
  textLight: {
    color: '#E5E7EB',
  },
  textMuted: {
    color: '#9CA3AF',
  },
});
