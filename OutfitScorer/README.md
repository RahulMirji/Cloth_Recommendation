# OutfitScorer Feature Module

> A self-contained, modular implementation of AI-powered outfit analysis and recommendation system.

## 📖 Overview

The OutfitScorer module provides comprehensive outfit analysis using AI vision models, delivering detailed feedback, scoring, and personalized product recommendations based on missing items or style improvements.

## ✨ Features

- 🤖 **AI-Powered Analysis** - Uses Pollinations AI with vision capabilities
- 📊 **Detailed Scoring** - 0-100 score with category ratings
- 💡 **Smart Recommendations** - Gender-aware product suggestions
- 🛍️ **Multi-Marketplace** - Products from Amazon, Walmart, eBay
- 📸 **Image Upload** - Supabase Storage integration
- 💾 **History Tracking** - Save and retrieve past analyses
- 🌓 **Dark Mode** - Full theme support
- ⚡ **Real-time Processing** - Fast analysis with timeout handling

## 🗂️ Structure

```
OutfitScorer/
├── screens/          # Main UI screens
├── components/       # Reusable components
├── hooks/           # Custom React hooks
├── utils/           # Business logic & utilities
├── types/           # TypeScript definitions
└── docs/            # Feature documentation
```

## 🚀 Quick Start

### Basic Usage

```typescript
import OutfitScorerScreen from "@/OutfitScorer";
// or
import OutfitScorerScreen from "@/app/outfit-scorer";
```

### Navigation

```typescript
import { router } from "expo-router";

// Navigate to outfit scorer
router.push("/outfit-scorer");

// Load specific history entry
router.push({
  pathname: "/outfit-scorer",
  params: { historyId: "abc-123" },
});
```

### Import Specific Utilities

```typescript
import {
  generateTextWithImage,
  convertImageToBase64,
} from "@/OutfitScorer/utils/pollinationsAI";

import {
  generateProductRecommendations,
  extractMissingItems,
} from "@/OutfitScorer/utils/productRecommendations";

import { ProductRecommendationsSection } from "@/OutfitScorer/components";
```

## 📦 Module Exports

### Components

- `ProductRecommendationsSection` - Product recommendation display
- `OutfitScorerShowcase` - Demo component for onboarding
- `Footer` - Consistent footer component

### Utilities

- `pollinationsAI` - AI text/image generation
- `productRecommendations` - Product search logic
- `productRecommendationStorage` - Database operations
- `chatHistory` - History management
- `supabaseStorage` - Image upload
- `genderDetection` - Gender-aware filtering

### Hooks

- `useImageUpload` - Image upload hook with compression

### Types

- `chatHistory.types` - All TypeScript definitions

## 🎯 API Reference

### generateTextWithImage()

Analyze an outfit image using AI vision.

```typescript
const result = await generateTextWithImage(
  base64Image: string,
  prompt: string
): Promise<string>
```

### generateProductRecommendations()

Get product recommendations for missing items.

```typescript
const recommendations = await generateProductRecommendations(
  missingItems: MissingItem[],
  context: string,
  analysisText: string,
  improvements: string[]
): Promise<Map<string, ProductRecommendation[]>>
```

### useImageUpload()

Hook for uploading images to Supabase Storage.

```typescript
const { uploadOutfitImage, isUploading } = useImageUpload();

const result = await uploadOutfitImage(
  imageUri: string,
  folder: 'OUTFITS' | 'PROFILES'
): Promise<ImageUploadResult>
```

## 🔧 Configuration

### AI Settings

- **Timeout:** 60 seconds (configurable in `pollinationsAI.ts`)
- **Model:** Gemini via Pollinations AI
- **Image Format:** Base64 JPEG

### Storage Settings

- **Bucket:** Supabase Storage
- **Compression:** 0.8 quality
- **Max Size:** Handled by API

## 🧪 Testing

```bash
# Run tests
npm test OutfitScorer

# Run specific test
npm test OutfitScorer/utils/productRecommendations.test.ts
```

## 📊 Data Flow

```
User uploads image
    ↓
convertImageToBase64()
    ↓
generateTextWithImage() → Pollinations AI
    ↓
Parse JSON response
    ↓
extractMissingItems()
    ↓
generateProductRecommendations() → Marketplace APIs
    ↓
Display results + Save to database
```

## 🔐 Dependencies

### External

- `expo-image-picker` - Image selection
- `expo-image-manipulator` - Image processing
- `expo-file-system` - File operations
- `@supabase/supabase-js` - Database
- `expo-linear-gradient` - UI gradients
- `lucide-react-native` - Icons

### Internal (Shared)

- `@/constants/colors` - Color palette
- `@/constants/themedColors` - Theme system
- `@/constants/fonts` - Typography
- `@/contexts/AppContext` - Global state
- `@/lib/supabase` - Supabase client

## ⚠️ Important Notes

### Timeout Handling

The AI analysis has a 60-second timeout. For slow connections:

- Compress images before upload
- Retry failed requests
- Show appropriate error messages

### Gender Detection

Product recommendations are gender-aware:

- Detected from AI analysis text
- Filters inappropriate items
- Provides context-specific suggestions

### Storage Limits

- Supabase Storage has usage limits
- Implement cleanup for old images
- Monitor storage usage

## 🐛 Troubleshooting

### Common Issues

**"AbortError: Aborted"**

- Cause: Request timeout (>60s)
- Solution: Check network, reduce image size

**"Invalid response format"**

- Cause: AI returned non-JSON
- Solution: Retry request

**Products not loading**

- Cause: Marketplace API issues
- Solution: Check API status, retry

**Image upload fails**

- Cause: Supabase Storage issue
- Solution: Check permissions, storage quota

## 📚 Documentation

- [Timeout Fix Guide](./docs/OUTFIT_SCORER_TIMEOUT_FIX.md)
- [Modularization Summary](../OUTFITSCORER_MODULARIZATION_SUMMARY.md)
- [Files List](../OUTFIT_SCORER_FILES_LIST.md)

## 🤝 Contributing

When contributing to this module:

1. Keep changes within `/OutfitScorer` folder
2. Update exports in `index.ts` files
3. Maintain backward compatibility
4. Add tests for new features
5. Update documentation

## 📄 License

Part of AI Dresser application.

## 👥 Maintainers

- Development Team
- Contact: [Your Contact Info]

---

**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** ✅ Production Ready
