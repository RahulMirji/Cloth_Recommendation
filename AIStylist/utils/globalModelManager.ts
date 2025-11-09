/**
 * Global Model Manager for AIStylist
 * 
 * Manages persistent storage and retrieval of the admin-selected AI model.
 * All AIStylist users will use the model selected by the admin.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIStylistAIModel, AISTYLIST_AI_MODELS, getDefaultAIStylistModel } from './aiModels';

const STORAGE_KEY = '@aistylist_global_model';

/**
 * Get the currently selected global AI model for AIStylist
 * Falls back to default if no selection is saved
 */
export async function getGlobalAIStylistModel(): Promise<AIStylistAIModel> {
  try {
    const savedModelId = await AsyncStorage.getItem(STORAGE_KEY);
    
    if (savedModelId) {
      const modelId = JSON.parse(savedModelId);
      const model = AISTYLIST_AI_MODELS.find(m => m.id === modelId);
      
      if (model) {
        console.log('📱 AIStylist using saved model:', model.name);
        return model;
      }
    }
    
    // No saved model or model not found - use default
    const defaultModel = getDefaultAIStylistModel();
    console.log('📱 AIStylist using default model:', defaultModel.name);
    return defaultModel;
  } catch (error) {
    console.error('❌ Error loading AIStylist model:', error);
    return getDefaultAIStylistModel();
  }
}

/**
 * Set the global AI model for all AIStylist users
 * Only callable by admin
 */
export async function setGlobalAIStylistModel(modelId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(modelId));
    console.log('✅ AIStylist global model updated to:', modelId);
  } catch (error) {
    console.error('❌ Error saving AIStylist model:', error);
    throw error;
  }
}
