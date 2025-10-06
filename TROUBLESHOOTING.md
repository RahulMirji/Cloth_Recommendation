# Troubleshooting Guide - Expo Go Crashes

## Recent Changes (Enhancements Branch)

### What Was Changed:
1. ✅ Created `app/index.tsx` - Entry point route for authentication routing
2. ✅ Updated `app/_layout.tsx` - Simplified routing logic
3. ✅ Added auth protection to `app/(tabs)/_layout.tsx`
4. ✅ Created custom alert system with gradient UI
5. ✅ Updated onboarding to use web-style gradients
6. ✅ Fixed outfit history thumbnail layout
7. ✅ Removed `newArchEnabled: false` from `app.json`

### Potential Issues & Solutions:

#### Issue 1: App crashes on launch in Expo Go
**Symptoms:** App builds successfully but crashes when opening in Expo Go

**Possible Causes:**
1. **Routing conflicts** - Multiple redirects happening simultaneously
2. **Context initialization** - AppContext might not be ready before routes render
3. **Async storage issues** - Auth check might be timing out

**Solutions:**
```typescript
// Already implemented in app/index.tsx:
- Added useEffect with setTimeout delay (100ms) before redirect
- This ensures app is fully mounted before navigation

// Already implemented in app/(tabs)/_layout.tsx:
- Return null while checking auth or if not authenticated
- This prevents rendering protected routes before auth check completes
```

#### Issue 2: expo-av deprecation warning
**Symptoms:** Warning about expo-av being deprecated

**Solution:** This is just a warning, not causing crashes. Can be ignored for now or replaced later.

#### Issue 3: New Architecture warning (FIXED)
**Symptoms:** Warning about newArchEnabled in app.json

**Solution:** ✅ Already removed `newArchEnabled: false` from app.json

### Testing Steps:

1. **Clear everything and restart:**
   ```powershell
   npx expo start -c
   ```

2. **Test in Expo Go:**
   - Scan QR code
   - Check if app loads to sign-in screen
   - Try logging in with existing account
   - Verify no onboarding shown for logged-in users

3. **Check for specific errors:**
   - Look at Metro bundler terminal output
   - Check Expo Go app for specific error messages
   - Use `r` to reload if needed

### Debugging Commands:

```powershell
# Clear cache and restart
npx expo start -c

# Check for TypeScript errors
npx tsc --noEmit

# Run on specific platform
npx expo start --android
npx expo start --ios
npx expo start --web

# View logs
npx expo start --no-dev --minify
```

### Rollback Plan (If Needed):

If issues persist, can revert specific changes:

1. **Revert routing changes:**
   ```powershell
   git checkout master -- app/_layout.tsx
   git checkout master -- app/(tabs)/_layout.tsx
   rm app/index.tsx
   ```

2. **Keep visual enhancements:**
   - CustomAlert components
   - Onboarding improvements
   - History card layout
   - These are cosmetic and shouldn't cause crashes

### Current Architecture:

```
app/
├── index.tsx (NEW) ← Entry point, handles initial routing
├── _layout.tsx (MODIFIED) ← Simplified, no complex routing logic
├── (tabs)/
│   ├── _layout.tsx (MODIFIED) ← Protected with auth check
│   └── ...
├── auth/ ← Sign in/up/forgot password
├── onboarding-tutorial.tsx ← Tutorial slides
└── profile.tsx ← User profile modal
```

### Expected Flow:

1. **App launches** → `index.tsx`
2. **Check auth** → AppContext provides `isAuthenticated`
3. **Authenticated** → Navigate to `/(tabs)`
4. **Not authenticated** → Navigate to `/auth/sign-in`
5. **Sign in** → AppContext updates → Auto-navigate to `/(tabs)`
6. **Logout** → Navigate to `/auth/sign-in`

### If Still Crashing:

1. Check if removing `app/index.tsx` fixes it (use old routing)
2. Check console for specific error stack trace
3. Try on different device/simulator
4. Check if it's an Expo Go version issue
5. Consider using development build instead of Expo Go

## Contact Information:

If issues persist, provide:
- Exact error message from Expo Go
- Metro bundler terminal output
- Steps to reproduce
- Device/OS information
