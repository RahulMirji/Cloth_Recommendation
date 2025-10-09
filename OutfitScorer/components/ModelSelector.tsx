/**
 * AI Model Selector Component
 * 
 * Beautiful dropdown to select AI vision model for outfit analysis.
 * Shows model details: quality, speed, description.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { ChevronDown, Check, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { AIModel, AI_MODELS } from '@/OutfitScorer/utils/aiModels';

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { settings } = useApp();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;

  const handleSelectModel = (model: AIModel) => {
    onModelChange(model);
    setIsDropdownOpen(false);
  };

  return (
    <View style={styles.container}>
      {!isDropdownOpen ? (
        /* Closed State - Show Selector Button */
        <TouchableOpacity
          style={[styles.selectorButton, isDarkMode && styles.selectorButtonDark]}
          onPress={() => setIsDropdownOpen(true)}
          activeOpacity={0.7}
        >
          <View style={styles.selectorContent}>
            <Sparkles size={18} color={Colors.primary} strokeWidth={2} />
            <View style={styles.selectorTextContainer}>
              <Text style={[styles.selectorLabel, isDarkMode && styles.textDark]}>
                AI Model
              </Text>
              <Text style={[styles.selectorValue, isDarkMode && styles.textDark]}>
                {selectedModel.name}
              </Text>
            </View>
          </View>
          <ChevronDown size={20} color={isDarkMode ? Colors.white : Colors.text} strokeWidth={2} />
        </TouchableOpacity>
      ) : (
        /* Open State - Show Dropdown List */
        <View style={[styles.dropdown, isDarkMode && styles.dropdownDark]}>
          {AI_MODELS.map((model, index) => (
            <TouchableOpacity
              key={model.id}
              style={[
                styles.dropdownItem,
                isDarkMode && styles.dropdownItemDark,
                selectedModel.id === model.id && styles.dropdownItemSelected,
                index === AI_MODELS.length - 1 && styles.dropdownItemLast,
              ]}
              onPress={() => handleSelectModel(model)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                isDarkMode && styles.textDark,
                selectedModel.id === model.id && styles.dropdownItemTextSelected,
              ]}>
                {model.name}
              </Text>
              {selectedModel.id === model.id && (
                <Check size={18} color={Colors.primary} strokeWidth={3} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1000,
  },

  // Selector Button
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectorButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectorTextContainer: {
    gap: 2,
  },
  selectorLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  selectorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },

  // Dropdown Menu (No Modal - Direct positioning)
  dropdown: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownDark: {
    backgroundColor: '#1F2937',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Dropdown Item
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  dropdownItemTextSelected: {
    color: Colors.primary,
  },

  // Common
  textDark: {
    color: Colors.white,
  },
});
