/**
 * Razorpay Instance Configuration
 * 
 * Initialize and export the Razorpay instance for use across the application.
 * This module handles the connection to Razorpay using credentials from environment variables.
 * 
 * File: backend/Razorpay/utils/razorpayInstance.js
 * Created: November 1, 2025
 */

const Razorpay = require('razorpay');

// Validate environment variables (skip in test environment before setup)
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  // In Jest test environment, this might run before jest.setup.js
  // Check if we're in a test environment and allow initialization to proceed
  if (process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be defined in environment variables');
  }
  // Set dummy values for test initialization if not set
  if (!process.env.RAZORPAY_KEY_ID) process.env.RAZORPAY_KEY_ID = 'test_key_id';
  if (!process.env.RAZORPAY_KEY_SECRET) process.env.RAZORPAY_KEY_SECRET = 'test_secret_key';
}

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Only log in non-test environments
if (process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined) {
  console.log('✅ Razorpay instance initialized successfully');
  console.log('🔑 Using Key ID:', process.env.RAZORPAY_KEY_ID);
}

module.exports = razorpayInstance;
