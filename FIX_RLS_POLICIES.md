# CRITICAL FIX NEEDED: Row Level Security Policies

## Current Issue

✅ **User sign up successful** - User created in Supabase Auth  
❌ **Profile creation failed** - RLS policy blocking insert  
❌ **Settings creation failed** - RLS policy blocking insert

**Error**: `new row violates row-level security policy for table "user_profiles"`

## Why This Happens

When a user signs up:

1. Supabase creates the auth user ✅
2. App tries to create profile in `user_profiles` table ❌
3. **Problem**: User isn't fully "logged in" yet when profile is being created
4. RLS policy blocks the insert because it checks `auth.uid()` which might be null during sign up

## IMMEDIATE FIX (Choose One)

### Option 1: Use Database Trigger (RECOMMENDED ⭐)

This is the best approach - automatically create profile when user signs up.

**Steps:**

1. **Go to Supabase Dashboard**:

   ```
   https://supabase.com/dashboard/project/wmhiwieooqfwkrdcvqvb/sql/new
   ```

2. **Paste this SQL and click "Run"**:

```sql
-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );

  INSERT INTO public.app_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that runs after user sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

3. **Update RLS Policy** to allow the trigger to insert:

```sql
-- Allow service role to insert (for triggers)
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can insert own settings" ON app_settings;
CREATE POLICY "Users can insert own settings"
  ON app_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
```

4. **Remove profile creation from Sign Up screen** - It's now automatic!

---

### Option 2: Fix RLS Policies (Quick but less ideal)

Temporarily allow any authenticated user to insert their own row.

**Steps:**

1. **Go to Supabase Dashboard**:

   ```
   https://supabase.com/dashboard/project/wmhiwieooqfwkrdcvqvb/sql/new
   ```

2. **Run this SQL**:

```sql
-- Update user_profiles policy
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (true); -- Allow any insert temporarily

-- Update app_settings policy
DROP POLICY IF EXISTS "Users can insert own settings" ON app_settings;
CREATE POLICY "Users can insert own settings"
  ON app_settings FOR INSERT
  WITH CHECK (true); -- Allow any insert temporarily

-- But restrict SELECT/UPDATE/DELETE to own data only
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

**⚠️ Warning**: This allows anyone to insert profiles. It's okay for development but should be fixed for production.

---

### Option 3: Disable RLS Temporarily (Development Only ⚠️)

**ONLY FOR DEVELOPMENT - NOT FOR PRODUCTION**

1. **Go to Supabase Dashboard**:

   ```
   https://supabase.com/dashboard/project/wmhiwieooqfwkrdcvqvb/editor
   ```

2. **Click on `user_profiles` table**

3. **Click the shield icon** at the top (RLS badge)

4. **Toggle "Enable RLS"** to OFF

5. **Repeat for `app_settings` table**

6. **Try signing up again** - should work!

7. **Remember to re-enable RLS later!**

---

## Which Option Should You Use?

| Option                     | Pros                                                  | Cons                   | Best For            |
| -------------------------- | ----------------------------------------------------- | ---------------------- | ------------------- |
| **Option 1: Trigger**      | ✅ Most secure<br>✅ Automatic<br>✅ Production-ready | Requires SQL knowledge | Production apps     |
| **Option 2: Fix Policies** | ✅ Quick fix<br>✅ Keep RLS enabled                   | ⚠️ Less secure         | Testing/Development |
| **Option 3: Disable RLS**  | ✅ Fastest<br>✅ No SQL needed                        | ❌ Very insecure       | Local dev only      |

**Recommendation**: Use **Option 1 (Database Trigger)** for the best solution.

---

## After Applying Fix

### Test the Fix:

1. **Clear existing test users** (optional):

   ```
   Go to: Authentication → Users
   Delete the test user: rahulmirji444@gmail.com
   ```

2. **Try signing up again**:

   - Open your app
   - Go to Sign Up
   - Enter:
     - Name: Test User
     - Email: your-email@example.com
     - Password: Test123!
   - Click Sign Up

3. **Check if it worked**:

   ```
   Go to: Table Editor → user_profiles
   Should see new row with your email

   Go to: Table Editor → app_settings
   Should see new row with same user_id
   ```

4. **Try signing in**:
   - Go to Sign In screen
   - Enter email and password
   - Should redirect to home! ✅

---

## Alternative: Simplify Sign Up (Remove Profile Creation)

If you want to keep it simple, remove profile creation from Sign Up and let users create profiles later:

**Update `screens/auth/SignUpScreen.tsx`**:

```typescript
// Remove the profile and settings creation
// Just do the auth signup:

const { data: authData, error: authError } = await supabase.auth.signUp({
  email: email.trim(),
  password: password,
  options: {
    data: {
      name: name.trim(),
    },
  },
});

if (authError) throw authError;

// That's it! Show success and redirect to sign in
Alert.alert("Success!", "Your account has been created. You can now sign in.", [
  { text: "OK", onPress: () => router.replace("/auth/sign-in") },
]);
```

Then create profile on first app load or in settings.

---

## Summary

**Current State**:

- ✅ Supabase Auth working
- ✅ User creation working
- ❌ Profile creation blocked by RLS
- ❌ Settings creation blocked by RLS

**After Fix**:

- ✅ Supabase Auth working
- ✅ User creation working
- ✅ Profile creation working (via trigger or updated policy)
- ✅ Settings creation working (via trigger or updated policy)
- ✅ Sign in working
- ✅ No more onboarding loop!

**Recommended Fix**: Use **Database Trigger (Option 1)** for production-ready solution.

Let me know which option you want to use, and I'll help you implement it!
