/**
 * Razorpay Create Order Edge Function
 * 
 * Creates a Razorpay order for credit purchase.
 * Replaces the Express.js backend endpoint.
 * 
 * Endpoint: POST /functions/v1/razorpay-create-order
 * 
 * Environment Variables Required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - RAZORPAY_KEY_ID
 * - RAZORPAY_KEY_SECRET
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Credit plan prices (in rupees)
const CREDIT_PLANS: Record<number, number> = {
  10: 99,    // 10 credits = ₹99
  25: 199,   // 25 credits = ₹199
  50: 349,   // 50 credits = ₹349
  100: 29,   // 100 credits = ₹29 (promotional)
};

const VALID_CREDIT_PLANS = [10, 25, 50, 100];

/**
 * Convert rupees to paise (Razorpay uses smallest currency unit)
 */
function convertToPaise(amountInRupees: number): number {
  return Math.round(amountInRupees * 100);
}

/**
 * Generate unique receipt ID
 */
function generateReceiptId(): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `receipt_${timestamp}_${randomString}`;
}

/**
 * Create Razorpay order via REST API
 * Replaces the Node.js SDK razorpayInstance.orders.create()
 */
async function createRazorpayOrder(
  keyId: string,
  keySecret: string,
  amount: number,
  currency: string,
  receipt: string,
  notes: Record<string, string | number>
): Promise<{ success: boolean; order?: any; error?: string }> {
  try {
    const credentials = btoa(`${keyId}:${keySecret}`);
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        notes,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Razorpay API error:', data);
      return {
        success: false,
        error: data.error?.description || 'Failed to create order in Razorpay',
      };
    }

    return { success: true, order: data };
  } catch (error) {
    console.error('❌ Razorpay fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    // Validate required env vars
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('❌ Razorpay credentials not configured');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment service not configured',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { credits, userId } = await req.json();

    // Validation
    if (!credits || !userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Credits and userId are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!VALID_CREDIT_PLANS.includes(credits)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid credit plan. Choose from: 10, 25, 50, or 100 credits',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get amount for the credit plan
    const amountInRupees = CREDIT_PLANS[credits];
    const amountInPaise = convertToPaise(amountInRupees);
    const receipt = generateReceiptId();

    console.log('📝 Creating Razorpay order:', { credits, userId, amountInRupees, amountInPaise });

    // Create order in Razorpay via REST API
    const orderResult = await createRazorpayOrder(
      razorpayKeyId,
      razorpayKeySecret,
      amountInPaise,
      'INR',
      receipt,
      {
        credits: credits,
        userId: userId,
        plan: `${credits} credits`,
      }
    );

    if (!orderResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to create order in Razorpay',
          error: orderResult.error,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const order = orderResult.order;
    console.log('✅ Razorpay order created:', order.id);

    // Store order in database (payment_submissions table)
    const { data: paymentRecord, error: dbError } = await supabase
      .from('payment_submissions')
      .insert([
        {
          user_id: userId,
          credits: credits,
          payment_method: 'razorpay',
          razorpay_order_id: order.id,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to store payment record',
          error: dbError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('💾 Payment record created:', paymentRecord?.id);

    // Return order details to frontend
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order created successfully',
        data: {
          orderId: order.id,
          amount: amountInRupees,
          amountInPaise: amountInPaise,
          currency: order.currency,
          credits: credits,
          paymentRecordId: paymentRecord.id,
          // Include key_id for frontend Razorpay checkout
          keyId: razorpayKeyId,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error creating order:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to create order',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
