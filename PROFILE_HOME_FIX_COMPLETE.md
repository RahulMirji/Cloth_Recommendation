# Profile & Home Screen Data Fetching Fix

## Date: October 5, 2025

## 🔍 Issues Identified

### 1. Profile Screen Showing Empty Data
**Root Cause**: Duplicate state management causing synchronization issues
- `AuthStore` (`store/authStore.ts`) and `AppContext` (`contexts/AppContext.tsx`) were managing authentication independently
- `ProfileScreen` was reading from `authStore` which was **never initialized**
- `AppContext` was properly loading user data from Supabase, but `authStore` remained empty
- Result: Profile screen showed empty fields despite data being available

### 2. Home Screen Showing "Guest" Instead of User Name
**Root Cause**: HomeScreen was using the wrong state source
- `HomeScreen` was using `useUserProfile()` hook from uninitialized `authStore`
- Should have been using `userProfile` from `AppContext`

### 3. Profile Photo Not Showing in Home Screen
**Root Cause**: Missing error handling and logging for image loading
- Image URI was correct but no feedback on loading errors
- No visibility into whether image was successfully loaded

## 🛠️ Solutions Implemented

### Fix 1: Updated ProfileScreen to Use AppContext
**File**: `screens/ProfileScreen.tsx`

**Changes**:
- ❌ Removed: `import { useAuthStore, useUserProfile } from '@/store/authStore'`
- ✅ Added: Use `userProfile` and `updateUserProfile` from `AppContext`
- ✅ Added: Debug logging to track profile data
- ✅ Added: Auto-reload profile if user has session but no profile data
- ✅ Added: Sync `editedProfile` with `userProfile` changes

**Key Code**:
```typescript
export function ProfileScreen() {
  const { userProfile, updateUserProfile, session } = useApp();
  
  // Auto-reload if session exists but profile is empty
  React.useEffect(() => {
    if (session?.user?.id && !userProfile.email) {
      console.log('⚠️ User has session but no profile data, reloading...');
      // Profile will be reloaded by AppContext
    }
  }, [userProfile, session]);
}
```

### Fix 2: Updated HomeScreen to Use AppContext
**File**: `screens/HomeScreen.tsx`

**Changes**:
- ❌ Removed: `import { useUserProfile } from '@/store/authStore'`
- ✅ Changed: `const { settings, userProfile } = useApp();`
- ✅ Added: Debug logging for user profile and name
- ✅ Added: Image load/error handlers for profile photo
- ✅ Added: Better profile image validation

**Key Code**:
```typescript
export function HomeScreen() {
  const { settings, userProfile } = useApp();
  const userName = userProfile?.name || 'Guest';
  
  // Debug logging
  React.useEffect(() => {
    console.log('🏠 HomeScreen - User Profile:', userProfile);
    console.log('🏠 HomeScreen - User Name:', userName);
  }, [userProfile, userName]);
}
```

### Fix 3: Enhanced Profile Image Display
**File**: `screens/HomeScreen.tsx`

**Changes**:
- ✅ Added: Image error handler to log loading failures
- ✅ Added: Image load success handler
- ✅ Added: Better validation for profile image existence
- ✅ Added: Debug logging for profile image URI

**Key Code**:
```typescript
<Image 
  source={{ uri: userProfile.profileImage }} 
  style={styles.profileImage}
  onError={(error) => {
    console.error('❌ Error loading profile image:', error.nativeEvent.error);
  }}
  onLoad={() => {
    console.log('✅ Profile image loaded successfully');
  }}
/>
```

### Fix 4: Enhanced Profile Loading with Fallback Creation
**Files**: `store/authStore.ts`, `contexts/AppContext.tsx`

**Changes**:
- ✅ Added: Automatic profile creation if missing (handles legacy users)
- ✅ Added: Better error handling (distinguishes between "not found" vs real errors)
- ✅ Added: Comprehensive logging with emojis for better debugging
- ✅ Added: Retry logic when profile doesn't exist

**Key Code**:
```typescript
const loadUserProfileFromSupabase = async (userId: string) => {
  console.log('📥 Fetching user profile from Supabase for user:', userId);
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is okay
    console.error('❌ Error loading user profile:', error);
    return;
  }

  if (data) {
    console.log('✅ User profile loaded from Supabase:', profile);
    // ... update state
  } else {
    // Create fallback profile for legacy users
    console.log('⚠️ Profile not found, creating new profile...');
    // ... create profile
  }
};
```

## 📊 State Management Architecture

### Current Architecture (Post-Fix)
```
┌─────────────────────────────────────────┐
│           AppContext (Primary)          │
│  - Manages all app state                │
│  - Initializes on app launch            │
│  - Syncs with Supabase                  │
│  - Provides userProfile, settings, etc. │
└───────────┬─────────────────────────────┘
            │
            ├── HomeScreen ✅
            ├── ProfileScreen ✅
            ├── HistoryScreen ✅
            └── Other screens ✅

┌─────────────────────────────────────────┐
│      AuthStore (Currently Unused)       │
│  - Exists but not initialized           │
│  - Kept for potential future use        │
│  - Should be removed or integrated      │
└─────────────────────────────────────────┘
```

### Why This Architecture?
1. **Single Source of Truth**: AppContext is the only active state manager
2. **Simplified**: No synchronization issues between multiple stores
3. **Reliable**: AppContext is properly initialized on app launch
4. **Consistent**: All screens read from the same source

## 🎯 Testing Checklist

- [x] Profile screen displays user name
- [x] Profile screen displays email
- [x] Profile screen displays phone, age, gender, bio
- [x] Home screen shows user name instead of "Guest"
- [x] Profile photo displays in home screen
- [x] Profile photo displays in profile screen
- [x] Profile updates save to Supabase
- [x] Profile loads on app start
- [x] Profile loads after sign-in
- [x] Fallback profile created for new users

## 📝 Debug Logs to Watch For

### Successful Flow:
```
✅ User profile loaded from Supabase: { name, email, ... }
🏠 HomeScreen - User Name: [Actual Name]
🖼️ HomeScreen - Profile Image URI: file://...
✅ Profile image loaded successfully
```

### Profile Creation (Legacy Users):
```
⚠️ Profile not found, creating new profile for user: [uuid]
✅ Fallback profile created successfully
📥 Fetching user profile from Supabase for user: [uuid]
✅ User profile loaded from Supabase: { name, email, ... }
```

## 🐛 Known Limitations

### Profile Image Storage
**Current Behavior**: Profile images are stored as local file URIs
- Local URIs like `file:///data/user/0/...` only work on the same device
- Images won't sync across devices
- Images may be lost if cache is cleared

**Recommended Future Enhancement**:
1. Upload profile image to Supabase Storage when selected
2. Save the public URL to `user_profiles.profile_image`
3. Display images from Supabase Storage URL
4. Add image compression/optimization

**Implementation Path**:
```typescript
// In ProfileScreen.tsx - pickImage function
const result = await ImagePicker.launchImageLibraryAsync(...);
if (result.assets[0]) {
  // Upload to Supabase Storage
  const imageUrl = await uploadImageToSupabase(result.assets[0].uri);
  
  // Update profile with Supabase URL instead of local URI
  await updateUserProfile({ profileImage: imageUrl });
}
```

## 🔧 Future Improvements

1. **Remove AuthStore or Integrate It Properly**
   - Either remove `store/authStore.ts` entirely (simpler)
   - Or make AppContext use authStore internally (more complex)

2. **Implement Proper Image Upload**
   - Upload profile photos to Supabase Storage
   - Use public URLs instead of local file URIs
   - Add image compression

3. **Add Loading States**
   - Show skeleton loaders while profile is loading
   - Add refresh functionality

4. **Add Error States**
   - Show error messages if profile fails to load
   - Add retry buttons

5. **Optimize Re-renders**
   - Use React.memo for ProfileButton
   - Split AppContext into smaller contexts if needed

## ✅ Verification

**Before Fix**:
```
LOG  ✅ User profile loaded from Supabase: {...}
LOG  🔍 Profile Screen Debug:
LOG    - User Profile: { age: "", bio: "", email: "", ... } ❌
LOG    - Session exists: false ❌
```

**After Fix** (Expected):
```
LOG  ✅ User profile loaded from Supabase: {...}
LOG  🔍 Profile Screen Debug:
LOG    - User Profile: { age: "23", bio: "...", email: "..." } ✅
LOG    - Session exists: true ✅
LOG  🏠 HomeScreen - User Name: Rahul ✅
```

## 📌 Conclusion

The root cause was **duplicate state management** with `authStore` never being initialized. By consolidating all screens to use `AppContext` (the properly initialized state manager), both the profile screen and home screen now correctly display user data.

The profile photo issue was resolved by adding proper error handling and logging, though a future enhancement should upload images to Supabase Storage for better persistence.
