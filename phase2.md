# 📋 Phase 2: Core Infrastructure (PLANNED 🔄)

> **Status**: 📅 PLANNED - Not Started
> **Estimated Duration**: 1-2 weeks
> **Goal**: Achieve true hands-free experience with wake word detection and offline STT

---

## 🎯 Phase 2 Objectives

Upgrade from button/VAD-based interaction to complete hands-free experience with:

- Wake word activation ("Hey Stylist")
- Offline speech-to-text (200-500ms latency)
- Pre-processing and background image capture
- Interruption handling

---

## 📋 PLANNED FEATURES

### 1. **Wake Word Detection** 🎯

**What Needs to Be Done:**

#### **Option A: Porcupine (Recommended)**

- **Library**: `@picovoice/porcupine-react-native`
- **Cost**: Free tier available (up to 3 wake words)
- **Wake Phrase**: "Hey Stylist" or "Hi Stylist"
- **Latency**: <100ms detection
- **Accuracy**: 95%+ in quiet environments

**Implementation Plan:**

1. **Install Porcupine**

   ```bash
   npm install @picovoice/porcupine-react-native
   npx pod-install  # iOS only
   ```

2. **Get API Key**

   - Sign up at https://console.picovoice.ai/
   - Create access key (free tier)
   - Add to `.env`:
     ```
     EXPO_PUBLIC_PORCUPINE_ACCESS_KEY=your_key_here
     ```

3. **Create Wake Word Detector**

   ```typescript
   // utils/wakeWordDetector.ts (TO BE CREATED)
   import { Porcupine } from "@picovoice/porcupine-react-native";

   class WakeWordDetector {
     private porcupine: Porcupine | null = null;
     private isListening = false;

     async start(onWakeWordDetected: () => void) {
       this.porcupine = await Porcupine.fromBuiltInKeywords(
         PORCUPINE_ACCESS_KEY,
         ["hey google"] // Use built-in or custom
       );

       this.porcupine.process((keywordIndex) => {
         if (keywordIndex === 0) {
           console.log("🎯 Wake word detected!");
           onWakeWordDetected();
         }
       });
     }

     async stop() {
       await this.porcupine?.delete();
     }
   }

   export const wakeWordDetector = new WakeWordDetector();
   ```

4. **Integrate into AI Stylist**

   ```typescript
   // app/ai-stylist.tsx (TO BE MODIFIED)

   // Add state
   const [wakeWordEnabled, setWakeWordEnabled] = useState(false);

   // Add useEffect
   useEffect(() => {
     if (wakeWordEnabled && isConversationActive) {
       wakeWordDetector.start(() => {
         // Wake word detected!
         setIsListening(true);
         startHoldToSpeak(); // Auto-start recording
       });

       return () => {
         wakeWordDetector.stop();
       };
     }
   }, [wakeWordEnabled, isConversationActive]);

   // Add toggle button in UI
   <TouchableOpacity onPress={() => setWakeWordEnabled(!wakeWordEnabled)}>
     <Text>🎯 {wakeWordEnabled ? "Wake Word ON" : "Wake Word OFF"}</Text>
   </TouchableOpacity>;
   ```

5. **Add Haptic Feedback**

   ```typescript
   import * as Haptics from "expo-haptics";

   wakeWordDetector.start(() => {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
     // Start recording
   });
   ```

**Expected Outcome:**

- User says "Hey Stylist"
- Device vibrates (haptic feedback)
- Recording starts automatically
- No button press needed

**Testing Plan:**

```bash
# Test wake word detection
1. Enable wake word mode
2. Say "Hey Stylist"
3. ✅ Haptic feedback
4. ✅ Recording starts
5. Ask your question
6. ✅ AI responds
```

**Performance Target:**

- Wake word detection: <100ms
- False positive rate: <1% (1 per 100 hours)
- Accuracy: >95% in quiet environments

---

#### **Option B: OpenWakeWord (Alternative - Free & Offline)**

- **Library**: Custom integration (requires model file)
- **Cost**: 100% free
- **Models**: Pre-trained "hey jarvis", "hey mycroft"
- **Latency**: ~50ms
- **File Size**: ~1MB per wake word model

**Implementation Plan:**

1. **Download Model**

   - Get model from: https://github.com/dscripka/openWakeWord
   - Models: `hey_jarvis.onnx`, `hey_mycroft.onnx`

2. **Integrate ONNX Runtime**

   ```bash
   npm install @siteed/react-native-onnx
   ```

3. **Create Custom Detector**

   ```typescript
   // utils/wakeWordDetector.ts (TO BE CREATED)
   import { InferenceSession } from "@siteed/react-native-onnx";

   class OpenWakeWordDetector {
     private session: InferenceSession | null = null;

     async loadModel() {
       const modelPath = require("../assets/models/hey_stylist.onnx");
       this.session = await InferenceSession.create(modelPath);
     }

     async processAudio(audioBuffer: Float32Array) {
       const input = { audio: audioBuffer };
       const output = await this.session.run(input);
       const score = output.score;

       if (score > 0.5) {
         console.log("🎯 Wake word detected! Score:", score);
         return true;
       }
       return false;
     }
   }
   ```

**Advantages:**

- 100% free
- Fully offline
- No API keys needed
- Custom wake words possible

**Disadvantages:**

- More complex setup
- Need to manage model files
- Lower accuracy than Porcupine

---

### 2. **Offline Speech-to-Text** 📱

**What Needs to Be Done:**

#### **Use Whisper.cpp for React Native**

- **Library**: `whisper-react-native` or `react-native-whisper`
- **Model Size**: 75-142MB (tiny/base models)
- **Latency**: 200-500ms (vs 3-5s online)
- **Accuracy**: 85-95% (comparable to online)
- **Privacy**: 100% on-device

**Implementation Plan:**

1. **Install Whisper React Native**

   ```bash
   npm install whisper-react-native
   npx pod-install  # iOS only
   ```

2. **Download Whisper Model**

   ```bash
   # Download tiny model (75MB) - fastest
   # OR base model (142MB) - better accuracy

   # Add to assets/models/
   # ggml-tiny.en.bin or ggml-base.en.bin
   ```

3. **Create Offline STT Service**

   ```typescript
   // utils/offlineSTT.ts (TO BE CREATED)
   import { initWhisper, transcribeAudio } from "whisper-react-native";

   class OfflineSTTService {
     private initialized = false;

     async initialize() {
       if (this.initialized) return;

       const modelPath = require("../assets/models/ggml-tiny.en.bin");
       await initWhisper({
         filePath: modelPath,
         language: "en",
       });

       this.initialized = true;
       console.log("🎙️ Offline STT initialized");
     }

     async transcribe(audioPath: string): Promise<string> {
       const startTime = Date.now();

       const result = await transcribeAudio({
         filePath: audioPath,
       });

       const duration = Date.now() - startTime;
       console.log(`🎙️ Transcription took ${duration}ms`);

       return result.transcription;
     }

     getEstimatedLatency(audioDurationMs: number): number {
       // Whisper.cpp is typically 0.2-0.3x audio duration
       return audioDurationMs * 0.25;
     }
   }

   export const offlineSTT = new OfflineSTTService();
   ```

4. **Integrate into Audio Utils**

   ```typescript
   // utils/audioUtils.ts (TO BE MODIFIED)
   import { offlineSTT } from "./offlineSTT";

   export async function convertAudioToText(
     audioUri: string,
     useOffline = true // New parameter
   ): Promise<string> {
     if (useOffline) {
       try {
         console.log("🎙️ Using offline STT...");
         await offlineSTT.initialize();
         const text = await offlineSTT.transcribe(audioUri);
         console.log("🎙️ Offline transcription:", text);
         return text;
       } catch (error) {
         console.warn("⚠️ Offline STT failed, falling back to online");
         // Fall back to online Whisper API
       }
     }

     // Original online implementation
     return await convertAudioToTextOnline(audioUri);
   }
   ```

5. **Add Settings Toggle**

   ```typescript
   // app/(tabs)/settings.tsx (TO BE MODIFIED)

   <View style={styles.settingRow}>
     <Text>Offline Speech Recognition</Text>
     <Switch value={useOfflineSTT} onValueChange={setUseOfflineSTT} />
     <Text style={styles.helperText}>
       75MB download required. 5x faster, works offline.
     </Text>
   </View>
   ```

**Expected Outcome:**

- STT latency: 3-5s → 200-500ms (6-10x faster!)
- Works offline (airplane mode, poor network)
- No API costs
- Better privacy (on-device)

**Testing Plan:**

```bash
# Test offline STT
1. Enable offline STT in settings
2. Wait for model download (first time)
3. Hold mic, speak for 5 seconds
4. Release
5. ✅ Should transcribe in <1 second
6. Compare accuracy with online STT
7. Test offline (airplane mode)
```

**Performance Target:**

- Latency: <500ms for 5s audio
- Accuracy: >85% (English)
- Model load time: <2s (one-time)
- Battery impact: 5-10% per hour

---

### 3. **Pre-Processing & Background Image Capture** 📸

**What Needs to Be Done:**

**Goal**: Eliminate 2-3 seconds of image capture latency by capturing images in the background every 5 seconds.

**Implementation Plan:**

1. **Create Background Capture Service**

   ```typescript
   // utils/backgroundImageCapture.ts (TO BE CREATED)

   class BackgroundImageCapture {
     private intervalId: NodeJS.Timeout | null = null;
     private latestImage: string | null = null;
     private captureInterval = 5000; // 5 seconds

     start(cameraRef: React.RefObject<CameraView>) {
       console.log("📸 Starting background capture...");

       this.intervalId = setInterval(async () => {
         try {
           const photo = await cameraRef.current?.takePictureAsync({
             quality: 0.8,
             skipProcessing: true, // Faster
           });

           if (photo?.uri) {
             this.latestImage = photo.uri;
             console.log("📸 Background image captured");
           }
         } catch (error) {
           console.warn("📸 Background capture failed:", error);
         }
       }, this.captureInterval);
     }

     stop() {
       if (this.intervalId) {
         clearInterval(this.intervalId);
         this.intervalId = null;
         console.log("📸 Background capture stopped");
       }
     }

     getLatestImage(): string | null {
       return this.latestImage;
     }

     clearCache() {
       this.latestImage = null;
     }
   }

   export const backgroundCapture = new BackgroundImageCapture();
   ```

2. **Integrate into AI Stylist**

   ```typescript
   // app/ai-stylist.tsx (TO BE MODIFIED)

   useEffect(() => {
     if (isConversationActive) {
       // Start background capture when conversation starts
       backgroundCapture.start(cameraRef);

       return () => {
         backgroundCapture.stop();
       };
     }
   }, [isConversationActive]);

   // Modify uploadImageAndGetURL
   const uploadImageAndGetURL = useCallback(async () => {
     // Try to use cached image first
     const cachedImage = backgroundCapture.getLatestImage();

     if (cachedImage) {
       console.log("📸 Using pre-captured image (0ms latency!)");
       const result = await storageService.uploadCameraImage(cachedImage);
       return result.publicUrl;
     }

     // Fall back to capturing now
     console.log("📸 No cached image, capturing now...");
     // ... existing capture logic
   }, []);
   ```

3. **Add Settings Control**

   ```typescript
   // app/(tabs)/settings.tsx (TO BE MODIFIED)

   <View style={styles.settingRow}>
     <Text>Pre-capture Images</Text>
     <Switch value={enablePreCapture} onValueChange={setEnablePreCapture} />
     <Text style={styles.helperText}>
       Capture images every 5s in background. Faster but uses more battery.
     </Text>
   </View>
   ```

**Expected Outcome:**

- Image capture latency: 2-3s → 0s (instant!)
- Total response time: 7-12s → 4-9s
- Always using recent image (max 5s old)

**Testing Plan:**

```bash
# Test pre-capture
1. Enable pre-capture in settings
2. Start conversation
3. Wait 10 seconds (let it capture 2 images)
4. Ask question immediately
5. ✅ Should use pre-captured image
6. ✅ Console: "📸 Using pre-captured image (0ms latency!)"
7. Check battery usage after 1 hour
```

**Performance Target:**

- Image latency: 2-3s → 0ms
- Battery impact: +10-15% per hour
- Storage: 1-2MB per hour (cache cleared)

**Optimization:**

- Only pre-capture when conversation active
- Adjust interval based on battery level
- Clear cache when conversation ends

---

### 4. **Interruption Handling** ✋

**What Needs to Be Done:**

**Goal**: Allow user to interrupt AI mid-response by speaking.

**Implementation Plan:**

1. **Detect Speech During TTS**

   ```typescript
   // utils/interruptionHandler.ts (TO BE CREATED)

   class InterruptionHandler {
     private isTTSPlaying = false;
     private vadMonitor: any = null;

     async monitorForInterruption(onInterrupted: () => void): Promise<void> {
       this.isTTSPlaying = true;

       // Use VAD to detect user speech while AI is speaking
       vadDetector.startMonitoring((event) => {
         if (event.type === "speech_start" && this.isTTSPlaying) {
           console.log("✋ User interrupted AI!");
           this.isTTSPlaying = false;
           onInterrupted();
         }
       });
     }

     stopMonitoring() {
       vadDetector.stopMonitoring();
       this.isTTSPlaying = false;
     }
   }

   export const interruptionHandler = new InterruptionHandler();
   ```

2. **Integrate into TTS Playback**

   ```typescript
   // app/ai-stylist.tsx (TO BE MODIFIED)

   const playTTSWithInterruption = useCallback(async (text: string) => {
     // Start TTS
     const ttsPromise = speakTextLocal(text);

     // Monitor for interruption
     interruptionHandler.monitorForInterruption(async () => {
       // Stop current TTS
       await stopAllAudio();

       // Start listening to new input
       startHoldToSpeak();

       // Show feedback
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
     });

     await ttsPromise;
     interruptionHandler.stopMonitoring();
   }, []);
   ```

3. **Add Visual Feedback**
   ```typescript
   // Show "Listening..." overlay when interrupted
   {
     isInterrupted && (
       <View style={styles.interruptedOverlay}>
         <Text>✋ Interrupted - Listening...</Text>
       </View>
     );
   }
   ```

**Expected Outcome:**

- User can interrupt AI at any time
- Natural conversation flow
- Alexa-like interruption experience

**Testing Plan:**

```bash
# Test interruption
1. Ask a question
2. While AI is speaking, say "Wait!"
3. ✅ AI stops speaking immediately
4. ✅ Haptic feedback
5. ✅ Recording starts
6. Ask new question
7. ✅ AI responds to new question
```

**Performance Target:**

- Interruption detection: <100ms
- TTS stop latency: <50ms
- Seamless transition to listening

---

## 📁 Files to Create

### **New Utilities (4 files)**

1. **`utils/wakeWordDetector.ts`** (~150 lines)

   - Porcupine or OpenWakeWord integration
   - Wake word monitoring
   - Event emission
   - Resource management

2. **`utils/offlineSTT.ts`** (~120 lines)

   - Whisper.cpp integration
   - Model initialization
   - Audio transcription
   - Fallback handling

3. **`utils/backgroundImageCapture.ts`** (~100 lines)

   - Background capture loop
   - Image caching
   - Resource cleanup

4. **`utils/interruptionHandler.ts`** (~80 lines)
   - Interruption detection
   - TTS stop coordination
   - State management

### **Files to Modify (3 files)**

1. **`app/ai-stylist.tsx`**

   - Add wake word state
   - Add offline STT toggle
   - Integrate background capture
   - Add interruption handling
   - Add new UI toggles

2. **`utils/audioUtils.ts`**

   - Add offline STT option
   - Fallback logic
   - Performance logging

3. **`app/(tabs)/settings.tsx`**
   - Add wake word toggle
   - Add offline STT toggle
   - Add pre-capture toggle
   - Add model download UI

---

## 📊 Expected Performance Improvements

| Metric              | Phase 1 (Current) | Phase 2 (Target)   | Improvement      |
| ------------------- | ----------------- | ------------------ | ---------------- |
| **STT Latency**     | 3-5s (online)     | 0.2-0.5s (offline) | **6-10x faster** |
| **Image Capture**   | 2-3s              | 0s (pre-captured)  | **Instant**      |
| **Wake Word**       | N/A (button)      | <100ms             | **Hands-free**   |
| **Total Response**  | 7-12s             | **4-7s**           | **2-5s faster**  |
| **User Activation** | Button press      | Voice command      | **Zero touch**   |
| **Interruption**    | Not supported     | <100ms             | **Natural flow** |

**Overall**: 7-12s → 4-7s = **2x faster actual response time**

---

## 🧪 Testing Plan

### **Week 1: Wake Word + Offline STT**

**Day 1-2: Wake Word Setup**

- [ ] Install Porcupine SDK
- [ ] Get API key
- [ ] Implement wake word detector
- [ ] Test detection accuracy
- [ ] Test false positive rate
- [ ] Add haptic feedback

**Day 3-4: Offline STT Setup**

- [ ] Install Whisper React Native
- [ ] Download tiny model (75MB)
- [ ] Implement offline STT service
- [ ] Test transcription accuracy
- [ ] Compare latency with online
- [ ] Add fallback logic

**Day 5-7: Integration & Testing**

- [ ] Integrate wake word into AI stylist
- [ ] Integrate offline STT
- [ ] Add settings toggles
- [ ] End-to-end testing
- [ ] Performance benchmarking

### **Week 2: Pre-Capture + Interruption**

**Day 8-10: Background Capture**

- [ ] Implement background capture service
- [ ] Test capture reliability
- [ ] Measure battery impact
- [ ] Add cache management
- [ ] Integrate into main flow

**Day 11-13: Interruption Handling**

- [ ] Implement interruption detector
- [ ] Integrate with TTS
- [ ] Add visual/haptic feedback
- [ ] Test interruption scenarios
- [ ] Handle edge cases

**Day 14: Final Testing**

- [ ] Full end-to-end test
- [ ] Performance benchmarking
- [ ] Battery usage measurement
- [ ] User acceptance testing
- [ ] Documentation update

---

## 🎯 Success Criteria

### **Must Have** ✅

- [ ] Wake word detection working (>90% accuracy)
- [ ] Offline STT functional (<500ms latency)
- [ ] Background capture working (0ms image latency)
- [ ] Interruption handling implemented
- [ ] Battery impact acceptable (<20% per hour)
- [ ] No regression in existing features
- [ ] All tests passing

### **Nice to Have** 🌟

- [ ] Custom wake word training
- [ ] Multiple language support
- [ ] Adaptive capture interval (based on battery)
- [ ] Smart interruption (context-aware)
- [ ] Offline mode fully functional

---

## 💰 Cost & Resources

### **Development Resources**

- **Time**: 1-2 weeks (1 senior developer)
- **Testing Devices**: 2-3 physical devices (iOS + Android)
- **API Keys**:
  - Porcupine: Free tier (sufficient)
  - OR OpenWakeWord: Free (no API key)

### **App Size Impact**

- **Wake Word Models**: +1-5MB
- **Whisper Model**: +75-142MB (tiny/base)
- **Total Increase**: ~80-150MB

### **Runtime Resources**

- **Memory**: +50-100MB (models loaded)
- **CPU**: +5-10% (VAD + wake word monitoring)
- **Battery**: +15-20% per hour (all features active)
- **Storage**: +1-2MB per hour (image cache)

---

## 🔒 Privacy & Security

### **Offline Processing Benefits**

- ✅ All STT processing on-device
- ✅ No audio sent to cloud
- ✅ Works in airplane mode
- ✅ No network required

### **Data Handling**

- Audio: Processed locally, deleted immediately
- Images: Cached temporarily, cleared on quit
- Wake word: Processed locally, no data stored
- Context: In-memory only, not persisted

---

## 📚 Dependencies to Install

```bash
# Wake Word Detection
npm install @picovoice/porcupine-react-native
# OR for OpenWakeWord
npm install @siteed/react-native-onnx

# Offline STT
npm install whisper-react-native

# Haptic Feedback (already installed)
# expo-haptics

# iOS Post-Install
npx pod-install
```

---

## 🚀 Ready to Start?

**Prerequisites:**

- ✅ Phase 1 complete and tested
- ✅ All Phase 1 features working
- ✅ Development environment set up
- ✅ Physical devices for testing

**Start Phase 2:**

1. Review this document thoroughly
2. Set up development branch: `git checkout -b phase2-core-infrastructure`
3. Install dependencies
4. Start with wake word detection (highest impact)
5. Follow testing plan
6. Document progress

---

**Phase 2 Status**: 📅 **PLANNED - Ready to Start**
**Estimated Completion**: 1-2 weeks from start
**Next Phase**: Phase 3 (Local AI + True Streaming)
