-- ============================================
-- FIX: Delete Payment with SECURITY DEFINER
-- ============================================
-- This fixes the delete issue by ensuring SECURITY DEFINER
-- bypasses ALL RLS policies properly
-- ============================================

-- Drop the existing function
DROP FUNCTION IF EXISTS delete_payment_submission(uuid);

-- Recreate with proper SECURITY DEFINER that bypasses RLS
CREATE OR REPLACE FUNCTION delete_payment_submission(payment_id uuid)
RETURNS json AS $$
DECLARE
  v_payment_record RECORD;
  v_user_id uuid;
  v_credits_to_remove integer := 100;
  v_rows_deleted integer;
BEGIN
  -- Get payment record first
  SELECT id, user_id, status
  INTO v_payment_record
  FROM payment_submissions
  WHERE id = payment_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Payment not found'
    );
  END IF;

  v_user_id := v_payment_record.user_id;

  -- Revert credits if approved
  IF v_payment_record.status = 'approved' THEN
    UPDATE user_profiles
    SET 
      credits = GREATEST(0, COALESCE(credits, 0) - v_credits_to_remove),
      updated_at = NOW()
    WHERE user_id = v_user_id;
  END IF;

  -- Delete the payment (SECURITY DEFINER bypasses RLS)
  DELETE FROM payment_submissions WHERE id = payment_id;
  
  GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
  
  RAISE NOTICE 'Rows deleted: %', v_rows_deleted;

  IF v_rows_deleted = 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Delete blocked by RLS or constraints'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Payment deleted successfully',
    'rows_deleted', v_rows_deleted
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_payment_submission TO authenticated;

-- ============================================
-- Now fix RLS policies
-- ============================================

-- Disable RLS temporarily to check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'payment_submissions';

-- Drop ALL existing DELETE policies
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'payment_submissions' 
      AND cmd = 'DELETE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON payment_submissions', r.policyname);
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- Create a simple, permissive DELETE policy for admins
CREATE POLICY "admin_delete_payments"
  ON payment_submissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- Ensure RLS is enabled
ALTER TABLE payment_submissions ENABLE ROW LEVEL SECURITY;

-- Grant explicit DELETE permission
GRANT DELETE ON payment_submissions TO authenticated;

-- ============================================
-- Verify Setup
-- ============================================

-- Check function exists
SELECT 
  p.proname as function_name,
  p.prosecdef as is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'delete_payment_submission';

-- Check new policy
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'payment_submissions'
  AND cmd = 'DELETE';

-- ============================================
-- DONE!
-- ============================================
