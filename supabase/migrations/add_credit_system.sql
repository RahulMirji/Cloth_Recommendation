-- Migration: Add credit system columns to user_profiles
-- Description: Adds credits_remaining, subscription_plan, and subscription_expires_at columns for credit tracking

-- Add credit columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS credits_remaining INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON user_profiles(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_user_profiles_credits ON user_profiles(credits_remaining);

-- Update existing users to have 5 free credits
UPDATE user_profiles 
SET credits_remaining = 5, 
    subscription_plan = 'free' 
WHERE credits_remaining IS NULL;

-- Add comment
COMMENT ON COLUMN user_profiles.credits_remaining IS 'Number of outfit analysis credits remaining for the user';
COMMENT ON COLUMN user_profiles.subscription_plan IS 'Subscription plan: free (5 credits) or pro (100 credits)';
COMMENT ON COLUMN user_profiles.subscription_expires_at IS 'Expiration date of pro subscription (30 days from purchase)';
