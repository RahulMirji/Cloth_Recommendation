# Supabase Image Upload Troubleshooting Guide

## Issues Fixed

### 1. Metro Bundler Error (InternalBytecode.js)

**Error**: `ENOENT: no such file or directory, open 'D:\ai-dresser\InternalBytecode.js'`

**Fix**: This is a Metro bundler cache issue. Clear the cache:

```powershell
# Stop the current server (Ctrl+C)

# Clear caches
npx expo start -c

# Or manually:
Remove-Item -Recurse -Force node_modules\.cache
Remove-Item -Recurse -Force .expo
npx expo start --clear
```

### 2. Network Request Failed Error

**Error**: `StorageUnknownError: Network request failed`

**Fixes Implemented**:

✅ **Retry Logic**: Automatically retries failed uploads up to 3 times
✅ **Timeout Protection**: 30-second timeout prevents hanging requests
✅ **Better Diagnostics**: Detailed logging to identify the exact issue
✅ **Connectivity Tests**: Pre-upload checks to verify Supabase connection

## Configuration Checklist

### In Supabase Dashboard

1. **Create Storage Bucket**

   - Go to Storage → Buckets
   - Create new bucket named: `user-images`
   - ✅ Check "Public bucket"

2. **Configure RLS Policies**

   Run this SQL in SQL Editor:

   ```sql
   -- Allow authenticated users to upload to their own folder
   CREATE POLICY "Users can upload to own folder"
   ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (
     bucket_id = 'user-images' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );

   -- Allow authenticated users to update their own files
   CREATE POLICY "Users can update own files"
   ON storage.objects FOR UPDATE TO authenticated
   USING (
     bucket_id = 'user-images' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );

   -- Allow authenticated users to delete their own files
   CREATE POLICY "Users can delete own files"
   ON storage.objects FOR DELETE TO authenticated
   USING (
     bucket_id = 'user-images' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );

   -- Allow public read access
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'user-images');
   ```

3. **Check CORS Settings**
   - Go to Settings → API
   - Verify CORS is enabled for your domain
   - For testing, allow `*` (wildcard)

### In Your Project

1. **Environment Variables**

   Verify `.env` file contains:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **Test Connection**

   Check the app logs on startup:

   ```
   ✅ Storage bucket verified: user-images
   📁 Bucket is accessible and ready for uploads
   ```

## Troubleshooting Steps

### Step 1: Check Network Connectivity

```bash
# Test if you can reach Supabase
curl https://your-project.supabase.co/storage/v1/bucket
```

### Step 2: Verify Bucket Exists

1. Open Supabase Dashboard
2. Go to Storage
3. Confirm `user-images` bucket exists and is Public

### Step 3: Test RLS Policies

For testing, you can use simplified policies (⚠️ **TEMPORARY ONLY**):

```sql
-- Drop all policies
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

-- Super permissive test policies
CREATE POLICY "Allow all authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-images');

CREATE POLICY "Allow all authenticated updates"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'user-images');

CREATE POLICY "Allow all reads"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-images');
```

If uploads work with these policies, the issue was with path checking.
**Remember to restore secure policies after testing!**

### Step 4: Check Device/Emulator Network

**Physical Device**:

- Ensure device has internet access
- Try switching between WiFi and mobile data
- Check if firewall/VPN is blocking Supabase

**Android Emulator**:

- Emulator should have network access by default
- Restart emulator if network issues persist

**iOS Simulator**:

- Should inherit Mac's network connection
- Restart simulator if issues occur

### Step 5: Enable Detailed Logging

The app now logs detailed information:

- Connectivity tests
- Bucket verification
- Upload attempts with retry count
- Error details with suggestions

Watch for:

```
🔍 Testing Supabase connectivity...
✅ Supabase connection OK, found X buckets
📤 Starting image upload to Supabase Storage... (Attempt 1/4)
```

## Common Issues & Solutions

### "Network request failed"

**Causes**:

- No internet connection
- Supabase project is paused
- Incorrect Supabase URL
- CORS blocking request

**Solution**: Check all configuration steps above

### "Bucket not found"

**Cause**: Bucket doesn't exist or wrong name

**Solution**:

1. Create bucket in Supabase Dashboard
2. Name it exactly `user-images` (lowercase)
3. Make it Public

### "Permission denied"

**Cause**: RLS policies blocking upload

**Solution**: Apply the SQL policies above

### "Upload timeout"

**Causes**:

- Poor network connection
- Large file size
- Server issues

**Solution**:

- Retry automatically happens
- Check network speed
- Image is compressed to <200KB

## Features Added

1. **Automatic Retry**: Up to 3 retries with 1-second delay
2. **Timeout Protection**: 30-second timeout on uploads
3. **Connectivity Tests**: Pre-flight checks before upload
4. **Better Error Messages**: Detailed logging for debugging
5. **Network Diagnostics**: Tests connection to Supabase on startup

## Testing the Fix

1. Clear Metro cache:

   ```powershell
   npx expo start -c
   ```

2. Watch logs for initialization:

   ```
   🔧 Initializing Supabase Storage bucket: user-images
   🔍 Test 1: Checking Supabase connectivity...
   ✅ Connected! Found buckets: user-images
   ```

3. Try uploading a profile image

4. Look for retry messages:
   ```
   📤 Starting image upload to Supabase Storage... (Attempt 1/4)
   ⏳ Retrying in 1000ms... (if first attempt fails)
   ✅ Image uploaded successfully
   ```

## Need More Help?

If issues persist:

1. Check Supabase Dashboard → Project Settings → API

   - Verify URL and keys
   - Check if project is active

2. Enable Network Inspector in Expo:

   - Press `m` in Metro terminal
   - Select "Enable Network Inspect"

3. Check Supabase logs:

   - Supabase Dashboard → Logs
   - Look for storage-related errors

4. Contact support with:
   - Complete error logs
   - Supabase bucket configuration
   - RLS policies in use
