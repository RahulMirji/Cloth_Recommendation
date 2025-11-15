/**
 * Virtual Try-On Router
 * 
 * Smart router that dynamically selects between Gemini and Vertex AI services
 * based on admin's model selection in the dashboard.
 * 
 * Features:
 * - Reads admin's model selection from AsyncStorage
 * - Routes to appropriate service (Gemini or Vertex AI)
 * - Falls back to default model if selection not found
 * - Transparent to UI layer (same interface)
 * 
 * Flow:
 * 1. Check AsyncStorage for '@admin_selected_tryon_model'
 * 2. Get model configuration from tryonModels.ts
 * 3. Route to correct service based on provider
 * 4. Return standardized response
 * 
 * Last updated: 2025-11-13
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GenerateTryOnResponse } from '../types';
import { 
  getDefaultVirtualTryOnModel, 
  getVirtualTryOnModelById,
  VirtualTryOnModel 
} from '../utils/tryonModels';
import * as geminiApiService from './geminiApiService';
import * as vertexAIService from './vertexAIService';

const STORAGE_KEY = '@admin_selected_tryon_model';

/**
 * Get the currently selected model from admin dashboard
 */
const getSelectedModel = async (): Promise<VirtualTryOnModel> => {
  try {
    const selectedModelIdString = await AsyncStorage.getItem(STORAGE_KEY);
    
    if (selectedModelIdString) {
      // Parse JSON string to get actual ID
      const selectedModelId = JSON.parse(selectedModelIdString);
      console.log(`🔍 Retrieved model ID from storage: ${selectedModelId}`);
      
      const model = getVirtualTryOnModelById(selectedModelId);
      if (model) {
        console.log(`📍 Using admin-selected model: ${model.name} (${model.provider})`);
        return model;
      } else {
        console.warn(`⚠️ Model ID "${selectedModelId}" not found in configuration`);
      }
    } else {
      console.log('ℹ️ No model selection found in storage, using default');
    }
    
    // Fallback to default model
    const defaultModel = getDefaultVirtualTryOnModel();
    console.log(`📍 Using default model: ${defaultModel.name} (${defaultModel.provider})`);
    return defaultModel;
  } catch (error) {
    console.error('⚠️ Error reading model selection, using default:', error);
    return getDefaultVirtualTryOnModel();
  }
};

/**
 * Generate virtual try-on image using the selected AI model
 * 
 * This function automatically routes to the correct service based on admin's selection:
 * - If Gemini selected → Direct Gemini API call
 * - If Vertex AI selected → Supabase Edge Function → Vertex AI
 */
export const generateTryOnImage = async (
  userImageUri: string,
  outfitImageUri: string
): Promise<GenerateTryOnResponse> => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 VIRTUAL TRY-ON ROUTER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Get selected model
    const selectedModel = await getSelectedModel();
    
    console.log('📊 Model Details:', {
      name: selectedModel.name,
      provider: selectedModel.provider,
      quality: `${selectedModel.quality}/5`,
      speed: selectedModel.speed,
      tier: selectedModel.tier,
    });
    
    let result: GenerateTryOnResponse;
    
    // Route to appropriate service
    if (selectedModel.provider === 'vertex') {
      console.log('🔀 Routing to: Vertex AI Service (via Edge Function)');
      console.log('✨ Using: PRESERVE_PERSON parameter for face preservation');
      result = await vertexAIService.generateTryOnImage(userImageUri, outfitImageUri);
    } else if (selectedModel.provider === 'gemini') {
      console.log('🔀 Routing to: Gemini API Service (Direct)');
      console.log('⚡ Using: Fast generation mode');
      result = await geminiApiService.generateTryOnImage(userImageUri, outfitImageUri);
    } else {
      // Fallback for any future providers
      console.warn('⚠️ Unknown provider, falling back to Gemini');
      result = await geminiApiService.generateTryOnImage(userImageUri, outfitImageUri);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Virtual Try-On completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return result;
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Virtual Try-On Router Error:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw error;
  }
};

/**
 * Get the currently active model (for display purposes)
 */
export const getActiveModel = async (): Promise<VirtualTryOnModel> => {
  return await getSelectedModel();
};
