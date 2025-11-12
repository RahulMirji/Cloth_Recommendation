# Gemini Live Integration

## Overview

The Gemini Live integration brings real-time multimodal AI conversation to the AI Stylist feature. Using Google's Gemini 2.5 Flash model with native audio support, users can have natural, flowing conversations about their outfits while the AI analyzes their appearance in real-time through video streaming.

## Features

### 🎥 Real-Time Video Streaming
- Captures and streams video frames at 2 FPS to Gemini
- Analyzes outfit, colors, fit, and style in real-time
- Provides instant visual feedback

### 🎤 Natural Voice Conversation
- Bidirectional audio streaming (16kHz input, 24kHz output)
- Real-time speech-to-text transcription
- Natural, conversational AI responses with Zephyr voice
- Mute/unmute controls

### 💬 Live Transcription
- Shows user speech as it's transcribed
- Displays AI responses in real-time
- Turn-based conversation management

### 🎯 Outfit Scoring & Styling
- Professional fashion advice
- Contextual questions (where are you going, what's the occasion)
- Friendly, buddy-like interaction style
- Practical styling tips and suggestions

## Architecture

### Components

1. **GeminiLiveManager** (`AIStylist/utils/geminiLiveAPI.ts`)
   - Manages WebSocket connection to Gemini Live API
   - Handles audio/video encoding and streaming
   - Manages audio playback with seamless buffering
   - Provides session lifecycle management

2. **GeminiLiveScreen** (`AIStylist/screens/GeminiLiveScreen.tsx`)
   - UI for live video conversation
   - Camera controls (flip, mute, end call)
   - Real-time transcription display
   - Error handling and user feedback

3. **Route** (`app/gemini-live.tsx`)
   - Expo Router integration
   - Navigation entry point

### Data Flow

```
User Camera/Mic → MediaStream → GeminiLiveManager
                                      ↓
                              Gemini 2.5 Flash API
                                      ↓
                              Audio + Transcription
                                      ↓
                              GeminiLiveScreen UI
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### API Configuration

Located in `AIStylist/utils/geminiLiveAPI.ts`:

```typescript
export const GEMINI_LIVE_CONFIG = {
  MODEL: 'gemini-2.5-flash-native-audio-preview-09-2025',
  SYSTEM_INSTRUCTION: '...', // AI personality and behavior
  FRAME_RATE: 2, // Video frames per second
  JPEG_QUALITY: 0.7, // Image compression quality
  INPUT_SAMPLE_RATE: 16000, // Microphone audio sample rate
  OUTPUT_SAMPLE_RATE: 24000, // AI voice audio sample rate
  VOICE_NAME: 'Zephyr', // AI voice character
};
```

## Usage

### Starting a Live Session

1. Navigate to the Gemini Live screen:
   ```typescript
   router.push('/gemini-live');
   ```

2. Grant camera and microphone permissions

3. Click "Start Live Session"

4. The AI will greet you and start analyzing your outfit

5. Speak naturally - the AI will respond in real-time

### Controls

- **Mute/Unmute**: Toggle microphone input
- **End Call**: Stop the session and return
- **Flip Camera**: Switch between front/back camera (before starting)

## Platform Support

### Web (Full Support) ✅
- All features available
- Uses Web Audio API and MediaStream API
- Requires HTTPS for microphone/camera access

### Mobile (Not Supported) ⚠️
- Gemini Live API requires web platform
- Mobile users should use standard AI Stylist mode
- Shows helpful message directing to web version

## Technical Details

### Audio Processing

**Input (User Speech)**
- Sample Rate: 16kHz
- Format: PCM (16-bit)
- Buffer Size: 4096 samples
- Encoding: Base64

**Output (AI Voice)**
- Sample Rate: 24kHz
- Format: PCM (16-bit)
- Seamless playback with buffering
- Automatic interruption handling

### Video Processing

- Capture Rate: 2 FPS
- Format: JPEG
- Quality: 0.7 (70%)
- Encoding: Base64
- Uses ImageCapture API for efficient frame grabbing

### Session Management

```typescript
// Start session
const manager = new GeminiLiveManager(apiKey);
await manager.startSession(mediaStream, callbacks);

// Mute/unmute
manager.setMuted(true);

// Stop session
await manager.stopSession();
```

### Callbacks

```typescript
interface GeminiLiveCallbacks {
  onSessionUpdate: (session: Partial<GeminiLiveSession>) => void;
  onError: (error: string) => void;
  onAudioData: (audioData: Uint8Array) => void;
  onTranscription: (type: 'user' | 'model', text: string) => void;
}
```

## Error Handling

### Common Errors

1. **API Key Missing**
   - Error: "API key not configured"
   - Solution: Set `EXPO_PUBLIC_GEMINI_API_KEY` in `.env`

2. **Permission Denied**
   - Error: "Camera and microphone access denied"
   - Solution: Grant permissions in browser settings

3. **Connection Failed**
   - Error: "Failed to connect"
   - Solution: Check internet connection and API key validity

4. **Platform Not Supported**
   - Error: "Web only feature"
   - Solution: Use web browser instead of mobile app

## Performance Optimization

### Video Streaming
- 2 FPS reduces bandwidth while maintaining quality
- JPEG compression (70%) balances quality and size
- Efficient frame capture using ImageCapture API

### Audio Streaming
- Chunked processing (4096 samples)
- Seamless playback with buffering
- Automatic cleanup of finished audio sources

### Memory Management
- Proper cleanup on session end
- Audio context closure
- MediaStream track stopping
- Interval clearing

## Comparison with Standard Mode

| Feature | Standard Mode | Gemini Live Mode |
|---------|--------------|------------------|
| Platform | Mobile + Web | Web Only |
| Interaction | Hold-to-speak | Continuous conversation |
| Video | Single frame capture | Real-time streaming |
| Audio | Recorded chunks | Live streaming |
| Latency | ~2-3 seconds | ~500ms |
| Transcription | Post-processing | Real-time |
| Use Case | Detailed analysis | Quick feedback |

## Future Enhancements

### Planned Features
- [ ] Mobile support (when API available)
- [ ] Screen recording/sharing
- [ ] Multi-language support
- [ ] Outfit history with timestamps
- [ ] Save favorite styling tips
- [ ] Share session highlights

### Potential Improvements
- [ ] Adaptive frame rate based on network
- [ ] Background blur/replacement
- [ ] AR try-on integration
- [ ] Group styling sessions
- [ ] Style preference learning

## Troubleshooting

### Video Not Showing
1. Check camera permissions
2. Verify camera is not in use by another app
3. Try refreshing the page

### Audio Not Working
1. Check microphone permissions
2. Verify audio output device
3. Check browser audio settings
4. Try unmuting and remuting

### Connection Issues
1. Verify API key is correct
2. Check internet connection
3. Ensure HTTPS is being used
4. Check browser console for errors

### Poor Performance
1. Close other tabs/applications
2. Check network bandwidth
3. Try reducing video quality (modify JPEG_QUALITY)
4. Ensure good lighting for better video compression

## References

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaStream API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API)
- [ImageCapture API](https://developer.mozilla.org/en-US/docs/Web/API/ImageCapture)

## Credits

Based on the reference implementation from `gemini-outfit-scorer` with enhancements for React Native and Expo integration.
