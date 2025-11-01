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

// Validate environment variables
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be defined in environment variables');
}

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

console.log('✅ Razorpay instance initialized successfully');
console.log('🔑 Using Key ID:', process.env.RAZORPAY_KEY_ID);

module.exports = razorpayInstance;
