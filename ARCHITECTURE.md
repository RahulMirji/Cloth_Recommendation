# 🏗️ Alexa-Mode Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            ┌───────▼────────┐           ┌─────────▼────────┐
            │ Button Press   │           │  Hands-Free Mode │
            │ (Hold-to-Talk) │           │  (Voice Activity │
            │                │           │   Detection)     │
            └───────┬────────┘           └─────────┬────────┘
                    │                               │
                    │                   ┌───────────▼──────────┐
                    │                   │  VAD Monitoring      │
                    │                   │  - 50ms polling      │
                    │                   │  - Energy threshold  │
                    │                   │  - Silence detection │
                    │                   └───────────┬──────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                      AUDIO RECORDING                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  expo-av Recording                                            │  │
│  │  - Quality: HIGH_QUALITY                                      │  │
│  │  - Format: M4A (AAC encoded)                                  │  │
│  │  - Sample Rate: 16000 Hz                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  ⚡ INSTANT ACKNOWLEDGMENT                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  streamingResponseHandler.getInstantAcknowledgment()          │  │
│  │                                                                │  │
│  │  Analyze question type:                                       │  │
│  │  - how_look → "Looking good!"                                 │  │
│  │  - what_think → "Let me see..."                               │  │
│  │  - color → "Love that color!"                                 │  │
│  │  - general → "Sure!"                                          │  │
│  │                                                                │  │
│  │  ⏱️ Latency: 0ms (pre-generated)                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
    ┌──────────────────────────┐    ┌──────────────────────────┐
    │  PLAY INSTANT ACK        │    │  PARALLEL PROCESSING     │
    │  (Native TTS - 0ms)      │    │  START                   │
    └──────────────────────────┘    └──────────────┬───────────┘
                                                    │
                    ┌───────────────────────────────┴────────────┐
                    │                                            │
                    ▼                                            ▼
    ┌────────────────────────────┐           ┌─────────────────────────┐
    │  SPEECH-TO-TEXT            │           │  IMAGE CAPTURE/UPLOAD   │
    │  ┌──────────────────────┐  │           │  ┌───────────────────┐  │
    │  │ convertAudioToText() │  │           │  │ Enhanced Vision:  │  │
    │  │ - OpenAI Whisper API │  │           │  │ - Upload to       │  │
    │  │ - Retry logic (3x)   │  │           │  │   Supabase        │  │
    │  │ - Time: 3-5s         │  │           │  │ - Get public URL  │  │
    │  └──────────────────────┘  │           │  │                   │  │
    └────────────────┬───────────┘           │  │ Basic Vision:     │  │
                     │                        │  │ - Base64 encode   │  │
                     │                        │  │ - Time: 2-3s      │  │
                     │                        │  └───────────────────┘  │
                     │                        └─────────────┬───────────┘
                     │                                      │
                     └──────────────┬───────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    🧠 CONTEXT RESOLUTION                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  contextManager.resolveReference(userQuestion)                │  │
│  │                                                                │  │
│  │  Check for references: "this", "that", "previous", etc.      │  │
│  │                                                                │  │
│  │  Memory: Last 5 exchanges with:                               │  │
│  │  - User question                                              │  │
│  │  - AI response                                                │  │
│  │  - Detected items (shirt, pants, etc.)                       │  │
│  │  - Detected colors (red, blue, etc.)                         │  │
│  │  - Sentiment (positive/negative/neutral)                     │  │
│  │                                                                │  │
│  │  Build context prompt for AI                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      VISION API PROCESSING                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  visionAPI.continuousVisionChat()                             │  │
│  │                                                                │  │
│  │  Input:                                                        │  │
│  │  - Image URL or Base64                                        │  │
│  │  - User question                                              │  │
│  │  - Context from memory                                        │  │
│  │                                                                │  │
│  │  API: Pollinations AI (or OpenAI GPT-4 Vision)               │  │
│  │  Config:                                                       │  │
│  │  - max_tokens: 80                                             │  │
│  │  - Prompt: "Keep response under 40 words"                     │  │
│  │  - Timeout: 20s / 30s / 40s (progressive)                     │  │
│  │  - Retries: 2                                                 │  │
│  │                                                                │  │
│  │  ⏱️ Time: 6-10s                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   STORE IN CONTEXT MEMORY                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  contextManager.addExchange()                                 │  │
│  │                                                                │  │
│  │  Store:                                                        │  │
│  │  - User question                                              │  │
│  │  - AI response                                                │  │
│  │  - Image URL                                                  │  │
│  │  - Auto-extract items & colors                               │  │
│  │  - Analyze sentiment                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
    ┌──────────────────────────┐    ┌──────────────────────────┐
    │  CHECK TEMPLATES         │    │  USE FULL RESPONSE       │
    │  ┌────────────────────┐  │    │  ┌────────────────────┐  │
    │  │ tryQuickTemplate() │  │    │  │ Vision API result  │  │
    │  │                    │  │    │  │ (40-50 words)      │  │
    │  │ Color compliments  │  │    │  └────────────────────┘  │
    │  │ Style positives    │  │    └──────────────────────────┘
    │  │ Suggestions        │  │
    │  └────────────────────┘  │
    └────────────┬─────────────┘
                 │
                 └──────────────┬───────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   🎵 TEXT-TO-SPEECH (TTS)                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Platform: Mobile (Native)                                    │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  speakTextLocal(response)                              │  │  │
│  │  │  - expo-speech (native TTS)                            │  │  │
│  │  │  - Voice: selected or default                          │  │  │
│  │  │  - Rate: 1.0 (normal speed)                            │  │  │
│  │  │  - ⏱️ Latency: 0ms (instant playback)                  │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  Platform: Web                                                 │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  generateSpeakBackAudio(response)                      │  │  │
│  │  │  - Pollinations AI TTS                                 │  │  │
│  │  │  - Returns audio URI                                   │  │  │
│  │  │  - ⏱️ Time: 3-5s                                        │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     AUDIO PLAYBACK & UI UPDATE                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Update Chat UI:                                              │  │
│  │  - Show user message (transcribed text)                       │  │
│  │  - Show instant acknowledgment                                │  │
│  │  - Show full AI response                                      │  │
│  │                                                                │  │
│  │  Play audio through device speakers                           │  │
│  │                                                                │  │
│  │  Store in chat session for history                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  AUTO_LISTEN_AFTER_AUDIO ?    │
                    │  (Currently: FALSE)           │
                    └───────────┬───────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                NO  │                       │  YES
                    ▼                       ▼
        ┌──────────────────┐    ┌──────────────────┐
        │  Wait for next   │    │  Auto-start      │
        │  user action     │    │  listening again │
        │  (button press   │    │  (600ms delay)   │
        │   or voice)      │    │                  │
        └──────────────────┘    └──────────────────┘
```

---

## 🔄 Data Flow Timeline

### **Standard Mode (Button-Based)**

```
T+0ms    User presses mic button
         └─ Start recording

T+2000ms User releases button
         ├─ Stop recording
         ├─ ⚡ INSTANT ACK: "Looking good!" (0ms)
         └─ Start parallel processing
             ├─ STT conversion (3-5s)
             └─ Image capture/upload (2-3s)

T+5000ms Parallel processing complete
         ├─ User text transcribed
         ├─ Image uploaded
         └─ 🧠 Check context memory

T+5100ms Context resolved
         └─ Send to Vision API

T+11000ms Vision API responds (6-10s)
          ├─ 🧠 Store in context memory
          ├─ Check templates
          └─ Prepare TTS

T+11100ms Start TTS playback
          └─ 🎵 Native TTS (instant on mobile)

T+16000ms TTS complete
          └─ Wait for next user action
```

**Total Time**: ~14-16s
**Perceived Latency**: <2s (instant ack at T+2000ms)

---

### **Hands-Free Mode (VAD)**

```
T+0ms    VAD monitoring active (50ms polling)
         └─ Checking audio energy level

T+500ms  User starts speaking
         ├─ Energy > -40 dB detected
         ├─ 🎤 VAD Event: speech_start
         └─ Auto-start recording

T+3000ms User stops speaking
         └─ Continue recording...

T+3800ms Silence detected (800ms)
         ├─ 🎤 VAD Event: speech_end
         ├─ Auto-stop recording
         ├─ ⚡ INSTANT ACK: "Looking good!" (0ms)
         └─ Start parallel processing
             ├─ STT conversion (3-5s)
             └─ Image capture/upload (2-3s)

T+8000ms Parallel processing complete
         └─ [Same flow as standard mode]

T+14000ms Vision API responds
          └─ [Same flow as standard mode]

T+14100ms Start TTS playback
          └─ User hears response

T+19000ms TTS complete
          └─ VAD continues monitoring for next speech
```

**Total Time**: ~16-19s from start of speech
**Perceived Latency**: <2s (instant ack at T+3800ms)
**Hands-Free**: ✅ No button press required

---

## 🧩 Component Dependencies

```
ai-stylist.tsx
├── streamingResponseHandler (instant acks, templates)
├── contextManager (memory, reference resolution)
├── vadDetector (hands-free mode)
├── visionAPI (image analysis)
├── audioUtils (STT, TTS)
├── storageService (image upload)
└── chatUtils (session management)

streamingResponseHandler.ts
└── Standalone (no dependencies)

contextManager.ts
└── Standalone (no dependencies)

voiceActivityDetection.ts
└── expo-av (audio recording with metering)

visionAPI.ts
├── pollinationsAI (free API)
└── OpenAI (fallback, requires API key)

audioUtils.ts
├── OpenAI Whisper API (STT)
├── expo-speech (native TTS)
└── Pollinations AI (web TTS)
```

---

## 🎯 Performance Bottlenecks & Solutions

### **Current Bottlenecks**

1. **Vision API (6-10s)** 🐌

   - Cause: Cloud-based, network latency
   - Solution: Local AI models (Ollama + LLaVA)
   - Expected: 1-2s response time

2. **STT Conversion (3-5s)** 🐌

   - Cause: Cloud-based Whisper API
   - Solution: Offline Whisper.cpp
   - Expected: 0.2-0.5s response time

3. **Image Upload (2-3s)** 🐌
   - Cause: Network upload to Supabase
   - Solution: Pre-capture in background every 5s
   - Expected: 0s (already captured)

### **Optimization Roadmap**

**Phase 2** (Reduce actual latency):

- Offline STT: 3-5s → 0.2-0.5s (save 2.5-4.5s)
- Pre-capture images: 2-3s → 0s (save 2-3s)
- **Total savings**: ~5-7s

**Phase 3** (Local AI):

- Vision API: 6-10s → 1-2s (save 4-8s)
- **Total savings**: ~10-15s

**Final Target**:

- Current: 14-16s
- After Phase 2: 7-9s
- After Phase 3: 2-4s actual, <1s perceived

---

## 💾 State Management Flow

```
┌─────────────────────────────────────────────┐
│              REACT STATE                    │
├─────────────────────────────────────────────┤
│ isConversationActive: boolean               │
│ isListening: boolean                        │
│ isRecording: boolean                        │
│ isProcessing: boolean                       │
│ isHandsFreeMode: boolean (NEW)              │
│ vadEnabled: boolean (NEW)                   │
│ messages: ChatMessage[]                     │
│ capturedImage: string | null                │
│ useEnhancedVision: boolean                  │
└─────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐    ┌────────────────────┐
│  CONTEXT MEMORY  │    │   VAD DETECTOR     │
│  (Persistent)    │    │   (Singleton)      │
├──────────────────┤    ├────────────────────┤
│ exchanges: []    │    │ isMonitoring: bool │
│ sessionStart: ms │    │ isSpeaking: bool   │
│ totalExchanges:# │    │ volumeHistory: []  │
└──────────────────┘    └────────────────────┘
        │                         │
        └────────────┬────────────┘
                     ▼
        ┌──────────────────────────┐
        │  CHAT SESSION REF        │
        ├──────────────────────────┤
        │ id: string               │
        │ messages: ChatMessage[]  │
        │ imageBase64: string      │
        │ createdAt: string        │
        └──────────────────────────┘
```

---

## 🔐 Security & Privacy

### **Data Flow**

- **Audio**: Recorded locally → Sent to OpenAI Whisper (encrypted)
- **Images**: Captured locally → Uploaded to Supabase (encrypted)
- **Context**: Stored in-memory only (cleared on quit)
- **Chat History**: Saved to Supabase with user ID

### **Privacy Considerations**

- ❌ Context memory NOT persisted to disk
- ✅ Images uploaded to user's Supabase bucket
- ✅ Audio not stored (deleted after transcription)
- ✅ Chat history opt-in (saved on quit)

---

**Architecture Version**: 1.0 (Phase 1 Complete)
**Last Updated**: October 7, 2025
**Next Update**: Phase 2 (Wake Word + Offline STT)
