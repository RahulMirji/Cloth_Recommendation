# User Profile Display - Visual Guide

## What You'll See After Login

### 1. Home Screen with User Profile Card

After logging in, the home screen now displays a beautiful user profile card showing:

```
┌─────────────────────────────────────────────┐
│                                             │
│  👋 Welcome Back, [User Name]!             │
│  Discover your perfect look                │
│                                             │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │  🧑  [Name]                          │   │
│  │     ✉️  [Email]                      │   │
│  │     📞  [Phone]                      │   │
│  │     📅  [Age] years old              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  📷 AI Stylist                       │   │
│  │  Get personalized styling advice    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  ✨ Outfit Scorer                    │   │
│  │  Rate your outfit combinations      │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### 2. Profile Card Features

The profile card displays:
- **Avatar**: Profile picture or user icon placeholder
- **Name**: User's full name (prominently displayed)
- **Email**: User's email address with mail icon
- **Phone**: Phone number if provided (with phone icon)
- **Age**: User's age if provided (with calendar icon)

### 3. Interactive Elements

- **Tap the card** → Navigate to full Profile Screen
- **Glassmorphism effect** → Semi-transparent with blur
- **Dark mode support** → Automatically adapts to theme
- **Smooth animations** → Elegant transitions

### 4. Data Flow Visualization

```
User Logs In
     ↓
Supabase Auth
     ↓
Session Created
     ↓
Auth Store Listener Triggered
     ↓
Fetch from user_profiles table
     ↓
Data Loaded to Store
     ↓
UI Auto-Updates
     ↓
Profile Card Displayed
```

### 5. Profile Completion States

#### Complete Profile
```
┌────────────────────────────┐
│  [Profile Photo]           │
│  John Doe                  │
│  ✉️  john@example.com      │
│  📞  +1 234-567-8900       │
│  📅  28 years old          │
└────────────────────────────┘
```

#### Minimal Profile (just name & email)
```
┌────────────────────────────┐
│  👤 (icon)                 │
│  Jane Smith                │
│  ✉️  jane@example.com      │
└────────────────────────────┘
```

### 6. User Journey Example

1. **Sign Up**
   - User creates account: "Alice Cooper" with "alice@email.com"
   - Profile created in Supabase automatically

2. **First Sign In**
   - User logs in
   - App fetches profile from Supabase
   - Home screen shows: "Welcome Back, Alice!"
   - Profile card displays Alice's information

3. **Edit Profile**
   - User taps profile card
   - Profile screen opens
   - User adds phone: "+1 555-0123"
   - User adds age: "32"
   - Changes saved to Supabase

4. **Sign Out & Sign In Again**
   - User logs out
   - User logs back in
   - All profile data including phone and age still there!
   - Data persisted in Supabase ✅

### 7. Behind the Scenes

When you sign in, the app:
1. ✅ Authenticates with Supabase
2. ✅ Receives auth session
3. ✅ Queries `user_profiles` table
4. ✅ Fetches your data: name, email, phone, age, gender, bio, photo
5. ✅ Stores in app state (Zustand)
6. ✅ Caches in AsyncStorage
7. ✅ Displays in UI components

### 8. Color & Design

- **Light Mode**: Clean white card with soft shadows
- **Dark Mode**: Semi-transparent dark card with glow
- **Gradient**: Purple to pink gradient background
- **Icons**: Lucide icons with consistent sizing
- **Typography**: Clear hierarchy with bold names

### 9. Responsive Behavior

- **Loading**: Shows loading state while fetching
- **Error**: Gracefully handles network errors
- **Offline**: Shows cached data if available
- **Empty**: Handles missing optional fields elegantly

### 10. Testing Checklist

Try these to see it in action:

- [ ] Sign up with a new account
- [ ] Check home screen shows your name
- [ ] Tap profile card to open full profile
- [ ] Edit your profile (add phone, age)
- [ ] Log out
- [ ] Log back in
- [ ] Verify all changes are still there
- [ ] Toggle dark mode - see card adapt
- [ ] Check console logs for "User profile loaded from Supabase"

---

## Developer Notes

### Key Components

1. **UserProfileCard** (`components/UserProfileCard.tsx`)
   - Displays user info in card format
   - Handles missing data gracefully
   - Dark mode aware

2. **AuthStore** (`store/authStore.ts`)
   - Manages auth state
   - Fetches from Supabase
   - Syncs with AsyncStorage

3. **HomeScreen** (`screens/HomeScreen.tsx`)
   - Shows UserProfileCard
   - Conditional rendering (only if authenticated)

### Hooks to Use

```typescript
// Get user profile data
const userProfile = useUserProfile();

// Check authentication
const isAuthenticated = useIsAuthenticated();

// Get dark mode setting
const isDarkMode = useIsDarkMode();

// Update profile
const { updateUserProfile } = useAuthStore();
```

### Sample Profile Data Structure

```typescript
{
  name: "Alice Cooper",
  email: "alice@example.com",
  phone: "+1 555-0123",
  age: "32",
  gender: "female",
  bio: "Fashion enthusiast",
  profileImage: "https://..."
}
```

---

**Result**: Beautiful, functional user profile display powered by real Supabase data! 🎉
