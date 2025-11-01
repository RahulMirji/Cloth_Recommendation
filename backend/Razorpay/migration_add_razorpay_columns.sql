-- ============================================================================
-- Razorpay Payment Integration - Database Migration
-- ============================================================================
-- Adds Razorpay-specific columns to payment_submissions table
-- File: backend/Razorpay/migration_add_razorpay_columns.sql
-- Created: November 1, 2025
-- ============================================================================

-- Make plan_id nullable since Razorpay payments don't use traditional plans
ALTER TABLE payment_submissions ALTER COLUMN plan_id DROP NOT NULL;

-- Add payment_method column to distinguish between razorpay and manual payments
ALTER TABLE payment_submissions 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual';

-- Add credits column to store the number of credits for this payment
ALTER TABLE payment_submissions 
ADD COLUMN IF NOT EXISTS credits INTEGER;

-- Add Razorpay order ID (created when order is initiated)
ALTER TABLE payment_submissions 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- Add Razorpay payment ID (received after successful payment)
ALTER TABLE payment_submissions 
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- Add Razorpay signature (for payment verification)
ALTER TABLE payment_submissions 
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;

-- Add index on razorpay_order_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_submissions_razorpay_order_id 
ON payment_submissions(razorpay_order_id);

-- Add index on payment_method for filtering
CREATE INDEX IF NOT EXISTS idx_payment_submissions_payment_method 
ON payment_submissions(payment_method);

-- Add comment to table for documentation
COMMENT ON COLUMN payment_submissions.payment_method IS 'Payment method: razorpay or manual';
COMMENT ON COLUMN payment_submissions.razorpay_order_id IS 'Razorpay order ID from order creation';
COMMENT ON COLUMN payment_submissions.razorpay_payment_id IS 'Razorpay payment ID after successful payment';
COMMENT ON COLUMN payment_submissions.razorpay_signature IS 'Razorpay signature for payment verification';

-- Update existing records to have 'manual' as payment_method
UPDATE payment_submissions 
SET payment_method = 'manual' 
WHERE payment_method IS NULL;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check if columns were added successfully
-- Run this after migration to verify:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'payment_submissions';

-- ============================================================================
-- Rollback (if needed)
-- ============================================================================

-- To rollback this migration, run:
-- ALTER TABLE payment_submissions DROP COLUMN IF EXISTS payment_method;
-- ALTER TABLE payment_submissions DROP COLUMN IF EXISTS razorpay_order_id;
-- ALTER TABLE payment_submissions DROP COLUMN IF EXISTS razorpay_payment_id;
-- ALTER TABLE payment_submissions DROP COLUMN IF EXISTS razorpay_signature;
-- DROP INDEX IF EXISTS idx_payment_submissions_razorpay_order_id;
-- DROP INDEX IF EXISTS idx_payment_submissions_payment_method;
