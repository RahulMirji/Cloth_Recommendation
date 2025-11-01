/**
 * Razorpay Helpers Tests
 * 
 * Tests for utility functions used in Razorpay integration
 */

const {
  convertToPaise,
  convertToRupees,
  verifyPaymentSignature,
  getCreditPlanAmount,
  generateReceiptId,
  isValidCreditPlan,
} = require('../../utils/razorpayHelpers');
const crypto = require('crypto');

// Mock crypto for signature verification
jest.mock('crypto');

describe('Razorpay Helpers', () => {
  describe('getCreditPlanAmount', () => {
    it('should return ₹99 for 10 credits', () => {
      const amount = getCreditPlanAmount(10);
      expect(amount).toBe(99);
    });

    it('should return ₹199 for 25 credits', () => {
      const amount = getCreditPlanAmount(25);
      expect(amount).toBe(199);
    });

    it('should return ₹349 for 50 credits', () => {
      const amount = getCreditPlanAmount(50);
      expect(amount).toBe(349);
    });

    it('should return ₹29 for 100 credits (test pricing)', () => {
      const amount = getCreditPlanAmount(100);
      expect(amount).toBe(29);
    });

    it('should return null for invalid credits', () => {
      const amount = getCreditPlanAmount(999);
      expect(amount).toBeNull();
    });

    it('should return null for null input', () => {
      const amount = getCreditPlanAmount(null);
      expect(amount).toBeNull();
    });

    it('should return null for undefined input', () => {
      const amount = getCreditPlanAmount(undefined);
      expect(amount).toBeNull();
    });
  });

  describe('convertToPaise', () => {
    it('should convert ₹99 to 9900 paise', () => {
      const paise = convertToPaise(99);
      expect(paise).toBe(9900);
    });

    it('should convert ₹29 to 2900 paise', () => {
      const paise = convertToPaise(29);
      expect(paise).toBe(2900);
    });

    it('should handle decimal amounts', () => {
      const paise = convertToPaise(99.50);
      expect(paise).toBe(9950);
    });

    it('should handle zero amount', () => {
      const paise = convertToPaise(0);
      expect(paise).toBe(0);
    });

    it('should handle large amounts', () => {
      const paise = convertToPaise(10000);
      expect(paise).toBe(1000000);
    });

    it('should handle negative INR amounts', () => {
      const paise = convertToPaise(-100);
      expect(paise).toBe(-10000);
    });
  });

  describe('convertToRupees', () => {
    it('should convert 9900 paise to ₹99', () => {
      const rupees = convertToRupees(9900);
      expect(rupees).toBe(99);
    });

    it('should convert 2900 paise to ₹29', () => {
      const rupees = convertToRupees(2900);
      expect(rupees).toBe(29);
    });

    it('should handle zero paise', () => {
      const rupees = convertToRupees(0);
      expect(rupees).toBe(0);
    });
  });

  describe('verifyPaymentSignature', () => {
    beforeEach(() => {
      process.env.RAZORPAY_KEY_SECRET = 'test_secret_key';
    });

    it('should verify valid signature', () => {
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid_signature'),
      };
      crypto.createHmac = jest.fn().mockReturnValue(mockHmac);

      const result = verifyPaymentSignature(
        'order_123',
        'pay_123',
        'valid_signature'
      );

      expect(result).toBe(true);
      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', 'test_secret_key');
      expect(mockHmac.update).toHaveBeenCalledWith('order_123|pay_123');
      expect(mockHmac.digest).toHaveBeenCalledWith('hex');
    });

    it('should reject invalid signature', () => {
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('expected_signature'),
      };
      crypto.createHmac = jest.fn().mockReturnValue(mockHmac);

      const result = verifyPaymentSignature(
        'order_123',
        'pay_123',
        'invalid_signature'
      );

      expect(result).toBe(false);
    });

    it('should handle empty signature', () => {
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('expected_signature'),
      };
      crypto.createHmac = jest.fn().mockReturnValue(mockHmac);

      const result = verifyPaymentSignature('order_123', 'pay_123', '');

      expect(result).toBe(false);
    });

    it('should use correct HMAC algorithm', () => {
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('signature'),
      };
      crypto.createHmac = jest.fn().mockReturnValue(mockHmac);

      verifyPaymentSignature('order_123', 'pay_123', 'signature');

      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', expect.any(String));
    });

    it('should format order and payment ID correctly', () => {
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('signature'),
      };
      crypto.createHmac = jest.fn().mockReturnValue(mockHmac);

      verifyPaymentSignature('order_ABC', 'pay_XYZ', 'signature');

      expect(mockHmac.update).toHaveBeenCalledWith('order_ABC|pay_XYZ');
    });
  });

  describe('isValidCreditPlan', () => {
    it('should return true for valid plans', () => {
      expect(isValidCreditPlan(10)).toBe(true);
      expect(isValidCreditPlan(25)).toBe(true);
      expect(isValidCreditPlan(50)).toBe(true);
      expect(isValidCreditPlan(100)).toBe(true);
    });

    it('should return false for invalid plan', () => {
      expect(isValidCreditPlan(75)).toBe(false);
      expect(isValidCreditPlan(999)).toBe(false);
    });

    it('should handle string input', () => {
      expect(isValidCreditPlan('10')).toBe(false);
      expect(isValidCreditPlan('invalid')).toBe(false);
    });
  });

  describe('generateReceiptId', () => {
    it('should generate unique receipts', () => {
      const receipt1 = generateReceiptId();
      const receipt2 = generateReceiptId();

      expect(receipt1).not.toBe(receipt2);
    });

    it('should include receipt prefix', () => {
      const receipt = generateReceiptId();
      expect(receipt).toMatch(/^receipt_/);
    });

    it('should include timestamp', () => {
      const receipt = generateReceiptId();
      expect(receipt).toMatch(/receipt_\d+_/);
    });

    it('should include random string', () => {
      const receipt = generateReceiptId();
      const parts = receipt.split('_');
      expect(parts).toHaveLength(3);
      expect(parts[2]).toHaveLength(6);
    });

    it('should generate valid receipt format', () => {
      const receipt = generateReceiptId();
      expect(receipt).toMatch(/^receipt_\d+_[a-z0-9]{6}$/);
    });
  });

  describe('Integration Tests', () => {
    it('should convert credits to paise correctly', () => {
      const credits = 100;
      const inr = getCreditPlanAmount(credits);
      const paise = convertToPaise(inr);

      expect(paise).toBe(2900);
    });

    it('should handle full payment flow', () => {
      const credits = 100;
      const price = getCreditPlanAmount(credits);
      const paise = convertToPaise(price);
      const receipt = generateReceiptId();

      expect(price).toBe(29);
      expect(paise).toBe(2900);
      expect(receipt).toMatch(/^receipt_/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative credit values', () => {
      const amount = getCreditPlanAmount(-10);
      expect(amount).toBeNull();
    });

    it('should handle very large credit values', () => {
      const amount = getCreditPlanAmount(999999);
      expect(amount).toBeNull();
    });

    it('should handle float credit values', () => {
      const amount = getCreditPlanAmount(10.5);
      expect(amount).toBeNull();
    });

    it('should handle negative INR amounts', () => {
      const paise = convertToPaise(-100);
      expect(paise).toBe(-10000);
    });
  });
});
