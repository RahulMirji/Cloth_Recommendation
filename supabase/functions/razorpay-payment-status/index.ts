/**
 * Razorpay Payment Status Edge Function
 * 
 * Get payment status by order ID.
 * 
 * Endpoint: GET /functions/v1/razorpay-payment-status?orderId=xxx
 * 
 * Environment Variables Required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get orderId from query params
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Order ID is required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch payment record from database
    const { data: paymentRecord, error } = await supabase
      .from('payment_submissions')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .single();

    if (error || !paymentRecord) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment not found',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          orderId: paymentRecord.razorpay_order_id,
          paymentId: paymentRecord.razorpay_payment_id,
          status: paymentRecord.status,
          credits: paymentRecord.credits,
          submittedAt: paymentRecord.submitted_at,
          reviewedAt: paymentRecord.reviewed_at,
          webhookProcessed: paymentRecord.webhook_processed,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error fetching payment status:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch payment status',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
