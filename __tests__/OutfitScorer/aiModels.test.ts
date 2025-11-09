/**
 * Tests for AI Models Configuration (OutfitScorer)
 * 
 * Tests the model definitions, helper functions, and model selection logic
 * for the OutfitScorer feature.
 */

import {
  AI_MODELS,
  getDefaultModel,
  getModelById,
  getModelsByTier,
  formatSpeed,
  formatQuality,
  AIModel,
} from '@/OutfitScorer/utils/aiModels';

describe('OutfitScorer AI Models Configuration', () => {
  describe('AI_MODELS array', () => {
    it('should have at least 2 models defined', () => {
      expect(AI_MODELS.length).toBeGreaterThanOrEqual(2);
    });

    it('should include Gemini 1.5 Flash (Pollinations)', () => {
      const pollinationsModel = AI_MODELS.find(m => m.id === 'gemini-flash');
      expect(pollinationsModel).toBeDefined();
      expect(pollinationsModel?.provider).toBe('pollinations');
      expect(pollinationsModel?.isRecommended).toBe(true);
    });

    it('should include Gemini Flash Lite (Official)', () => {
      const geminiModel = AI_MODELS.find(m => m.id === 'gemini-2-flash');
      expect(geminiModel).toBeDefined();
      expect(geminiModel?.provider).toBe('gemini');
      expect(geminiModel?.modelName).toBe('gemini-flash-lite-latest');
    });

    it('should have valid quality ratings (1-5)', () => {
      AI_MODELS.forEach(model => {
        expect(model.quality).toBeGreaterThanOrEqual(1);
        expect(model.quality).toBeLessThanOrEqual(5);
      });
    });

    it('should have valid speed values', () => {
      const validSpeeds = ['slow', 'medium', 'fast', 'very-fast'];
      AI_MODELS.forEach(model => {
        expect(validSpeeds).toContain(model.speed);
      });
    });

    it('should have valid tier values (1 or 2)', () => {
      AI_MODELS.forEach(model => {
        expect([1, 2]).toContain(model.tier);
      });
    });

    it('should have valid endpoint URLs', () => {
      AI_MODELS.forEach(model => {
        expect(model.endpoint).toMatch(/^https?:\/\/.+/);
      });
    });

    it('should have Gemini Official with correct endpoint', () => {
      const geminiModel = AI_MODELS.find(m => m.provider === 'gemini');
      expect(geminiModel?.endpoint).toContain('generativelanguage.googleapis.com');
      expect(geminiModel?.endpoint).toContain('gemini-flash-lite-latest');
    });
  });

  describe('getDefaultModel()', () => {
    it('should return a model', () => {
      const defaultModel = getDefaultModel();
      expect(defaultModel).toBeDefined();
      expect(defaultModel).toHaveProperty('id');
      expect(defaultModel).toHaveProperty('name');
    });

    it('should return the recommended model', () => {
      const defaultModel = getDefaultModel();
      expect(defaultModel.isRecommended).toBe(true);
    });

    it('should return Pollinations as default', () => {
      const defaultModel = getDefaultModel();
      expect(defaultModel.provider).toBe('pollinations');
      expect(defaultModel.id).toBe('gemini-flash');
    });
  });

  describe('getModelById()', () => {
    it('should return correct model for valid ID', () => {
      const model = getModelById('gemini-flash');
      expect(model).toBeDefined();
      expect(model?.name).toBe('Gemini 1.5 Flash');
    });

    it('should return undefined for invalid ID', () => {
      const model = getModelById('non-existent-model');
      expect(model).toBeUndefined();
    });

    it('should return Gemini Official model', () => {
      const model = getModelById('gemini-2-flash');
      expect(model).toBeDefined();
      expect(model?.name).toBe('Gemini Flash Lite (Official)');
      expect(model?.provider).toBe('gemini');
    });
  });

  describe('getModelsByTier()', () => {
    it('should return tier 1 models', () => {
      const tier1Models = getModelsByTier(1);
      expect(tier1Models.length).toBeGreaterThan(0);
      tier1Models.forEach(model => {
        expect(model.tier).toBe(1);
      });
    });

    it('should return tier 2 models', () => {
      const tier2Models = getModelsByTier(2);
      tier2Models.forEach(model => {
        expect(model.tier).toBe(2);
      });
    });

    it('should separate tiers correctly', () => {
      const tier1 = getModelsByTier(1);
      const tier2 = getModelsByTier(2);
      
      // No overlap
      tier1.forEach(t1Model => {
        expect(tier2.find(t2Model => t2Model.id === t1Model.id)).toBeUndefined();
      });
    });
  });

  describe('formatSpeed()', () => {
    it('should format slow speed', () => {
      expect(formatSpeed('slow')).toBe('🐢 Slow');
    });

    it('should format medium speed', () => {
      expect(formatSpeed('medium')).toBe('🚶 Medium');
    });

    it('should format fast speed', () => {
      expect(formatSpeed('fast')).toBe('🏃 Fast');
    });

    it('should format very-fast speed', () => {
      expect(formatSpeed('very-fast')).toBe('⚡ Very Fast');
    });
  });

  describe('formatQuality()', () => {
    it('should return correct number of stars for quality 1', () => {
      expect(formatQuality(1)).toBe('⭐');
    });

    it('should return correct number of stars for quality 3', () => {
      expect(formatQuality(3)).toBe('⭐⭐⭐');
    });

    it('should return correct number of stars for quality 5', () => {
      expect(formatQuality(5)).toBe('⭐⭐⭐⭐⭐');
    });
  });

  describe('Model properties validation', () => {
    it('should have unique IDs', () => {
      const ids = AI_MODELS.map(m => m.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have non-empty names', () => {
      AI_MODELS.forEach(model => {
        expect(model.name.length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty descriptions', () => {
      AI_MODELS.forEach(model => {
        expect(model.description.length).toBeGreaterThan(0);
      });
    });

    it('should have valid provider types', () => {
      const validProviders = ['pollinations', 'huggingface', 'gemini'];
      AI_MODELS.forEach(model => {
        expect(validProviders).toContain(model.provider);
      });
    });
  });

  describe('Gemini Flash Lite model', () => {
    let geminiModel: AIModel | undefined;

    beforeEach(() => {
      geminiModel = AI_MODELS.find(m => m.modelName === 'gemini-flash-lite-latest');
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

    it('should have very-fast speed', () => {
      expect(geminiModel?.speed).toBe('very-fast');
    });

    it('should be tier 1', () => {
      expect(geminiModel?.tier).toBe(1);
    });
  });
});
