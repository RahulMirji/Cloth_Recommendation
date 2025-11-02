# Fix Delete Payment Button Issue

## 🔍 Problem Identified

The delete button in the payment details popup is not working because:

1. **Missing RPC Function**: The database function `delete_payment_submission` hasn't been created yet
2. **Missing RLS Policy**: The Row Level Security policy to allow admins to delete payments hasn't been applied

## ✅ Solution

You need to apply the migration to your Supabase database. Here's how:

### Method 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `wmhiwieooqfwkrdcvqvb` (Cloth Recommendation)

2. **Open SQL Editor**
   - In the left sidebar, click on **SQL Editor**
   - Click **+ New query**

3. **Run the Migration**
   - Open the file: `scripts/apply-delete-payment-migration.sql`
   - Copy the entire content
   - Paste it into the SQL Editor
   - Click **Run** or press `Ctrl/Cmd + Enter`

4. **Verify Success**
   - Scroll to the bottom of the results
   - You should see two verification queries with results:
     - Function `delete_payment_submission` exists ✅
     - Policy `Admins can delete any payment` exists ✅

### Method 2: Using Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
cd /Users/apple/Cloth_Recommendation
supabase db push
```

This will apply all pending migrations in the `supabase/migrations/` folder.

## 🧪 Testing

After applying the migration:

1. **Refresh your app** (reload Expo)
2. **Go to Admin Dashboard → Payments tab**
3. **Click on any approved payment**
4. **Click the Delete button** at the bottom
5. **Confirm deletion**
6. **Expected behavior**:
   - Payment should be deleted ✅
   - If payment was approved, user credits should be reverted ✅
   - Success message should appear ✅
   - Payment list should refresh automatically ✅

## 🔧 What the Migration Does

### 1. Creates `delete_payment_submission` Function
- Safely deletes a payment record
- Automatically reverts user credits if payment was approved
- Runs with `SECURITY DEFINER` to bypass RLS restrictions
- Returns detailed success/error JSON response

### 2. Sets Up RLS Policy
- Allows users in `admin_users` table to delete any payment
- Grants DELETE permission to authenticated users
- Enables Row Level Security on payment_submissions table

## 📊 Database Changes

```sql
-- Function created
delete_payment_submission(payment_id UUID) → JSON

-- RLS Policy created
"Admins can delete any payment" ON payment_submissions FOR DELETE

-- Permissions granted
GRANT EXECUTE ON FUNCTION delete_payment_submission TO authenticated
GRANT DELETE ON payment_submissions TO authenticated
```

## 🔒 Security

✅ **Safe for production**:
- Only admin users (listed in `admin_users` table) can delete
- Function uses `SECURITY DEFINER` to bypass RLS only within the function scope
- Credits are properly reverted to prevent abuse
- All operations are logged via console output

## 🐛 Troubleshooting

### If delete still doesn't work after applying migration:

1. **Check if you're logged in as admin**:
   ```sql
   -- Run this in Supabase SQL Editor
   SELECT * FROM admin_users WHERE email = 'your-admin-email@example.com';
   ```

2. **Check if function exists**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'delete_payment_submission';
   ```

3. **Check RLS policy**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'payment_submissions';
   ```

4. **Check browser console** for error messages when clicking delete

5. **Check Expo terminal** for backend error logs

## 📝 Notes

- This migration is **idempotent** - safe to run multiple times
- The function handles both `approved` and `rejected` payments
- Credits are only reverted for `approved` payments (100 credits)
- The delete operation is atomic - either everything succeeds or nothing changes

---

**Need help?** Check the console logs in both Expo and browser DevTools for detailed error messages.
