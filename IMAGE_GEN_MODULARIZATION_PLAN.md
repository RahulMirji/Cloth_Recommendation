# Image Generator Modularization Plan

## 🎯 Objective
Modularize the AI Image Generator feature into a self-contained `ImageGen/` module following the same pattern used for OutfitScorer and AIStylist.

## 📋 Current State Analysis

### Files Identified
1. **Main Screen**: `app/ai-image-generator.tsx` (61 lines)
2. **Core Component**: `components/ExploreSection.tsx` (525 lines)

### Dependencies
- ✅ No feature-specific utilities
- ✅ Uses only shared components and hooks
- ✅ Self-contained logic within ExploreSection

### Import Analysis
```typescript
// External dependencies
- React Native core components
- expo-linear-gradient
- lucide-react-native (icons)
- expo-file-system (for downloads)

// Internal dependencies (shared)
- @/constants/colors
- @/constants/fonts
- @/contexts/AppContext
- @/hooks/useCustomAlert
```

## 📁 Proposed Module Structure

```
ImageGen/
├── screens/
│   └── ImageGeneratorScreen.tsx     # Main screen (from app/ai-image-generator.tsx)
├── components/
│   ├── ExploreSection.tsx           # Core image generation component
│   └── index.ts                     # Component exports
├── utils/
│   ├── imageGenerator.ts            # Extract image generation logic
│   ├── imageDownloader.ts           # Extract download logic
│   └── index.ts                     # Utils exports
├── hooks/
│   └── index.ts                     # Future custom hooks
├── types/
│   ├── index.ts                     # TypeScript types
│   └── imageGen.types.ts            # Image generation types
├── docs/
│   └── README.md                    # Module documentation
├── index.ts                         # Main module exports
└── README.md                        # Module overview
```

## 🔄 Migration Steps

### Phase 1: Create Directory Structure (5 min)
```bash
mkdir ImageGen
mkdir ImageGen/screens
mkdir ImageGen/components
mkdir ImageGen/utils
mkdir ImageGen/hooks
mkdir ImageGen/types
mkdir ImageGen/docs
```

### Phase 2: Extract and Refactor Logic (20 min)

#### 2.1 Create Utilities
Extract logic from ExploreSection into utility files:

**imageGenerator.ts**: Image generation logic
- `generateImageUrl()` - Create Pollinations API URL
- `validatePrompt()` - Validate user input
- Image generation configuration

**imageDownloader.ts**: Download logic
- `downloadImage()` - Save image to device
- `shareImage()` - Share functionality
- Platform-specific handling

#### 2.2 Create Types
**imageGen.types.ts**:
```typescript
export interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  enhance?: boolean;
  nologo?: boolean;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

export interface ImageGeneratorState {
  prompt: string;
  generatedImageUrl: string | null;
  loading: boolean;
  error: string | null;
}
```

### Phase 3: Move Components (10 min)
```bash
# Move ExploreSection to module
git mv components/ExploreSection.tsx ImageGen/components/ExploreSection.tsx

# Move main screen
git mv app/ai-image-generator.tsx ImageGen/screens/ImageGeneratorScreen.tsx
```

### Phase 4: Update Imports (15 min)
Update all imports in:
- ImageGeneratorScreen.tsx
- ExploreSection.tsx

Change from:
```typescript
import { ExploreSection } from '@/components/ExploreSection';
```

To:
```typescript
import { ExploreSection } from '@/ImageGen/components/ExploreSection';
```

### Phase 5: Create Export Files (10 min)
Create index.ts files:
- `ImageGen/index.ts` - Main exports
- `ImageGen/screens/index.ts` - Screen exports
- `ImageGen/components/index.ts` - Component exports
- `ImageGen/utils/index.ts` - Utility exports
- `ImageGen/types/index.ts` - Type exports

### Phase 6: Create Route Wrapper (5 min)
Create `app/ai-image-generator.tsx`:
```typescript
// AI Image Generator Route Wrapper
export { default } from '@/ImageGen/screens/ImageGeneratorScreen';
```

### Phase 7: Documentation (15 min)
Create documentation files:
- `ImageGen/README.md` - Module overview
- `ImageGen/docs/README.md` - Detailed docs
- `IMAGE_GEN_MODULARIZATION_PLAN.md` - This file
- `IMAGE_GEN_MODULARIZATION_COMPLETE.md` - Completion summary

### Phase 8: Testing (20 min)
Test all functionality:
- [ ] Screen navigation works
- [ ] Image generation from prompt
- [ ] Loading states
- [ ] Error handling
- [ ] Image download
- [ ] Dark mode support
- [ ] Animation transitions

### Phase 9: Build Verification (10 min)
- [ ] No TypeScript errors
- [ ] No compilation errors
- [ ] No runtime errors
- [ ] All imports resolved

### Phase 10: Git Commit and Push (5 min)
```bash
git add -A
git commit -m "feat: Modularize Image Generator into ImageGen module"
git push origin outfit-score-v2
```

## ⏱️ Time Estimate
**Total Time**: ~2 hours

- Phase 1: 5 min
- Phase 2: 20 min
- Phase 3: 10 min
- Phase 4: 15 min
- Phase 5: 10 min
- Phase 6: 5 min
- Phase 7: 15 min
- Phase 8: 20 min
- Phase 9: 10 min
- Phase 10: 5 min
- Buffer: 5 min

## 📊 Complexity Assessment

### Low Complexity ✅
- Simple component structure
- No complex utilities
- Self-contained logic
- Minimal dependencies
- Single main component

### What Makes This Easy:
1. Only 2 files to move (screen + component)
2. No feature-specific utilities yet
3. Logic is already contained in ExploreSection
4. No shared state between features
5. Clean import structure

## 🎯 Success Criteria

### Must Have:
- [x] All files moved to ImageGen/ directory
- [ ] All imports using @/ImageGen/* paths
- [ ] No compilation errors
- [ ] Image generation working
- [ ] Download functionality working
- [ ] Route wrapper created
- [ ] Documentation complete

### Should Have:
- [ ] Logic extracted into utils
- [ ] TypeScript types defined
- [ ] Comprehensive README
- [ ] Testing documentation

### Nice to Have:
- [ ] Custom hooks for image generation
- [ ] Image history/gallery
- [ ] Advanced generation options
- [ ] Image editing capabilities

## 🚨 Risks and Mitigation

### Risk 1: Breaking Image Generation
**Mitigation**: Test immediately after moving files, keep logic unchanged

### Risk 2: Download Functionality Issues
**Mitigation**: Platform-specific testing (Android/iOS/Web)

### Risk 3: Import Path Issues
**Mitigation**: Update all imports systematically, verify with TypeScript

## 📝 Notes

### Key Differences from Previous Modules:
1. **Simpler Structure**: Only 2 main files vs. 10+ in AIStylist
2. **No Utilities Yet**: Logic can be extracted later if needed
3. **Self-Contained**: Everything in one component
4. **External API**: Uses Pollinations API (no backend logic)

### Advantages of This Structure:
1. Easy to add more generation options
2. Can add image history feature
3. Room for advanced editing tools
4. Potential for gallery view

### Future Enhancements:
- Image history/gallery
- Multiple generation models
- Image editing tools
- Batch generation
- Style presets
- Image variations

## 🔗 Related Modules

- **OutfitScorer**: Modularized ✅ (commit d6e39e5)
- **AIStylist**: Modularized ✅ (commit 419f116)
- **ImageGen**: In Progress 🚧

## 📚 References

- OutfitScorer modularization pattern
- AIStylist modularization pattern
- Pollinations AI API documentation

---

**Created**: October 9, 2025  
**Status**: Ready for Execution  
**Estimated Completion**: 2 hours
