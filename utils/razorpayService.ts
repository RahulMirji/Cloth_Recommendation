/**
 * Razorpay Payment Service
 * 
 * Utility functions for handling Razorpay payments in the frontend.
 * Communicates with backend API for order creation and payment verification.
 * 
 * File: utils/razorpayService.ts
 * Created: November 1, 2025
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface CreateOrderRequest {
  credits: number;
  userId: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    amount: number;
    amountInPaise: number;
    currency: string;
    credits: number;
    paymentRecordId: string;
  };
  error?: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  userId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    paymentId: string;
    credits: number;
    amount: number;
  };
  error?: string;
}

/**
 * Create Razorpay order
 * Step 1 of payment flow
 */
export const createRazorpayOrder = async (
  request: CreateOrderRequest
): Promise<CreateOrderResponse> => {
  try {
    console.log('📝 Creating Razorpay order:', request);

    const response = await fetch(`${API_URL}/api/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create order');
    }

    console.log('✅ Order created:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Error creating order:', error);
    return {
      success: false,
      message: error.message || 'Failed to create order',
      error: error.message,
    };
  }
};

/**
 * Verify Razorpay payment
 * Step 2 of payment flow - after user completes payment
 */
export const verifyRazorpayPayment = async (
  request: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> => {
  try {
    console.log('🔍 Verifying payment:', {
      orderId: request.razorpay_order_id,
      paymentId: request.razorpay_payment_id,
    });

    // Add timeout to fetch request (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_URL}/api/razorpay/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Payment verification failed');
    }

    console.log('✅ Payment verified:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Error verifying payment:', error);
    
    // Handle timeout error
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Payment verification timed out. Your payment may still be processing. Please check your credits or contact support.',
        error: 'Request timeout',
      };
    }
    
    return {
      success: false,
      message: error.message || 'Payment verification failed',
      error: error.message,
    };
  }
};

/**
 * Get payment status by order ID
 */
export const getPaymentStatus = async (orderId: string) => {
  try {
    const response = await fetch(
      `${API_URL}/api/razorpay/payment-status/${orderId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('❌ Error fetching payment status:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch payment status',
    };
  }
};

/**
 * Credit plan prices
 */
export const CREDIT_PLANS = {
  10: 99,
  25: 199,
  50: 349,
  100: 599,
} as const;

export type CreditPlan = keyof typeof CREDIT_PLANS;

/**
 * Get amount for credit plan
 */
export const getCreditPlanAmount = (credits: CreditPlan): number => {
  return CREDIT_PLANS[credits];
};
