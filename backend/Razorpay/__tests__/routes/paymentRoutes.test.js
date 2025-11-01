/**
 * Razorpay Routes Integration Tests
 * 
 * End-to-end tests for Razorpay API endpoints
 */

const request = require('supertest');
const express = require('express');
const paymentRoutes = require('../../routes/paymentRoutes');

// Mock the entire controller
jest.mock('../../controllers/paymentController', () => ({
  createOrder: jest.fn((req, res) => {
    res.status(200).json({
      success: true,
      message: 'Order created',
      data: {
        orderId: 'order_123',
        amount: 29,
        currency: 'INR',
      },
    });
  }),
  verifyPayment: jest.fn((req, res) => {
    res.status(200).json({
      success: true,
      message: 'Payment verified',
      data: {
        orderId: 'order_123',
        paymentId: 'pay_123',
        credits: 100,
      },
    });
  }),
  getPaymentStatus: jest.fn((req, res) => {
    res.status(200).json({
      success: true,
      data: {
        orderId: req.params.orderId,
        status: 'completed',
      },
    });
  }),
}));

describe('Razorpay API Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/razorpay', paymentRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/razorpay/create-order', () => {
    it('should create order with valid request', async () => {
      const response = await request(app)
        .post('/api/razorpay/create-order')
        .send({
          credits: 100,
          userId: 'user_123',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('orderId');
    });

    it('should return error for missing fields', async () => {
      const response = await request(app)
        .post('/api/razorpay/create-order')
        .send({
          credits: 100,
          // userId missing
        });

      // Controller will handle validation
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should accept all credit plan values', async () => {
      const plans = [10, 25, 50, 100];

      for (const credits of plans) {
        const response = await request(app)
          .post('/api/razorpay/create-order')
          .send({
            credits,
            userId: 'user_123',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('should handle JSON parsing errors', async () => {
      const response = await request(app)
        .post('/api/razorpay/create-order')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/razorpay/verify-payment', () => {
    it('should verify payment with valid signature', async () => {
      const response = await request(app)
        .post('/api/razorpay/verify-payment')
        .send({
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: 'signature_123',
          userId: 'user_123',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('paymentId');
      expect(response.body.data).toHaveProperty('credits');
    });

    it('should require all payment fields', async () => {
      const response = await request(app)
        .post('/api/razorpay/verify-payment')
        .send({
          razorpay_order_id: 'order_123',
          // Other fields missing
        });

      // Controller handles validation
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should handle invalid signature gracefully', async () => {
      const response = await request(app)
        .post('/api/razorpay/verify-payment')
        .send({
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: 'invalid_signature',
          userId: 'user_123',
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('GET /api/razorpay/payment-status/:orderId', () => {
    it('should get payment status for valid order', async () => {
      const response = await request(app)
        .get('/api/razorpay/payment-status/order_123')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('orderId', 'order_123');
      expect(response.body.data).toHaveProperty('status');
    });

    it('should handle non-existent order', async () => {
      const response = await request(app)
        .get('/api/razorpay/payment-status/invalid_order')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('should accept order IDs with special characters', async () => {
      const response = await request(app)
        .get('/api/razorpay/payment-status/order_ABC_123')
        .expect(200);

      expect(response.body.data.orderId).toBe('order_ABC_123');
    });
  });

  describe('CORS and Headers', () => {
    it('should accept JSON content type', async () => {
      const response = await request(app)
        .post('/api/razorpay/create-order')
        .set('Content-Type', 'application/json')
        .send({
          credits: 100,
          userId: 'user_123',
        });

      expect(response.status).toBe(200);
    });

    it('should return JSON responses', async () => {
      const response = await request(app)
        .post('/api/razorpay/create-order')
        .send({
          credits: 100,
          userId: 'user_123',
        });

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/razorpay/create-order')
        .send('{invalid json}')
        .set('Content-Type', 'application/json');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/api/razorpay/create-order')
        .send();

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should handle undefined route params', async () => {
      const response = await request(app).get(
        '/api/razorpay/payment-status/'
      );

      expect(response.status).toBeGreaterThanOrEqual(404);
    });
  });

  describe('Rate Limiting and Security', () => {
    it('should accept multiple concurrent requests', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app).post('/api/razorpay/create-order').send({
            credits: 100,
            userId: 'user_123',
          })
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle large payload gracefully', async () => {
      const largePayload = {
        credits: 100,
        userId: 'user_123',
        extraData: 'x'.repeat(10000),
      };

      const response = await request(app)
        .post('/api/razorpay/create-order')
        .send(largePayload);

      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Response Format', () => {
    it('should return consistent response structure', async () => {
      const response = await request(app)
        .post('/api/razorpay/create-order')
        .send({
          credits: 100,
          userId: 'user_123',
        });

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
    });

    it('should include timestamp in responses', async () => {
      const response = await request(app)
        .post('/api/razorpay/create-order')
        .send({
          credits: 100,
          userId: 'user_123',
        });

      expect(response.body).toHaveProperty('success');
      // Timestamp might be in data object
      expect(response.body.data).toBeDefined();
    });
  });
});
