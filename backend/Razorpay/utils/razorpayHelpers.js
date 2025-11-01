/**
 * Razorpay Helper Functions
 * 
 * Utility functions for Razorpay payment processing, including:
 * - Order creation
 * - Payment signature verification
 * - Amount conversion
 * 
 * File: backend/Razorpay/utils/razorpayHelpers.js
 * Created: November 1, 2025
 */

const crypto = require('crypto');

/**
 * Convert amount to paise (Razorpay uses smallest currency unit)
 * @param {number} amountInRupees - Amount in rupees
 * @returns {number} Amount in paise
 */
const convertToPaise = (amountInRupees) => {
  return Math.round(amountInRupees * 100);
};

/**
 * Convert paise to rupees
 * @param {number} amountInPaise - Amount in paise
 * @returns {number} Amount in rupees
 */
const convertToRupees = (amountInPaise) => {
  return amountInPaise / 100;
};

/**
 * Verify Razorpay payment signature
 * This ensures the payment callback is genuine and not tampered with
 * 
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature from callback
 * @returns {boolean} True if signature is valid
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    
    // Generate expected signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');
    
    // Compare signatures
    const isValid = expectedSignature === signature;
    
    if (isValid) {
      console.log('✅ Payment signature verified successfully');
    } else {
      console.log('❌ Payment signature verification failed');
      console.log('Expected:', expectedSignature);
      console.log('Received:', signature);
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying signature:', error);
    return false;
  }
};

/**
 * Generate receipt ID for Razorpay order
 * Format: receipt_timestamp_randomstring
 * 
 * @returns {string} Unique receipt ID
 */
const generateReceiptId = () => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `receipt_${timestamp}_${randomString}`;
};

/**
 * Get credit amount based on plan
 * Maps credit packages to their prices
 * 
 * @param {number} credits - Number of credits
 * @returns {number|null} Price in rupees, or null if invalid
 */
const getCreditPlanAmount = (credits) => {
  const plans = {
    10: 99,      // 10 credits = ₹99
    25: 199,     // 25 credits = ₹199
    50: 349,     // 50 credits = ₹349
    100: 29,     // 100 credits = ₹29
  };
  
  return plans[credits] || null;
};

/**
 * Validate credit plan
 * @param {number} credits - Number of credits
 * @returns {boolean} True if valid plan
 */
const isValidCreditPlan = (credits) => {
  return [10, 25, 50, 100].includes(credits);
};

module.exports = {
  convertToPaise,
  convertToRupees,
  verifyPaymentSignature,
  generateReceiptId,
  getCreditPlanAmount,
  isValidCreditPlan,
};
