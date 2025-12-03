/**
 * Razorpay Payment Service
 * 
 * Utility functions for handling Razorpay payments in the frontend.
 * Communicates with Supabase Edge Functions for order creation and payment verification.
 * 
 * File: utils/razorpayService.ts
 * Created: November 1, 2025
 * Updated: December 3, 2025 - Migrated to Supabase Edge Functions
 */

// Supabase Edge Functions URL - no ngrok needed!
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wmhiwieooqfwkrdcvqvb.supabase.co';
const EDGE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

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

    const response = await fetch(`${EDGE_FUNCTIONS_URL}/razorpay-create-order`, {
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

    const response = await fetch(`${EDGE_FUNCTIONS_URL}/razorpay-verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Payment verification failed');
    }

    console.log('✅ Payment verified:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Error verifying payment:', error);
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
    // For now, we'll check directly from the database via Supabase
    // The webhook handles status updates, so we can query the payment_submissions table
    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/razorpay-payment-status?orderId=${orderId}`,
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
