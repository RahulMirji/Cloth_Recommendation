/**
 * Razorpay Payment Controllers
 * 
 * Business logic for handling Razorpay payments:
 * - Creating payment orders
 * - Verifying payment signatures
 * - Processing successful payments
 * - Adding credits to user accounts
 * 
 * File: backend/Razorpay/controllers/paymentController.js
 * Created: November 1, 2025
 */

const razorpayInstance = require('../utils/razorpayInstance');
const {
  convertToPaise,
  convertToRupees,
  verifyPaymentSignature,
  generateReceiptId,
  getCreditPlanAmount,
  isValidCreditPlan,
} = require('../utils/razorpayHelpers');
const { createClient } = require('@supabase/supabase-js');

// Lazy-load Supabase client to ensure env vars are loaded
let supabase = null;
const getSupabase = () => {
  if (!supabase) {
    // Use service role key to bypass RLS for backend operations
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY).trim();
    const supabaseUrl = process.env.SUPABASE_URL.trim();
    
    console.log('� Initializing Supabase with URL:', supabaseUrl);
    console.log('🔑 Key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon');
    console.log('🔑 Key length:', serviceRoleKey.length);
    
    supabase = createClient(supabaseUrl, serviceRoleKey);
    console.log('💾 Supabase client initialized');
  }
  return supabase;
};

/**
 * Create Razorpay Order
 * 
 * Step 1 of payment flow:
 * - Validate credit plan
 * - Create order in Razorpay
 * - Store order details in database
 * 
 * @route POST /api/razorpay/create-order
 */
const createOrder = async (req, res) => {
  try {
    const { credits, userId } = req.body;

    // Validation
    if (!credits || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Credits and userId are required',
      });
    }

    if (!isValidCreditPlan(credits)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credit plan. Choose from: 10, 25, 50, or 100 credits',
      });
    }

    // Get amount for the credit plan
    const amountInRupees = getCreditPlanAmount(credits);
    const amountInPaise = convertToPaise(amountInRupees);

    // Create Razorpay order options
    const options = {
      amount: amountInPaise, // Amount in paise
      currency: 'INR',
      receipt: generateReceiptId(),
      notes: {
        credits: credits,
        userId: userId,
        plan: `${credits} credits`,
      },
    };

    console.log('📝 Creating Razorpay order:', options);

    // Create order in Razorpay
    let order;
    try {
      order = await razorpayInstance.orders.create(options);
      console.log('✅ Razorpay order created:', order.id);
    } catch (razorpayError) {
      console.error('❌ Razorpay API error:', razorpayError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create order in Razorpay',
        error: razorpayError.message || 'Razorpay API error',
      });
    }

    // Store order in database (payment_submissions table)
    const { data: paymentRecord, error: dbError} = await getSupabase()
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
      return res.status(500).json({
        success: false,
        message: 'Failed to store payment record',
        error: dbError.message,
      });
    }

    console.log('💾 Payment record created in database:', paymentRecord?.id);

    // Return order details to frontend
    res.status(200).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        amount: amountInRupees,
        amountInPaise: amountInPaise,
        currency: order.currency,
        credits: credits,
        paymentRecordId: paymentRecord.id,
      },
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
};

/**
 * Verify Payment and Add Credits
 * 
 * Step 2 of payment flow:
 * - Verify payment signature
 * - Update payment record
 * - Add credits to user account
 * 
 * @route POST /api/razorpay/verify-payment
 */
const verifyPayment = async (req, res) => {
  const verifyStartTime = Date.now();
  console.log('⏱️  [TIMING] ========== VERIFY PAYMENT START ==========');
  
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
    } = req.body;

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment details',
      });
    }

    console.log('🔍 Verifying payment:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });

    // Verify signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      console.log('❌ Invalid payment signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Payment verification failed.',
      });
    }

    console.log('✅ Payment signature verified');

    // Get payment record from database
    const { data: paymentRecord, error: fetchError } = await getSupabase()
      .from('payment_submissions')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !paymentRecord) {
      console.error('❌ Payment record not found:', fetchError);
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    // Update payment record with payment details
    const { error: updateError } = await getSupabase()
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
      return res.status(500).json({
        success: false,
        message: 'Failed to update payment record',
      });
    }

    console.log('💾 Payment record updated');

    // Get the monthly_pro plan ID from subscription_plans table
    console.log('⏱️  [TIMING] Fetching plan ID...');
    const planStartTime = Date.now();
    
    const { data: plan, error: planError } = await getSupabase()
      .from('subscription_plans')
      .select('id')
      .eq('slug', 'monthly_pro')
      .single();

    console.log(`⏱️  [TIMING] Plan fetch took ${Date.now() - planStartTime}ms`);

    if (planError || !plan) {
      console.error('❌ Failed to fetch plan:', planError);
      return res.status(500).json({
        success: false,
        message: 'Payment verified but failed to fetch plan. Contact support.',
        error: planError?.message || 'Plan not found',
      });
    }

    console.log(`📋 Found plan ID: ${plan.id}`);

    // Add credits to user account using the existing grant_plan RPC function
    // This function properly handles credits in the feature_credits table
    console.log('⏱️  [TIMING] Calling grant_plan RPC...');
    const grantStartTime = Date.now();
    
    const { data: grantResult, error: creditError } = await getSupabase().rpc(
      'grant_plan',
      {
        p_plan_id: plan.id,
        p_user_id: userId,
      }
    );

    console.log(`⏱️  [TIMING] grant_plan RPC took ${Date.now() - grantStartTime}ms`);

    if (creditError) {
      console.error('❌ Failed to grant plan credits:', creditError);
      return res.status(500).json({
        success: false,
        message: 'Payment verified but failed to add credits. Contact support.',
        error: creditError.message,
      });
    }

    console.log(`✅ Granted 100 credits to user ${userId} via grant_plan RPC`);

    console.log(`⏱️  [TIMING] ========== TOTAL VERIFY TIME: ${Date.now() - verifyStartTime}ms ==========`);

    // Success response
    res.status(200).json({
      success: true,
      message: `Payment successful! ${paymentRecord.credits} credits added to your account.`,
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        credits: paymentRecord.credits,
        amount: paymentRecord.amount,
      },
    });
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    console.log(`⏱️  [TIMING] ========== ERROR AT: ${Date.now() - verifyStartTime}ms ==========`);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
};

/**
 * Get Payment Status
 * 
 * Check status of a payment by order ID
 * 
 * @route GET /api/razorpay/payment-status/:orderId
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    // Fetch payment record from database
    const { data: paymentRecord, error } = await getSupabase()
      .from('payment_submissions')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .single();

    if (error || !paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: paymentRecord.razorpay_order_id,
        paymentId: paymentRecord.razorpay_payment_id,
        status: paymentRecord.status,
        amount: paymentRecord.amount,
        credits: paymentRecord.credits,
        submittedAt: paymentRecord.submitted_at,
        reviewedAt: paymentRecord.reviewed_at,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentStatus,
};
