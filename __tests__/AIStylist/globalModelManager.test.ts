/**
 * Tests for Global Model Manager (AIStylist)
 * 
 * Tests AsyncStorage persistence for admin-selected AI models.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getGlobalAIStylistModel,
  setGlobalAIStylistModel,
} from '@/AIStylist/utils/globalModelManager';
import {
  AISTYLIST_AI_MODELS,
  getDefaultAIStylistModel,
} from '@/AIStylist/utils/aiModels';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('AIStylist Global Model Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGlobalAIStylistModel()', () => {
    it('should return default model when no saved model', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const model = await getGlobalAIStylistModel();
      
      expect(model).toEqual(getDefaultAIStylistModel());
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@aistylist_global_model');
    });

    it('should return saved model when available', async () => {
      const savedModelId = 'gemini-2.0-flash-official';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(savedModelId));

      const model = await getGlobalAIStylistModel();
      
      expect(model.id).toBe(savedModelId);
      expect(model.name).toBe('Gemini Flash Lite (Official)');
    });

    it('should return default model if saved ID is invalid', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify('invalid-id'));

      const model = await getGlobalAIStylistModel();
      
      expect(model).toEqual(getDefaultAIStylistModel());
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const model = await getGlobalAIStylistModel();
      
      expect(model).toEqual(getDefaultAIStylistModel());
    });

    it('should return Pollinations model by default', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const model = await getGlobalAIStylistModel();
      
      expect(model.provider).toBe('pollinations');
      expect(model.isRecommended).toBe(true);
    });
  });

  describe('setGlobalAIStylistModel()', () => {
    it('should save model ID to AsyncStorage', async () => {
      const modelId = 'gemini-2.0-flash-official';

      await setGlobalAIStylistModel(modelId);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@aistylist_global_model',
        JSON.stringify(modelId)
      );
    });

    it('should save Pollinations model ID', async () => {
      const modelId = 'gemini-1.5-flash-pollinations';

      await setGlobalAIStylistModel(modelId);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@aistylist_global_model',
        JSON.stringify(modelId)
      );
    });

    it('should throw error if AsyncStorage fails', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(setGlobalAIStylistModel('some-id')).rejects.toThrow('Storage error');
      
      // Reset mock for next tests
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    });
  });

  describe('Integration: get and set', () => {
    it('should persist and retrieve model correctly', async () => {
      const modelId = 'gemini-2.0-flash-official';
      
      // Save model
      await setGlobalAIStylistModel(modelId);
      
      // Mock retrieval
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(modelId));
      
      // Get model
      const model = await getGlobalAIStylistModel();
      
      expect(model.id).toBe(modelId);
      expect(model.provider).toBe('gemini');
    });

    it('should switch between models correctly', async () => {
      // Save Gemini Official
      await setGlobalAIStylistModel('gemini-2.0-flash-official');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify('gemini-2.0-flash-official')
      );
      
      let model = await getGlobalAIStylistModel();
      expect(model.provider).toBe('gemini');
      
      // Switch to Pollinations
      await setGlobalAIStylistModel('gemini-1.5-flash-pollinations');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify('gemini-1.5-flash-pollinations')
      );
      
      model = await getGlobalAIStylistModel();
      expect(model.provider).toBe('pollinations');
    });
  });

  describe('Storage key validation', () => {
    it('should use correct storage key', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      await getGlobalAIStylistModel();
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@aistylist_global_model');
    });

    it('should use prefixed key to avoid conflicts', async () => {
      await setGlobalAIStylistModel('test-id');
      
      const callArg = (AsyncStorage.setItem as jest.Mock).mock.calls[0][0];
      expect(callArg).toMatch(/^@aistylist_/);
    });
  });

  describe('Model validation', () => {
    it('should only return valid models from AISTYLIST_AI_MODELS', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify('gemini-2.0-flash-official')
      );

      const model = await getGlobalAIStylistModel();
      
      const isValidModel = AISTYLIST_AI_MODELS.some(m => m.id === model.id);
      expect(isValidModel).toBe(true);
    });

    it('should return model with all required properties', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const model = await getGlobalAIStylistModel();
      
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('provider');
      expect(model).toHaveProperty('modelName');
      expect(model).toHaveProperty('endpoint');
      expect(model).toHaveProperty('quality');
      expect(model).toHaveProperty('speed');
      expect(model).toHaveProperty('supportsStreaming');
      expect(model).toHaveProperty('supportsVision');
      expect(model).toHaveProperty('tier');
    });
  });
});
