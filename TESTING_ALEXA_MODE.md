# 🧪 Alexa-Mode Testing Script

## Quick Test Commands

### 1. Start the Development Server

```powershell
npx expo start
```

### 2. Test on Physical Device (Recommended for VAD)

```powershell
# Scan QR code with Expo Go app
# OR press 'a' for Android, 'i' for iOS
```

---

## 🎯 Test Scenarios

### **Test 1: Instant Acknowledgments** ⚡

**Goal**: Verify <1s perceived latency

1. Navigate to AI Stylist
2. Press "Start Chat"
3. Press and hold mic button
4. Say: **"How do I look?"**
5. Release button

**Expected Results**:

- ✅ Within 0.5s: Hear "Looking good!"
- ✅ Within 7-12s: Hear full fashion analysis
- ✅ Console shows: `⚡ Instant acknowledgment: Looking good!`

**Console Logs to Watch**:

```
⚡ ALEXA-MODE: Starting AI response with streaming...
⚡ Instant acknowledgment: Looking good!
🧠 Context resolved: ...
📝 Vision API Response received: ...
```

---

### **Test 2: Context Memory** 🧠

**Goal**: Verify AI remembers previous exchanges

**Round 1**:

- Say: **"How does this blue shirt look?"**
- ✅ AI responds about blue shirt
- ✅ Console: `📝 Context updated: 1 exchanges in memory`

**Round 2** (immediately after):

- Say: **"What about with black pants?"**
- ✅ AI should mention "blue shirt" from previous exchange
- ✅ Console: `🧠 Context resolved: Referring to the blue item from earlier`

**Round 3**:

- Say: **"Should I change the shirt color?"**
- ✅ AI remembers discussing shirt
- ✅ Console: `📝 Context updated: 3 exchanges in memory`

---

### **Test 3: Hands-Free Mode** 🎤

**Goal**: Verify voice activity detection works

1. Start conversation
2. **Toggle "Hands-Free" button** (should show green)
3. ✅ Alert appears: "🎤 Hands-Free Mode"
4. **Just speak** (no button press): **"Can you hear me?"**
5. Stop speaking for 1 second

**Expected Results**:

- ✅ Recording starts automatically when you speak
- ✅ Console: `🎤 VAD: Speech detected, starting recording...`
- ✅ Recording stops after 800ms silence
- ✅ Console: `🎤 VAD: Speech ended (Xms), stopping recording...`
- ✅ AI processes and responds

**Troubleshooting**:

- If doesn't trigger: Background noise too loud (increase threshold)
- If false triggers: Threshold too low (adjust in voiceActivityDetection.ts)

---

### **Test 4: Template Responses** 🎨

**Goal**: Verify quick template matching

Try these specific questions:

1. **"Is this red shirt good?"**

   - ✅ Should use red color template
   - ✅ Console: `✨ Using quick template: color_compliment`

2. **"Do I look professional?"**

   - ✅ Should use professional style template
   - ✅ Console: `✨ Using quick template: style_positive`

3. **"What should I wear with this?"**
   - ✅ Should use suggestion template
   - ✅ Console: `✨ Using quick template: suggestion`

---

### **Test 5: Progressive Streaming** 🌊

**Goal**: Verify two-phase response delivery

1. Ask any fashion question
2. **Phase 1** (0ms):
   - ✅ Hear instant acknowledgment
   - ✅ See in chat: "Looking good!" (or similar)
3. **Phase 2** (6-10s later):
   - ✅ Hear/see full response
   - ✅ Response feels like it's being generated

---

### **Test 6: Vision Mode Toggle** 👁️

**Goal**: Verify both vision modes work

**Enhanced Vision** (default):

- ✅ Eye icon shows open eye
- ✅ Console: `🚀 Using enhanced vision API with image URL`
- ✅ Response time: 6-10s

**Basic Vision**:

- Toggle to Basic Vision
- ✅ Eye icon shows closed eye
- ✅ Console: `👁️ Using basic vision API with base64 image`
- ✅ Response time: 8-12s

---

### **Test 7: Audio Stop on Quit** 🔇

**Goal**: Verify audio stops immediately on quit

1. Start conversation
2. Ask question
3. While AI is speaking, press **"Quit Chat"**

**Expected Results**:

- ✅ Audio stops immediately
- ✅ Console: `🔇 Stopping all audio playback...`
- ✅ VAD stops if hands-free mode was on
- ✅ Console: `🗑️ Context cleared on conversation quit`

---

## 📊 Performance Monitoring

### **Key Metrics to Track**

Open DevTools Console and filter by these tags:

#### **Instant Acknowledgment** ⚡

```
Search: "⚡ Instant acknowledgment"
Expected: Shows within 500ms of release
```

#### **Context Updates** 🧠

```
Search: "📝 Context updated"
Expected: Shows after each exchange
Format: "X exchanges in memory"
```

#### **VAD Events** 🎤

```
Search: "🎤 VAD"
Expected: Shows speech_start and speech_end
Timing: speech_end - speech_start = speech duration
```

#### **Vision API** 🔍

```
Search: "🚀 Using enhanced vision"
Expected: Shows image URL being used
Timing: Should complete in 6-10s
```

#### **TTS (Text-to-Speech)** 🎵

```
Search: "🎵 Starting TTS"
Expected: Shows response length
Timing: Native TTS should be ~0ms on mobile
```

---

## 🐛 Common Issues & Fixes

### **Issue**: Instant ack not heard

**Cause**: TTS not initialized
**Fix**: Check native TTS permissions
**Command**: Re-enable microphone permissions in phone settings

### **Issue**: Hands-free not triggering

**Cause**: VAD threshold too high
**Fix**: Open `utils/voiceActivityDetection.ts`
**Change**: Line 18: `energyThreshold: -40` → `-45` (more sensitive)

### **Issue**: Context not resolving

**Cause**: Keywords not detected
**Fix**: Check `contextManager.ts` `extractItems()` and `extractColors()`
**Add**: Your specific clothing items to keyword lists (lines 167-171)

### **Issue**: False VAD triggers

**Cause**: Background noise
**Fix**: Increase threshold
**Change**: Line 18: `energyThreshold: -40` → `-35` (less sensitive)

---

## 📈 Performance Benchmarks

### **Target Metrics** (Phase 1)

| Metric             | Target | How to Measure                          |
| ------------------ | ------ | --------------------------------------- |
| Perceived Latency  | <2s    | Time from button release to first audio |
| Instant Ack        | <500ms | Time to hear acknowledgment             |
| Context Resolution | 100%   | "this/that" correctly resolved          |
| VAD Detection      | <50ms  | speech_start event timing               |
| Full Response      | <12s   | Complete AI response delivered          |

### **How to Measure**

**Perceived Latency**:

```javascript
// In Console, search for timestamps:
"🎵 === STOPPING HOLD-TO-SPEAK" (Release button)
"⚡ Instant acknowledgment" (First audio)
// Difference should be <500ms
```

**Full Response Time**:

```javascript
// Search for:
"🎵 === STOPPING HOLD-TO-SPEAK"(Start);
"📝 Vision API Response received"(End);
// Difference should be <12s
```

---

## 🎬 Test Script (Copy-Paste)

### **Quick 5-Minute Test**

```
1. npx expo start
2. Open on phone (Expo Go)
3. Navigate to AI Stylist
4. Press "Start Chat"

Round 1: Test Instant Ack
- Hold mic: "How do I look?"
- ✅ Hear "Looking good!" within 1s

Round 2: Test Context
- Hold mic: "What about this blue shirt?"
- ✅ AI responds about blue
- Hold mic: "And with black pants?"
- ✅ AI mentions "blue shirt"

Round 3: Test Hands-Free
- Toggle "Hands-Free" button
- Just speak: "Can you hear me?"
- ✅ Records automatically
- ✅ Stops after silence

Round 4: Test Quit
- Press "Quit Chat" while AI speaking
- ✅ Audio stops immediately
- ✅ Context cleared
```

---

## 📝 Report Template

Copy this after testing:

```
## Test Results - [Date]

### ✅ Passing Tests
- [ ] Instant acknowledgments (<1s)
- [ ] Context memory (5 exchanges)
- [ ] Hands-free mode (VAD working)
- [ ] Template responses
- [ ] Audio stops on quit

### ❌ Failing Tests
- [ ] Issue: _____
  - Expected: _____
  - Actual: _____
  - Console log: _____

### 📊 Performance
- Perceived latency: _____ms
- Full response time: _____s
- VAD accuracy: _____%
- Context resolution: _____%

### 💡 Observations
- _____
- _____

### 🔧 Recommendations
- _____
- _____
```

---

## 🚀 Next Steps After Testing

1. **If everything passes**:

   - Proceed to Phase 2 (Wake word detection)
   - Document any threshold adjustments needed
   - Collect user feedback

2. **If issues found**:

   - Check console logs for errors
   - Adjust VAD thresholds
   - Add more context keywords
   - File bug report with logs

3. **Performance tuning**:
   - Measure average response times
   - Identify bottlenecks
   - Optimize slow paths

---

**Happy Testing! 🎉**

_Remember: Hands-free mode works best in quiet environments. Test in noisy environment to find optimal VAD threshold._
