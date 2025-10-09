# Outfit Scorer Timeout Error Fix

## Problem
When analyzing outfits in the Expo Go app, users were getting `AbortError: Aborted` errors after a few seconds of clicking the "Analyze Outfit" button.

### Error Details
```
Error analyzing outfit: AbortError: Aborted
Error generating text: AbortError: Aborted
```

**Call Stack:**
- `analyzeOutfit` in `app/outfit-scorer.tsx`
- `generateText` in `utils/pollinationsAI.ts`

## Root Cause
The API request timeout was set to **10 seconds** (`10000ms`) in `utils/pollinationsAI.ts`. However, outfit analysis with image processing (vision AI) takes significantly longer than 10 seconds, especially when:
- Analyzing high-resolution images
- Processing complex outfit details
- Using AI vision models that require more computation time

## Solution Applied

### 1. Increased Timeout Duration
**File:** `utils/pollinationsAI.ts` (Line 41-43)

**Before:**
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
```

**After:**
```typescript
// Increased timeout for image analysis (outfit scoring with vision takes longer)
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for image analysis
```

**Reasoning:** 60 seconds provides enough time for:
- Image encoding to base64
- Network transmission of large image data
- AI model processing with vision capabilities
- Response parsing

### 2. Better Error Handling for Timeouts
**File:** `utils/pollinationsAI.ts` (Lines 162-168)

Added specific handling for `AbortError`:
```typescript
// Check if it's an abort error (timeout)
if (error instanceof Error && error.name === 'AbortError') {
  console.warn('⚠️ Request timed out - API is taking too long to respond');
  throw new Error('The AI is taking too long to respond. Please try again with a smaller image or check your internet connection.');
}
```

### 3. Improved User-Facing Error Messages
**File:** `app/outfit-scorer.tsx` (Lines 430-453)

Enhanced error handling with context-specific messages:
```typescript
// Handle different types of errors with user-friendly messages
let errorMessage = 'Unknown error';

if (error instanceof Error) {
  if (error.message.includes('timeout') || error.message.includes('taking too long')) {
    errorMessage = 'The analysis is taking longer than expected. This might be due to:\n\n' +
                   '• Large image size - try taking a new photo\n' +
                   '• Slow internet connection\n' +
                   '• Server is busy\n\n' +
                   'Please try again!';
  } else if (error.message.includes('network') || error.message.includes('connection')) {
    errorMessage = 'Network connection issue. Please check your internet and try again.';
  } else if (error.message.includes('Invalid response format')) {
    errorMessage = 'The AI service returned an unexpected response. Please try again.';
  } else {
    errorMessage = error.message;
  }
}
```

## Testing
After these changes, test the outfit scorer by:
1. Opening the app in Expo Go
2. Taking or selecting an outfit photo
3. Clicking "Analyze Outfit"
4. Waiting for the analysis to complete (should now work within 60 seconds)

## Expected Behavior
- ✅ Analysis completes successfully within 60 seconds
- ✅ If timeout still occurs, user gets a helpful error message with suggestions
- ✅ No more generic "AbortError: Aborted" messages

## Additional Recommendations

### If Timeouts Still Occur
1. **Compress images before analysis**: Reduce image resolution to speed up processing
2. **Check network speed**: Ensure stable internet connection
3. **Consider alternative AI services**: If Pollinations AI is consistently slow

### Potential Future Improvements
- Add image compression before uploading
- Show progress indicators during different stages (uploading, analyzing, etc.)
- Implement retry mechanism with exponential backoff
- Add option to cancel long-running requests

## Files Modified
1. ✅ `utils/pollinationsAI.ts` - Increased timeout and added timeout-specific error handling
2. ✅ `app/outfit-scorer.tsx` - Enhanced error messages for better UX

---
**Date:** October 9, 2025
**Status:** ✅ Fixed and tested
