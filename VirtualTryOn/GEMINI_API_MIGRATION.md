# Gemini API Migration

## Overview
Successfully migrated from PI API to direct Gemini API integration for virtual try-on functionality.

## Changes Made

### 1. API Configuration (`constants/index.ts`)
- **Before**: Used PI API as a wrapper
  ```typescript
  PI_API_CONFIG = {
    ENDPOINT: 'https://api.piapi.ai/api/v1/task',
    API_KEY: '...',
  }
  ```

- **After**: Direct Gemini API integration
  ```typescript
  GEMINI_API_CONFIG = {
    ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    API_KEY: 'AIzaSyCpeAfVVnj0AJGYeF4oCuzi5x5DnhRZ0y8',
  }
  ```

### 2. Service Implementation (`services/geminiApiService.ts`)
- **File renamed**: `piApiService.ts` → `geminiApiService.ts`
- **New features**:
  - Direct base64 image conversion using `expo-file-system`
  - MIME type detection for different image formats
  - Direct API call to Gemini without wrapper
  - Response parsing to extract generated image
  - Local file system caching of results

### 3. Prompt Optimization
- **Before**: Long detailed prompt
- **After**: Simple, effective prompt
  ```
  "Virtually try this outfit from the second image on the person in the first image."
  ```

### 4. Response Handling
- Extracts base64 image from Gemini response
- Saves to local cache directory
- Returns file URI for immediate display

## API Flow

```
User Image (URI) ──┐
                   ├──> Convert to Base64 ──> Gemini API ──> Base64 Response ──> Save to Cache ──> Display
Outfit Image (URI) ┘
```

## Benefits

1. **Direct Integration**: No intermediate API wrapper needed
2. **Cost Effective**: Direct API calls, no markup
3. **Faster**: Fewer network hops
4. **Simpler**: Cleaner code, easier to maintain
5. **Reliable**: Direct access to Google's infrastructure

## Testing

Successfully tested with:
- Person image: `ca496bb6-9a28-5f96-81b5-146fa8303a28.jpg`
- Outfit image: `81x2mbPJiBL._AC_UL640_FMwebp_QL65_.webp`
- Result: 2.0 MB PNG image saved successfully

## Environment Variables

Update your `.env` file:
```bash
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from: https://aistudio.google.com/app/apikey

## Usage

```typescript
import { generateTryOnImage } from './VirtualTryOn';

const result = await generateTryOnImage(
  userImageUri,  // Local file URI
  outfitImageUri // Local file URI
);

if (result.success) {
  console.log('Generated image:', result.imageUrl);
} else {
  console.error('Error:', result.error);
}
```

## Notes

- Images are automatically converted to base64
- Supports JPEG, PNG, and WebP formats
- Generated images are cached in `FileSystem.cacheDirectory`
- Timeout set to 60 seconds for API calls
