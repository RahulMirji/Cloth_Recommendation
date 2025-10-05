# ⚠️ Speech Recognition Issue with Expo Go

## Problem

```
ERROR Cannot find native module 'ExpoSpeechRecognition', js engine: hermes
```

## Root Cause

**`expo-speech-recognition` is a native module** that is **NOT included in Expo Go**.

Expo Go only includes a limited set of pre-built native modules. Custom native modules require a **development build**.

---

## Solution Options

### Option 1: Use Web Speech API (Recommended for Expo Go)

For **Expo Go compatibility**, we need to use browser-based Web Speech API which works on web but has limitations on mobile.

**Status**: ❌ **Not ideal** - Requires web browser, doesn't work well in native apps

---

### Option 2: Use expo-av Audio Recording (Current Implementation)

The app currently uses `expo-av` to record audio, then sends it to an API for transcription.

**Status**: ✅ **Working** - but needs a working transcription API

**Issue**: The Pollinations API (`https://audio.pollinations.ai/transcribe`) is not working.

---

### Option 3: Create Development Build (Best for Production)

Build a custom development client that includes `expo-speech-recognition`.

**Steps**:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Create development build
eas build --profile development --platform android

# Or for local build
npx expo run:android
```

**Status**: ✅ **Recommended** - Full native performance, works offline

---

### Option 4: Use Alternative Transcription API

Keep using `expo-av` for recording, but use a different transcription service.

**Options**:

1. **Google Cloud Speech-to-Text** - $$ Paid, very accurate
2. **AssemblyAI** - $ Affordable, good accuracy
3. **Deepgram** - $ Real-time, fast
4. **OpenAI Whisper API** - $ Very accurate

**Example with OpenAI Whisper**:

```typescript
async function transcribeWithWhisper(audioUri: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", {
    uri: audioUri,
    type: "audio/m4a",
    name: "audio.m4a",
  } as any);
  formData.append("model", "whisper-1");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer YOUR_OPENAI_API_KEY`,
      },
      body: formData,
    }
  );

  const result = await response.json();
  return result.text;
}
```

**Status**: ✅ **Works in Expo Go** - but requires API key and costs money

---

## Recommended Path Forward

### For Development (Expo Go):

**Use expo-av + Whisper API**

1. Keep the current audio recording with `expo-av`
2. Replace Pollinations API with OpenAI Whisper API
3. Add API key to environment variables

**Pros**:

- ✅ Works in Expo Go immediately
- ✅ No build required
- ✅ Very accurate transcription
- ✅ Fast (1-2 seconds)

**Cons**:

- ❌ Requires API key
- ❌ Costs ~$0.006 per minute
- ❌ Requires network

---

### For Production:

**Create Development Build with expo-speech-recognition**

1. Run `npx expo prebuild`
2. Build with `npx expo run:android`
3. Use native on-device speech recognition
4. Deploy as standalone app

**Pros**:

- ✅ **Free** - no API costs
- ✅ **Fast** - sub-second latency
- ✅ **Offline** - works without internet
- ✅ **Private** - audio stays on device

**Cons**:

- ❌ Requires custom build (can't use Expo Go)
- ❌ Build time ~10-15 minutes
- ❌ Need to rebuild for changes

---

## Immediate Fix (Use Whisper API)

Would you like me to:

1. **Integrate OpenAI Whisper API** for transcription (works in Expo Go)
2. **Set up a development build** for native speech recognition (better for production)
3. **Find another free API** that works for transcription

Let me know which approach you prefer!

---

## Quick Implementation: Whisper API

If you want to try Whisper API now:

1. Get API key from: https://platform.openai.com/api-keys
2. Add to `.env`:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=sk-...
   ```
3. Update `utils/audioUtils.ts` to use Whisper

This will work immediately in Expo Go with accurate transcription!
