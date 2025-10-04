# Developer Guide: Using User Data from Supabase

## Quick Start

### Accessing User Data in Your Components

```typescript
import { useUserProfile, useAuthStore } from '@/store/authStore';

function MyComponent() {
  const userProfile = useUserProfile();
  
  return (
    <View>
      <Text>Hello, {userProfile.name}!</Text>
      <Text>{userProfile.email}</Text>
    </View>
  );
}
```

## Available Hooks

### 1. Get User Profile
```typescript
const userProfile = useUserProfile();
// Returns: { name, email, phone?, age?, gender?, bio?, profileImage? }
```

### 2. Check Authentication Status
```typescript
const isAuthenticated = useIsAuthenticated();
// Returns: boolean
```

### 3. Get App Settings
```typescript
const settings = useAppSettings();
// Returns: { useCloudAI, saveHistory, voiceEnabled, isDarkMode }
```

### 4. Get Dark Mode Status
```typescript
const isDarkMode = useIsDarkMode();
// Returns: boolean
```

### 5. Full Store Access
```typescript
const { 
  userProfile, 
  isAuthenticated, 
  session,
  updateUserProfile, 
  logout 
} = useAuthStore();
```

## Common Operations

### Update User Profile

```typescript
import { useAuthStore } from '@/store/authStore';

function EditProfile() {
  const { updateUserProfile } = useAuthStore();
  
  const handleSave = async () => {
    try {
      await updateUserProfile({
        phone: '+1 555-0123',
        age: '32',
        bio: 'Fashion enthusiast'
      });
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };
  
  return <Button onPress={handleSave} title="Save" />;
}
```

### Logout

```typescript
import { useAuthStore } from '@/store/authStore';
import { router } from 'expo-router';

function LogoutButton() {
  const { logout } = useAuthStore();
  
  const handleLogout = async () => {
    await logout();
    router.replace('/auth/sign-in');
  };
  
  return <Button onPress={handleLogout} title="Logout" />;
}
```

### Check if User Has Complete Profile

```typescript
const userProfile = useUserProfile();

const isProfileComplete = !!(
  userProfile.name &&
  userProfile.email &&
  userProfile.phone &&
  userProfile.age
);

if (!isProfileComplete) {
  // Show complete profile prompt
}
```

### Display User Avatar

```typescript
import { Image, View } from 'react-native';
import { User } from 'lucide-react-native';
import { useUserProfile } from '@/store/authStore';

function UserAvatar() {
  const userProfile = useUserProfile();
  
  return (
    <View style={styles.avatar}>
      {userProfile.profileImage ? (
        <Image 
          source={{ uri: userProfile.profileImage }} 
          style={styles.avatarImage}
        />
      ) : (
        <User size={24} color="#8B5CF6" />
      )}
    </View>
  );
}
```

## Direct Supabase Queries

### Fetch User Profile Manually

```typescript
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

async function fetchUserProfile() {
  const { session } = useAuthStore.getState();
  
  if (!session?.user) return null;
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();
    
  if (error) {
    console.error('Error:', error);
    return null;
  }
  
  return data;
}
```

### Update Specific Fields

```typescript
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

async function updateProfilePhoto(photoUrl: string) {
  const { session } = useAuthStore.getState();
  
  if (!session?.user) return;
  
  const { error } = await supabase
    .from('user_profiles')
    .update({ 
      profile_image: photoUrl,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', session.user.id);
    
  if (error) {
    console.error('Error updating photo:', error);
    throw error;
  }
  
  // Update local state
  const { updateUserProfile } = useAuthStore.getState();
  await updateUserProfile({ profileImage: photoUrl });
}
```

## Component Examples

### Profile Summary Component

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUserProfile } from '@/store/authStore';

export function ProfileSummary() {
  const profile = useUserProfile();
  
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.email}>{profile.email}</Text>
      {profile.bio && (
        <Text style={styles.bio}>{profile.bio}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  name: { fontSize: 24, fontWeight: 'bold' },
  email: { fontSize: 16, color: '#666' },
  bio: { fontSize: 14, marginTop: 8 },
});
```

### Protected Route Component

```typescript
import { useIsAuthenticated } from '@/store/authStore';
import { Redirect } from 'expo-router';

export function ProtectedRoute({ children }) {
  const isAuthenticated = useIsAuthenticated();
  
  if (!isAuthenticated) {
    return <Redirect href="/auth/sign-in" />;
  }
  
  return children;
}
```

### Personalized Greeting

```typescript
import { useUserProfile } from '@/store/authStore';

export function PersonalizedGreeting() {
  const profile = useUserProfile();
  const hour = new Date().getHours();
  
  const greeting = hour < 12 ? 'Good morning' :
                   hour < 18 ? 'Good afternoon' :
                   'Good evening';
  
  return (
    <Text>
      {greeting}, {profile.name}! 👋
    </Text>
  );
}
```

## Testing Your Implementation

### 1. Test Data Fetching

```typescript
// Add this to your component
useEffect(() => {
  const profile = useAuthStore.getState().userProfile;
  console.log('Current user profile:', profile);
}, []);
```

### 2. Test Profile Updates

```typescript
const testUpdate = async () => {
  const { updateUserProfile } = useAuthStore.getState();
  
  console.log('Before:', useAuthStore.getState().userProfile);
  
  await updateUserProfile({ bio: 'Test bio' });
  
  console.log('After:', useAuthStore.getState().userProfile);
};
```

### 3. Test Session State

```typescript
const { session } = useAuthStore();
console.log('Current session:', session);
console.log('User ID:', session?.user?.id);
console.log('Email:', session?.user?.email);
```

## Best Practices

### 1. Always Check for Null/Undefined

```typescript
const profile = useUserProfile();

// ✅ Good
const displayName = profile?.name || 'Guest';

// ❌ Bad
const displayName = profile.name; // Could be undefined
```

### 2. Handle Loading States

```typescript
const { isLoading, userProfile } = useAuthStore();

if (isLoading) {
  return <LoadingSpinner />;
}

return <ProfileDisplay profile={userProfile} />;
```

### 3. Error Handling

```typescript
try {
  await updateUserProfile(newData);
} catch (error) {
  console.error('Profile update failed:', error);
  Alert.alert('Error', 'Failed to update profile. Please try again.');
}
```

### 4. Use Memoization for Computed Values

```typescript
import { useMemo } from 'react';

const isProfileComplete = useMemo(() => {
  return !!(
    userProfile.name &&
    userProfile.email &&
    userProfile.phone &&
    userProfile.age
  );
}, [userProfile]);
```

## Troubleshooting

### Profile Not Showing After Login

1. Check console for "User profile loaded from Supabase"
2. Verify session exists: `console.log(useAuthStore.getState().session)`
3. Check Supabase table has data: Query `user_profiles` table
4. Ensure RLS policies allow reading user's own profile

### Profile Updates Not Saving

1. Check network request in developer tools
2. Verify Supabase RLS policies allow updates
3. Check for error messages in console
4. Ensure user is authenticated: `console.log(session?.user?.id)`

### Data Not Syncing

1. Check AsyncStorage: `AsyncStorage.getItem('user_profile')`
2. Verify auth state listener is working
3. Clear cache: `await AsyncStorage.clear()`
4. Restart app

## Advanced Usage

### Listen to Profile Changes

```typescript
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

function MyComponent() {
  const userProfile = useAuthStore((state) => state.userProfile);
  
  useEffect(() => {
    console.log('Profile changed:', userProfile);
    // Do something when profile updates
  }, [userProfile]);
}
```

### Conditional Rendering Based on Profile

```typescript
const profile = useUserProfile();

return (
  <View>
    {profile.age && parseInt(profile.age) >= 18 ? (
      <AdultContent />
    ) : (
      <GeneralContent />
    )}
  </View>
);
```

### Profile Completion Percentage

```typescript
function calculateProfileCompletion(profile: UserProfile): number {
  const fields = [
    profile.name,
    profile.email,
    profile.phone,
    profile.age,
    profile.gender,
    profile.bio,
    profile.profileImage
  ];
  
  const filledFields = fields.filter(field => !!field).length;
  return Math.round((filledFields / fields.length) * 100);
}

// Usage
const profile = useUserProfile();
const completion = calculateProfileCompletion(profile);

<Text>Profile {completion}% complete</Text>
```

## API Reference

### UserProfile Type

```typescript
interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  age?: string;
  gender?: 'male' | 'female' | 'other' | '';
  bio?: string;
  profileImage?: string;
}
```

### Session Type

```typescript
interface Session {
  user: {
    id: string;
    email: string;
    // ... other Supabase user fields
  };
  access_token: string;
  refresh_token: string;
  expires_at: number;
}
```

---

## Need Help?

Check the implementation files:
- `store/authStore.ts` - Main store logic
- `contexts/AppContext.tsx` - Alternative context API
- `components/UserProfileCard.tsx` - Example usage
- `screens/ProfileScreen.tsx` - Full profile implementation

**Happy coding! 🚀**
