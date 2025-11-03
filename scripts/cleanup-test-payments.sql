-- ============================================
-- Cleanup Test Payments for Specific User
-- ============================================
-- This script helps you delete all payment submissions
-- for a specific user (useful for cleaning up test data)
-- ============================================

-- STEP 1: First, let's find your test user
-- ============================================
-- Run this to see all users with multiple payment submissions
SELECT 
  user_id,
  user_name,
  user_email,
  COUNT(*) as payment_count,
  STRING_AGG(status::text, ', ') as statuses
FROM payment_submissions
GROUP BY user_id, user_name, user_email
HAVING COUNT(*) > 1
ORDER BY payment_count DESC;

-- This will show you which user has the most test payments
-- Copy the user_id from the results

-- ============================================
-- STEP 2: Preview what will be deleted
-- ============================================
-- User: Raju (1hk22ai039@hkbk.edu.in)
-- User ID: 1aa1adb1-b15e-4554-ba85-13c85a3202b1

-- PREVIEW: See all payments for this user
SELECT 
  id,
  user_name,
  user_email,
  status,
  amount,
  submitted_at,
  utr_number
FROM payment_submissions
WHERE user_id = '1aa1adb1-b15e-4554-ba85-13c85a3202b1'
ORDER BY submitted_at DESC;

-- Count how many will be deleted
SELECT COUNT(*) as total_to_delete
FROM payment_submissions
WHERE user_id = '1aa1adb1-b15e-4554-ba85-13c85a3202b1';

-- ============================================
-- STEP 3: Delete all payments for this user
-- ============================================
-- ⚠️ WARNING: This is PERMANENT! Make sure you have the right user_id
-- User: Raju (1hk22ai039@hkbk.edu.in)

-- Option A: Delete ALL payments for this user
DELETE FROM payment_submissions
WHERE user_id = '1aa1adb1-b15e-4554-ba85-13c85a3202b1';

-- Option B: Only delete PENDING payments (keep approved/rejected)
-- DELETE FROM payment_submissions
-- WHERE user_id = '1aa1adb1-b15e-4554-ba85-13c85a3202b1' 
--   AND status = 'pending';

-- Option C: Only delete payments from today (if you just did tests)
-- DELETE FROM payment_submissions
-- WHERE user_id = '1aa1adb1-b15e-4554-ba85-13c85a3202b1' 
--   AND submitted_at >= CURRENT_DATE;

-- ============================================
-- STEP 4: Verify deletion
-- ============================================
-- Check if payments are gone
SELECT COUNT(*) as remaining_payments
FROM payment_submissions
WHERE user_id = '1aa1adb1-b15e-4554-ba85-13c85a3202b1';

-- Should return 0 if all deleted

-- ============================================
-- BONUS: Delete ALL test payments across all users
-- ============================================
-- Use this if you want to clean up all pending test payments

-- Preview: See all pending payments
SELECT 
  user_name,
  user_email,
  status,
  COUNT(*) as count
FROM payment_submissions
WHERE status = 'pending'
GROUP BY user_name, user_email, status;

-- Delete all pending payments (CAREFUL!)
-- DELETE FROM payment_submissions
-- WHERE status = 'pending';

-- ============================================
-- NOTES:
-- ============================================
-- 1. Always run STEP 1 and 2 first to preview
-- 2. Replace 'YOUR_USER_ID_HERE' with actual UUID
-- 3. Uncomment the DELETE statement you want to use
-- 4. This bypasses the RPC function, so credits won't be reverted
--    (Only use for test data cleanup)
-- ============================================
