# 🎤 STT Testing Guide - AI Stylist

## Quick Test Flow

### Expected Behavior:

```
1. User HOLDS button 🔴
   ↓
2. Recording starts... (you'll see "Recording..." on screen)
   ↓
3. User SPEAKS: "What outfit should I wear today?"
   ↓
4. User RELEASES button 🔴
   ↓
5. Screen shows: "🎤 Converting speech to text..."
   ↓
6. Groq Whisper STT processes audio (1-2 seconds)
   ↓
7. Screen updates with transcribed text: "What outfit should I wear today?"
   ↓
8. Camera captures your outfit image 📸
   ↓
9. Both text + image sent to Gemini AI 🤖
   ↓
10. AI responds with fashion advice 💬
   ↓
11. TTS plays AI response (chunked for streaming) 🔊
```

---

## Step-by-Step Testing

### 1. Start the App

```bash
cd /Users/apple/Cloth_Recommendation
npm start

# Then press 'a' for Android or 'i' for iOS
```

### 2. Navigate to AI Stylist

- From home screen → Tap "AI Stylist" icon
- Or use the navigation menu

### 3. Grant Permissions

When prompted:
- ✅ Allow Camera access
- ✅ Allow Microphone access

### 4. Start Conversation

- Tap the **round microphone button** (bottom center)
- Screen should show: "Tap to start chat"
- Button will turn **primary color**

### 5. Test Voice Input (Hold-to-Speak)

**Important:** You must **PRESS AND HOLD** the button!

#### On Mobile:
```
1. PRESS AND HOLD the microphone button
2. Speak clearly: "Show me outfit ideas for a wedding"
3. RELEASE the button
4. Wait for transcription...
```

#### On Web:
```
Option A (Click-to-speak):
1. CLICK microphone button once
2. Speak: "What goes with this blue shirt?"
3. Wait for transcription...

Option B (Hold-to-speak):
1. PRESS AND HOLD microphone button
2. Speak: "I need styling advice"
3. RELEASE button
```

### 6. Watch the Console Logs

You should see these logs in order:

```typescript
✅ STEP 1: STT
🎵 === STEP 1: STARTING SPEECH-TO-TEXT ===
🎵 Using Groq Whisper API (whisper-large-v3-turbo)
🎵 STT Attempt 1/3 using Groq Whisper-Turbo
✅ Groq Whisper-Turbo STT Success on attempt 1
✅ STT Complete! Transcribed text: "Show me outfit ideas for a wedding"

✅ STEP 2: IMAGE
🎵 === STEP 2: CAPTURING IMAGE ===
📸 Using Basic Vision mode - capturing base64...
✅ Image captured (base64), length: 123456

✅ STEP 3: GEMINI AI
🎵 === STEP 3: SENDING TO GEMINI AI ===
🤖 User input: Show me outfit ideas for a wedding
🤖 Has image: true
⚡ ALEXA-MODE: Starting AI response with streaming...
✅ AI response generation complete!
```

---

## Test Cases

### Test Case 1: Basic Fashion Query
```
User says: "What do you think of my outfit?"
Expected: 
- STT transcribes correctly
- Image captured
- AI analyzes outfit and gives feedback
- TTS plays response
```

### Test Case 2: Color Coordination
```
User says: "What colors go well with this shirt?"
Expected:
- STT transcribes "what colors go well with this shirt"
- AI identifies shirt color from image
- AI suggests matching colors
- Response is spoken back
```

### Test Case 3: Styling Advice
```
User says: "I have a job interview tomorrow, any tips?"
Expected:
- STT transcribes the query
- AI analyzes current outfit
- AI gives professional styling advice
- TTS with streaming chunks
```

### Test Case 4: Follow-up Question
```
First: "How does this look?"
Then: "What about the accessories?"
Expected:
- Context maintained from first question
- AI remembers the outfit being discussed
- Answers specifically about accessories
```

---

## Common Issues & Fixes

### Issue 1: "Recording..." but nothing happens

**Symptoms:**
- Button shows "Recording..."
- Release button but nothing happens
- No STT transcription

**Fix:**
```bash
# Check microphone permissions
# iOS: Settings → Your App → Microphone → Enable
# Android: Settings → Apps → Your App → Permissions → Microphone → Allow
```

**Also check console for:**
```
🎵 ❌ Microphone permission denied
```

### Issue 2: Empty transcription

**Symptoms:**
```
❌ STT Attempt 1/3 failed: Empty transcription
⏳ Waiting 1000ms before retry...
```

**Causes:**
- Speaking too quickly (< 1 second)
- Too quiet / background noise
- Network timeout

**Fix:**
- Speak for at least 2-3 seconds
- Speak louder and clearer
- Check internet connection

### Issue 3: "Could not understand speech"

**Symptoms:**
```
❌ STT FAILED: Speech transcription failed after 3 attempts
```

**Possible causes:**
- No Groq API key in .env
- Invalid API key
- Network issues
- Audio format not supported

**Fix:**
```bash
# 1. Check .env file
cat .env | grep WISPHERE

# Should show:
# EXPO_PUBLIC_WISPHERE_API_KEY=gsk_...

# 2. Verify API key is valid
# Visit: https://console.groq.com/keys
# Regenerate if needed

# 3. Restart dev server
npm start
```

### Issue 4: Image not captured

**Symptoms:**
```
⚠️ Image capture failed (continuing anyway): [error]
🤖 Has image: false
```

**Fix:**
- Make sure camera is not covered
- Check camera permissions
- Try switching camera (front/back button)
- Disable Enhanced Vision if causing issues

### Issue 5: AI doesn't respond

**Symptoms:**
- STT works ✅
- Image captured ✅
- But no AI response

**Check:**
```typescript
// Console should show:
🎵 === STEP 3: SENDING TO GEMINI AI ===

// If this doesn't appear, check:
1. Gemini API key configured?
2. Network connection OK?
3. Check getAIResponseWithImageAndVoice function
```

---

## Debugging Tips

### Enable Verbose Logging

Add this to check each step:

```typescript
// In AIStylistScreen.tsx, add console.log at key points:

console.log('🐛 DEBUG: isRecording =', isRecording);
console.log('🐛 DEBUG: recording =', recording);
console.log('🐛 DEBUG: uri =', uri);
console.log('🐛 DEBUG: voiceText =', voiceText);
```

### Check Groq API Status

```bash
# Test Groq API manually
curl -X POST https://api.groq.com/openai/v1/audio/transcriptions \
  -H "Authorization: Bearer gsk_YOUR_KEY" \
  -F "file=@test.mp3" \
  -F "model=whisper-large-v3-turbo"
```

### Monitor Network Requests

In Chrome DevTools (for web):
1. Open DevTools (F12)
2. Go to Network tab
3. Filter: `groq.com`
4. Look for `/audio/transcriptions` requests

Expected response:
```json
{
  "text": "What outfit should I wear today?"
}
```

---

## Performance Benchmarks

### Expected Timings

```
┌─────────────────────────────────────────┐
│  OPERATION           │  TIME             │
├─────────────────────────────────────────┤
│  Start Recording     │  < 100ms          │
│  Audio Recording     │  2-5 seconds      │
│  Stop Recording      │  < 100ms          │
│  STT Transcription   │  1-2 seconds ⚡   │
│  Image Capture       │  0.5-1 second     │
│  Gemini Processing   │  2-4 seconds      │
│  TTS Generation      │  Instant (native) │
│  Total User Wait     │  ~4-7 seconds     │
└─────────────────────────────────────────┘
```

### Optimal Flow

```
User releases button (t=0)
  ↓
STT starts (t=0)
  ↓
"Converting speech..." shown (t=0)
  ↓
Text appears on screen (t=1.5s) ← User sees result!
  ↓
Image capture (t=2s)
  ↓
Gemini processing (t=2s - t=6s)
  ↓
AI speaks back (t=6s)
```

---

## Success Indicators

✅ **Working Correctly If:**
1. Hold button → "Recording..." appears
2. Release → "🎤 Converting speech to text..." appears
3. 1-2 seconds → Your words appear on screen
4. Camera flash (image captured)
5. AI starts speaking back with advice
6. Glow animation pulses during AI speech

❌ **Not Working If:**
- Button does nothing when held
- Recording never stops
- "Could not understand speech" appears
- No image is captured
- AI never responds
- Console shows errors

---

## Next Steps After Testing

### If Everything Works ✅
- Test with different accents
- Test with background noise
- Test with various fashion queries
- Test follow-up questions (context)

### If Issues Found ❌
1. Check console logs for specific errors
2. Verify API keys in .env
3. Test network connectivity
4. Try Basic Vision mode first
5. Report issues with log screenshots

---

## Quick Checklist

Before reporting issues, verify:

- [ ] Microphone permissions granted
- [ ] Camera permissions granted
- [ ] Groq API key in .env file
- [ ] Internet connection active
- [ ] App restarted after .env changes
- [ ] Spoke for at least 2 seconds
- [ ] Spoke clearly and loud enough
- [ ] Not covering camera
- [ ] Console logs checked
- [ ] Network tab checked (web)

---

**Last Updated:** November 9, 2025  
**STT Model:** Groq whisper-large-v3-turbo  
**Expected Latency:** 1-2 seconds  
**Accuracy:** ~88% (12% WER)
