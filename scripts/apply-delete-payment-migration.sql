-- ============================================
-- Apply Delete Payment Migration
-- ============================================
-- This script creates the delete_payment_submission function
-- and sets up proper RLS policies for admin deletion
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Create the delete_payment_submission function
-- ============================================
DROP FUNCTION IF EXISTS delete_payment_submission(uuid);

CREATE OR REPLACE FUNCTION delete_payment_submission(payment_id uuid)
RETURNS json AS $$
DECLARE
  v_payment_record RECORD;
  v_user_id uuid;
  v_credits_to_remove integer := 100; -- Credits granted per approved payment
  v_rows_deleted integer;
BEGIN
  -- IMPORTANT: This function runs as SECURITY DEFINER which means it executes
  -- with the privileges of the function owner (typically postgres superuser)
  -- This should bypass RLS policies
  
  -- Get the payment record (this should work even with RLS)
  SELECT id, user_id, status
  INTO v_payment_record
  FROM payment_submissions
  WHERE id = payment_id;

  -- Check if payment exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Payment not found with ID: ' || payment_id::text
    );
  END IF;

  v_user_id := v_payment_record.user_id;

  -- If payment was approved, remove credits from user
  IF v_payment_record.status = 'approved' THEN
    UPDATE user_profiles
    SET 
      credits = GREATEST(0, COALESCE(credits, 0) - v_credits_to_remove),
      updated_at = NOW()
    WHERE user_id = v_user_id;
    
    GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
    RAISE NOTICE 'Credits removed from user %, rows updated: %', v_user_id, v_rows_deleted;
  END IF;

  -- Delete the payment submission
  -- Using explicit DELETE with no additional conditions
  DELETE FROM payment_submissions
  WHERE id = payment_id;
  
  -- Check how many rows were deleted
  GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
  
  RAISE NOTICE 'DELETE attempted for payment %, rows deleted: %', payment_id, v_rows_deleted;
  
  IF v_rows_deleted = 0 THEN
    -- The record exists (we found it above) but couldn't be deleted
    -- This indicates RLS or other constraint is blocking the delete
    RETURN json_build_object(
      'success', false,
      'message', 'Failed to delete payment (ID: ' || payment_id::text || '). Record found but delete blocked. Check RLS policies or foreign key constraints.',
      'debug_info', json_build_object(
        'payment_exists', true,
        'rows_deleted', v_rows_deleted,
        'user_id', v_user_id,
        'status', v_payment_record.status
      )
    );
  END IF;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Payment deleted successfully',
    'credits_removed', CASE 
      WHEN v_payment_record.status = 'approved' THEN v_credits_to_remove 
      ELSE 0 
    END,
    'rows_deleted', v_rows_deleted
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error deleting payment: ' || SQLERRM,
      'error_detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_payment_submission TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_payment_submission IS 'Deletes a payment submission and reverts user credits if payment was approved. Runs with SECURITY DEFINER to bypass RLS.';


-- STEP 2: Set up RLS policies for admin deletion
-- ============================================

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  ALTER TABLE payment_submissions ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'RLS enabled on payment_submissions';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'RLS already enabled or error: %', SQLERRM;
END $$;

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Admins can delete any payment" ON payment_submissions;

-- Create policy allowing admins to delete any payment submission
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


-- STEP 3: Verify the setup
-- ============================================

-- Check if function exists
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'delete_payment_submission';

-- Check if RLS policy exists
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'payment_submissions'
  AND policyname = 'Admins can delete any payment';

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================
-- If both queries above return results, the migration was successful!
