-- Migration: Create admin_users table for admin dashboard
-- Created: 2025-10-11
-- Description: Adds admin_users table to manage admin access to the dashboard

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read admin_users (to check if they are admin)
CREATE POLICY "Allow authenticated users to check admin status"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update/delete admin users
CREATE POLICY "Only service role can manage admin users"
  ON public.admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to check if a user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE email = user_email
  );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin(TEXT) TO authenticated;

-- Insert your admin email (CHANGE THIS TO YOUR ACTUAL EMAIL)
INSERT INTO public.admin_users (email)
VALUES ('devprahulmirji@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.admin_users IS 'Stores admin user emails for dashboard access';
COMMENT ON FUNCTION public.is_admin(TEXT) IS 'Checks if a given email belongs to an admin user';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
