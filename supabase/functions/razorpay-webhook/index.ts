/**
 * Razorpay Webhook Edge Function
 * 
 * Handles Razorpay webhook events for reliable payment confirmation.
 * This is the PRIMARY method for granting credits - more reliable than client verification.
 * 
 * Endpoint: POST /functions/v1/razorpay-webhook
 * 
 * Webhook Events Handled:
 * - payment.captured: Payment successful, grant credits
 * - payment.failed: Payment failed, update status
 * - order.paid: Order fully paid (backup for payment.captured)
 * 
 * Environment Variables Required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - RAZORPAY_KEY_SECRET (used for webhook signature verification)
 * - RAZORPAY_WEBHOOK_SECRET (optional, for dedicated webhook secret)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

/**
 * Verify Razorpay webhook signature using Web Crypto API
 * Razorpay signs the entire request body with HMAC-SHA256
 */
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
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
      console.log('✅ Webhook signature verified');
    } else {
      console.log('❌ Webhook signature verification failed');
      console.log('Expected:', expectedSignature);
      console.log('Received:', signature);
    }

    return isValid;
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Process payment.captured event
 * Grant credits to user when payment is confirmed by Razorpay
 */
async function handlePaymentCaptured(
  supabase: any,
  payload: any
): Promise<{ success: boolean; message: string }> {
  const payment = payload.payment?.entity;
  
  if (!payment) {
    return { success: false, message: 'No payment entity in payload' };
  }

  const orderId = payment.order_id;
  const paymentId = payment.id;

  console.log(`💳 Processing payment.captured for order: ${orderId}, payment: ${paymentId}`);

  // Find the payment record
  const { data: paymentRecord, error: fetchError } = await supabase
    .from('payment_submissions')
    .select('*')
    .eq('razorpay_order_id', orderId)
    .single();

  if (fetchError || !paymentRecord) {
    console.error('❌ Payment record not found for order:', orderId);
    return { success: false, message: `Payment record not found for order: ${orderId}` };
  }

  // Check if already processed (idempotency)
  if (paymentRecord.status === 'approved' && paymentRecord.webhook_processed === true) {
    console.log('⚠️ Payment already processed via webhook, skipping');
    return { success: true, message: 'Already processed' };
  }

  // Update payment record
  const { error: updateError } = await supabase
    .from('payment_submissions')
    .update({
      razorpay_payment_id: paymentId,
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      webhook_processed: true,
      webhook_event: 'payment.captured',
      webhook_received_at: new Date().toISOString(),
    })
    .eq('id', paymentRecord.id);

  if (updateError) {
    console.error('❌ Failed to update payment record:', updateError);
    return { success: false, message: 'Failed to update payment record' };
  }

  // Only grant credits if not already approved (prevent double-granting)
  if (paymentRecord.status !== 'approved') {
    // Get the monthly_pro plan ID
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('slug', 'monthly_pro')
      .single();

    if (planError || !plan) {
      console.error('❌ Failed to fetch plan:', planError);
      return { success: false, message: 'Failed to fetch plan' };
    }

    // Grant credits using RPC
    const { error: creditError } = await supabase.rpc('grant_plan', {
      p_plan_id: plan.id,
      p_user_id: paymentRecord.user_id,
    });

    if (creditError) {
      console.error('❌ Failed to grant credits:', creditError);
      return { success: false, message: 'Failed to grant credits' };
    }

    console.log(`✅ Granted credits to user ${paymentRecord.user_id} via webhook`);
  }

  return { success: true, message: 'Payment processed successfully' };
}

/**
 * Process payment.failed event
 * Update payment status when payment fails
 */
async function handlePaymentFailed(
  supabase: any,
  payload: any
): Promise<{ success: boolean; message: string }> {
  const payment = payload.payment?.entity;
  
  if (!payment) {
    return { success: false, message: 'No payment entity in payload' };
  }

  const orderId = payment.order_id;
  const paymentId = payment.id;
  const errorCode = payment.error_code;
  const errorDescription = payment.error_description;

  console.log(`❌ Processing payment.failed for order: ${orderId}`);
  console.log(`Error: ${errorCode} - ${errorDescription}`);

  // Update payment record
  const { error: updateError } = await supabase
    .from('payment_submissions')
    .update({
      razorpay_payment_id: paymentId,
      status: 'failed',
      reviewed_at: new Date().toISOString(),
      webhook_processed: true,
      webhook_event: 'payment.failed',
      webhook_received_at: new Date().toISOString(),
      failure_reason: `${errorCode}: ${errorDescription}`,
    })
    .eq('razorpay_order_id', orderId);

  if (updateError) {
    console.error('❌ Failed to update payment record:', updateError);
    return { success: false, message: 'Failed to update payment record' };
  }

  return { success: true, message: 'Payment failure recorded' };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST requests for webhooks
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // Use dedicated webhook secret if available, otherwise fall back to key secret
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || Deno.env.get('RAZORPAY_KEY_SECRET')!;

    if (!webhookSecret) {
      console.error('❌ Webhook secret not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the raw body for signature verification
    const body = await req.text();
    
    // Get the signature from headers
    const signature = req.headers.get('x-razorpay-signature');
    
    if (!signature) {
      console.error('❌ No signature in webhook request');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(body, signature, webhookSecret);
    
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse the webhook payload
    const payload = JSON.parse(body);
    const event = payload.event;

    console.log(`📥 Received webhook event: ${event}`);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result: { success: boolean; message: string };

    // Handle different event types
    switch (event) {
      case 'payment.captured':
        result = await handlePaymentCaptured(supabase, payload);
        break;
      
      case 'payment.failed':
        result = await handlePaymentFailed(supabase, payload);
        break;
      
      case 'order.paid':
        // order.paid is a backup - extract payment info and process
        console.log('📦 Received order.paid event');
        result = await handlePaymentCaptured(supabase, {
          payment: { entity: payload.payload?.payment?.entity },
        });
        break;
      
      default:
        console.log(`ℹ️ Unhandled event type: ${event}`);
        result = { success: true, message: `Event ${event} acknowledged but not processed` };
    }

    // Always return 200 to acknowledge receipt (Razorpay will retry on non-2xx)
    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.message,
        event: event,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    // Still return 200 to prevent Razorpay from retrying on parse errors
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
