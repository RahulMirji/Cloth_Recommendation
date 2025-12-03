# Android Gemini Live Fix - Implementation Plan

## Problem Analysis

The current Android implementation fails because:

1. **Missing Real-Time Audio Streaming**: Using `expo-av` Recording API which doesn't provide real-time PCM chunks
2. **Incorrect Audio Format**: Gemini requires 16-bit PCM at 16kHz, but we're sending M4A/AAC
3. **No Audio Playback**: PCM audio from Gemini cannot be played directly with expo-av
4. **Frame Capture Issues**: `takePictureAsync` is too slow for real-time streaming

## Required Changes

### 1. Install Required Packages

```bash
npm install @mykin-ai/expo-audio-stream
npm install expo-audio
npm install react-native-fs
npm install buffer
```

### 2. Use expo-audio-stream for Real-Time PCM

This package provides:
- Real-time PCM audio chunks (16-bit, 16kHz)
- Direct base64 encoding
- Low latency streaming
- Works on Android/iOS

### 3. Implement Proper Audio Playback

Convert PCM to WAV with proper headers for playback.

### 4. Use Frame Processor for Video

Instead of `takePictureAsync`, use `react-native-vision-camera` with frame processors for true real-time video.

## Implementation Steps

### Step 1: Audio Input Pipeline

```typescript
import ExpoAudioStream from '@mykin-ai/expo-audio-stream';

// Start streaming
await ExpoAudioStream.startRecording({
  sampleRate: 16000,
  channels: 1,
  encoding: 'pcm_16bit',
  interval: 100, // Get chunks every 100ms
  onAudioStream: async (event) => {
    const audioBase64 = event.data; // Already in base64 PCM format
    await this.sendAudioChunk(audioBase64);
  }
});
```

### Step 2: Fix WebSocket Message Format

The research shows the correct format should be:

```typescript
// For audio chunks
{
  "realtime_input": {
    "media_chunks": [
      {
        "mime_type": "audio/pcm;rate=16000",
        "data": audioBase64
      }
    ]
  }
}

// For video frames
{
  "realtime_input": {
    "media_chunks": [
      {
        "mime_type": "image/jpeg",
        "data": imageBase64
      }
    ]
  }
}
```

### Step 3: Audio Output Pipeline

```typescript
private addWavHeader(base64PCM: string, sampleRate: number, channels: number, bitDepth: number): string {
  const pcmData = Buffer.from(base64PCM, 'base64');
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);

  // WAV header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * (bitDepth / 8), 28);
  header.writeUInt16LE(channels * (bitDepth / 8), 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  const wavBuffer = Buffer.concat([header, pcmData]);
  return wavBuffer.toString('base64');
}
```

### Step 4: Video Streaming with Vision Camera

```typescript
import { Camera, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  
  // Process frames at 2 FPS
  if (frame.timestamp % 500 < 50) {
    const buffer = frame.toArrayBuffer();
    runOnJS(processFrameBuffer)(buffer);
  }
}, []);

const processFrameBuffer = async (buffer: ArrayBuffer) => {
  const base64 = Buffer.from(buffer).toString('base64');
  await sendVideoFrame(base64);
};
```

## Alternative: Use Firebase AI Logic SDK (Android Native)

For a more robust solution, use Firebase's Android SDK:

```kotlin
// In Android native module
val model = FirebaseAI
    .getInstance(GenerativeBackend.googleAI())
    .liveModel(
        "gemini-live-2.5-flash-preview",
        LiveGenerationConfig.Builder()
            .setResponseModality(ResponseModality.AUDIO)
            .setSpeechConfig(SpeechConfig(Voice("FENRIR")))
            .build()
    )
```

This requires creating a native module bridge.

## Recommended Approach

**Option A: Full Native Implementation** (Complex but best performance)
- Use `@mykin-ai/expo-audio-stream` for audio
- Use `react-native-vision-camera` for video
- Implement proper PCM to WAV conversion
- Estimated time: 2-3 days

**Option B: Hybrid Approach** (Balanced)
- Keep WebView for web platform
- Use simplified REST API for mobile
- Implement push-to-talk instead of continuous streaming
- Estimated time: 4-6 hours

**Option C: Mobile-Optimized Experience** (Fastest)
- Keep existing AI Stylist mode for mobile (it works great!)
- Make Gemini Live web-only
- Add clear messaging about platform differences
- Estimated time: 30 minutes

## My Recommendation

**Go with Option C** for now, then implement Option B if needed.

Why?
1. Your existing AI Stylist mode already provides excellent mobile experience
2. The "continuous streaming" of Gemini Live is mostly marketing - the experience is similar
3. You can ship immediately instead of spending days on complex audio processing
4. Users won't notice the difference in practice

## Code Changes for Option C

Make Gemini Live web-only and improve mobile messaging:

```typescript
// In AIStylistScreen.tsx - only show Gemini Live button on web
{Platform.OS === 'web' && !isConversationActive && (
  <TouchableOpacity
    style={styles.geminiLiveButton}
    onPress={() => router.push('/gemini-live')}
  >
    <Text>🚀 Try Gemini Live Mode</Text>
  </TouchableOpacity>
)}

// Add info for mobile users
{Platform.OS !== 'web' && (
  <View style={styles.infoBox}>
    <Text style={styles.infoText}>
      💡 You're using the optimized mobile AI Stylist mode with instant outfit analysis!
    </Text>
  </View>
)}
```

## Next Steps

1. Decide which option to pursue
2. If Option A or B: Install required packages
3. If Option C: Update UI to clarify platform differences
4. Test thoroughly on Android device
5. Update documentation

## Resources

- expo-audio-stream: https://www.npmjs.com/package/@mykin-ai/expo-audio-stream
- react-native-vision-camera: https://react-native-vision-camera.com/
- Gemini Live API: https://ai.google.dev/gemini-api/docs/live
- Firebase AI Logic: https://firebase.google.com/docs/ai-logic/live-api
