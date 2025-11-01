/**
 * Razorpay Payment Routes
 * 
 * API endpoints for Razorpay payment integration:
 * - POST /api/razorpay/create-order - Create a new payment order
 * - POST /api/razorpay/verify-payment - Verify payment and add credits
 * - GET /api/razorpay/payment-status/:orderId - Check payment status
 * 
 * File: backend/Razorpay/routes/paymentRoutes.js
 * Created: November 1, 2025
 */

const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPaymentStatus,
} = require('../controllers/paymentController');

// Middleware to log requests (optional)
router.use((req, res, next) => {
  console.log(`📡 Razorpay API: ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * @route   POST /api/razorpay/create-order
 * @desc    Create a Razorpay order for credit purchase
 * @access  Private (requires userId)
 * @body    { credits: number, userId: string }
 */
router.post('/create-order', createOrder);

/**
 * @route   POST /api/razorpay/verify-payment
 * @desc    Verify Razorpay payment signature and add credits
 * @access  Private (requires userId)
 * @body    {
 *            razorpay_order_id: string,
 *            razorpay_payment_id: string,
 *            razorpay_signature: string,
 *            userId: string
 *          }
 */
router.post('/verify-payment', verifyPayment);

/**
 * @route   GET /api/razorpay/payment-status/:orderId
 * @desc    Get status of a payment by order ID
 * @access  Private
 * @params  orderId - Razorpay order ID
 */
router.get('/payment-status/:orderId', getPaymentStatus);

/**
 * @route   GET /api/razorpay/health
 * @desc    Health check endpoint for Razorpay module
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Razorpay module is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
