# 🔍 Console Log Guide - Verify AI Model Routing

This guide helps you verify which AI API is actually being called when you analyze an outfit.

---

## 🧪 How to Test

1. **Start Expo**: `npx expo start`
2. **Open the app** on your device/simulator
3. **Login as admin** → Go to Dashboard
4. **Switch to a model** (Gemini 2.0 Flash or Gemini 1.5 Flash)
5. **Go to Outfit Scorer**
6. **Upload a photo and analyze**
7. **Watch the console output**

---

## 📋 What You'll See in Console

### When Using **Gemini 2.0 Flash (Official)**

```
╔═══════════════════════════════════════════════════════╗
║         📱 OUTFIT SCORER - ANALYSIS STARTING         ║
╚═══════════════════════════════════════════════════════╝

🎯 Selected Model: Gemini 2.0 Flash (Official)
🔧 Model ID: gemini-2-flash
🏭 Provider: gemini
🤖 Model Name: gemini-2.0-flash-exp
⭐ Quality: ⭐⭐⭐⭐⭐
⚡ Speed: very-fast

╔═══════════════════════════════════════════════════════╗
║                                                       ║
║           🚀 AI MODEL REQUEST ROUTING                ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

📋 Model Info:
   Name: Gemini 2.0 Flash (Official)
   ID: gemini-2-flash
   Provider: gemini
   Model Name: gemini-2.0-flash-exp

🔀 ROUTING DECISION: Official Gemini API
   ✅ Provider is "gemini" - using Google's official API
   🌐 Direct connection to Google servers

═══════════════════════════════════════════════════════
🔵 OFFICIAL GEMINI API CALL STARTING
═══════════════════════════════════════════════════════
🤖 Model: gemini-2.0-flash-exp
📸 Image included: true
🌐 Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp...
📝 Prompt length: 1234 characters
⏰ Timestamp: 2025-11-09T10:30:45.123Z
═══════════════════════════════════════════════════════

⏳ Sending request to Google Gemini API...
⚡ Response received in 2345ms

═══════════════════════════════════════════════════════
✅ OFFICIAL GEMINI API SUCCESS
═══════════════════════════════════════════════════════
📊 Response length: 567 characters
⏱️  Total time: 2345 ms
🎯 Source: Google Gemini API (DIRECT)
═══════════════════════════════════════════════════════

╔═══════════════════════════════════════════════════════╗
║           📥 RESPONSE RECEIVED FROM AI              ║
╚═══════════════════════════════════════════════════════╝
📝 Response preview: {"score":85,"category":"Excellent"...
📊 Total response length: 567 characters
```

### When Using **Gemini 1.5 Flash (Pollinations)**

```
╔═══════════════════════════════════════════════════════╗
║         📱 OUTFIT SCORER - ANALYSIS STARTING         ║
╚═══════════════════════════════════════════════════════╝

🎯 Selected Model: Gemini 1.5 Flash
🔧 Model ID: gemini-flash
🏭 Provider: pollinations
🤖 Model Name: gemini
⭐ Quality: ⭐⭐⭐⭐⭐
⚡ Speed: fast

╔═══════════════════════════════════════════════════════╗
║                                                       ║
║           🚀 AI MODEL REQUEST ROUTING                ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

📋 Model Info:
   Name: Gemini 1.5 Flash
   ID: gemini-flash
   Provider: pollinations
   Model Name: gemini

🔀 ROUTING DECISION: Pollinations Proxy API
   ✅ Provider is "pollinations" - using free proxy
   🌐 Connection via Pollinations proxy

═══════════════════════════════════════════════════════
🟢 POLLINATIONS API CALL STARTING
═══════════════════════════════════════════════════════
🤖 Model: Gemini 1.5 Flash (gemini)
🌐 Endpoint: https://text.pollinations.ai/openai
📤 Provider: Pollinations Proxy
⏰ Timestamp: 2025-11-09T10:30:45.123Z
═══════════════════════════════════════════════════════

⏳ Sending request to Pollinations API...
⚡ Response received in 3456ms

═══════════════════════════════════════════════════════
✅ POLLINATIONS API SUCCESS
═══════════════════════════════════════════════════════
📊 Response length: 543 characters
⏱️  Total time: 3456 ms
🎯 Source: Pollinations Proxy → Gemini
═══════════════════════════════════════════════════════

╔═══════════════════════════════════════════════════════╗
║           📥 RESPONSE RECEIVED FROM AI              ║
╚═══════════════════════════════════════════════════════╝
📝 Response preview: {"score":80,"category":"Good"...
📊 Total response length: 543 characters
```

---

## 🔍 Key Differences to Look For

### Official Gemini (Direct)
- ✅ Shows: `🔵 OFFICIAL GEMINI API CALL STARTING`
- ✅ Shows: `🔀 ROUTING DECISION: Official Gemini API`
- ✅ Shows: `🌐 Endpoint: https://generativelanguage.googleapis.com...`
- ✅ Shows: `🎯 Source: Google Gemini API (DIRECT)`
- ⚡ **Usually faster** (1-3 seconds)

### Pollinations Proxy
- ✅ Shows: `🟢 POLLINATIONS API CALL STARTING`
- ✅ Shows: `🔀 ROUTING DECISION: Pollinations Proxy API`
- ✅ Shows: `🌐 Endpoint: https://text.pollinations.ai/openai`
- ✅ Shows: `🎯 Source: Pollinations Proxy → Gemini`
- ⏱️  **May be slower** (2-5 seconds)

---

## 🎯 Quick Verification Checklist

To confirm you're using the **correct API**, look for these specific lines:

### For Official Gemini:
```
✅ Provider: gemini
✅ 🔀 ROUTING DECISION: Official Gemini API
✅ 🔵 OFFICIAL GEMINI API CALL STARTING
✅ 🎯 Source: Google Gemini API (DIRECT)
```

### For Pollinations:
```
✅ Provider: pollinations
✅ 🔀 ROUTING DECISION: Pollinations Proxy API
✅ 🟢 POLLINATIONS API CALL STARTING
✅ 🎯 Source: Pollinations Proxy → Gemini
```

---

## 🐛 Troubleshooting

### Issue: No console logs appear

**Solution:**
1. Make sure Metro bundler is running
2. Check that you're looking at the correct terminal (not just the device log)
3. Try `npx expo start -c` to clear cache

### Issue: Shows wrong provider

**Possible causes:**
1. Model wasn't saved properly in Dashboard
2. AsyncStorage wasn't updated
3. App needs restart

**Solution:**
1. Go back to Dashboard
2. Select the model again
3. Wait for checkmark to appear
4. Close and reopen the app
5. Try again

### Issue: Logs are mixed up

**This is normal!** If you see both types of logs, you might have:
- Previously used one model, now using another
- Multiple requests happening
- Look for the **most recent** timestamp

---

## 📊 Performance Comparison

Based on the console logs, you can compare:

| Metric | Official Gemini | Pollinations |
|--------|----------------|--------------|
| **Endpoint** | generativelanguage.googleapis.com | text.pollinations.ai |
| **Response Time** | Typically 1-3s | Typically 2-5s |
| **API Key** | Required | Not required |
| **Reliability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Features** | Latest Gemini | May lag behind |

---

## 🎓 What the Logs Tell You

### Timestamps
- Shows exactly when the request was made
- Helps track response times
- Useful for debugging delays

### Response Times
- **< 2 seconds**: Excellent
- **2-4 seconds**: Good
- **> 4 seconds**: Slow (check connection)

### Response Length
- Shows how much text the AI generated
- Outfit analysis typically: 400-800 characters
- Very short responses may indicate errors

### Source Indicator
- **Most important!** Shows which API was actually used
- `Google Gemini API (DIRECT)` = Official API ✅
- `Pollinations Proxy → Gemini` = Proxy API ✅

---

## 📝 Example Test Session

Here's what a complete test should look like:

```bash
# 1. Start Expo
$ npx expo start

# 2. In the app, switch to Gemini 2.0 Flash (Official)

# 3. Analyze an outfit

# 4. You should see this in console:
╔═══════════════════════════════════════════════════════╗
║         📱 OUTFIT SCORER - ANALYSIS STARTING         ║
╚═══════════════════════════════════════════════════════╝

🎯 Selected Model: Gemini 2.0 Flash (Official)  ← Confirms model
🏭 Provider: gemini  ← Key: shows "gemini" not "pollinations"

🔀 ROUTING DECISION: Official Gemini API  ← Confirms routing
🔵 OFFICIAL GEMINI API CALL STARTING  ← Confirms API call
🎯 Source: Google Gemini API (DIRECT)  ← Final confirmation

# ✅ SUCCESS! You're using the official Gemini API
```

---

## 💡 Pro Tips

1. **Keep console open** - Always have the terminal visible when testing
2. **Clear previous logs** - Press Ctrl+K (Mac) or Ctrl+L (Windows) to clear console
3. **Take screenshots** - Capture console output for comparison
4. **Test both models** - Switch back and forth to see the difference
5. **Check timestamps** - Make sure you're looking at the latest logs

---

## ✅ Success Indicators

You'll know the implementation is working correctly when:

1. ✅ Console shows different logs for different models
2. ✅ Official Gemini shows `🔵 OFFICIAL GEMINI API CALL`
3. ✅ Pollinations shows `🟢 POLLINATIONS API CALL`
4. ✅ Endpoint URLs are different
5. ✅ Source indicators are correct
6. ✅ Both models produce valid results

---

## 🚀 Ready to Test!

Now that you have detailed console logging:

1. **Open the console/terminal** where Expo is running
2. **Switch to Gemini 2.0 Flash (Official)** in Dashboard
3. **Analyze an outfit**
4. **Look for the blue "OFFICIAL GEMINI API" logs**
5. **Switch to Gemini 1.5 Flash**
6. **Analyze again**
7. **Look for the green "POLLINATIONS API" logs**

The logs will clearly show you which API is being used! 🎉

---

**Generated by**: GitHub Copilot  
**Purpose**: Verify AI model routing  
**Status**: Ready for testing
