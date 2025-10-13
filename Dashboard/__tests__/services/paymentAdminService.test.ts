// @ts-nocheck - Mocking Supabase functions
import { formatCurrency, formatDate } from '../../services/paymentAdminService';

describe('Payment Admin Service - Utility Functions', () => {
  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(29)).toBe('₹29.00');
      expect(formatCurrency(100)).toBe('₹100.00');
      expect(formatCurrency(0)).toBe('₹0.00');
    });

    it('handles decimal values', () => {
      expect(formatCurrency(29.99)).toBe('₹29.99');
      expect(formatCurrency(100.5)).toBe('₹100.50');
      expect(formatCurrency(0.01)).toBe('₹0.01');
    });

    it('handles large numbers', () => {
      expect(formatCurrency(10000)).toBe('₹10000.00');
      expect(formatCurrency(999999.99)).toBe('₹999999.99');
    });

    it('handles negative numbers', () => {
      expect(formatCurrency(-29)).toBe('₹-29.00');
    });
  });

  describe('formatDate', () => {
    it('formats valid date string correctly', () => {
      const result = formatDate('2025-10-13T10:00:00Z');
      expect(result).toMatch(/Oct/i);
      expect(result).toMatch(/13/);
      expect(result).toMatch(/2025/);
    });

    it('formats Date object correctly', () => {
      const date = new Date('2025-10-13T10:00:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/Oct/i);
      expect(result).toMatch(/13/);
    });

    it('handles null value', () => {
      expect(formatDate(null)).toBe('N/A');
    });

    it('handles undefined value', () => {
      expect(formatDate(undefined)).toBe('N/A');
    });

    it('handles empty string', () => {
      expect(formatDate('')).toBe('N/A');
    });

    it('handles invalid date string', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('Invalid Date');
    });

    it('returns N/A for falsy values', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate(undefined)).toBe('N/A');
      expect(formatDate('')).toBe('N/A');
    });
  });
});
