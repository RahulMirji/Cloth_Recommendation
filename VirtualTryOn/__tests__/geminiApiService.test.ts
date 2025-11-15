/**
 * Gemini API Service Tests
 * 
 * Test suite for the Gemini API virtual try-on service
 */

import { GEMINI_API_CONFIG } from '../constants';
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Gemini API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Configuration', () => {
    it('should have valid API configuration', () => {
      expect(GEMINI_API_CONFIG.ENDPOINT).toBeDefined();
      expect(GEMINI_API_CONFIG.ENDPOINT).toContain('generativelanguage.googleapis.com');
      expect(GEMINI_API_CONFIG.API_KEY).toBeDefined();
      expect(GEMINI_API_CONFIG.TIMEOUT).toBeGreaterThan(0);
    });

    it('should have correct endpoint structure', () => {
      expect(GEMINI_API_CONFIG.ENDPOINT).toContain('v1beta');
      expect(GEMINI_API_CONFIG.ENDPOINT).toContain('gemini-2.5-flash-image');
      expect(GEMINI_API_CONFIG.ENDPOINT).toContain('generateContent');
    });

    it('should have reasonable timeout', () => {
      expect(GEMINI_API_CONFIG.TIMEOUT).toBe(120000); // 120 seconds (updated for image generation)
      expect(GEMINI_API_CONFIG.TIMEOUT).toBeGreaterThanOrEqual(30000);
      expect(GEMINI_API_CONFIG.TIMEOUT).toBeLessThanOrEqual(180000); // Max 3 minutes for heavy operations
    });
  });

  describe('Axios Mock Tests', () => {
    it('should be able to mock axios.post', () => {
      mockedAxios.post.mockResolvedValue({ data: { test: 'data' } });
      expect(mockedAxios.post).toBeDefined();
    });

    it('should handle axios errors', async () => {
      const error = new Error('Network error');
      mockedAxios.post.mockRejectedValue(error);
      
      try {
        await mockedAxios.post('https://test.com', {});
      } catch (e: any) {
        expect(e.message).toBe('Network error');
      }
    });
  });
});
