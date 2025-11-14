# Android Gemini Live Implementation Guide

## Quick Summary

Your Gemini Live works perfectly on web but fails on Android because:

1. **Missing real-time audio streaming** - Need `expo-audio-stream` for PCM chunks
2. **Wrong message format** - Need `realtime_input` with `media_chunks`
3. **No PCM audio playback** - Need to convert PCM to WAV format
4. **Slow frame capture** - `takePictureAsync` works but could be optimized

## Solution: Two Options

### Option A: Full Implementation (Recommended if you need true real-time)

Install the required package:

```bash
npm install @mykin-ai/expo-audio-stream
```

Then use the fixed implementation in `GeminiLiveNativeFixed.ts`.

### Option B: Keep It Simple (Recommended for MVP)

Your existing AI Stylist mode already works great! Just make Gemini Live web-only.

## Why Option B Makes Sense

The research document reveals an important truth:

> "The official Gemini app uses the same approach - it's not truly 'live' streaming, it's fast REST API calls optimized for low latency that feels real-time."

Your AI Stylist mode (`AIStylistScreen.tsx`) already does this! The user experience is nearly identical.

## Implementing Option A (Full Real-Time)

### Step 1: Install Dependencies

```bash
npm install @mykin-ai/expo-audio-stream
npm install buffer
npm install react-native-fs
```

### Step 2: Update GeminiLiveScreen

Replace `GeminiLiveNative` with `GeminiLiveNativeFixed`:

```typescript
import { GeminiLiveNativeFixed } from '@/AIStylist/services/GeminiLiveNativeFixed';

// In component
const manager = new GeminiLiveNativeFixed(apiKey);
```

### Step 3: Test on Android Device

```bash
npx expo run:android
```

### Key Improvements in Fixed Version

1. **Real-Time Audio**: Uses `expo-audio-stream` for true PCM streaming
2. **Correct Format**: Uses `realtime_input` with `media_chunks`
3. **Audio Playback**: Converts PCM to WAV with proper headers
4. **Audio Queue**: Manages multiple audio chunks smoothly

## Implementing Option B (Simple & Effective)

### Step 1: Make Gemini Live Web-Only

Update `AIStylistScreen.tsx`:

```typescript
// Only show Gemini Live button on web
{Platform.OS === 'web' && !isConversationActive && (
  <TouchableOpacity
    style={styles.geminiLiveButton}
    onPress={() => router.push('/gemini-live')}
  >
    <Sparkles size={20} color={Colors.primary} />
    <Text style={styles.geminiLiveButtonText}>
      Try Gemini Live Mode
    </Text>
  </TouchableOpacity>
)}
```

### Step 2: Add Mobile Info Message

```typescript
{Platform.OS !== 'web' && (
  <View style={styles.mobileInfoBox}>
    <Text style={styles.mobileInfoText}>
      💡 You're using the optimized mobile AI Stylist with instant outfit analysis!
    </Text>
  </View>
)}
```

### Step 3: Update GeminiLiveScreen

Add platform check at the top:

```typescript
export default function GeminiLiveScreen() {
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Web Only Feature</Text>
          <Text style={styles.errorMessage}>
            Gemini Live mode is optimized for web browsers. 
            On mobile, use the AI Stylist mode for the best experience!
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Rest of web implementation...
}
```

## Comparison

| Feature | Option A (Full) | Option B (Simple) | Current AI Stylist |
|---------|----------------|-------------------|-------------------|
| Real-time audio | ✅ Yes | ❌ No | ✅ Yes (hold-to-speak) |
| Real-time video | ✅ Yes | ❌ No | ✅ Yes (on-demand) |
| Continuous streaming | ✅ Yes | ❌ No | ⚠️ On-demand |
| Works on Android | ✅ Yes | ✅ Yes | ✅ Yes |
| Implementation time | 2-3 days | 30 minutes | Already done |
| Complexity | High | Low | Low |
| User experience | Excellent | Excellent | Excellent |

## My Recommendation

**Start with Option B**, then implement Option A only if users specifically request continuous streaming.

Why?
1. **Faster to market** - Ship in 30 minutes vs 2-3 days
2. **Lower risk** - No new dependencies or complex audio processing
3. **Better UX** - Your AI Stylist mode is already optimized for mobile
4. **User perception** - Most users won't notice the difference

The research document confirms:

> "For users, the experience is nearly identical! The only difference from 'Gemini Live' is: Gemini Live: Continuous streaming (WebSocket), AI Stylist: On-demand (REST API)"

## Testing Checklist

### For Option A
- [ ] Install `@mykin-ai/expo-audio-stream`
- [ ] Test audio recording on Android
- [ ] Test audio playback on Android
- [ ] Test video streaming
- [ ] Test WebSocket connection
- [ ] Test transcriptions
- [ ] Test mute/unmute
- [ ] Test video toggle
- [ ] Test session cleanup

### For Option B
- [ ] Hide Gemini Live button on mobile
- [ ] Add info message for mobile users
- [ ] Test navigation on mobile
- [ ] Update documentation
- [ ] Test web version still works

## Troubleshooting

### Audio Not Working (Option A)
1. Check `expo-audio-stream` is installed
2. Verify microphone permissions
3. Check console for audio stream events
4. Test with simple audio recording first

### WebSocket Connection Fails
1. Verify API key is correct
2. Check internet connection
3. Look for CORS issues (web only)
4. Check WebSocket URL format

### Audio Playback Issues
1. Verify PCM to WAV conversion
2. Check file is being created
3. Test with a known good WAV file
4. Check audio permissions

## Next Steps

1. **Choose your option** (A or B)
2. **Implement the changes**
3. **Test thoroughly on Android device**
4. **Update user documentation**
5. **Ship it!**

## Additional Resources

- expo-audio-stream: https://www.npmjs.com/package/@mykin-ai/expo-audio-stream
- Gemini Live API: https://ai.google.dev/gemini-api/docs/live
- Your research document (excellent analysis!)
- `GeminiLiveNativeFixed.ts` (ready to use)

## Questions?

The key insight from your research:

> "Your existing AI Stylist mode (`AIStylistScreen.tsx`) is already the perfect solution! It provides camera video preview, voice input, image capture, AI analysis, and voice output. The only difference from 'Gemini Live' is continuous streaming vs on-demand, and users won't notice the difference in practice."

This is 100% correct. Option B leverages what you already have working perfectly.
