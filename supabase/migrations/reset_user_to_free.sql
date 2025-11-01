-- Reset a specific user from Pro to Free
-- This will:
-- 1. Set all feature credits to 5 (free tier)
-- 2. Reset subscription status to 'free'
-- 3. Clear expiry dates

-- Replace 'YOUR_USER_ID_HERE' with the actual user ID
-- Example: '1aa1adb1-b15e-4554-ba85-13c85a3202b1'

UPDATE feature_credits
SET 
  credits_remaining = 5,
  subscription_status = 'free',
  subscription_expires_at = NULL,
  updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID_HERE';

-- To reset ALL users to free (use carefully!):
-- UPDATE feature_credits
-- SET 
--   credits_remaining = 5,
--   subscription_status = 'free',
--   subscription_expires_at = NULL,
--   updated_at = NOW();

-- To check the current status:
-- SELECT user_id, feature_name, credits_remaining, subscription_status, subscription_expires_at
-- FROM feature_credits
-- WHERE user_id = 'YOUR_USER_ID_HERE';
