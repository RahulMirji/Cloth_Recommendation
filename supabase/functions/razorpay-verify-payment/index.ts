/**
 * Razorpay Verify Payment Edge Function
 * 
 * Verifies Razorpay payment signature and adds credits to user account.
 * Replaces the Express.js backend endpoint.
 * 
 * Endpoint: POST /functions/v1/razorpay-verify-payment
 * 
 * Environment Variables Required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - RAZORPAY_KEY_SECRET
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Verify Razorpay payment signature using Web Crypto API
 * Replaces Node.js crypto.createHmac()
 */
async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const body = `${orderId}|${paymentId}`;
    const encoder = new TextEncoder();

    // Import the secret key for HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Generate the expected signature
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );

    // Convert to hex string
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const verifyStartTime = Date.now();
  console.log('⏱️  [TIMING] ========== VERIFY PAYMENT START ==========');

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    if (!razorpayKeySecret) {
      console.error('❌ Razorpay secret not configured');
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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
    } = await req.json();

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required payment details',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🔍 Verifying payment:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });

    // Verify signature using Web Crypto API
    const isValid = await verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayKeySecret
    );

    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid payment signature. Payment verification failed.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get payment record from database
    const { data: paymentRecord, error: fetchError } = await supabase
      .from('payment_submissions')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !paymentRecord) {
      console.error('❌ Payment record not found:', fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment record not found',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if already processed (idempotency)
    if (paymentRecord.status === 'approved') {
      console.log('⚠️ Payment already processed, returning success');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment already processed',
          data: {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            credits: paymentRecord.credits,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update payment record with payment details
    const { error: updateError } = await supabase
      .from('payment_submissions')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.id);

    if (updateError) {
      console.error('❌ Failed to update payment record:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to update payment record',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('💾 Payment record updated');

    // Get the monthly_pro plan ID from subscription_plans table
    console.log('⏱️  [TIMING] Fetching plan ID...');
    const planStartTime = Date.now();

    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('slug', 'monthly_pro')
      .single();

    console.log(`⏱️  [TIMING] Plan fetch took ${Date.now() - planStartTime}ms`);

    if (planError || !plan) {
      console.error('❌ Failed to fetch plan:', planError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment verified but failed to fetch plan. Contact support.',
          error: planError?.message || 'Plan not found',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`📋 Found plan ID: ${plan.id}`);

    // Add credits to user account using the existing grant_plan RPC function
    console.log('⏱️  [TIMING] Calling grant_plan RPC...');
    const grantStartTime = Date.now();

    const { error: creditError } = await supabase.rpc('grant_plan', {
      p_plan_id: plan.id,
      p_user_id: userId,
    });

    console.log(`⏱️  [TIMING] grant_plan RPC took ${Date.now() - grantStartTime}ms`);

    if (creditError) {
      console.error('❌ Failed to grant plan credits:', creditError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment verified but failed to add credits. Contact support.',
          error: creditError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ Granted credits to user ${userId} via grant_plan RPC`);
    console.log(`⏱️  [TIMING] ========== TOTAL VERIFY TIME: ${Date.now() - verifyStartTime}ms ==========`);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Payment successful! ${paymentRecord.credits} credits added to your account.`,
        data: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          credits: paymentRecord.credits,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    console.log(`⏱️  [TIMING] ========== ERROR AT: ${Date.now() - verifyStartTime}ms ==========`);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Payment verification failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
