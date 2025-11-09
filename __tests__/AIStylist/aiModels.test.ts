/**
 * Tests for AIStylist AI Models Configuration
 * 
 * Tests the model definitions and helper functions for the AIStylist feature.
 */

import {
  AISTYLIST_AI_MODELS,
  getDefaultAIStylistModel,
  AIStylistAIModel,
} from '@/AIStylist/utils/aiModels';

describe('AIStylist AI Models Configuration', () => {
  describe('AISTYLIST_AI_MODELS array', () => {
    it('should have exactly 2 models defined', () => {
      expect(AISTYLIST_AI_MODELS.length).toBe(2);
    });

    it('should include Gemini 1.5 Flash (Pollinations)', () => {
      const pollinationsModel = AISTYLIST_AI_MODELS.find(
        m => m.id === 'gemini-1.5-flash-pollinations'
      );
      expect(pollinationsModel).toBeDefined();
      expect(pollinationsModel?.provider).toBe('pollinations');
      expect(pollinationsModel?.isRecommended).toBe(true);
    });

    it('should include Gemini Flash Lite (Official)', () => {
      const geminiModel = AISTYLIST_AI_MODELS.find(
        m => m.id === 'gemini-2.0-flash-official'
      );
      expect(geminiModel).toBeDefined();
      expect(geminiModel?.provider).toBe('gemini');
      expect(geminiModel?.modelName).toBe('gemini-flash-lite-latest');
    });

    it('should have valid quality ratings (1-5)', () => {
      AISTYLIST_AI_MODELS.forEach(model => {
        expect(model.quality).toBeGreaterThanOrEqual(1);
        expect(model.quality).toBeLessThanOrEqual(5);
      });
    });

    it('should all support streaming', () => {
      AISTYLIST_AI_MODELS.forEach(model => {
        expect(model.supportsStreaming).toBe(true);
      });
    });

    it('should all support vision', () => {
      AISTYLIST_AI_MODELS.forEach(model => {
        expect(model.supportsVision).toBe(true);
      });
    });

    it('should all be tier 1', () => {
      AISTYLIST_AI_MODELS.forEach(model => {
        expect(model.tier).toBe(1);
      });
    });

    it('should have valid endpoint URLs', () => {
      AISTYLIST_AI_MODELS.forEach(model => {
        expect(model.endpoint).toMatch(/^https?:\/\/.+/);
      });
    });
  });

  describe('getDefaultAIStylistModel()', () => {
    it('should return a model', () => {
      const defaultModel = getDefaultAIStylistModel();
      expect(defaultModel).toBeDefined();
      expect(defaultModel).toHaveProperty('id');
      expect(defaultModel).toHaveProperty('name');
    });

    it('should return the recommended model', () => {
      const defaultModel = getDefaultAIStylistModel();
      expect(defaultModel.isRecommended).toBe(true);
    });

    it('should return Pollinations as default', () => {
      const defaultModel = getDefaultAIStylistModel();
      expect(defaultModel.provider).toBe('pollinations');
      expect(defaultModel.id).toBe('gemini-1.5-flash-pollinations');
    });

    it('should return a model with streaming support', () => {
      const defaultModel = getDefaultAIStylistModel();
      expect(defaultModel.supportsStreaming).toBe(true);
    });

    it('should return a model with vision support', () => {
      const defaultModel = getDefaultAIStylistModel();
      expect(defaultModel.supportsVision).toBe(true);
    });
  });

  describe('Model properties validation', () => {
    it('should have unique IDs', () => {
      const ids = AISTYLIST_AI_MODELS.map(m => m.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have non-empty names', () => {
      AISTYLIST_AI_MODELS.forEach(model => {
        expect(model.name.length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty descriptions', () => {
      AISTYLIST_AI_MODELS.forEach(model => {
        expect(model.description.length).toBeGreaterThan(0);
      });
    });

    it('should have valid provider types', () => {
      const validProviders = ['pollinations', 'gemini'];
      AISTYLIST_AI_MODELS.forEach(model => {
        expect(validProviders).toContain(model.provider);
      });
    });

    it('should have valid speed values', () => {
      const validSpeeds = ['slow', 'medium', 'fast', 'very-fast'];
      AISTYLIST_AI_MODELS.forEach(model => {
        expect(validSpeeds).toContain(model.speed);
      });
    });
  });

  describe('Gemini Flash Lite model', () => {
    let geminiModel: AIStylistAIModel | undefined;

    beforeEach(() => {
      geminiModel = AISTYLIST_AI_MODELS.find(
        m => m.modelName === 'gemini-flash-lite-latest'
      );
    });

    it('should exist', () => {
      expect(geminiModel).toBeDefined();
    });

    it('should have correct provider', () => {
      expect(geminiModel?.provider).toBe('gemini');
    });

    it('should have correct model name', () => {
      expect(geminiModel?.modelName).toBe('gemini-flash-lite-latest');
    });

    it('should have correct endpoint', () => {
      expect(geminiModel?.endpoint).toContain('generativelanguage.googleapis.com');
      expect(geminiModel?.endpoint).toContain('gemini-flash-lite-latest:generateContent');
    });

    it('should have high quality rating', () => {
      expect(geminiModel?.quality).toBe(5);
    });

    it('should have fast speed', () => {
      expect(geminiModel?.speed).toBe('fast');
    });

    it('should support streaming', () => {
      expect(geminiModel?.supportsStreaming).toBe(true);
    });

    it('should support vision', () => {
      expect(geminiModel?.supportsVision).toBe(true);
    });

    it('should be tier 1', () => {
      expect(geminiModel?.tier).toBe(1);
    });
  });

  describe('Pollinations model', () => {
    let pollinationsModel: AIStylistAIModel | undefined;

    beforeEach(() => {
      pollinationsModel = AISTYLIST_AI_MODELS.find(
        m => m.provider === 'pollinations'
      );
    });

    it('should have quality rating of 4', () => {
      expect(pollinationsModel?.quality).toBe(4);
    });

    it('should have very-fast speed', () => {
      expect(pollinationsModel?.speed).toBe('very-fast');
    });

    it('should be recommended', () => {
      expect(pollinationsModel?.isRecommended).toBe(true);
    });

    it('should have correct endpoint', () => {
      expect(pollinationsModel?.endpoint).toBe('https://text.pollinations.ai/openai');
    });
  });

  describe('Interface compatibility with OutfitScorer', () => {
    it('should have endpoint property', () => {
      AISTYLIST_AI_MODELS.forEach(model => {
        expect(model).toHaveProperty('endpoint');
        expect(typeof model.endpoint).toBe('string');
      });
    });

    it('should have tier property', () => {
      AISTYLIST_AI_MODELS.forEach(model => {
        expect(model).toHaveProperty('tier');
        expect([1, 2]).toContain(model.tier);
      });
    });

    it('should have quality property with correct type', () => {
      AISTYLIST_AI_MODELS.forEach(model => {
        expect(model).toHaveProperty('quality');
        expect(typeof model.quality).toBe('number');
        expect(model.quality).toBeGreaterThanOrEqual(1);
        expect(model.quality).toBeLessThanOrEqual(5);
      });
    });
  });
});
