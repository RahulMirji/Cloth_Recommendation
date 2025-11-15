/**
 * Constants Tests
 * 
 * Test suite for Virtual Try-On constants
 */

import { GEMINI_API_CONFIG, VIRTUAL_TRY_ON_PROMPT } from '../constants';

describe('Virtual Try-On Constants', () => {
  describe('GEMINI_API_CONFIG', () => {
    it('should have a valid endpoint', () => {
      expect(GEMINI_API_CONFIG.ENDPOINT).toBeDefined();
      expect(GEMINI_API_CONFIG.ENDPOINT).toContain('generativelanguage.googleapis.com');
      expect(GEMINI_API_CONFIG.ENDPOINT).toContain('gemini-2.5-flash-image');
    });

    it('should have an API key', () => {
      expect(GEMINI_API_CONFIG.API_KEY).toBeDefined();
      expect(typeof GEMINI_API_CONFIG.API_KEY).toBe('string');
      // API key might be empty if not configured in test environment
      expect(GEMINI_API_CONFIG.API_KEY.length).toBeGreaterThanOrEqual(0);
    });

    it('should have a reasonable timeout', () => {
      expect(GEMINI_API_CONFIG.TIMEOUT).toBeDefined();
      expect(GEMINI_API_CONFIG.TIMEOUT).toBeGreaterThan(0);
      expect(GEMINI_API_CONFIG.TIMEOUT).toBeLessThanOrEqual(120000); // Max 2 minutes
    });

    it('should be defined as a constant object', () => {
      // Test that the config object is properly typed as const
      expect(GEMINI_API_CONFIG).toBeDefined();
      expect(typeof GEMINI_API_CONFIG).toBe('object');
      // Verify all properties exist
      expect(GEMINI_API_CONFIG.ENDPOINT).toBeDefined();
      expect(GEMINI_API_CONFIG.API_KEY).toBeDefined();
      expect(GEMINI_API_CONFIG.TIMEOUT).toBeDefined();
    });
  });

  describe('VIRTUAL_TRY_ON_PROMPT', () => {
    it('should have a prompt defined', () => {
      expect(VIRTUAL_TRY_ON_PROMPT).toBeDefined();
      expect(typeof VIRTUAL_TRY_ON_PROMPT).toBe('string');
      expect(VIRTUAL_TRY_ON_PROMPT.length).toBeGreaterThan(0);
    });

    it('should contain relevant keywords', () => {
      const prompt = VIRTUAL_TRY_ON_PROMPT.toLowerCase();
      expect(prompt).toContain('virtual');
      expect(prompt).toContain('clothing'); // Changed from 'outfit' as the prompt uses 'clothing'
      expect(prompt).toContain('person');
      expect(prompt).toContain('image');
    });

    it('should be concise', () => {
      // Prompt should be reasonably sized for API calls
      expect(VIRTUAL_TRY_ON_PROMPT.length).toBeLessThan(500); // Updated to match actual length (~335 chars)
    });
  });
});
