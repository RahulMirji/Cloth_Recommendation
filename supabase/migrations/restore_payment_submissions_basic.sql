-- Restore get_payment_submissions RPC function (basic version without profile images)
-- This will get your payment requests working again

DROP FUNCTION IF EXISTS get_payment_submissions(text);

CREATE OR REPLACE FUNCTION get_payment_submissions(filter_status text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  user_email text,
  user_phone text,
  amount numeric,
  utr_number varchar(32),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_name text,
  admin_notes text,
  screenshot_url text,
  status text,
  plan_id uuid,
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
    29::numeric as amount,
    ps.utr as utr_number,
    ps.created_at as submitted_at,
    ps.reviewed_at,
    ps.admin_note as reviewer_name,
    ps.admin_note as admin_notes,
    ps.screenshot_path as screenshot_url,
    ps.status,
    ps.plan_id,
    ps.reviewer_id as reviewed_by
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
    ps.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_payment_submissions TO authenticated;
