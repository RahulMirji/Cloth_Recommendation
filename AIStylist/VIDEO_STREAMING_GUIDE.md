# Video Streaming Integration for Gemini Live API

## Overview

This guide explains how video streaming has been integrated into the AI Stylist's Gemini Live mode, enabling real-time multimodal conversations with both audio and video input.

## Architecture

### Components

1. **VideoStreamService** (`AIStylist/services/VideoStreamService.ts`)
   - Handles continuous frame capture from expo-camera
   - Manages frame rate and quality settings
   - Provides throttling and optimization

2. **GeminiLiveManager** (`AIStylist/utils/geminiLiveAPI.ts`)
   - Manages WebSocket connection to Gemini Live API
   - Streams audio + video frames
   - Handles real-time responses

3. **GeminiLiveScreen** (`AIStylist/screens/GeminiLiveScreen.tsx`)
   - UI for live video + audio conversation
   - Camera controls and video toggle
   - Real-time transcription display

## Features

### ✅ Implemented

- **Continuous Video Streaming**: Captures and sends video frames at configurable frame rates (1-10 fps)
- **Audio Streaming**: Bidirectional audio communication with Gemini
- **Frame Rate Control**: Adjustable fps for bandwidth optimization
- **Quality Settings**: Configurable JPEG quality (0.1-1.0)
- **Video Toggle**: Switch between video mode and audio-only mode
- **Camera Flip**: Switch between front and back cameras
- **Real-time Transcription**: Display user and AI transcriptions
- **Mute Control**: Mute/unmute microphone during conversation

### 🎯 Configuration Options

```typescript
// Default configuration
const config = {
  frameRate: 2,      // 2 frames per second (balanced)
  quality: 0.7,      // 70% JPEG quality
  enabled: true,     // Video streaming enabled
};

// Performance presets
// Low bandwidth: { frameRate: 1, quality: 0.5 }
// Balanced:      { frameRate: 2, quality: 0.7 }
// High quality:  { frameRate: 5, quality: 0.8 }
```

## Usage

### Starting a Video Session

```typescript
import { videoStreamService } from '@/AIStylist/services/VideoStreamService';
import { GeminiLiveManager } from '@/AIStylist/utils/geminiLiveAPI';

// 1. Setup camera reference
videoStreamService.setupCamera(cameraRef.current);

// 2. Start Gemini Live session with video enabled
const manager = new GeminiLiveManager(apiKey);
await manager.startSession(
  mediaStream,
  callbacks,
  { videoEnabled: true } // Enable video streaming
);

// 3. Start video frame streaming
videoStreamService.startStreaming(
  (frameBase64) => {
    // Frame captured - send to Gemini
    manager.sendVideoFrame(frameBase64);
  },
  { frameRate: 2, quality: 0.7 }
);
```

### Adjusting Frame Rate

```typescript
// Change frame rate during streaming
videoStreamService.setFrameRate(5); // 5 fps

// Change quality
videoStreamService.setQuality(0.8); // 80% quality
```

### Stopping Video Stream

```typescript
// Stop video streaming
videoStreamService.stopStreaming();

// Cleanup resources
videoStreamService.cleanup();
```

## Performance Optimization

### Frame Rate Guidelines

| Use Case | Frame Rate | Quality | Bandwidth |
|----------|-----------|---------|-----------|
| Low bandwidth | 1 fps | 0.5 | ~50 KB/s |
| Balanced | 2 fps | 0.7 | ~140 KB/s |
| High responsiveness | 5 fps | 0.7 | ~350 KB/s |
| Maximum quality | 10 fps | 0.8 | ~800 KB/s |

### Best Practices

1. **Start with 2 fps**: Good balance between responsiveness and bandwidth
2. **Monitor network**: Reduce frame rate on slow connections
3. **Use front camera**: Better for outfit analysis
4. **Skip processing**: Use `skipProcessing: true` for faster capture
5. **Throttle logging**: Avoid excessive console logs

### Battery Optimization

- Lower frame rates consume less battery
- Disable video when not needed (audio-only mode)
- Use quality 0.7 or lower for mobile devices

## Platform Support

### Web (✅ Full Support)
- Native WebRTC support
- ImageCapture API for frame grabbing
- Full Gemini Live API support

### Mobile (⚠️ Limited)
- expo-camera for frame capture
- WebView-based implementation
- Some browser limitations apply

## API Integration

### Gemini Live API Configuration

```typescript
const GEMINI_LIVE_CONFIG = {
  MODEL: 'gemini-2.5-flash-native-audio-preview-09-2025',
  SYSTEM_INSTRUCTION: `You are a professional AI stylist...`,
  FRAME_RATE: 2,
  JPEG_QUALITY: 0.7,
  INPUT_SAMPLE_RATE: 16000,
  OUTPUT_SAMPLE_RATE: 24000,
  VOICE_NAME: 'Zephyr',
};
```

### Sending Video Frames

```typescript
// Frame format
const videoMessage = {
  realtime_input: {
    media_chunks: [{
      mime_type: 'image/jpeg',
      data: frameBase64, // Base64 encoded JPEG
    }]
  }
};
```

### Combined Audio + Video

```typescript
// Send both audio and video in one message
const multimodalMessage = {
  realtime_input: {
    media_chunks: [
      { mime_type: 'audio/pcm', data: audioBase64 },
      { mime_type: 'image/jpeg', data: videoBase64 }
    ]
  }
};
```

## Troubleshooting

### Common Issues

**1. No frames being captured**
- Check camera permissions
- Verify camera reference is set
- Ensure streaming is started

**2. High latency**
- Reduce frame rate (try 1 fps)
- Lower quality setting
- Check network connection

**3. WebView not working on mobile**
- Verify API key is set in .env
- Check WebView permissions
- Review console logs in WebView

**4. Audio/video out of sync**
- This is normal with frame-based video
- Gemini processes frames independently
- Consider reducing frame rate

### Debug Logging

```typescript
// Enable detailed logging
const status = videoStreamService.getStatus();
console.log('Video streaming status:', status);

// Monitor frame capture
videoStreamService.startStreaming((frame) => {
  console.log('Frame size:', Math.round(frame.length / 1024) + 'KB');
});
```

## Future Enhancements

- [ ] Adaptive frame rate based on network conditions
- [ ] Frame buffering for smoother streaming
- [ ] Video quality auto-adjustment
- [ ] Native mobile implementation (without WebView)
- [ ] Frame interpolation for smoother video
- [ ] Region of interest (ROI) detection
- [ ] Outfit change detection

## Resources

- [Gemini Live API Documentation](https://ai.google.dev/gemini-api/docs/live)
- [expo-camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)

## Support

For issues or questions:
1. Check console logs for errors
2. Review this guide's troubleshooting section
3. Test with audio-only mode first
4. Verify API key and permissions

---

**Last Updated**: November 2025
**Version**: 1.0.0
