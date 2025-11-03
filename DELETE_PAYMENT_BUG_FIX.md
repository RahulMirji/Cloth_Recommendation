# Delete Payment Button Bug Fix

## 🐛 Problem Description

The delete button in the Admin Dashboard's payment details popup was not deleting records from the `payment_submissions` table. When an admin clicked the delete button, the action would silently fail without any error message or visual feedback.

## 🔍 Root Cause Analysis

As a senior database engineer, I performed a thorough investigation and identified the following issues:

### 1. **Schema Mismatch in Database Function**
The `delete_payment_submission` RPC function was attempting to update a **non-existent column** in the database:

```sql
-- ❌ OLD CODE (BROKEN)
UPDATE user_profiles
SET 
  credits = GREATEST(0, COALESCE(credits, 0) - v_credits_to_remove),
  updated_at = NOW()
WHERE user_id = v_user_id;
```

**Problem:** The `user_profiles` table does NOT have a `credits` column. This was referencing an old schema design.

### 2. **Current Database Schema**
The actual schema uses a separate `feature_credits` table to manage credits:

```
user_profiles columns:
- id, user_id, name, email, phone, age, gender, bio, profile_image, created_at, updated_at

feature_credits columns:
- id, user_id, feature, plan_status, credits_remaining, credits_cap, expires_at, 
  last_reset_at, created_at, updated_at
```

### 3. **Inconsistent Credit Management**
- The `approve_payment_request` function correctly updates the `feature_credits` table
- The `delete_payment_submission` function was trying to update the non-existent `credits` column in `user_profiles`
- This inconsistency caused the DELETE operation to fail silently

## ✅ Solution Implemented

### Migration Applied: `fix_delete_payment_submission_function`

I completely rewrote the `delete_payment_submission` function to:

1. **Use the correct table structure** - Updates `feature_credits` instead of `user_profiles`
2. **Properly revert credits** - Resets all three features back to free tier (5 credits each)
3. **Add audit logging** - Records the credit reversion in `subscription_audit_log` for traceability
4. **Maintain admin authorization** - Validates that only admins can delete payments
5. **Improve error handling** - Returns clear success/error messages

### Key Changes:

```sql
-- ✅ NEW CODE (FIXED)
-- Revert credits if payment was approved
IF v_payment_record.status = 'approved' THEN
  UPDATE feature_credits
  SET 
    plan_status = 'free',
    credits_remaining = 5,
    credits_cap = 5,
    expires_at = NULL,
    updated_at = NOW()
  WHERE user_id = v_user_id 
    AND feature IN ('outfit_scorer', 'ai_stylist', 'image_gen');
  
  -- Log the credit reversion in audit log
  INSERT INTO subscription_audit_log (...)
  VALUES (...);
END IF;
```

## 🎯 What the Fix Does

### Before Delete:
- Checks if the caller is an admin (security check)
- Retrieves the payment record and validates it exists
- Identifies if the payment was approved

### If Payment Was Approved:
1. **Reverts all feature credits** to free tier:
   - `outfit_scorer`: 100 credits → 5 credits
   - `ai_stylist`: 100 credits → 5 credits  
   - `image_gen`: 100 credits → 5 credits
2. **Changes plan status** from `pro` → `free`
3. **Removes expiry date** (sets to NULL)
4. **Creates audit log entries** for each feature with:
   - Change type: 'payment_deleted'
   - Credits before/after tracking
   - Plan status change tracking
   - Admin ID and reason

### Delete Operation:
- Deletes the payment record from `payment_submissions`
- Returns success/failure with appropriate message
- Handles any errors gracefully

## 🧪 Testing Recommendations

Test the following scenarios:

1. **Delete Pending Payment:**
   - Create a payment with status 'pending'
   - Delete it from admin dashboard
   - ✅ Should delete without affecting credits

2. **Delete Approved Payment:**
   - Create and approve a payment
   - Verify user has 100 credits in all features
   - Delete the payment
   - ✅ User should be reverted to 5 credits per feature
   - ✅ Check `subscription_audit_log` for proper entries

3. **Delete Rejected Payment:**
   - Create a payment with status 'rejected'
   - Delete it from admin dashboard
   - ✅ Should delete without affecting credits

4. **Non-Admin Attempt:**
   - Try to call the function as a non-admin user
   - ✅ Should return error: "Only admins can delete payments"

5. **Invalid Payment ID:**
   - Try to delete a non-existent payment
   - ✅ Should return error: "Payment not found"

## 📊 Impact on Database

### Tables Affected:
1. `payment_submissions` - Records deleted
2. `feature_credits` - Credits reverted if approved
3. `subscription_audit_log` - Audit entries created

### No Breaking Changes:
- Function signature remains the same
- Frontend code requires no changes
- All existing RLS policies continue to work

## 🔐 Security Considerations

The function maintains all security measures:
- ✅ `SECURITY DEFINER` - Bypasses RLS for administrative operations
- ✅ Admin verification at function start
- ✅ Proper error handling and logging
- ✅ Audit trail for compliance

## 📝 Additional Notes

### Why This Bug Existed:
The app likely went through a schema migration where the credit system was moved from a single `credits` column in `user_profiles` to a more robust `feature_credits` table system. The `delete_payment_submission` function was created during the old schema and never updated.

### Prevention:
- Keep database functions in sync with schema changes
- Add integration tests for all RPC functions
- Use database migrations to update functions when schema changes
- Consider using TypeScript type generation from Supabase schema

## 🚀 Deployment Status

- ✅ Migration applied successfully
- ✅ Function verified in database
- ✅ Ready for testing
- ⏳ Pending production validation

## 📞 Support

If you encounter any issues after this fix:
1. Check the `subscription_audit_log` table for audit trail
2. Verify the payment status before deletion
3. Ensure the admin user is properly registered in `admin_users` table
4. Check Supabase logs for any function execution errors

---

**Fixed by:** Senior Database Engineer
**Date:** November 3, 2025
**Migration:** `fix_delete_payment_submission_function`
