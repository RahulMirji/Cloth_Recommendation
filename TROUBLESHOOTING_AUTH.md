# Troubleshooting Authentication Issues

## Current Error: 400 Bad Request on Sign In

You're seeing this error:

```
POST https://wmhiwieooqfwkrdcvqvb.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
```

### Possible Causes and Solutions:

### 1. **No Account Exists Yet** ✅ MOST LIKELY

**Problem**: You're trying to sign in, but you haven't created an account yet.

**Solution**:

1. Go to the **Sign Up** screen first
2. Create an account with:
   - Full Name: Your name
   - Email: Valid email address
   - Password: At least 6 characters
3. After successful sign up, go to **Sign In**
4. Enter your email and password

---

### 2. **Email Confirmation Required**

**Problem**: Supabase requires email verification before you can sign in.

**Check in Supabase Dashboard**:

1. Go to https://supabase.com/dashboard
2. Open your project (wmhiwieooqfwkrdcvqvb)
3. Go to **Authentication** → **Settings**
4. Check if **"Enable email confirmations"** is turned ON

**If it's ON**:

- After sign up, you MUST check your email inbox
- Click the verification link
- Then you can sign in

**To disable for development** (recommended):

1. In Supabase Dashboard → Authentication → Settings
2. Find "Enable email confirmations"
3. Turn it OFF
4. Click Save
5. Now you can sign in immediately after sign up

---

### 3. **Wrong Credentials**

**Problem**: Email or password doesn't match.

**Solution**:

- Double-check your email spelling
- Password is case-sensitive
- Use "Forgot Password" if you forgot it

---

### 4. **Email Format Invalid**

**Problem**: Email doesn't match required format.

**Solution**:

- Use format: `name@domain.com`
- No spaces
- Valid domain (.com, .net, .org, etc.)

---

### 5. **Password Too Short**

**Problem**: Password must be at least 6 characters.

**Solution**:

- Use at least 6 characters
- Mix letters, numbers, and symbols for security

---

## How to Fix Your Current Issue:

### Step 1: Check Supabase Email Confirmation Setting

1. **Go to Supabase Dashboard**:

   ```
   https://supabase.com/dashboard/project/wmhiwieooqfwkrdcvqvb/auth/users
   ```

2. **Check if you have any users**:

   - If you see users, one of them might be your test account
   - Note the email address

3. **Go to Settings**:

   ```
   https://supabase.com/dashboard/project/wmhiwieooqfwkrdcvqvb/settings/auth
   ```

4. **Scroll to "Email Auth"**:

   - Find "Enable email confirmations"
   - **For development**: Turn it OFF
   - **For production**: Keep it ON

5. **Save Changes**

### Step 2: Create a New Account

1. **Open your app**
2. **Go to Sign Up** (not Sign In)
3. **Fill in the form**:
   ```
   Name: Test User
   Email: your-email@example.com
   Password: Test123!
   ```
4. **Click "Sign Up"**

5. **If email confirmation is ON**:

   - Check your email inbox
   - Click the verification link
   - Come back to app

6. **If email confirmation is OFF**:
   - You'll see success message immediately
   - Go to Sign In screen

### Step 3: Sign In

1. **Go to Sign In** screen
2. **Enter the SAME credentials** you used to sign up:
   ```
   Email: your-email@example.com
   Password: Test123!
   ```
3. **Click "Sign In"**
4. **Should work!** ✅

---

## Still Not Working?

### Check Console Logs

The updated code now logs detailed information. Open browser console (F12) and look for:

```
Starting sign up for: [email]
Auth signup successful: [user-id]
Profile created successfully
Settings created successfully
```

Or for sign in:

```
Sign in successful, session created
```

### Common Console Errors:

**"Email already registered"**:

- Use Sign In instead of Sign Up
- Or use a different email for Sign Up

**"Invalid login credentials"**:

- Wrong email or password
- Use Forgot Password to reset

**"Email not confirmed"**:

- Check your email inbox
- Click verification link
- Then try signing in again

**"User not found"**:

- You haven't signed up yet
- Go to Sign Up screen first

---

## Quick Test Commands

### Test 1: Check if Supabase is reachable

```powershell
Test-NetConnection -ComputerName wmhiwieooqfwkrdcvqvb.supabase.co -Port 443
```

Should show: `TcpTestSucceeded: True`

### Test 2: Check environment variables

Open `d:\ai-dresser\.env` and verify:

```env
EXPO_PUBLIC_SUPABASE_URL=https://wmhiwieooqfwkrdcvqvb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Test 3: Restart with clear cache

```powershell
npx expo start --clear
```

---

## Recommended Settings for Development

In Supabase Dashboard → Authentication → Settings:

1. **Enable email confirmations**: ❌ OFF (easier for testing)
2. **Enable signup**: ✅ ON
3. **Minimum password length**: 6 characters
4. **Double opt-in for password resets**: ❌ OFF (easier for testing)

---

## Production Settings (when ready to launch)

In Supabase Dashboard → Authentication → Settings:

1. **Enable email confirmations**: ✅ ON (security)
2. **Enable signup**: ✅ ON
3. **Minimum password length**: 8+ characters
4. **Double opt-in for password resets**: ✅ ON (security)

---

## Next Steps

1. **Disable email confirmation in Supabase** (for easier development)
2. **Sign up with test account**
3. **Sign in with test account**
4. **Should work!** ✅

If you continue to see errors, check the browser console (F12) for detailed error messages. The updated code now logs everything.
