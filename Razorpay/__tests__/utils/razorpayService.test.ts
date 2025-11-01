/**
 * Razorpay Service Tests
 * 
 * Tests for frontend Razorpay API service functions
 */

import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentStatus,
  getCreditPlanAmount,
} from '@/utils/razorpayService';

// Mock fetch
global.fetch = jest.fn();

describe('Razorpay Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRazorpayOrder', () => {
    it('should create order successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Order created successfully',
        data: {
          orderId: 'order_123',
          amount: 29,
          amountInPaise: 2900,
          currency: 'INR',
          credits: 100,
          paymentRecordId: 'payment_123',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createRazorpayOrder({
        credits: 100,
        userId: 'user_123',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/razorpay/create-order'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            credits: 100,
            userId: 'user_123',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.data?.orderId).toBe('order_123');
    });

    it('should handle order creation failure', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Failed to create order',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      const result = await createRazorpayOrder({
        credits: 100,
        userId: 'user_123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to create order');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await createRazorpayOrder({
        credits: 100,
        userId: 'user_123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });

    it('should send correct request payload', async () => {
      const mockResponse = {
        success: true,
        data: {},
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await createRazorpayOrder({
        credits: 50,
        userId: 'test-user',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            credits: 50,
            userId: 'test-user',
          }),
        })
      );
    });
  });

  describe('verifyRazorpayPayment', () => {
    it('should verify payment successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Payment verified successfully',
        data: {
          orderId: 'order_123',
          paymentId: 'pay_123',
          credits: 100,
          amount: 29,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await verifyRazorpayPayment({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'signature_123',
        userId: 'user_123',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/razorpay/verify-payment'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.data?.paymentId).toBe('pay_123');
    });

    it('should handle verification failure', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Invalid signature',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      const result = await verifyRazorpayPayment({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'invalid_signature',
        userId: 'user_123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid signature');
    });

    it('should handle network errors during verification', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Connection timeout')
      );

      const result = await verifyRazorpayPayment({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'signature_123',
        userId: 'user_123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Connection timeout');
    });

    it('should include all required fields in request', async () => {
      const mockResponse = { success: true, data: {} };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const paymentData = {
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'signature_123',
        userId: 'user_123',
      };

      await verifyRazorpayPayment(paymentData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(paymentData),
        })
      );
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          orderId: 'order_123',
          status: 'completed',
          amount: 29,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getPaymentStatus('order_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/razorpay/payment-status/order_123'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
    });

    it('should handle payment status fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Not found')
      );

      const result = await getPaymentStatus('invalid_order');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Not found');
    });
  });

  describe('getCreditPlanAmount', () => {
    it('should return correct amount for 10 credits', () => {
      const amount = getCreditPlanAmount(10);
      expect(amount).toBe(99);
    });

    it('should return correct amount for 25 credits', () => {
      const amount = getCreditPlanAmount(25);
      expect(amount).toBe(199);
    });

    it('should return correct amount for 50 credits', () => {
      const amount = getCreditPlanAmount(50);
      expect(amount).toBe(349);
    });

    it('should return correct amount for 100 credits', () => {
      const amount = getCreditPlanAmount(100);
      expect(amount).toBe(599);
    });
  });
});
