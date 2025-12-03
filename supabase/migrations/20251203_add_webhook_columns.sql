-- Migration: Add webhook tracking columns to payment_submissions
-- Purpose: Support Razorpay webhook for reliable payment confirmation
-- Date: December 3, 2025

-- Add columns for webhook tracking
ALTER TABLE payment_submissions
ADD COLUMN IF NOT EXISTS webhook_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS webhook_event TEXT,
ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Add index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_payment_submissions_razorpay_order_id 
ON payment_submissions(razorpay_order_id);

-- Add index for finding unprocessed payments
CREATE INDEX IF NOT EXISTS idx_payment_submissions_webhook_processed 
ON payment_submissions(webhook_processed) 
WHERE webhook_processed = FALSE;

-- Comment for documentation
COMMENT ON COLUMN payment_submissions.webhook_processed IS 'True if credits were granted via webhook (prevents double-granting)';
COMMENT ON COLUMN payment_submissions.webhook_event IS 'The Razorpay webhook event type that processed this payment';
COMMENT ON COLUMN payment_submissions.webhook_received_at IS 'Timestamp when webhook was received';
COMMENT ON COLUMN payment_submissions.failure_reason IS 'Error details if payment failed';
