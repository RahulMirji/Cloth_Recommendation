# 📱 Frontend Documentation - Style GPT

**Last Updated**: November 5, 2025  
**Framework**: React Native 0.81.4 + Expo SDK 54  
**Routing**: Expo Router 6.0.12 (File-based)  
**Language**: TypeScript 5.9.2

---

## 📋 Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Navigation Architecture](#navigation-architecture)
4. [State Management](#state-management)
5. [Feature Modules](#feature-modules)
6. [UI Components](#ui-components)
7. [Styling & Theming](#styling--theming)
8. [Mobile Features](#mobile-features)
9. [Development Guide](#development-guide)

---

## 🛠️ Technology Stack

### Core Framework
```json
{
  "react": "19.1.0",
  "react-native": "0.81.4",
  "expo": "54.0.13",
  "expo-router": "6.0.12",
  "typescript": "5.9.2"
}
```

### Key Libraries
- **UI/Navigation**: Expo Router, React Navigation, Lucide React Native (icons)
- **State Management**: React Context API, React Query (@tanstack/react-query)
- **Storage**: AsyncStorage (@react-native-async-storage/async-storage)
- **Styling**: React Native StyleSheet, Expo Linear Gradient, NativeWind
- **Backend**: Supabase JS Client (@supabase/supabase-js)
- **Payment**: React Native Razorpay
- **Media**: expo-image-picker, expo-camera, expo-av
- **AI/Voice**: expo-speech, expo-speech-recognition, @react-native-voice/voice

---

## 📁 Project Structure

```
/
├── app/                          # Expo Router screens (file-based routing)
│   ├── _layout.tsx              # Root layout with auth navigation
│   ├── index.tsx                # Entry point / initial route
│   ├── (tabs)/                  # Tab navigation group
│   │   ├── _layout.tsx         # Tab bar configuration
│   │   ├── index.tsx           # Home tab
│   │   ├── history.tsx         # History tab
│   │   └── settings.tsx        # Settings tab
│   ├── auth/                    # Authentication screens
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── (admin)/                 # Admin routes
│   │   ├── _layout.tsx
│   │   ├── admin-login.tsx
│   │   └── admin-dashboard.tsx
│   ├── profile.tsx              # Profile modal
│   ├── ai-stylist.tsx          # AI Stylist full-screen modal
│   ├── outfit-scorer.tsx       # Outfit Scorer modal
│   └── ai-image-generator.tsx  # Image Gen modal
│
├── screens/                     # Reusable screen components
│   ├── HomeScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── UserInfoScreen.tsx
│   ├── auth/                    # Auth screen components
│   └── history/                 # History screen components
│
├── components/                  # Shared UI components
│   ├── PrimaryButton.tsx
│   ├── InputField.tsx
│   ├── GlassContainer.tsx
│   ├── CustomAlert.tsx
│   ├── CreditsCard.tsx
│   ├── Footer.tsx
│   └── RazorpayPayment.tsx
│
├── contexts/                    # Global state management
│   ├── AppContext.tsx          # Auth, user profile, settings
│   └── AlertContext.tsx        # Global alerts
│
├── constants/                   # App-wide constants
│   ├── colors.ts               # Color palette
│   ├── fonts.ts                # Typography scale
│   ├── strings.ts              # Static text strings
│   ├── ThemeConfig.ts          # Theme configuration
│   └── themedColors.ts         # Dynamic theme colors
│
├── hooks/                       # Custom React hooks
│   └── useImageUpload.ts       # Image upload to Supabase
│
├── OutfitScorer/               # Outfit Scorer feature module
├── AIStylist/                  # AI Stylist feature module
├── ImageGen/                   # Image Generator module
├── Dashboard/                  # Admin Dashboard module
│
└── lib/                         # Core utilities
    └── supabase.ts             # Supabase client setup
```

---

## 🧭 Navigation Architecture

### Root Layout (`app/_layout.tsx`)

```typescript
// Authentication-aware navigation
- Checks auth state with AppContext
- Redirects unauthenticated users to /auth/sign-in
- Redirects authenticated users to /(tabs)
- Manages splash screen
- Provides QueryClientProvider, AppProvider, AlertProvider
```

**Key Features**:
- ✅ Protected routes (auto-redirect based on auth state)
- ✅ Dark mode support (HeaderStyle adapts to theme)
- ✅ Global gesture handler root
- ✅ Loading state with ActivityIndicator

### Tab Navigation (`app/(tabs)/_layout.tsx`)

**3 Main Tabs**:
1. **Home** (`index.tsx`) - Feature cards for AI Stylist, Outfit Scorer, Image Gen
2. **History** (`history.tsx`) - Past analyses and chat sessions
3. **Settings** (`settings.tsx`) - App preferences, profile, dark mode

**Custom Header**:
- Logo with gradient icon (Shirt icon + "Style GPT")
- Profile button (top-right) - Opens `/profile` modal
- Dynamic theme (light/dark mode)

### Modal Screens

```typescript
// Modal Presentation Styles:
- profile.tsx          // presentation: 'modal'
- outfit-scorer.tsx    // presentation: 'modal'
- ai-stylist.tsx       // presentation: 'fullScreenModal'
- ai-image-generator.tsx // presentation: 'fullScreenModal'
```

### Authentication Flow

```
Unauthenticated:
  index.tsx → /auth/sign-in → Sign up/Forgot password

Authenticated:
  index.tsx → /(tabs) → Home/History/Settings
```

---

## 🔄 State Management

### 1. AppContext (`contexts/AppContext.tsx`)

**Purpose**: Global auth state, user profile, app settings

```typescript
interface AppContext {
  // Auth State
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  
  // User Profile
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  age?: string;
  gender?: 'male' | 'female' | 'other' | '';
  bio?: string;
  profileImage?: string;
}

interface AppSettings {
  useCloudAI: boolean;
  saveHistory: boolean;
  isDarkMode: boolean;
}
```

**Features**:
- ✅ Supabase auth listener (auto-updates on sign in/out)
- ✅ Auto-loads profile from `user_profiles` table
- ✅ Persists settings to AsyncStorage
- ✅ Syncs profile updates to Supabase

### 2. AlertContext (`contexts/AlertContext.tsx`)

**Purpose**: Global alert/notification system

```typescript
const { showAlert } = useAlert();

showAlert({
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message: string,
  buttons?: AlertButton[]
});
```

### 3. React Query

**Used for server state caching**:
- Admin dashboard stats
- User lists
- Payment records

---

## 🎯 Feature Modules

### 1. OutfitScorer Module (`/OutfitScorer/`)

**Purpose**: AI-powered outfit analysis with product recommendations

**Structure**:
```
OutfitScorer/
├── screens/
│   └── OutfitScorerScreen.tsx    # Main screen
├── components/
│   ├── CreditDisplay.tsx          # Show remaining credits
│   ├── OutOfCreditsModal.tsx      # Upgrade prompt
│   ├── PaymentUploadScreen.tsx    # Payment proof upload
│   ├── ProductRecommendations.tsx # Amazon product cards
│   └── ModelSelector.tsx          # AI model selector
├── services/
│   └── creditService.ts           # Credit system logic
├── utils/
│   ├── multiModelAI.ts            # Multi-AI model integration
│   ├── pollinationsAI.ts          # Free AI API
│   ├── productRecommendations.ts  # Generate Amazon links
│   ├── chatHistory.ts             # Save to Supabase
│   ├── supabaseStorage.ts         # Image uploads
│   └── globalModelManager.ts      # Model selection state
├── hooks/
│   └── useImageUpload.ts          # Image upload hook
└── types/
    └── chatHistory.types.ts       # TypeScript types
```

**User Flow**:
1. User captures/selects outfit image
2. Image uploaded to Supabase Storage (`outfit-images` bucket)
3. AI analyzes image (Pollinations AI or OpenAI GPT-4 Vision)
4. Returns outfit score (0-100) + feedback
5. Extracts missing items (e.g., "belt", "watch")
6. Generates Amazon product recommendations
7. Saves analysis to `analysis_history` table
8. Saves products to `product_recommendations` table
9. Displays results with purchasable links

**Credit System**:
- Free users: 5 analyses
- Paid users: 50 analyses
- Credit deduction on analysis
- Modal prompt when credits run out

---

### 2. AIStylist Module (`/AIStylist/`)

**Purpose**: Voice-interactive fashion advisor (Alexa-like experience)

**Structure**:
```
AIStylist/
├── screens/
│   └── AIStylistScreen.tsx        # Main screen with camera
├── utils/
│   ├── visionAPI.ts               # Image + text to AI
│   ├── audioUtils.ts              # STT (Whisper) + TTS
│   ├── contextManager.ts          # Conversation memory (last 5)
│   ├── streamingResponseHandler.ts # Instant acknowledgments
│   ├── voiceActivityDetection.ts  # Hands-free mode (VAD)
│   ├── pollinationsAI.ts          # Free AI API
│   ├── chatUtils.ts               # Chat session management
│   ├── storageService.ts          # Image uploads (enhanced vision)
│   └── supabaseStorage.ts         # Supabase storage helpers
└── types/
    └── index.ts                   # TypeScript interfaces
```

**User Flow**:
1. User grants camera + microphone permissions
2. Camera feed shows live video (front/back camera toggle)
3. **Button Mode**: Press & hold mic button to speak
4. **Hands-Free Mode**: AI auto-detects when user speaks (VAD)
5. User asks question (e.g., "How does this look?")
6. Audio recorded (expo-av)
7. **Instant acknowledgment** played (0ms latency, pre-generated)
8. **Parallel processing**:
   - Speech-to-Text (OpenAI Whisper API) - 3-5s
   - Image capture + upload (Supabase) - 2-3s
9. **Context resolution**: Check last 5 exchanges for references ("this", "that")
10. Vision API call (Pollinations AI) with image + question + context - 6-10s
11. Response stored in context memory (extracts items, colors, sentiment)
12. **Text-to-Speech**: Native TTS (mobile) or Pollinations TTS (web)
13. Audio played through device speakers
14. Session saved to `analysis_history` table on exit

**Alexa-Like Features**:
- ⚡ **Instant Acknowledgment** (<100ms response time)
- 🎤 **Voice Activity Detection** (hands-free mode)
- 🧠 **Context Memory** (remembers last 5 exchanges)
- 👁️ **Vision API** (understands outfit images)
- 🎵 **Natural Voice Output** (TTS)

**Performance**:
- Total time: ~14-16s from question to answer
- Perceived latency: <2s (instant ack)
- Target (future): <4s actual latency

---

### 3. ImageGen Module (`/ImageGen/`)

**Purpose**: AI-powered image generation (text-to-image)

**Structure**:
```
ImageGen/
├── screens/
│   └── ImageGeneratorScreen.tsx   # Main screen
├── components/
│   └── ExploreSection.tsx         # Pre-made prompts gallery
├── utils/
│   └── index.ts                   # Pollinations image API
└── types/
    └── index.ts                   # Type definitions
```

**Features**:
- Text prompt → AI-generated image
- Explore section with pre-made prompts
- Save images to device
- Share generated images

---

### 4. Dashboard Module (`/Dashboard/`)

**Purpose**: Admin analytics and user management

**Structure**:
```
Dashboard/
├── screens/
│   ├── AdminLoginScreen.tsx       # Admin authentication
│   └── AdminDashboardScreen.tsx   # Main dashboard (3 tabs)
├── components/
│   ├── StatsCard.tsx              # Stat widgets
│   ├── UserMiniCard.tsx           # User list items
│   ├── UserDetailsModal.tsx       # User detail view
│   ├── DeleteUserModal.tsx        # Confirm delete
│   ├── DemographicsModal.tsx      # Age/gender insights
│   ├── PaymentStatsCard.tsx       # Payment metrics
│   ├── PaymentRequestCard.tsx     # Payment proof review
│   ├── AgeDistributionChart.tsx   # Demographics chart
│   ├── AgeGroupCard.tsx           # Age group breakdown
│   └── ModelManagementCard.tsx    # AI model config
├── services/
│   ├── adminService.ts            # User management APIs
│   ├── paymentAdminService.ts     # Payment admin APIs
│   └── demographicsService.ts     # Demographics APIs
├── contexts/
│   └── AdminAuthContext.tsx       # Admin auth state
├── hooks/
│   ├── useAdminAuth.ts            # Admin auth hook
│   ├── useAdminStats.ts           # Stats hook
│   └── useUserManagement.ts       # User management hook
├── types/
│   ├── index.ts                   # Main types
│   ├── demographics.types.ts      # Demographics types
│   └── payment.types.ts           # Payment types
└── constants/
    ├── config.ts                  # Admin config
    └── demographicsConfig.ts      # Demographics config
```

**Dashboard Tabs**:
1. **Stats** - Total users, demographics, age distribution
2. **Users** - User list, search, filter, view details, delete
3. **Payments** - Payment requests, approve/reject, stats

**Admin Authentication**:
- Supabase Auth login
- Checks `admin_users` table for authorization
- Persistent session in AsyncStorage

---

## 🎨 UI Components

### 1. PrimaryButton

**Usage**:
```tsx
<PrimaryButton
  title="Continue"
  onPress={handleSubmit}
  loading={isSubmitting}
  variant="primary" // or "secondary"
/>
```

**Features**: Gradient background, loading state, disabled state

---

### 2. InputField

**Usage**:
```tsx
<InputField
  icon={<User size={20} color="#8B5CF6" />}
  placeholder="Your name"
  value={name}
  onChangeText={setName}
  autoCapitalize="words"
/>
```

**Features**: Icon support, dark mode, right icon slot

---

### 3. GlassContainer

**Usage**:
```tsx
<GlassContainer>
  <Text>Content with glassmorphism effect</Text>
</GlassContainer>
```

**Features**: Blur effect, semi-transparent background, rounded corners

---

### 4. CreditsCard

**Usage**:
```tsx
<CreditsCard
  currentCredits={25}
  maxCredits={50}
  onUpgrade={() => setShowPayment(true)}
/>
```

**Features**: Progress bar, upgrade button, animated

---

### 5. Footer

**Usage**:
```tsx
<Footer />
```

**Features**: App info, version, tech stack, social links

---

## 🎨 Styling & Theming

### Color System (`constants/colors.ts`)

```typescript
const Colors = {
  primary: '#8B5CF6',      // Purple
  secondary: '#EC4899',     // Pink
  
  background: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  gradient: {
    start: '#8B5CF6',
    end: '#EC4899',
  },
};
```

### Typography (`constants/fonts.ts`)

```typescript
const FontSizes = {
  hero: 32,        // Page titles
  heading: 24,     // Section titles
  subheading: 20,  // Card titles
  body: 16,        // Regular text
  small: 14,       // Helper text
  caption: 12,     // Smallest text
};

const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};
```

### Dark Mode

**Implementation**:
```typescript
const { settings } = useApp();
const colorScheme = useColorScheme();
const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;

// Apply dark styles conditionally
<View style={[styles.container, isDarkMode && styles.containerDark]} />
```

**Dark Mode Colors**:
- Background: `#0F172A` (slate-900)
- Text: `#FFFFFF`
- Cards: `rgba(255, 255, 255, 0.1)`
- Borders: `rgba(255, 255, 255, 0.2)`

---

## 📱 Mobile Features

### 1. Camera Integration

**Library**: `expo-camera`

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

const [permission, requestPermission] = useCameraPermissions();
const cameraRef = useRef<CameraView>(null);

// Capture photo
const photo = await cameraRef.current?.takePictureAsync({
  quality: 0.7,
  base64: true,
});
```

**Used in**: AI Stylist (live camera feed)

---

### 2. Image Picker

**Library**: `expo-image-picker`

```typescript
import * as ImagePicker from 'expo-image-picker';

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  quality: 0.8,
});
```

**Used in**: Outfit Scorer, Profile Screen

---

### 3. Voice Recording

**Library**: `expo-av`

```typescript
import { Audio } from 'expo-av';

// Start recording
const { recording } = await Audio.Recording.createAsync(
  Audio.RecordingOptionsPresets.HIGH_QUALITY
);

// Stop recording
await recording.stopAndUnloadAsync();
const uri = recording.getURI();
```

**Used in**: AI Stylist (voice input)

---

### 4. Speech Recognition

**Library**: `expo-speech-recognition`

```typescript
import * as Speech from 'expo-speech';

Speech.speak('Hello, how can I help you?', {
  language: 'en-US',
  pitch: 1.0,
  rate: 1.0,
});
```

**Used in**: AI Stylist (voice output)

---

### 5. Haptic Feedback

**Library**: `expo-haptics`

```typescript
import * as Haptics from 'expo-haptics';

// Impact feedback
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Notification feedback
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

**Used in**: Button presses, credit deduction

---

### 6. Local Storage

**Library**: `@react-native-async-storage/async-storage`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save
await AsyncStorage.setItem('key', JSON.stringify(data));

// Load
const data = JSON.parse(await AsyncStorage.getItem('key'));

// Remove
await AsyncStorage.removeItem('key');
```

**Used in**: App settings, auth tokens, cached profiles

---

## 🚀 Development Guide

### Running the App

```bash
# Start Expo dev server
npm start

# iOS Simulator
npm start -- --ios

# Android Emulator
npm start -- --android

# Web browser
npm start -- --web
```

### Project Commands

```json
{
  "start": "expo start",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "lint": "expo lint"
}
```

### Environment Variables

Create `.env` file:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-key
```

### Testing

**Test Structure**:
```
__tests__/
├── components/
│   ├── PrimaryButton.test.tsx
│   └── InputField.test.tsx
├── screens/
│   ├── HomeScreen.test.tsx
│   └── ProfileScreen.test.tsx
└── contexts/
    └── AppContext.test.tsx
```

**Run Tests**:
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Code Style

**ESLint Configuration**: `eslint.config.js`
- TypeScript strict mode
- React Native rules
- Expo recommended config

**TypeScript**: `tsconfig.json`
- Strict type checking
- Path aliases (`@/` → root)

---

## 📊 Performance Optimizations

### Image Optimization
- ✅ Use `expo-image` (faster than `<Image>`)
- ✅ Compress images before upload (quality: 0.7-0.8)
- ✅ Cache images with Supabase CDN

### Navigation
- ✅ Lazy load screens with Expo Router
- ✅ Use memo for expensive components
- ✅ Optimize re-renders with `useMemo`/`useCallback`

### State Management
- ✅ Context split (App, Alert separate)
- ✅ React Query for server state
- ✅ AsyncStorage for persistence

---

## 🔐 Security Best Practices

1. **No Hardcoded Secrets** - Use environment variables
2. **Supabase RLS** - Row Level Security on all tables
3. **Input Validation** - Sanitize user inputs
4. **Secure Storage** - AsyncStorage for non-sensitive data only
5. **JWT Tokens** - Supabase handles token refresh automatically

---

## 📦 Build & Deployment

### EAS Build

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure project
eas build:configure

# Build iOS
eas build --platform ios

# Build Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### App Configuration (`app.json`)

```json
{
  "expo": {
    "name": "Style GPT",
    "slug": "ai-cloth-recommendation",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/logo.png",
    "scheme": "ai-dressup",
    "platforms": ["ios", "android", "web"],
    "plugins": [
      "expo-router",
      "expo-camera",
      "expo-image-picker"
    ]
  }
}
```

---

## 🐛 Common Issues & Solutions

### Issue: App crashes on launch
**Solution**: Clear Metro cache
```bash
npx expo start --clear
```

### Issue: Images not loading
**Solution**: Check Supabase Storage permissions and URLs

### Issue: Dark mode not working
**Solution**: Ensure `isDarkMode` from AppContext is used consistently

### Issue: Voice features not working
**Solution**: Check microphone permissions in app settings

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root navigation, auth routing |
| `contexts/AppContext.tsx` | Global state (auth, profile, settings) |
| `lib/supabase.ts` | Supabase client configuration |
| `constants/colors.ts` | App color palette |
| `components/PrimaryButton.tsx` | Reusable button component |
| `OutfitScorer/screens/OutfitScorerScreen.tsx` | Outfit analysis feature |
| `AIStylist/screens/AIStylistScreen.tsx` | Voice AI stylist feature |
| `Dashboard/screens/AdminDashboardScreen.tsx` | Admin analytics |

---

## 🎯 Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ Production | Supabase Auth |
| Profile Management | ✅ Production | Full CRUD |
| Outfit Scorer | ✅ Production | Multi-AI models |
| AI Stylist | 🧪 Beta | Voice interaction |
| Image Generator | 🧪 Beta | Pollinations AI |
| Admin Dashboard | ✅ Production | Full analytics |
| Dark Mode | ✅ Production | System + manual |
| Payment Integration | ✅ Production | Razorpay |
| History | ✅ Production | Saved analyses |

---

**Frontend Documentation Complete** ✅  
**Total Lines**: 950  
**Coverage**: Comprehensive overview of all frontend aspects
