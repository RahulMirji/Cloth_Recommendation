# 🚀 AI Stylist Modularization - Quick Start Guide

## ⏱️ Time Estimate: 5-6 hours

This guide provides step-by-step instructions to modularize the AI Stylist feature following the proven OutfitScorer pattern.

---

## ✅ Prerequisites

Before starting, ensure:
- [x] OutfitScorer modularization is complete and committed
- [x] All features are currently working
- [x] No pending changes in git
- [x] Expo server is running (for live testing)
- [x] You have 5-6 uninterrupted hours

---

## 📋 Phase 1: Preparation (30 minutes)

### Step 1.1: Create Branch (Optional but Recommended)
```bash
git checkout -b ai-stylist-modularization
```

### Step 1.2: Create Module Directory Structure
```bash
# Create all directories at once
mkdir -p AIStylist/{screens,components,hooks,utils,types,docs}
```

### Step 1.3: Verify Structure
```bash
tree AIStylist -L 1
```

Expected output:
```
AIStylist
├── screens/
├── components/
├── hooks/
├── utils/
├── types/
└── docs/
```

---

## 📦 Phase 2: Move Exclusive Utilities (45 minutes)

### Step 2.1: Move 7 AI Stylist-Exclusive Utils

**Important:** Use `git mv` to preserve history!

```bash
# Move audio utilities
git mv utils/audioUtils.ts AIStylist/utils/audioUtils.ts

# Move chat utilities
git mv utils/chatUtils.ts AIStylist/utils/chatUtils.ts

# Move vision API
git mv utils/visionAPI.ts AIStylist/utils/visionAPI.ts

# Move storage service
git mv utils/storageService.ts AIStylist/utils/storageService.ts

# Move streaming handler
git mv utils/streamingResponseHandler.ts AIStylist/utils/streamingResponseHandler.ts

# Move context manager
git mv utils/contextManager.ts AIStylist/utils/contextManager.ts

# Move voice activity detection
git mv utils/voiceActivityDetection.ts AIStylist/utils/voiceActivityDetection.ts
```

### Step 2.2: Verify Move
```bash
# Check moved files
ls -la AIStylist/utils/

# Check git status
git status
```

You should see 7 files renamed/moved.

### Step 2.3: Update Internal Imports in Moved Files

**Files to update:**
- `AIStylist/utils/visionAPI.ts` - Update imports to use AIStylist paths
- `AIStylist/utils/contextManager.ts` - Update imports to use AIStylist paths

Open each file and change:
```typescript
// Before
import { ... } from '@/utils/storageService';
import { ... } from '@/utils/pollinationsAI';

// After
import { ... } from '@/AIStylist/utils/storageService';
import { ... } from '@/AIStylist/utils/pollinationsAI';
```

---

## 🔄 Phase 3: Duplicate Shared Utilities (15 minutes)

### Step 3.1: Copy Shared Files from OutfitScorer

```bash
# Copy pollinationsAI
cp OutfitScorer/utils/pollinationsAI.ts AIStylist/utils/pollinationsAI.ts

# Copy chatHistory
cp OutfitScorer/utils/chatHistory.ts AIStylist/utils/chatHistory.ts

# Copy Footer (if needed by AI Stylist)
cp OutfitScorer/components/Footer.tsx AIStylist/components/Footer.tsx
```

### Step 3.2: Update Imports in Copied Files

Open `AIStylist/utils/chatHistory.ts` and update:
```typescript
// Change
import { ... } from '@/OutfitScorer/types/chatHistory.types';

// To
import { ... } from '@/AIStylist/types/chatHistory.types';
```

---

## 🎨 Phase 4: Move Main Screen (60 minutes)

### Step 4.1: Move Screen File

```bash
# Move main screen
git mv app/ai-stylist.tsx AIStylist/screens/AIStylistScreen.tsx
```

### Step 4.2: Update All Imports in Main Screen

Open `AIStylist/screens/AIStylistScreen.tsx` and update imports:

```typescript
// Change all utility imports
import { SpeechToTextService, generateSpeakBackAudio, convertAudioToText, speakTextLocal } from '@/AIStylist/utils/audioUtils';
import { ChatMessage, ChatSession, generateChatSummary, saveChatSession, generateSessionId, createChatMessage } from '@/AIStylist/utils/chatUtils';
import { generateTextWithImage, convertImageToBase64 } from '@/AIStylist/utils/pollinationsAI';
import { visionAPI } from '@/AIStylist/utils/visionAPI';
import { storageService } from '@/AIStylist/utils/storageService';
import { StreamingResponseHandler } from '@/AIStylist/utils/streamingResponseHandler';
import { contextManager } from '@/AIStylist/utils/contextManager';
import { vadDetector } from '@/AIStylist/utils/voiceActivityDetection';

// Keep these as-is (global imports)
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
```

### Step 4.3: Create Route Wrapper

Create new file `app/ai-stylist.tsx`:
```typescript
// AI Stylist Route Wrapper
export { default } from '@/AIStylist/screens/AIStylistScreen';
```

### Step 4.4: Test Navigation

```bash
# Restart Expo
# Press 'r' in terminal to reload
```

Navigate to AI Stylist and verify it loads without errors.

---

## 🔧 Phase 5: Create Type Definitions (30 minutes)

### Step 5.1: Extract Chat Types

Create `AIStylist/types/chat.types.ts`:
```typescript
/**
 * Chat Types for AI Stylist
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imageUrl?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  startedAt: string;
  endedAt?: string;
  summary?: string;
}

// Add more types from chatUtils.ts
```

### Step 5.2: Extract Audio Types

Create `AIStylist/types/audio.types.ts`:
```typescript
/**
 * Audio Types for AI Stylist
 */

export interface AudioRecording {
  uri: string;
  duration: number;
  mimeType: string;
}

export interface SpeechConfig {
  language: string;
  voice?: string;
  rate?: number;
  pitch?: number;
}

// Add more types from audioUtils.ts
```

### Step 5.3: Extract Vision Types

Create `AIStylist/types/vision.types.ts`:
```typescript
/**
 * Vision API Types for AI Stylist
 */

export interface VisionAnalysisResult {
  outfitDescription: string;
  colors: string[];
  items: string[];
  style: string;
  occasion?: string;
  confidence: number;
}

export interface ImageUploadOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

// Add more types from visionAPI.ts
```

### Step 5.4: Update Utils to Use Types

Update imports in utils to reference the new type files:
```typescript
// In AIStylist/utils/chatUtils.ts
import { ChatMessage, ChatSession } from '@/AIStylist/types/chat.types';

// In AIStylist/utils/audioUtils.ts
import { AudioRecording, SpeechConfig } from '@/AIStylist/types/audio.types';

// In AIStylist/utils/visionAPI.ts
import { VisionAnalysisResult } from '@/AIStylist/types/vision.types';
```

---

## 📤 Phase 6: Create Export Files (15 minutes)

### Step 6.1: Components Index

Create `AIStylist/components/index.ts`:
```typescript
// AI Stylist Components Index
// Central export point for all AI Stylist components

export { default as Footer } from './Footer';
// Add more component exports as they're created
```

### Step 6.2: Hooks Index

Create `AIStylist/hooks/index.ts`:
```typescript
// AI Stylist Hooks Index
// Central export point for all AI Stylist hooks

// Add hook exports as they're created
// export * from './useVoiceRecording';
// export * from './useCameraCapture';
// export * from './useConversation';
```

### Step 6.3: Utils Index

Create `AIStylist/utils/index.ts`:
```typescript
// AI Stylist Utils Index
// Central export point for all AI Stylist utilities

export * from './pollinationsAI';
export * from './audioUtils';
export * from './chatUtils';
export * from './visionAPI';
export * from './storageService';
export * from './streamingResponseHandler';
export * from './contextManager';
export * from './voiceActivityDetection';
export * from './chatHistory';
```

### Step 6.4: Types Index

Create `AIStylist/types/index.ts`:
```typescript
// AI Stylist Types Index
// Central export point for all AI Stylist type definitions

export * from './chat.types';
export * from './audio.types';
export * from './vision.types';
```

### Step 6.5: Main Module Index

Create `AIStylist/index.ts`:
```typescript
// AI Stylist Module
// Main export point for the AI Stylist feature module

// Screens
export { default as AIStylistScreen } from './screens/AIStylistScreen';

// Components (export as needed)
export * from './components';

// Hooks (export as needed)
export * from './hooks';

// Utils (typically not exported at module level)
// export * from './utils';

// Types
export * from './types';
```

---

## 📚 Phase 7: Create Documentation (45 minutes)

### Step 7.1: Module README

Create `AIStylist/README.md` - Use OutfitScorer/README.md as template:
```markdown
# 🎨 AI Stylist Module

Voice-activated AI fashion consultant with camera integration.

## Features
- Voice recording and playback
- Speech-to-text conversion
- Text-to-speech responses
- Camera integration
- Enhanced vision analysis
- Hands-free mode
- Context-aware conversations
- Real-time streaming responses

... (expand with full documentation)
```

### Step 7.2: Architecture Documentation

Create `AIStylist/docs/ARCHITECTURE.md`:
```markdown
# AI Stylist - Technical Architecture

## Overview
...

## Component Diagram
...

## Data Flow
...
```

### Step 7.3: Feature Documentation

Create 3 more docs:
- `AIStylist/docs/VOICE_FEATURES.md`
- `AIStylist/docs/ENHANCED_VISION.md`
- `AIStylist/docs/HANDS_FREE_MODE.md`

### Step 7.4: Root-Level Summary

Create `AI_STYLIST_MODULARIZATION_SUMMARY.md` - Use OUTFITSCORER_MODULARIZATION_SUMMARY.md as template.

---

## 🧪 Phase 8: Testing (60 minutes)

### Step 8.1: Compile Check
```bash
# Check for TypeScript errors
npx tsc --noEmit
```

Fix any import errors.

### Step 8.2: Test Core Features

Start Expo and test:
- [ ] App launches
- [ ] Navigate to AI Stylist
- [ ] Voice button appears
- [ ] Camera preview works
- [ ] Take a photo
- [ ] Record voice
- [ ] Speech-to-text works
- [ ] Get AI response
- [ ] Text-to-speech works
- [ ] Chat history saves

### Step 8.3: Test Advanced Features
- [ ] Enhanced vision mode
- [ ] Hands-free mode
- [ ] Voice activity detection
- [ ] Context preservation
- [ ] Streaming responses

### Step 8.4: Test Other Features
- [ ] OutfitScorer still works
- [ ] AI Image Generator works
- [ ] Profile screen works
- [ ] Home screen works

---

## 🧹 Phase 9: Cleanup (30 minutes)

### Step 9.1: Delete Original Files from Root

**⚠️ CRITICAL: Only delete after testing confirms everything works!**

```bash
# Verify files were moved to AIStylist/
ls -la AIStylist/utils/

# Safe to delete - AIStylist-exclusive (already moved)
# These commands will fail with "file not found" because files were moved with git mv
# This is expected and confirms files are in the right place
rm utils/audioUtils.ts 2>/dev/null || echo "✅ Already moved"
rm utils/chatUtils.ts 2>/dev/null || echo "✅ Already moved"
rm utils/visionAPI.ts 2>/dev/null || echo "✅ Already moved"
rm utils/storageService.ts 2>/dev/null || echo "✅ Already moved"
rm utils/streamingResponseHandler.ts 2>/dev/null || echo "✅ Already moved"
rm utils/contextManager.ts 2>/dev/null || echo "✅ Already moved"
rm utils/voiceActivityDetection.ts 2>/dev/null || echo "✅ Already moved"
```

### Step 9.2: Verify No Broken Imports

```bash
# Search for any remaining old imports
grep -r "@/utils/audioUtils" --include="*.ts" --include="*.tsx" .
grep -r "@/utils/chatUtils" --include="*.ts" --include="*.tsx" .
# ... repeat for all moved files
```

Should find NO results outside of AIStylist/.

### Step 9.3: Final Compile Check

```bash
npx tsc --noEmit
```

Should have 0 errors.

---

## 💾 Phase 10: Commit & Push (15 minutes)

### Step 10.1: Stage All Changes

```bash
git add AIStylist/
git add app/ai-stylist.tsx
git add *.md
git add -u  # Stage deletions
```

### Step 10.2: Check Status

```bash
git status
```

### Step 10.3: Create Commit

```bash
git commit -m "feat: Complete AIStylist modularization with voice/vision features

- Created self-contained /AIStylist module (7 utilities + screen moved)
- Duplicated 3 shared files for feature independence
- Created comprehensive type definitions
- Organized into screens, components, hooks, utils, types, docs
- All features tested: Voice, Camera, STT, TTS, Vision, Hands-free
- 0 build errors, all features working independently

Module Structure:
/AIStylist/
├── screens/ (AIStylistScreen.tsx - 1,526 lines)
├── components/ (Footer.tsx + future extractions)
├── hooks/ (future custom hooks)
├── utils/ (7 AI Stylist utilities + 2 shared)
├── types/ (chat, audio, vision types)
├── docs/ (architecture, features documentation)
├── index.ts (main export)
└── README.md (complete documentation)

Files Moved:
1. utils/audioUtils.ts → AIStylist/utils/
2. utils/chatUtils.ts → AIStylist/utils/
3. utils/visionAPI.ts → AIStylist/utils/
4. utils/storageService.ts → AIStylist/utils/
5. utils/streamingResponseHandler.ts → AIStylist/utils/
6. utils/contextManager.ts → AIStylist/utils/
7. utils/voiceActivityDetection.ts → AIStylist/utils/
8. app/ai-stylist.tsx → AIStylist/screens/AIStylistScreen.tsx

Shared Files (duplicated):
- utils/pollinationsAI.ts
- utils/chatHistory.ts
- components/Footer.tsx

Key Changes:
- Import paths updated: @/utils/* → @/AIStylist/utils/*
- Created app/ai-stylist.tsx route wrapper
- 4 index.ts files for clean exports
- 6 documentation files created
- Type definitions extracted
- All features independently tested

Testing Completed:
✅ Voice recording/playback working
✅ Speech-to-text conversion working
✅ Text-to-speech responses working
✅ Camera capture working
✅ Enhanced vision mode working
✅ Hands-free mode working
✅ Context management working
✅ Streaming responses working
✅ OutfitScorer unaffected
✅ Other features working
✅ 0 build errors

Closes: AI Stylist modularization complete"
```

### Step 10.4: Push to Repository

```bash
git push origin ai-stylist-modularization
```

---

## ✅ Success Checklist

Before considering the modularization complete:

### Module Structure
- [ ] `/AIStylist` directory exists
- [ ] All subdirectories created (screens, components, hooks, utils, types, docs)
- [ ] 7 utilities moved to AIStylist/utils/
- [ ] 3 shared files duplicated
- [ ] Main screen in AIStylist/screens/
- [ ] 4 index.ts files created
- [ ] Route wrapper created

### Import Paths
- [ ] All imports in AIStylist files use `@/AIStylist/*`
- [ ] No broken imports
- [ ] TypeScript compiles without errors
- [ ] No console warnings about missing modules

### Functionality
- [ ] Voice recording works
- [ ] Audio playback works
- [ ] Speech-to-text works
- [ ] Text-to-speech works
- [ ] Camera preview works
- [ ] Photo capture works
- [ ] Enhanced vision works
- [ ] Hands-free mode works
- [ ] Context preservation works
- [ ] Streaming responses work
- [ ] Chat history saves/loads

### Other Features
- [ ] OutfitScorer works
- [ ] AI Image Generator works
- [ ] Profile screen works
- [ ] Home screen works
- [ ] Navigation works
- [ ] Dark mode works

### Documentation
- [ ] AIStylist/README.md complete
- [ ] Architecture documentation created
- [ ] Feature documentation created (3 files)
- [ ] Root-level summary created
- [ ] All docs reviewed for accuracy

### Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint warnings (or acceptable)
- [ ] Code formatted consistently
- [ ] Comments updated
- [ ] No console.logs left in production code

### Git
- [ ] All changes staged
- [ ] Comprehensive commit message
- [ ] Pushed to repository
- [ ] Ready for pull request (if needed)

---

## 🎉 Completion

When all checkboxes are ✅:

1. Create pull request (if working in branch)
2. Notify team of modularization completion
3. Update project documentation
4. Consider next modularization target (AI Image Generator?)

**Estimated Total Time:** 5-6 hours  
**Complexity:** Medium-High  
**Pattern:** Proven (OutfitScorer success)  
**Risk:** Low

---

## 🆘 Troubleshooting

### "Cannot find module '@/AIStylist/utils/...'"
- Check import path typo
- Verify file exists in AIStylist/
- Restart TypeScript server in VSCode
- Clear Metro bundler cache: `npx expo start -c`

### "Unexpected token export"
- Check for circular dependencies
- Verify index.ts export syntax
- Check default vs named exports

### Features not working
- Check console for errors
- Verify all imports updated
- Test in clean app reload
- Check permissions (camera, mic)

### Build errors
- Run `npx tsc --noEmit` for details
- Check for missing type definitions
- Verify all dependencies installed

---

**Good luck! 🚀 Follow the pattern that worked for OutfitScorer!**
