/**
 * Razorpay Module - Main Entry Point
 * 
 * This file exports all Razorpay-related functionality:
 * - Payment routes
 * - Utility functions
 * - Razorpay instance
 * 
 * Usage in main server:
 * const razorpayRoutes = require('./Razorpay');
 * app.use('/api/razorpay', razorpayRoutes);
 * 
 * File: backend/Razorpay/index.js
 * Created: November 1, 2025
 */

const paymentRoutes = require('./routes/paymentRoutes');
const razorpayInstance = require('./utils/razorpayInstance');
const razorpayHelpers = require('./utils/razorpayHelpers');

module.exports = {
  // Export routes for use in main server
  routes: paymentRoutes,
  
  // Export Razorpay instance for direct access if needed
  instance: razorpayInstance,
  
  // Export helper functions
  helpers: razorpayHelpers,
};
