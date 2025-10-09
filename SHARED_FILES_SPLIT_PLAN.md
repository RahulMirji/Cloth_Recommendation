# Shared Files Split Plan

## Objective
Split shared utility files into **two independent versions**:
1. **Original location** - Minimal code for AI Stylist and other features
2. **OutfitScorer module** - Complete code for OutfitScorer feature

## Benefits
- ✅ **True modularity** - OutfitScorer is 100% self-contained
- ✅ **No breaking changes** - AI Stylist continues working independently
- ✅ **Clean separation** - Each feature has its own version
- ✅ **Easy to modularize next** - Same pattern for AI Stylist later

---

## Files to Split

### 1. `utils/pollinationsAI.ts`

**Used By:**
- AI Stylist: `generateTextWithImage()`, `convertImageToBase64()`
- OutfitScorer: `generateTextWithImage()`, `convertImageToBase64()`

**Action:**
- ✅ Keep in `OutfitScorer/utils/pollinationsAI.ts` (already complete with 60s timeout)
- ✅ Keep in `utils/pollinationsAI.ts` (same complete version for AI Stylist)
- Status: **Both versions are identical, no changes needed**

---

### 2. `components/Footer.tsx`

**Used By:**
- HomeScreen (line 33)
- ProfileScreen (line 39)
- OutfitScorerScreen

**Action:**
- ✅ Keep in `OutfitScorer/components/Footer.tsx` (already moved)
- ✅ Keep in `components/Footer.tsx` (for HomeScreen, ProfileScreen)
- Status: **Both versions needed**

---

### 3. `hooks/useImageUpload.ts`

**Used By:**
- ProfileScreen (line 40) - for profile photo uploads
- OutfitScorerScreen - for outfit image uploads

**Action:**
- ✅ Keep in `OutfitScorer/hooks/useImageUpload.ts` (already moved)
- ✅ Keep in `hooks/useImageUpload.ts` (for ProfileScreen)
- Status: **Both versions needed**

---

### 4. `utils/chatHistory.ts`

**Used By:**
- screens/history/OutfitHistoryList.tsx (line 35) - `deleteChatHistory()`
- OutfitScorerScreen - full chat history management

**Action:**
- ✅ Keep in `OutfitScorer/utils/chatHistory.ts` (already moved - complete)
- ✅ Keep in `utils/chatHistory.ts` (minimal version for OutfitHistoryList)
- Status: **Both versions needed, but original can be trimmed**

---

### 5. `utils/supabaseStorage.ts`

**Used By:**
- hooks/useImageUpload.ts (line 9) - `uploadImageToStorage()`, `replaceImage()`
- OutfitScorer hooks/useImageUpload.ts

**Action:**
- ✅ Keep in `OutfitScorer/utils/supabaseStorage.ts` (already moved)
- ✅ Keep in `utils/supabaseStorage.ts` (for non-OutfitScorer features)
- Status: **Both versions needed**

---

## Files That Are OutfitScorer-Exclusive (Safe to Delete from Root)

### ✅ Can Delete These from Root:
1. ✅ `components/ProductRecommendations.tsx` - Only used by OutfitScorer
2. ✅ `components/OutfitScorerShowcase.tsx` - Only used by OutfitScorer  
3. ✅ `utils/productRecommendations.ts` - Only used by OutfitScorer
4. ✅ `utils/productRecommendationStorage.ts` - Only used by OutfitScorer
5. ✅ `utils/genderDetection.ts` - Only used by productRecommendations.ts
6. ✅ `types/chatHistory.types.ts` - Only used by OutfitScorer module now

---

## Implementation Steps

### Step 1: Verify Shared Files Are Present in Both Locations ✅
- [x] `pollinationsAI.ts` exists in both locations
- [x] `Footer.tsx` exists in both locations  
- [x] `useImageUpload.ts` exists in both locations
- [x] `chatHistory.ts` exists in both locations
- [x] `supabaseStorage.ts` exists in both locations

### Step 2: Delete OutfitScorer-Exclusive Files from Root 🔄
Delete these files (they only exist for OutfitScorer):
```bash
# Safe to delete - OutfitScorer-exclusive
rm components/ProductRecommendations.tsx
rm components/OutfitScorerShowcase.tsx
rm utils/productRecommendations.ts
rm utils/productRecommendationStorage.ts
rm utils/genderDetection.ts
rm types/chatHistory.types.ts
```

### Step 3: Test All Features ✅
- [ ] Test OutfitScorer - should work (uses OutfitScorer/*)
- [ ] Test AI Stylist - should work (uses utils/pollinationsAI)
- [ ] Test ProfileScreen - should work (uses hooks/useImageUpload, components/Footer)
- [ ] Test HomeScreen - should work (uses components/Footer)
- [ ] Test OutfitHistoryList - should work (uses utils/chatHistory)

### Step 4: Final Commit 🎯
- Create commit with all changes
- Update documentation

---

## Result

### Final Structure:
```
/OutfitScorer/              # Self-contained OutfitScorer module
├── components/
│   ├── ProductRecommendations.tsx     ✅ OutfitScorer-exclusive
│   ├── OutfitScorerShowcase.tsx       ✅ OutfitScorer-exclusive
│   ├── Footer.tsx                     ✅ Shared (duplicate)
│   └── index.ts
├── hooks/
│   ├── useImageUpload.ts              ✅ Shared (duplicate)
│   └── index.ts
├── utils/
│   ├── pollinationsAI.ts              ✅ Shared (duplicate)
│   ├── productRecommendations.ts      ✅ OutfitScorer-exclusive
│   ├── productRecommendationStorage.ts ✅ OutfitScorer-exclusive
│   ├── chatHistory.ts                 ✅ Shared (duplicate)
│   ├── supabaseStorage.ts             ✅ Shared (duplicate)
│   ├── genderDetection.ts             ✅ OutfitScorer-exclusive
│   └── index.ts
├── types/
│   ├── chatHistory.types.ts           ✅ OutfitScorer-exclusive
│   └── index.ts
└── screens/
    └── OutfitScorerScreen.tsx

/components/                # Shared components for other features
├── Footer.tsx              ✅ Used by HomeScreen, ProfileScreen

/hooks/                     # Shared hooks for other features
├── useImageUpload.ts       ✅ Used by ProfileScreen

/utils/                     # Shared utilities for other features
├── pollinationsAI.ts       ✅ Used by AI Stylist
├── chatHistory.ts          ✅ Used by OutfitHistoryList
├── supabaseStorage.ts      ✅ Used by useImageUpload

/types/                     # Shared types (empty after cleanup)
```

---

## Status: Ready to Execute ✅

All files are verified and ready for cleanup. Proceeding with deletion of OutfitScorer-exclusive files from root.
