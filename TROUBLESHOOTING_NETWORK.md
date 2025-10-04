# Troubleshooting Guide - Network Errors

## Current Error

```
wmhiwieooqfwkrdcvqvb.supabase.co/auth/v1/signup:1 Failed to load resource: net::ERR_INTERNET_DISCONNECTED
TypeError: Failed to fetch
```

## What This Means

The app is trying to connect to Supabase authentication service but cannot reach it due to:

1. Internet connection issues
2. Firewall blocking the connection
3. Network configuration problems

## Quick Fixes

### 1. Check Internet Connection

```bash
# Test if you can reach Supabase
ping wmhiwieooqfwkrdcvqvb.supabase.co
```

If ping fails, check:

- ✅ WiFi/Ethernet is connected
- ✅ Other websites load in browser
- ✅ No VPN blocking connections

### 2. Test Supabase Connection in Browser

Open in your browser:

```
https://wmhiwieooqfwkrdcvqvb.supabase.co/
```

You should see: `{"msg":"supabase is running"}`

If you see this, Supabase is accessible and the issue might be:

- CORS (Cross-Origin) issues in web dev
- Firewall blocking fetch requests
- Antivirus blocking API calls

### 3. Check Environment Variables

Verify `.env` file has correct values:

```bash
# In PowerShell
Get-Content .env
```

Should show:

```env
EXPO_PUBLIC_SUPABASE_URL=https://wmhiwieooqfwkrdcvqvb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Restart Development Server

Sometimes the .env changes don't load:

```bash
# Stop the server (Ctrl+C or in terminal)
# Clear cache and restart
npx expo start --clear
```

### 5. Test on Physical Device (Not Web)

The web version might have CORS issues. Try on mobile:

1. Install Expo Go app on your phone
2. Scan QR code from `npx expo start`
3. Try signing up on mobile device

Mobile apps don't have CORS restrictions and should work better.

### 6. Check Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Open your project (wmhiwieooqfwkrdcvqvb)
3. Go to Settings → API
4. Verify:
   - ✅ Project URL matches .env
   - ✅ anon/public key matches .env
   - ✅ Project is not paused

### 7. Temporarily Disable Firewall/Antivirus

Sometimes Windows Firewall or antivirus blocks API requests:

```powershell
# Check Windows Firewall (run as Administrator)
Get-NetFirewallProfile | Select-Object Name, Enabled

# Temporarily disable (for testing only)
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Re-enable after testing
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

## Alternative: Test with Mock Data (Development Only)

If you need to continue development without Supabase access, you can temporarily mock the auth:

### Create a mock auth file:

**`lib/mockAuth.ts`**:

```typescript
export const mockAuth = {
  async signUp(email: string, password: string, name: string) {
    console.log("MOCK: Sign up", email, name);
    return {
      data: {
        user: {
          id: "mock-user-id",
          email,
          user_metadata: { name },
        },
      },
      error: null,
    };
  },

  async signIn(email: string, password: string) {
    console.log("MOCK: Sign in", email);
    return {
      data: {
        session: {
          user: {
            id: "mock-user-id",
            email,
          },
        },
      },
      error: null,
    };
  },
};
```

Then in your auth screens, wrap the Supabase calls:

```typescript
const USE_MOCK = false; // Set to true for offline development

if (USE_MOCK) {
  const result = await mockAuth.signUp(email, password, name);
} else {
  const result = await supabase.auth.signUp(...);
}
```

## Warning Messages (Safe to Ignore)

These warnings don't affect functionality:

### ✅ Safe Warnings:

```
"shadow*" style props are deprecated. Use "boxShadow"
"textShadow*" style props are deprecated. Use "textShadow"
[expo-av]: Expo AV has been deprecated
props.pointerEvents is deprecated. Use style.pointerEvents
```

These are from third-party libraries and will be fixed in future updates.

## Verification Steps After Fix

Once internet is restored, test:

1. **Sign Up Flow**:

   ```
   Open app → Tutorial → Sign Up
   Enter: Name, Email, Password
   Click "Sign Up"
   Should see: "Check your email" message
   ```

2. **Check Supabase Dashboard**:

   ```
   Authentication → Users
   Should see new user created
   ```

3. **Check Database**:

   ```
   Table Editor → user_profiles
   Should see new profile row
   ```

4. **Sign In Flow**:
   ```
   Go to Sign In
   Enter email and password
   Should redirect to home screen
   ```

## Still Having Issues?

### Check Browser Console

Press F12 → Console tab → Look for:

- ❌ Red errors (need fixing)
- ⚠️ Yellow warnings (safe to ignore)

Common errors and solutions:

| Error                       | Solution                       |
| --------------------------- | ------------------------------ |
| "Failed to fetch"           | Check internet connection      |
| "Invalid API key"           | Check .env file                |
| "Email already exists"      | Use different email or sign in |
| "Invalid login credentials" | Check email/password spelling  |
| "Network request failed"    | Restart dev server             |
| "CORS error"                | Test on mobile device          |

### Try Different Network

If on corporate/school network:

- Try personal hotspot from phone
- Try different WiFi network
- Corporate firewalls often block API requests

### Contact Support

If nothing works:

1. Check Supabase status: https://status.supabase.com/
2. Check Supabase community: https://github.com/supabase/supabase/discussions
3. Verify project isn't paused due to inactivity

## Success!

When working, you should see:

```
✅ App loads without red errors
✅ Can navigate to Sign Up screen
✅ Can submit form without "Failed to fetch"
✅ See "Check your email" success message
✅ User appears in Supabase dashboard
```

## Summary

**Most Likely Fix**:

1. Check internet connection
2. Restart Expo dev server with `npx expo start --clear`
3. Test on mobile device instead of web

**If Offline**:
Use mock authentication for development

**Production**:
These network errors won't happen in production builds - only during development with hot reload.
