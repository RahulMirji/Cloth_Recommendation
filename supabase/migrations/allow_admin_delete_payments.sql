-- Allow admins to delete payment submissions
-- This policy allows any authenticated user in the admin_users table to delete any payment

-- First, check if RLS is enabled
DO $$ 
BEGIN
  -- Enable RLS if not already enabled
  ALTER TABLE payment_submissions ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'RLS enabled on payment_submissions';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'RLS already enabled or error: %', SQLERRM;
END $$;

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Admins can delete any payment" ON payment_submissions;

-- Create policy allowing admins to delete any payment submission
-- admin_users table has 'id' column (not 'user_id')
CREATE POLICY "Admins can delete any payment"
  ON payment_submissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- Grant delete permission to authenticated role
GRANT DELETE ON payment_submissions TO authenticated;

COMMENT ON POLICY "Admins can delete any payment" ON payment_submissions IS 
  'Allows users listed in admin_users table to delete any payment submission';
