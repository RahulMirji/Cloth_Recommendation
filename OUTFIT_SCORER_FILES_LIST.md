# Outfit Scorer Feature - Complete File List

This document lists all files used by the Outfit Scorer feature in the AI Dresser application.

## 📱 Main Screen
### `app/outfit-scorer.tsx` (964 lines)
**Purpose:** Main outfit scoring screen with image upload, analysis, and results display
**Key Features:**
- Image capture/selection from camera or gallery
- AI-powered outfit analysis with vision
- Score calculation and display with animations
- Product recommendations generation
- Chat history saving
- Context input for occasion-specific analysis

---

## 🔧 Utilities

### `utils/pollinationsAI.ts` (252 lines)
**Purpose:** AI text generation and image analysis
**Key Functions:**
- `generateText()` - Main API call to Pollinations AI
- `generateTextWithImage()` - Image + prompt analysis
- `convertImageToBase64()` - Image encoding
**Features:**
- 60-second timeout for image analysis
- Retry mechanism with fallback
- AbortError handling
- Streaming support for web

### `utils/productRecommendations.ts`
**Purpose:** Generate product recommendations based on missing items
**Key Functions:**
- `extractMissingItems()` - Parse improvements for missing items
- `generateProductRecommendations()` - Fetch products from APIs
- Gender-aware recommendations
**Features:**
- Multiple marketplace support (Amazon, Walmart, eBay)
- Gender detection for appropriate suggestions
- Context-aware filtering

### `utils/productRecommendationStorage.ts`
**Purpose:** Save and retrieve product recommendations from database
**Key Functions:**
- `saveProductRecommendations()` - Store recommendations in Supabase
- `getProductRecommendations()` - Retrieve recommendations by history ID

### `utils/chatHistory.ts`
**Purpose:** Save and retrieve outfit scoring history
**Key Functions:**
- `saveChatHistory()` - Save outfit analysis to database
- `getChatHistoryById()` - Load previous analysis from history

### `utils/supabaseStorage.ts`
**Purpose:** Upload outfit images to Supabase Storage
**Key Functions:**
- Image upload to cloud storage
- Public URL generation

### `utils/genderDetection.ts`
**Purpose:** Detect gender from analysis text for appropriate recommendations
**Key Functions:**
- Gender inference from AI analysis
- Gender-specific product filtering

---

## 🎨 Components

### `components/ProductRecommendations.tsx`
**Purpose:** Display product recommendations in cards
**Features:**
- Product cards with images, prices, ratings
- Marketplace badges
- Category grouping
- Open product links in browser
- Dark mode support
- Loading states

### `components/Footer.tsx`
**Purpose:** Footer component used in outfit scorer screen

### `components/OutfitScorerShowcase.tsx` (302 lines)
**Purpose:** Showcase component demonstrating outfit scorer functionality
**Features:**
- Sample outfit analyses display
- Score badges with color coding
- Example summaries
- Used in onboarding/tutorial screens

---

## 🪝 Custom Hooks

### `hooks/useImageUpload.ts`
**Purpose:** Handle image upload to Supabase Storage
**Key Functions:**
- `uploadOutfitImage()` - Upload image and return URL
**Features:**
- File type validation
- Error handling
- Progress tracking

---

## 🎯 Contexts

### `contexts/AppContext.tsx`
**Purpose:** Global app state management
**Provides:**
- `session` - User authentication session
- `settings` - App settings including dark mode
- `userProfile` - User profile information

---

## 📊 Types

### `types/chatHistory.types.ts`
**Purpose:** TypeScript type definitions for outfit scoring data
**Key Types:**
- `OutfitScoreConversationData` - Outfit analysis data structure
- `ProductRecommendationData` - Product recommendation structure
- `ScoringResult` - AI analysis result structure

---

## 🎨 Constants

### `constants/colors.ts`
**Purpose:** Color palette definitions
**Used for:**
- Score color coding (success, warning, primary)
- Gradient colors
- Theme colors

### `constants/themedColors.ts`
**Purpose:** Dynamic color scheme based on dark/light mode
**Used for:**
- Background colors
- Text colors
- Card colors

### `constants/strings.ts`
**Purpose:** Localized text strings
**Contains:**
- `outfitScorer` section with labels and messages
- Error messages
- Button labels

### `constants/fonts.ts`
**Purpose:** Typography definitions
**Used for:**
- Font sizes
- Font weights
- Text styling

---

## 🗄️ Database/Backend

### `lib/supabase.ts`
**Purpose:** Supabase client initialization
**Used for:**
- Authentication
- Database operations
- Storage operations

---

## 🔗 Navigation/Routing

### Entry Points to Outfit Scorer:
1. `screens/HomeScreen.tsx` (line 140)
   - Button: "Outfit Scorer" card
   - Navigation: `router.push('/outfit-scorer')`

2. `screens/history/OutfitHistoryList.tsx` (line 160)
   - Opens previous outfit analyses
   - Navigation: `router.push('/outfit-scorer?historyId=...')`

3. `app/_layout.tsx` (line 109)
   - Route definition: `name="outfit-scorer"`

---

## 📦 External Dependencies

### NPM Packages Used:
- `expo-image-picker` - Image capture/selection
- `expo-router` - Navigation
- `expo-linear-gradient` - Gradient backgrounds
- `lucide-react-native` - Icons (Camera, Sparkles, etc.)
- `react-native-safe-area-context` - Safe area handling
- `@supabase/supabase-js` - Database operations

---

## 📝 Documentation

### `OUTFIT_SCORER_TIMEOUT_FIX.md`
**Purpose:** Documentation of recent timeout error fix
**Contains:**
- Problem description
- Root cause analysis
- Solution implementation
- Testing guidelines

---

## 🧪 Tests

### `__tests__/screens/HomeScreen.test.tsx` (line 72)
**Purpose:** Unit tests for Home Screen navigation
**Tests:**
- Outfit scorer button navigation

---

## 📊 File Count Summary

| Category | Count | Files |
|----------|-------|-------|
| **Main Screen** | 1 | `app/outfit-scorer.tsx` |
| **Utilities** | 7 | pollinationsAI, productRecommendations, productRecommendationStorage, chatHistory, supabaseStorage, genderDetection |
| **Components** | 3 | ProductRecommendations, Footer, OutfitScorerShowcase |
| **Hooks** | 1 | useImageUpload |
| **Contexts** | 1 | AppContext |
| **Types** | 1 | chatHistory.types |
| **Constants** | 4 | colors, themedColors, strings, fonts |
| **Database** | 1 | supabase |
| **Navigation** | 3 | HomeScreen, OutfitHistoryList, _layout |
| **Documentation** | 1 | OUTFIT_SCORER_TIMEOUT_FIX |
| **Tests** | 1 | HomeScreen.test |
| **TOTAL** | **24** | **Core files directly used by Outfit Scorer** |

---

## 🔄 Data Flow

```
User Action (Take/Upload Photo)
    ↓
app/outfit-scorer.tsx
    ↓
hooks/useImageUpload.ts → utils/supabaseStorage.ts → Supabase Storage
    ↓
utils/pollinationsAI.ts (convertImageToBase64)
    ↓
utils/pollinationsAI.ts (generateTextWithImage) → Pollinations AI API
    ↓
Parse AI Response (ScoringResult)
    ↓
utils/productRecommendations.ts (extractMissingItems + generateProductRecommendations)
    ↓
Display Results + Recommendations (components/ProductRecommendations.tsx)
    ↓
utils/chatHistory.ts + utils/productRecommendationStorage.ts → Supabase Database
```

---

**Last Updated:** October 9, 2025  
**Feature Status:** ✅ Fully Functional
