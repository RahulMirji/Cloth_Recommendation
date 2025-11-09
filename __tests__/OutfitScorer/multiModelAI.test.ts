/**
 * Tests for Multi-Model AI Routing
 * 
 * Tests the routing logic that directs AI requests to either
 * Pollinations API or Gemini Official API based on model provider.
 */

import { Platform } from 'react-native';
import { generateTextWithImageModel } from '@/OutfitScorer/utils/multiModelAI';
import { callGeminiAPI } from '@/OutfitScorer/utils/geminiAPI';
import { AIModel } from '@/OutfitScorer/utils/aiModels';

// Mock the Gemini API module
jest.mock('@/OutfitScorer/utils/geminiAPI', () => ({
  callGeminiAPI: jest.fn(),
}));

// Mock fetch for Pollinations API
global.fetch = jest.fn();

describe('Multi-Model AI Routing', () => {
  const mockImageBase64 = 'base64encodedimage';
  const mockPrompt = 'Analyze this outfit';
  const mockResponse = 'This is a great outfit!';

  const pollinationsModel: AIModel = {
    id: 'gemini-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'pollinations',
    description: 'Test model',
    quality: 5,
    speed: 'fast',
    modelName: 'gemini',
    endpoint: 'https://text.pollinations.ai/openai',
    isRecommended: true,
    tier: 1,
  };

  const geminiModel: AIModel = {
    id: 'gemini-2-flash',
    name: 'Gemini Flash Lite (Official)',
    provider: 'gemini',
    description: 'Test model',
    quality: 5,
    speed: 'very-fast',
    modelName: 'gemini-flash-lite-latest',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',
    tier: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android'; // Default to mobile for tests
  });

  describe('Gemini Official API routing', () => {
    it('should call Gemini Official API when provider is "gemini"', async () => {
      (callGeminiAPI as jest.Mock).mockResolvedValue(mockResponse);

      const result = await generateTextWithImageModel(
        geminiModel,
        mockImageBase64,
        mockPrompt
      );

      expect(callGeminiAPI).toHaveBeenCalledWith(
        'gemini-flash-lite-latest',
        mockPrompt,
        mockImageBase64
      );
      expect(result).toBe(mockResponse);
    });

    it('should pass correct model name to Gemini API', async () => {
      (callGeminiAPI as jest.Mock).mockResolvedValue(mockResponse);

      await generateTextWithImageModel(geminiModel, mockImageBase64, mockPrompt);

      expect(callGeminiAPI).toHaveBeenCalledWith(
        expect.stringContaining('gemini-flash-lite-latest'),
        expect.any(String),
        expect.any(String)
      );
    });

    it('should pass image base64 to Gemini API', async () => {
      (callGeminiAPI as jest.Mock).mockResolvedValue(mockResponse);

      await generateTextWithImageModel(geminiModel, mockImageBase64, mockPrompt);

      expect(callGeminiAPI).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        mockImageBase64
      );
    });

    it('should propagate errors from Gemini API', async () => {
      const error = new Error('Gemini API error');
      (callGeminiAPI as jest.Mock).mockRejectedValue(error);

      await expect(
        generateTextWithImageModel(geminiModel, mockImageBase64, mockPrompt)
      ).rejects.toThrow('Gemini API error');
    });
  });

  describe('Pollinations API routing', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: mockResponse,
              },
            },
          ],
        }),
      });
    });

    it('should call Pollinations API when provider is "pollinations"', async () => {
      const result = await generateTextWithImageModel(
        pollinationsModel,
        mockImageBase64,
        mockPrompt
      );

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('should NOT call Gemini Official API for Pollinations model', async () => {
      await generateTextWithImageModel(pollinationsModel, mockImageBase64, mockPrompt);

      expect(callGeminiAPI).not.toHaveBeenCalled();
    });

    it('should use correct endpoint for Pollinations', async () => {
      await generateTextWithImageModel(pollinationsModel, mockImageBase64, mockPrompt);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://text.pollinations.ai/openai',
        expect.any(Object)
      );
    });

    it('should format image as data URI for Pollinations', async () => {
      await generateTextWithImageModel(pollinationsModel, mockImageBase64, mockPrompt);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const imageUrl = requestBody.messages[0].content[1].image_url.url;

      expect(imageUrl).toMatch(/^data:image\/jpeg;base64,/);
    });
  });

  describe('Provider-based routing logic', () => {
    it('should correctly identify Gemini provider', async () => {
      (callGeminiAPI as jest.Mock).mockResolvedValue(mockResponse);

      const model: AIModel = { ...geminiModel, provider: 'gemini' };
      await generateTextWithImageModel(model, mockImageBase64, mockPrompt);

      expect(callGeminiAPI).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should correctly identify Pollinations provider', async () => {
      const model: AIModel = { ...pollinationsModel, provider: 'pollinations' };
      await generateTextWithImageModel(model, mockImageBase64, mockPrompt);

      expect(global.fetch).toHaveBeenCalled();
      expect(callGeminiAPI).not.toHaveBeenCalled();
    });

    it('should route to Pollinations for huggingface provider', async () => {
      const hfModel: AIModel = { ...pollinationsModel, provider: 'huggingface' };
      await generateTextWithImageModel(hfModel, mockImageBase64, mockPrompt);

      expect(global.fetch).toHaveBeenCalled();
      expect(callGeminiAPI).not.toHaveBeenCalled();
    });
  });

  describe('Console logging', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      (console.log as jest.Mock).mockRestore();
    });

    it('should log routing decision for Gemini', async () => {
      (callGeminiAPI as jest.Mock).mockResolvedValue(mockResponse);

      await generateTextWithImageModel(geminiModel, mockImageBase64, mockPrompt);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Official Gemini API')
      );
    });

    it('should log routing decision for Pollinations', async () => {
      await generateTextWithImageModel(pollinationsModel, mockImageBase64, mockPrompt);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Pollinations')
      );
    });
  });

  describe('Error handling', () => {
    it('should handle network errors for Pollinations', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        generateTextWithImageModel(pollinationsModel, mockImageBase64, mockPrompt)
      ).rejects.toThrow();
    });

    it('should handle API errors for Gemini', async () => {
      (callGeminiAPI as jest.Mock).mockRejectedValue(new Error('API key invalid'));

      await expect(
        generateTextWithImageModel(geminiModel, mockImageBase64, mockPrompt)
      ).rejects.toThrow('API key invalid');
    });

    it('should handle empty response from Pollinations', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [],
        }),
      });

      await expect(
        generateTextWithImageModel(pollinationsModel, mockImageBase64, mockPrompt)
      ).rejects.toThrow();
    });
  });

  describe('Model-specific behavior', () => {
    it('should use gemini-flash-lite-latest for Gemini Official', async () => {
      (callGeminiAPI as jest.Mock).mockResolvedValue(mockResponse);

      await generateTextWithImageModel(geminiModel, mockImageBase64, mockPrompt);

      expect(callGeminiAPI).toHaveBeenCalledWith(
        'gemini-flash-lite-latest',
        expect.any(String),
        expect.any(String)
      );
    });
  });
});
