-- Password Reset System Database Schema
-- 
-- This schema supports a secure, rate-limited password reset system
-- with token expiry and usage tracking.

-- Table: password_reset_tokens
-- Stores secure tokens for password reset requests
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the reset token
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT, -- For security tracking
  user_agent TEXT  -- For security tracking
);

-- Index for fast lookup by email
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email 
ON password_reset_tokens(email);

-- Index for fast lookup by token hash
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash 
ON password_reset_tokens(token_hash);

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at 
ON password_reset_tokens(expires_at);

-- Table: password_reset_rate_limits
-- Prevents abuse by limiting reset requests per email
CREATE TABLE IF NOT EXISTS password_reset_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by email
CREATE INDEX IF NOT EXISTS idx_password_reset_rate_limits_email 
ON password_reset_rate_limits(email);

-- Enable Row Level Security (RLS)
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only service role can access these tables
CREATE POLICY "Service role only access" ON password_reset_tokens
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only access" ON password_reset_rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- Function: Clean up expired tokens (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on password_reset_tokens
CREATE TRIGGER update_password_reset_tokens_updated_at
  BEFORE UPDATE ON password_reset_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on password_reset_rate_limits
CREATE TRIGGER update_password_reset_rate_limits_updated_at
  BEFORE UPDATE ON password_reset_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Notes:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Tokens expire in 15 minutes (configured in Edge Function)
-- 3. Rate limit: 3 requests per hour per email
-- 4. Tokens are one-time use only
-- 5. Consider setting up a cron job to run cleanup_expired_reset_tokens() daily
