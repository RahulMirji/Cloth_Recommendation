/**
 * Global Model Manager
 * 
 * Manages the globally selected AI model (admin-controlled).
 * All outfit analysis requests use this model.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIModel, AI_MODELS, getDefaultModel } from './aiModels';

const STORAGE_KEY = '@admin_selected_model';

/**
 * Get the globally selected model
 * Used by OutfitScorerScreen to determine which model to use
 */
export async function getGlobalModel(): Promise<AIModel> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      const modelId = JSON.parse(saved);
      const model = AI_MODELS.find(m => m.id === modelId);
      if (model) {
        return model;
      }
    }
  } catch (error) {
    console.error('Error loading global model:', error);
  }
  
  // Fallback to default
  return getDefaultModel();
}

/**
 * Set the global model (admin only)
 */
export async function setGlobalModel(modelId: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(modelId));
    return true;
  } catch (error) {
    console.error('Error saving global model:', error);
    return false;
  }
}

/**
 * Check if a custom model is configured
 */
export async function hasCustomModel(): Promise<boolean> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  return saved !== null;
}
