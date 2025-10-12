-- Update get_payment_submissions RPC to include user profile image
-- This adds the user's profile_image from user_profiles table

CREATE OR REPLACE FUNCTION get_payment_submissions(filter_status text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  user_email text,
  user_phone text,
  user_profile_image text,
  amount numeric,
  utr_number text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_name text,
  admin_notes text,
  screenshot_url text,
  status text,
  plan_id text,
  reviewed_by uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.user_id,
    up.name as user_name,
    up.email as user_email,
    up.phone as user_phone,
    up.profile_image as user_profile_image,
    ps.amount,
    ps.utr_number,
    ps.submitted_at,
    ps.reviewed_at,
    ps.reviewer_name,
    ps.admin_notes,
    ps.screenshot_url,
    ps.status,
    ps.plan_id,
    ps.reviewed_by
  FROM payment_submissions ps
  LEFT JOIN user_profiles up ON ps.user_id = up.user_id
  WHERE 
    CASE 
      WHEN filter_status IS NULL THEN true
      ELSE ps.status = filter_status
    END
  ORDER BY 
    CASE 
      WHEN ps.status = 'pending' THEN 1
      WHEN ps.status = 'approved' THEN 2
      WHEN ps.status = 'rejected' THEN 3
      ELSE 4
    END,
    ps.submitted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admins will check via RLS)
GRANT EXECUTE ON FUNCTION get_payment_submissions TO authenticated;
