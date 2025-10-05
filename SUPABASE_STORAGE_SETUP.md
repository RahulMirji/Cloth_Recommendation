# Supabase Storage Bucket Setup Guide

## Problem Identified ❌

Your app is showing **0 buckets found** which indicates a **permissions/policy issue**, not a missing bucket issue. The bucket exists in your Supabase dashboard, but your authenticated users cannot access it due to missing Row Level Security (RLS) policies.

## Root Cause 🔍

Supabase Storage requires explicit policies to allow authenticated users to:
1. **List buckets** (to see available buckets)
2. **Read files** from buckets
3. **Upload files** to buckets

Without these policies, even authenticated users get **empty bucket lists**.

## Solution Steps 🛠️

### Step 1: Set up Bucket Policies

1. **Go to Supabase Dashboard**
   - Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to **Storage** → **Policies**

2. **Create Bucket List Policy**
   ```sql
   -- Policy Name: "Allow authenticated users to list buckets"
   -- Operation: SELECT
   -- Target: buckets (under storage schema)
   -- Policy: authenticated users only
   
   CREATE POLICY "Allow authenticated users to list buckets" 
   ON storage.buckets 
   FOR SELECT 
   TO authenticated 
   USING (true);
   ```

3. **Create File Access Policies for your 'image-url' bucket**
   
   **a) Allow reading files:**
   ```sql
   -- Policy Name: "Allow authenticated users to read images"
   -- Operation: SELECT
   -- Target: objects (under storage schema)
   
   CREATE POLICY "Allow authenticated users to read images" 
   ON storage.objects 
   FOR SELECT 
   TO authenticated 
   USING (bucket_id = 'image-url');
   ```
   
   **b) Allow uploading files:**
   ```sql
   -- Policy Name: "Allow authenticated users to upload images"
   -- Operation: INSERT
   -- Target: objects (under storage schema)
   
   CREATE POLICY "Allow authenticated users to upload images" 
   ON storage.objects 
   FOR INSERT 
   TO authenticated 
   WITH CHECK (bucket_id = 'image-url' AND auth.uid()::text IS NOT NULL);
   ```
   
   **c) Allow deleting files (optional):**
   ```sql
   -- Policy Name: "Allow users to delete their own images"
   -- Operation: DELETE
   -- Target: objects (under storage schema)
   
   CREATE POLICY "Allow users to delete their own images" 
   ON storage.objects 
   FOR DELETE 
   TO authenticated 
   USING (bucket_id = 'image-url' AND auth.uid()::text = owner);
   ```

### Step 2: Alternative UI Method

If you prefer using the Supabase UI instead of SQL:

1. **Go to Storage → Policies**
2. **Click "New Policy"**
3. **For bucket listing:**
   - Policy name: `Allow authenticated users to list buckets`
   - Table: `buckets`
   - Operation: `SELECT`
   - Target roles: `authenticated`
   - Policy definition: `true`

4. **For file operations on 'image-url' bucket:**
   - Policy name: `Allow authenticated users full access to image-url`
   - Table: `objects`  
   - Operation: `ALL`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'image-url'`

### Step 3: Verify Setup

After creating the policies:

1. **Restart your app**
2. **Check the console logs** - you should now see:
   - `Total buckets found: 1` (or more)
   - `✅ Found existing bucket: 'image-url'`
   - `✅ Bucket 'image-url' is accessible`

## Quick Test 🧪

You can test the setup with this SQL query in your Supabase SQL editor:

```sql
-- Test bucket access as authenticated user
SELECT * FROM storage.buckets;

-- Test if image-url bucket exists
SELECT * FROM storage.buckets WHERE name = 'image-url';
```

## Common Issues & Solutions 🚨

### Issue 1: Still showing 0 buckets
**Solution:** Make sure you created the bucket-level policy (`storage.buckets` table)

### Issue 2: Can list buckets but can't upload
**Solution:** Check the `storage.objects` INSERT policy

### Issue 3: App crashes on image upload
**Solution:** Verify the bucket name exactly matches `'image-url'` (case-sensitive)

## Security Best Practices 🔒

1. **Use specific bucket names** in policies instead of wildcards
2. **Add owner checks** for delete operations
3. **Set file size limits** in bucket configuration
4. **Enable RLS** on all storage tables (should be default)

## Verification Checklist ✅

- [ ] Bucket policy for SELECT on `storage.buckets` exists
- [ ] Object policy for SELECT on `storage.objects` with `bucket_id = 'image-url'` exists  
- [ ] Object policy for INSERT on `storage.objects` with `bucket_id = 'image-url'` exists
- [ ] Policies target `authenticated` role
- [ ] Bucket name in policies matches exactly: `'image-url'`
- [ ] App restarted after policy changes

## After Setup

Once policies are configured, your vision API integration should work perfectly:
1. 📸 **Camera captures image**
2. ☁️ **Uploads to Supabase storage**
3. 🔗 **Gets public URL**
4. 🤖 **Sends to Pollinations AI vision API**
5. 🎵 **Converts response to speech**
6. 🔄 **Continuous chat loop**

---

**Need help?** The debug logs will now show much more detailed information about what's happening with your bucket access!