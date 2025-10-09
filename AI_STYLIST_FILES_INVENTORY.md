# 📋 AI Stylist - Complete File Inventory

## 🎯 Purpose
Comprehensive list of all files used by the AI Stylist feature for modularization planning.

**Created:** October 9, 2025  
**Status:** Pre-Modularization Analysis

---

## 📁 Files by Category

### 1. Main Screen (1 file)
```
app/ai-stylist.tsx (1,526 lines)
├── Voice recording and playback
├── Camera integration
├── Speech-to-text conversion
├── Text-to-speech responses
├── Enhanced vision mode
├── Hands-free mode
├── Voice activity detection
├── Context management
├── Streaming response handling
└── Chat history integration
```

**Dependencies:**
- expo-av (Audio)
- expo-camera (CameraView)
- expo-router (Stack, router)
- expo-speech (Speech)
- react-native-safe-area-context
- lucide-react-native (icons)

---

### 2. AI Stylist-Exclusive Utilities (7 files)

#### `utils/audioUtils.ts`
**Purpose:** Speech-to-text, text-to-speech, audio processing  
**Key Functions:**
- `SpeechToTextService` - Singleton service for STT
- `generateSpeakBackAudio()` - Generate TTS audio
- `convertAudioToText()` - Convert recording to text
- `speakTextLocal()` - Local TTS playback
- Audio recording management
- Audio format conversion

**Used By:** `app/ai-stylist.tsx` only  
**Lines:** ~400-500 lines (estimated)  
**External Dependencies:**
- expo-av
- expo-speech
- fetch (for API calls)

---

#### `utils/chatUtils.ts`
**Purpose:** Chat session management and message handling  
**Key Functions:**
- `ChatMessage` - Message type definition
- `ChatSession` - Session type definition
- `generateChatSummary()` - Summarize conversation
- `saveChatSession()` - Save to database
- `generateSessionId()` - Create unique session ID
- `createChatMessage()` - Create message object

**Used By:** `app/ai-stylist.tsx` only  
**Lines:** ~300-400 lines (estimated)  
**External Dependencies:**
- @/lib/supabase

---

#### `utils/visionAPI.ts`
**Purpose:** Enhanced vision analysis for outfit understanding  
**Key Functions:**
- `visionAPI.analyzeImage()` - Analyze uploaded images
- `visionAPI.getOutfitDetails()` - Extract outfit info
- Image preprocessing
- Vision model integration

**Used By:** `app/ai-stylist.tsx` only  
**Lines:** ~200-300 lines (estimated)  
**External Dependencies:**
- @/utils/pollinationsAI
- @/utils/storageService

---

#### `utils/storageService.ts`
**Purpose:** Supabase storage management for vision images  
**Key Functions:**
- `storageService.uploadImage()` - Upload to Supabase
- `storageService.getImageUrl()` - Get public URL
- `storageService.deleteImage()` - Remove image
- `storageService.initializeBucket()` - Setup storage
- `storageService.debugBuckets()` - Debug info

**Used By:** `app/ai-stylist.tsx`, `utils/visionAPI.ts`  
**Lines:** ~300-400 lines (estimated)  
**External Dependencies:**
- @/lib/supabase
- expo-file-system

---

#### `utils/streamingResponseHandler.ts`
**Purpose:** Real-time streaming response handling  
**Key Functions:**
- `StreamingResponseHandler` - Class for streaming
- `handleStreamingResponse()` - Process chunks
- `parseStreamChunk()` - Parse SSE data
- Token buffering
- Error recovery

**Used By:** `app/ai-stylist.tsx` only  
**Lines:** ~200-250 lines (estimated)  
**External Dependencies:**
- fetch (streaming API)

---

#### `utils/contextManager.ts`
**Purpose:** Conversation context management and memory  
**Key Functions:**
- `contextManager.addMessage()` - Add to context
- `contextManager.getContext()` - Retrieve context
- `contextManager.summarizeContext()` - Compress context
- `contextManager.clearContext()` - Reset context
- Context window management
- Message prioritization

**Used By:** `app/ai-stylist.tsx` only  
**Lines:** ~250-300 lines (estimated)  
**External Dependencies:**
- @/utils/pollinationsAI

---

#### `utils/voiceActivityDetection.ts`
**Purpose:** Voice Activity Detection for hands-free mode  
**Key Functions:**
- `vadDetector.start()` - Start VAD
- `vadDetector.stop()` - Stop VAD
- `vadDetector.calibrate()` - Calibrate threshold
- `vadDetector.isSpeaking()` - Check if user speaking
- Energy level detection
- Noise filtering

**Used By:** `app/ai-stylist.tsx` only  
**Lines:** ~150-200 lines (estimated)  
**External Dependencies:**
- expo-av (audio analysis)

---

### 3. Shared Utilities (Already Duplicated for OutfitScorer)

#### `utils/pollinationsAI.ts`
**Purpose:** AI text/image generation  
**Status:** ✅ Already duplicated in OutfitScorer  
**Action:** Copy to AIStylist module  
**Used By:** AI Stylist, OutfitScorer, visionAPI, contextManager

#### `utils/chatHistory.ts`
**Purpose:** Chat history database operations  
**Status:** ✅ Already duplicated in OutfitScorer  
**Action:** Copy to AIStylist module  
**Used By:** AI Stylist, OutfitScorer, History screens

#### `components/Footer.tsx`
**Purpose:** Common footer component  
**Status:** ✅ Already duplicated in OutfitScorer  
**Action:** Copy to AIStylist module (if needed)  
**Used By:** HomeScreen, ProfileScreen, OutfitScorer, AI Stylist

---

### 4. Global Dependencies (Keep as @/ imports)

#### Constants
- `@/constants/colors` - Color palette
- `@/constants/themedColors` - Dark mode colors
- `@/constants/strings` - App strings
- `@/constants/fonts` - Typography

#### Contexts
- `@/contexts/AppContext` - Global app state
- `@/contexts/AlertContext` - Alert system

#### Services
- `@/lib/supabase` - Supabase client

#### Expo Packages
- expo-av
- expo-camera
- expo-router
- expo-speech
- expo-file-system
- react-native-safe-area-context

---

## 🔄 Import Dependency Graph

```
app/ai-stylist.tsx
├── @/utils/pollinationsAI (shared - duplicate)
├── @/utils/audioUtils (exclusive - move)
├── @/utils/chatUtils (exclusive - move)
├── @/utils/visionAPI (exclusive - move)
│   ├── @/utils/pollinationsAI (shared)
│   └── @/utils/storageService (exclusive - move)
├── @/utils/storageService (exclusive - move)
├── @/utils/streamingResponseHandler (exclusive - move)
├── @/utils/contextManager (exclusive - move)
│   └── @/utils/pollinationsAI (shared)
├── @/utils/voiceActivityDetection (exclusive - move)
├── @/lib/supabase (global - keep)
└── @/constants/* (global - keep)
```

---

## 📊 File Statistics

### Files to Move (7 AIStylist-exclusive)
1. ✅ `utils/audioUtils.ts` (~450 lines)
2. ✅ `utils/chatUtils.ts` (~350 lines)
3. ✅ `utils/visionAPI.ts` (~250 lines)
4. ✅ `utils/storageService.ts` (~350 lines)
5. ✅ `utils/streamingResponseHandler.ts` (~225 lines)
6. ✅ `utils/contextManager.ts` (~275 lines)
7. ✅ `utils/voiceActivityDetection.ts` (~175 lines)

**Total:** ~2,075 lines

### Files to Duplicate (3 shared)
1. 🔄 `utils/pollinationsAI.ts` (already in OutfitScorer)
2. 🔄 `utils/chatHistory.ts` (already in OutfitScorer)
3. 🔄 `components/Footer.tsx` (already in OutfitScorer)

### Files to Create (15+ new files)
1. ⏳ `AIStylist/screens/AIStylistScreen.tsx` (refactored from app/ai-stylist.tsx)
2. ⏳ `AIStylist/components/VoiceButton.tsx` (extracted)
3. ⏳ `AIStylist/components/CameraPreview.tsx` (extracted)
4. ⏳ `AIStylist/components/ChatMessage.tsx` (extracted)
5. ⏳ `AIStylist/hooks/useVoiceRecording.ts` (extracted)
6. ⏳ `AIStylist/hooks/useCameraCapture.ts` (extracted)
7. ⏳ `AIStylist/hooks/useConversation.ts` (extracted)
8. ⏳ `AIStylist/types/chat.types.ts` (new)
9. ⏳ `AIStylist/types/audio.types.ts` (new)
10. ⏳ `AIStylist/types/vision.types.ts` (new)
11. ⏳ `AIStylist/index.ts` (main export)
12. ⏳ `AIStylist/README.md` (documentation)
13. ⏳ 4 index.ts files (components, hooks, utils, types)
14. ⏳ 5 documentation files (docs/)

**Estimated Total:** ~24 files in module

---

## 🎯 Modularization Actions

### Phase 1: Move Exclusive Utilities
```bash
# Create directory structure
mkdir -p AIStylist/utils

# Move 7 exclusive utilities
git mv utils/audioUtils.ts AIStylist/utils/
git mv utils/chatUtils.ts AIStylist/utils/
git mv utils/visionAPI.ts AIStylist/utils/
git mv utils/storageService.ts AIStylist/utils/
git mv utils/streamingResponseHandler.ts AIStylist/utils/
git mv utils/contextManager.ts AIStylist/utils/
git mv utils/voiceActivityDetection.ts AIStylist/utils/
```

### Phase 2: Duplicate Shared Utilities
```bash
# Copy shared utilities from OutfitScorer
cp OutfitScorer/utils/pollinationsAI.ts AIStylist/utils/
cp OutfitScorer/utils/chatHistory.ts AIStylist/utils/
cp OutfitScorer/components/Footer.tsx AIStylist/components/
```

### Phase 3: Extract Components & Hooks
```bash
# Create component and hook files
touch AIStylist/components/VoiceButton.tsx
touch AIStylist/components/CameraPreview.tsx
touch AIStylist/components/ChatMessage.tsx
touch AIStylist/hooks/useVoiceRecording.ts
touch AIStylist/hooks/useCameraCapture.ts
touch AIStylist/hooks/useConversation.ts
```

### Phase 4: Create Type Definitions
```bash
# Create type files
touch AIStylist/types/chat.types.ts
touch AIStylist/types/audio.types.ts
touch AIStylist/types/vision.types.ts
```

### Phase 5: Update Import Paths
- Change `@/utils/audioUtils` → `@/AIStylist/utils/audioUtils`
- Change `@/utils/chatUtils` → `@/AIStylist/utils/chatUtils`
- Change `@/utils/visionAPI` → `@/AIStylist/utils/visionAPI`
- Change `@/utils/storageService` → `@/AIStylist/utils/storageService`
- And so on...

---

## ⚠️ Critical Notes

### DO NOT Move These Files
❌ `@/constants/*` - App-wide constants  
❌ `@/contexts/*` - Global app state  
❌ `@/lib/supabase` - Database client  
❌ `@/hooks/useCustomAlert.ts` - Global alert hook  
❌ Expo packages - Framework dependencies

### Careful with These Files
⚠️ `utils/pollinationsAI.ts` - Used by multiple features, duplicate  
⚠️ `utils/chatHistory.ts` - Used by history screens, duplicate  
⚠️ `components/Footer.tsx` - Used by multiple screens, duplicate

### Safe to Move
✅ All 7 AIStylist-exclusive utilities  
✅ Main screen to AIStylist/screens/  
✅ Extracted components to AIStylist/components/  
✅ Extracted hooks to AIStylist/hooks/

---

## 📝 Testing Checklist

After modularization, test:

### Core Features
- [ ] Voice recording starts/stops
- [ ] Audio playback works
- [ ] Speech-to-text conversion accurate
- [ ] Text-to-speech responses work
- [ ] Camera preview displays
- [ ] Camera capture works
- [ ] Image upload successful

### Advanced Features
- [ ] Enhanced vision mode works
- [ ] Hands-free mode activates
- [ ] Voice activity detection accurate
- [ ] Context management preserves history
- [ ] Streaming responses display correctly
- [ ] Chat history saves to database
- [ ] Chat history loads from database

### Integration
- [ ] Navigation to/from AI Stylist works
- [ ] Other features (OutfitScorer, etc.) unaffected
- [ ] Dark mode respects theme
- [ ] Permissions (camera, mic) work

---

## 📚 Documentation to Create

1. **AIStylist/README.md** - Module overview, usage, API
2. **AIStylist/docs/ARCHITECTURE.md** - Technical architecture
3. **AIStylist/docs/VOICE_FEATURES.md** - Voice recording, STT, TTS
4. **AIStylist/docs/ENHANCED_VISION.md** - Vision analysis, storage
5. **AIStylist/docs/HANDS_FREE_MODE.md** - VAD, hands-free usage
6. **AI_STYLIST_MODULARIZATION_SUMMARY.md** - Root-level summary

---

**Status:** Ready for Phase 1 execution ✅  
**Next Step:** Begin moving exclusive utilities  
**Estimated Time to Complete:** 5-6 hours
