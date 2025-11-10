# Quick Test Guide - Gemini Live Voice Conversation

## 🚀 Quick Start (2 Minutes)

### Step 1: Start the App
```bash
cd /Users/apple/Cloth_Recommendation
npx expo start
```
- Press `i` for iOS Simulator
- Press `a` for Android Emulator  
- Or scan QR code with Expo Go app

### Step 2: Navigate to AI Stylist
1. Open the app
2. Tap "AI Stylist" from main menu
3. Allow camera + microphone permissions

### Step 3: Enable Live Mode
1. Look for **"Live Mode"** toggle at top (below "Enhanced Vision")
2. Tap it → Should turn green with ⚡ icon
3. Confirm it says "⚡ Live Mode"

### Step 4: Start Conversation
1. Tap the **microphone button** (large circle at bottom)
2. Wait 1-2 seconds for connection
3. Look for:
   - "👂 Listening..." text below button
   - Green microphone icon
   - Status: "Live Chat" at top

### Step 5: Speak!
Say: **"Hello! Can you see what I'm wearing?"**

✅ **Expected Result:**
- Your speech appears as transcript: "You: Hello! Can you..."
- Within 500ms, AI responds with audio
- AI transcript appears: "AI: Yes, I can see..."
- Mic icon changes to 🔊 while AI speaks

### Step 6: Try Interrupting
While AI is speaking, say: **"Wait, stop"**

✅ **Expected Result:**
- AI stops talking immediately
- Transcript clears
- AI listens for your new question

### Step 7: End Conversation
Tap the **microphone button** again

✅ **Expected Result:**
- Connection closes
- Returns to "Tap to start live conversation"
- Glow animation stops

---

## 🐛 Troubleshooting

### Problem: "Connection Failed" Alert

**Causes:**
1. Missing API key
2. Invalid API key
3. Network issues
4. Model not available

**Solutions:**

#### Check API Key (Most Common)
```bash
# 1. Open app.config.js
grep geminiApiKey app.config.js

# 2. Should see:
"geminiApiKey": process.env.EXPO_PUBLIC_GEMINI_API_KEY || "AIza..."

# 3. Check .env file
grep GEMINI .env

# 4. Should see:
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyC...
```

**If API key is missing:**
1. Get key from https://aistudio.google.com/app/apikey
2. Add to `.env` file:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
   ```
3. Restart Expo (`Ctrl+C` then `npx expo start` again)

#### Verify Network
```bash
# Test if API is reachable
curl -v "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-native-audio-preview-09-2025?key=YOUR_KEY"
```

Should return model info (not 404 or auth error)

---

### Problem: No Audio Heard

**Check These:**

1. **Device Volume**
   - Turn up device volume
   - Check mute switch (iOS)

2. **Console Logs**
   ```javascript
   // Look for these in Metro logs:
   ✅ Connected to Gemini Live API
   🤖 AI: [transcript text]
   ❌ Audio playback error: [error details]
   ```

3. **Audio Permissions**
   - iOS: Settings → Privacy → Microphone → Expo Go
   - Android: Settings → Apps → Expo Go → Permissions

4. **Expo AV Setup**
   ```bash
   # Verify expo-av is installed
   npm list expo-av
   
   # Should show: expo-av@~14.0.17 or similar
   ```

---

### Problem: Transcript Not Updating

**Check:**

1. **Live Mode Enabled**
   - Look for green "⚡ Live Mode" toggle
   - If gray, tap to enable

2. **Console Logs**
   ```javascript
   // Should see:
   📝 User: [your speech]
   🤖 AI: [ai response]
   ```

3. **Microphone Permission**
   - Check device settings
   - Try recording test in voice memos app

---

### Problem: AI Doesn't Stop When Interrupted

**This is Expected Behavior:**
- Gemini's VAD (Voice Activity Detection) has ~100-300ms delay
- AI needs to detect you started speaking
- Try speaking louder or clearer

**If AI Never Stops:**
1. Check console for: `⚠️ Interrupt detected`
2. If missing, VAD may not be working
3. Try closing and reopening conversation

---

### Problem: Button Shows Wrong Icon

**Icon States:**
- ⚡ (Lightning): Not connected, ready to start
- 🎤 (Microphone): Connected, listening
- 🔊 (Speaker): AI is speaking
- 🎤 (MicOff): Recording (Regular Mode only)

**If stuck on one icon:**
1. Tap button to disconnect
2. Wait 2 seconds
3. Tap to reconnect

---

## 📊 Debug Commands

### Check Connection Status
Open React Native Debugger and run:
```javascript
// In console:
global.geminiLive
// Should show: { isConnected: true, isListening: true, ... }
```

### Monitor WebSocket
```javascript
// Enable WebSocket debugging
global.WebSocket = require('ws');

// Look for:
[WebSocket] Connected: wss://generativelanguage.googleapis.com/ws/...
[WebSocket] Message received: {"serverContent":...}
```

### Check Audio Recording
```bash
# In Metro logs, look for:
🎵 Starting continuous recording...
🎵 Recording chunk received: 16000 samples
🎵 Sending audio to Gemini...
```

---

## ✅ Verification Checklist

Use this to confirm everything works:

### Basic Setup
- [ ] App starts without crashes
- [ ] Camera view loads
- [ ] "Live Mode" toggle visible
- [ ] Microphone button visible

### Connection
- [ ] Toggle Live Mode → Turns green
- [ ] Tap mic → "Connecting..." shown briefly
- [ ] Status changes to "Live Chat"
- [ ] Icon changes to green 🎤

### Audio Input
- [ ] Speak → Transcript appears
- [ ] "You: [your text]" shown
- [ ] Console shows: `📝 User: ...`
- [ ] Mic icon animates

### Audio Output
- [ ] AI voice heard within 1 second
- [ ] "AI: [response]" transcript appears
- [ ] Icon changes to 🔊
- [ ] Console shows: `🤖 AI: ...`

### Interrupts
- [ ] Start speaking while AI talking
- [ ] AI stops within 300ms
- [ ] New question processed
- [ ] Console shows: `⚠️ Interrupt detected`

### Visual Context
- [ ] Image captured at session start
- [ ] Ask about visible clothing
- [ ] AI describes specific items
- [ ] AI accurate about colors/styles

### Disconnect
- [ ] Tap mic button
- [ ] "Disconnected" shown briefly
- [ ] Returns to ready state
- [ ] No audio still playing

---

## 🎯 Test Scenarios

### Scenario 1: Complete Conversation
```
1. Enable Live Mode
2. Tap mic
3. Say: "Hi! Can you see my outfit?"
4. Wait for response
5. Say: "What do you think of my shirt?"
6. Wait for response
7. Say: "Thanks! Goodbye"
8. Tap mic to end

Expected: All responses within 1 second, accurate descriptions
```

### Scenario 2: Interrupt Flow
```
1. Enable Live Mode
2. Tap mic
3. Say: "Tell me everything about fashion trends"
4. While AI talking, say: "Stop. What color is my shirt?"
5. Verify AI stopped and answered about shirt

Expected: Interrupt works, context maintained
```

### Scenario 3: Long Session
```
1. Enable Live Mode
2. Tap mic
3. Ask 5-10 different questions about outfit
4. Each time wait for full response
5. Verify no disconnects or lag increase

Expected: Stable throughout, no degradation
```

### Scenario 4: Network Recovery
```
1. Start conversation
2. Turn off WiFi/data mid-conversation
3. Note error message
4. Turn on WiFi/data
5. Tap mic to reconnect

Expected: Graceful error, successful reconnect
```

---

## 🔍 Console Log Guide

### Healthy Session Logs
```
🎙️ Starting Gemini Live session...
✅ Connected to Gemini Live API
📸 Sending image for analysis...
✅ Image sent successfully
📝 User: hello can you see my outfit
🤖 AI: Yes I can see you're wearing...
⚠️ Interrupt detected - stopping AI speech
📝 User: what about my shoes
🤖 AI: Your shoes look great...
🛑 Stopping Gemini Live session...
✅ Disconnected successfully
```

### Error Logs
```
❌ Failed to initialize session: API key not found
❌ Session error: WebSocket connection failed
❌ Audio playback error: Audio.Sound not initialized
❌ Recording error: Microphone permission denied
```

---

## 📞 Getting Help

### Still Having Issues?

1. **Check the full logs:**
   ```bash
   # Save Metro logs to file
   npx expo start --clear | tee logs.txt
   ```

2. **Verify installations:**
   ```bash
   npm list expo-av expo-camera expo-constants
   ```

3. **Clean restart:**
   ```bash
   # Clear all caches
   npx expo start --clear
   
   # Or full clean:
   rm -rf node_modules
   npm install
   npx expo start --clear
   ```

4. **Check the docs:**
   - `/AIStylist/GEMINI_LIVE_API_IMPLEMENTATION.md`
   - `/AIStylist/PHASE_2_IMPLEMENTATION_COMPLETE.md`

---

## 💡 Pro Tips

1. **Test in Quiet Environment First**
   - Background noise can trigger VAD
   - Test in quiet room before noisy areas

2. **Speak Clearly**
   - Articulate words for best transcription
   - Pause briefly between sentences

3. **Check Before Long Sessions**
   - Test connection with quick question first
   - Verify audio quality before important use

4. **Monitor Battery**
   - Continuous audio uses more battery
   - Consider plugging in for extended testing

5. **Use Simulator for Quick Tests**
   - iOS Simulator faster than physical device
   - But audio may not work perfectly
   - Physical device recommended for audio testing

---

**Ready to test?** Start with Step 1 above! 🚀
