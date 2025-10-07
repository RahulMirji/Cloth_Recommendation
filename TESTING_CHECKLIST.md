# ✅ Phase 1 Fixes - Testing Checklist

> **Purpose**: Verify all 4 critical bugs are fixed
> **Estimated Time**: 10 minutes
> **Required**: Physical device or Android emulator

---

## 🚀 Pre-Test Setup

### Step 1: Clear Caches
```powershell
# Run in PowerShell at D:\ai-dresser
.\test-fixes.ps1
# Answer "Y" when asked to clear caches
```

**Expected Output:**
```
✅ @react-native-voice/voice installed: ^3.2.4
✅ utils\audioUtils.ts exists
✅ utils\visionAPI.ts exists
✅ PHASE1_FIXES.md exists
✅ Voice module import fixed (.default added)
✅ TTS chunking implemented
✅ Vision API timeout optimized (10s, 15s, 20s)
🧹 Clearing .expo cache...
✅ .expo cache cleared
```

### Step 2: Restart Metro
```powershell
bunx rork start -p 85o9mg6zkxdpc0bkp2pt8 --tunnel
```

**Wait for:**
```
✅ Metro bundler started
✅ QR code displayed
```

### Step 3: Open App on Device
- Scan QR code with Expo Go
- OR run: `npx expo run:android`

---

## 🧪 Test 1: Voice Recognition (Bug #1)

### Test Steps:
1. [ ] Open AI Stylist screen
2. [ ] Press and hold the microphone button
3. [ ] Say: "Describe my outfit"
4. [ ] Release the button

### Expected Logs:
```
✅ LOG  🎤 Voice module loaded: function
✅ LOG  🎤 Initializing Voice recognition...
✅ LOG  🎤 Voice methods: ["start", "stop", "destroy", "onSpeechError", ...]
✅ LOG  🎤 Previous Voice session destroyed
✅ LOG  🎤 Voice handlers set
✅ LOG  🎤 Starting Voice recognition...
✅ LOG  🎤 Voice recognition started successfully
✅ LOG  🎤 Speech results: { value: ["describe my outfit"] }
✅ LOG  ✅ STT Success on attempt 1
```

### ❌ ERROR Logs to Watch For (should NOT appear):
```
❌ ERROR  Voice.start is not a function
❌ ERROR  Voice module not available
```

### Result:
- [ ] ✅ Voice recognition started successfully
- [ ] ✅ Speech transcribed correctly
- [ ] ✅ No errors in console

---

## 🧪 Test 2: Vision API Speed (Bug #2)

### Test Steps:
1. [ ] Capture or upload an outfit image
2. [ ] Ask: "What do you think of my outfit?"
3. [ ] Start timer when releasing mic button

### Expected Logs:
```
✅ LOG  📤 Sending request to Vision API...
✅ LOG  🌐 Using Pollinations AI API
✅ LOG  📥 Response received: {"ok": true, "status": 200}
✅ LOG  ✅ Response parsed successfully
✅ LOG  ✅ Vision API success on attempt 1  ⬅️ FIRST ATTEMPT!
✅ LOG  📝 Response preview: Nice mint crewneck...
```

### ❌ ERROR Logs to Watch For (should NOT appear):
```
❌ ERROR  Vision API request timed out after 20 seconds
❌ LOG  🔄 Vision API attempt 2/2...
```

### Result:
- [ ] ✅ Response received in 10-15 seconds (not 20-30s)
- [ ] ✅ Success on FIRST attempt (not retry)
- [ ] ✅ Response is concise (<30 words)

---

## 🧪 Test 3: TTS Streaming (Bug #3)

### Test Steps:
1. [ ] Ask: "Give me detailed styling advice"
2. [ ] Listen to how AI speaks response
3. [ ] Watch console logs

### Expected Logs:
```
✅ LOG  🎵 Chunked response into 3 parts for streaming TTS  ⬅️ KEY!
✅ LOG  🎵 Speaking chunk 1/3: "Nice mint crewneck—clean, casual..."
✅ LOG  ✅ Chunk 1 done
✅ LOG  🎵 Speaking chunk 2/3: "For polish, add a denim or bomber..."
✅ LOG  ✅ Chunk 2 done
✅ LOG  🎵 Speaking chunk 3/3: "White sneakers and a simple watch..."
✅ LOG  ✅ Chunk 3 done
✅ LOG  ✅ All TTS chunks complete
```

### Expected Audio Experience:
```
AI: "Okay!" (instant)
[2-3 second pause]
AI: "Nice mint crewneck—clean, casual." (sentence 1)
[0.2s pause]
AI: "For polish, add a denim or bomber jacket, dark jeans or chinos." (sentence 2)
[0.2s pause]
AI: "White sneakers and a simple watch would complete the look." (sentence 3)
```

### ❌ BAD Experience (should NOT happen):
```
AI: "Okay!"
[10 second pause]
AI: [speaks for 18 seconds non-stop without pausing]
```

### Result:
- [ ] ✅ Response chunked into 2-4 parts
- [ ] ✅ Natural pauses between sentences
- [ ] ✅ Sounds like human conversation
- [ ] ✅ NOT one long robotic audio

---

## 🧪 Test 4: Voice Listening (Bug #4)

### Test Steps:
1. [ ] Enable hands-free mode (toggle switch)
2. [ ] Wait for green indicator
3. [ ] Say: "How do I look?"
4. [ ] Watch for auto-start recording

### Expected Logs:
```
✅ LOG  🎤 Voice module loaded: function
✅ LOG  🎧 VAD: Starting monitoring...
✅ LOG  🎧 VAD: Voice detected!
✅ LOG  🎙️ Starting speech recognition...
✅ LOG  🎤 Voice recognition started successfully
```

### Expected Behavior:
- [ ] ✅ Green indicator shows "Listening..."
- [ ] ✅ Red recording indicator appears when you speak
- [ ] ✅ Recording stops automatically after silence
- [ ] ✅ AI responds to your command

### Result:
- [ ] ✅ System responds to voice commands
- [ ] ✅ Auto-starts recording on speech
- [ ] ✅ Auto-stops after silence
- [ ] ✅ Processes voice correctly

---

## 📊 Final Verification

### All Tests Passed?
- [ ] Test 1: Voice Recognition ✅
- [ ] Test 2: Vision API Speed ✅
- [ ] Test 3: TTS Streaming ✅
- [ ] Test 4: Voice Listening ✅

### Performance Checklist:
- [ ] Voice recognition initializes without errors
- [ ] Vision API responds in 10-15s (first attempt)
- [ ] TTS speaks in natural chunks with pauses
- [ ] Voice commands trigger recording automatically
- [ ] No "Voice.start is not a function" errors
- [ ] No Vision API timeouts on first attempt
- [ ] No long robotic audio outputs
- [ ] Smooth, natural conversation flow

---

## 🆘 If Tests Fail

### Voice Recognition Still Failing:
```powershell
# Reinstall voice package
npm uninstall @react-native-voice/voice
npm install @react-native-voice/voice
npx expo start -c
```

### Vision API Still Timing Out:
1. Check internet connection
2. Try different network
3. Verify image URL is accessible
4. Check logs for "📤 Sending request..."

### TTS Not Chunking:
1. Verify response length > 50 characters
2. Check logs for "🎵 Chunked response into X parts"
3. If missing, review `utils/audioUtils.ts` line ~345

### Voice Not Listening:
1. Check microphone permissions
2. Test on physical device (not emulator)
3. Verify green "Listening" indicator shows
4. Check logs for "🎧 VAD: Voice detected!"

---

## 📝 Test Results Template

Copy and fill out:

```
=== PHASE 1 FIXES TEST RESULTS ===
Date: __________
Device: __________
Tester: __________

Test 1 (Voice Recognition): [ ] PASS [ ] FAIL
  Notes: ________________________________

Test 2 (Vision API Speed): [ ] PASS [ ] FAIL
  Response Time: _____s
  Attempts Needed: _____
  Notes: ________________________________

Test 3 (TTS Streaming): [ ] PASS [ ] FAIL
  Chunks: _____
  Natural Pauses: [ ] YES [ ] NO
  Notes: ________________________________

Test 4 (Voice Listening): [ ] PASS [ ] FAIL
  Auto-Start: [ ] YES [ ] NO
  Auto-Stop: [ ] YES [ ] NO
  Notes: ________________________________

Overall Result: [ ] ALL FIXED ✅ [ ] NEEDS WORK ⚠️

Additional Notes:
_________________________________________________
_________________________________________________
```

---

## 🎉 Success Criteria

All 4 tests pass when:
- ✅ Voice recognition works on first try
- ✅ Vision API responds in <15s
- ✅ TTS streams naturally (2-4 chunks)
- ✅ Voice commands trigger auto-recording
- ✅ No errors in console
- ✅ Smooth conversation experience

---

**Checklist Status**: Ready for Testing
**Expected Time**: 10 minutes
**Expected Result**: 4/4 Tests Passing ✅
