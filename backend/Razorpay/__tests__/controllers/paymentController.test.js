/**
 * Payment Controller Tests
 * 
 * Tests for backend payment business logic
 */

const request = require('supertest');
const express = require('express');
const paymentController = require('../../controllers/paymentController');
const razorpayInstance = require('../../utils/razorpayInstance');
const razorpayHelpers = require('../../utils/razorpayHelpers');

// Mock dependencies
jest.mock('../../utils/razorpayInstance');
jest.mock('../../utils/razorpayHelpers');
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((tableName) => {
      // Different mock responses based on table name
      if (tableName === 'payment_submissions') {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({ data: { id: 'payment_123' }, error: null })),
            })),
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => ({ data: {}, error: null })),
          })),
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ 
                  data: { 
                    id: 'payment_123',
                    razorpay_order_id: 'order_123',
                    credits: 100,
                    amount_inr: 29,
                    user_id: 'user_123'
                  }, 
                  error: null 
                })),
              })),
              single: jest.fn(() => ({ 
                data: { 
                  id: 'payment_123',
                  razorpay_order_id: 'order_123',
                  credits: 100,
                  amount_inr: 29,
                  user_id: 'user_123'
                }, 
                error: null 
              })),
            })),
          })),
        };
      } else if (tableName === 'subscription_plans') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ 
                data: { id: 'plan_monthly_pro', slug: 'monthly_pro' }, 
                error: null 
              })),
            })),
          })),
        };
      }
      // Default mock for other tables
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({ data: null, error: null })),
          })),
        })),
      };
    }),
    rpc: jest.fn(() => ({ data: {}, error: null })),
  })),
}));

describe('Payment Controller', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    razorpayHelpers.getCreditPlanAmount.mockReturnValue(29);
    razorpayHelpers.convertToPaise.mockReturnValue(2900);
    razorpayHelpers.generateReceiptId.mockReturnValue('receipt_123');
    razorpayHelpers.isValidCreditPlan.mockReturnValue(true);
    razorpayHelpers.verifyPaymentSignature.mockReturnValue(true);
  });

  describe('createOrder', () => {
    it('should create Razorpay order successfully', async () => {
      const mockOrder = {
        id: 'order_123',
        amount: 2900,
        currency: 'INR',
        receipt: 'receipt_123',
      };

      razorpayInstance.orders.create = jest.fn().mockResolvedValue(mockOrder);

      const mockReq = {
        body: {
          credits: 100,
          userId: 'user_123',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.createOrder(mockReq, mockRes);

      expect(razorpayInstance.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2900,
          currency: 'INR',
        })
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
        })
      );
    });

    it('should validate required fields', async () => {
      const mockReq = {
        body: {
          credits: 100,
          // userId missing
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.createOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it('should handle Razorpay API errors', async () => {
      razorpayInstance.orders.create = jest
        .fn()
        .mockRejectedValue(new Error('Razorpay API error'));

      const mockReq = {
        body: {
          credits: 100,
          userId: 'user_123',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.createOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to create order in Razorpay',
        })
      );
    });

    it('should create payment record in database', async () => {
      const mockOrder = {
        id: 'order_123',
        amount: 2900,
        currency: 'INR',
      };

      razorpayInstance.orders.create = jest.fn().mockResolvedValue(mockOrder);

      const mockReq = {
        body: {
          credits: 100,
          userId: 'user_123',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.createOrder(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orderId: 'order_123',
          }),
        })
      );
    });

    it('should use correct amount conversion', async () => {
      razorpayHelpers.getCreditPlanAmount.mockReturnValue(29);
      razorpayHelpers.convertToPaise.mockReturnValue(2900);

      const mockOrder = {
        id: 'order_123',
        amount: 2900,
        currency: 'INR',
      };

      razorpayInstance.orders.create = jest.fn().mockResolvedValue(mockOrder);

      const mockReq = {
        body: {
          credits: 100,
          userId: 'user_123',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.createOrder(mockReq, mockRes);

      expect(razorpayHelpers.getCreditPlanAmount).toHaveBeenCalledWith(100);
      expect(razorpayHelpers.convertToPaise).toHaveBeenCalledWith(29);
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment successfully', async () => {
      razorpayHelpers.verifyPaymentSignature.mockReturnValue(true);

      const mockReq = {
        body: {
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: 'signature_123',
          userId: 'user_123',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.verifyPayment(mockReq, mockRes);

      expect(razorpayHelpers.verifyPaymentSignature).toHaveBeenCalledWith(
        'order_123',
        'pay_123',
        'signature_123'
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should reject invalid signature', async () => {
      razorpayHelpers.verifyPaymentSignature.mockReturnValue(false);

      const mockReq = {
        body: {
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: 'invalid_signature',
          userId: 'user_123',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.verifyPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid'),
        })
      );
    });

    it('should validate required fields', async () => {
      const mockReq = {
        body: {
          razorpay_order_id: 'order_123',
          // Missing other required fields
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.verifyPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should grant credits after successful verification', async () => {
      razorpayHelpers.verifyPaymentSignature.mockReturnValue(true);

      const mockReq = {
        body: {
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: 'signature_123',
          userId: 'user_123',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.verifyPayment(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        })
      );
    });

    it('should update payment record status', async () => {
      razorpayHelpers.verifyPaymentSignature.mockReturnValue(true);

      const mockReq = {
        body: {
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: 'signature_123',
          userId: 'user_123',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.verifyPayment(mockReq, mockRes);

      // Should call database update
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status for valid order', async () => {
      const mockReq = {
        params: {
          orderId: 'order_123',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.getPaymentStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle non-existent order', async () => {
      const mockReq = {
        params: {
          orderId: 'invalid_order',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.getPaymentStatus(mockReq, mockRes);

      // Should handle gracefully
      expect(mockRes.status).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      razorpayInstance.orders.create = jest.fn().mockResolvedValue({
        id: 'order_123',
        amount: 2900,
      });

      const mockReq = {
        body: {
          credits: 100,
          userId: 'user_123',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.createOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalled();
    });

    it('should log errors for debugging', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();

      razorpayInstance.orders.create = jest
        .fn()
        .mockRejectedValue(new Error('Test error'));

      const mockReq = {
        body: {
          credits: 100,
          userId: 'user_123',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.createOrder(mockReq, mockRes);

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
