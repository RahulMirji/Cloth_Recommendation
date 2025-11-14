# Quick Start: Video Streaming with Gemini Live

## 🚀 Get Started in 3 Steps

### Step 1: Open Gemini Live Screen

```typescript
// Navigate to Gemini Live
router.push('/gemini-live');
```

### Step 2: Enable Video Mode

Before starting the session:
1. Tap the **"📹 Video Mode"** button (it will turn blue)
2. Or keep it on **"🎤 Audio Only"** for audio-only mode

### Step 3: Start Live Session

1. Tap **"Start Live Session"**
2. Grant camera and microphone permissions
3. Start talking about your outfit!

That's it! The AI can now see and hear you in real-time.

---

## 🎛️ Controls

### During a Session

| Control | Action |
|---------|--------|
| 🔇 Mute Button | Mute/unmute your microphone |
| 📞 End Call Button | Stop the session |
| 🔄 Flip Camera | Switch front/back (before session) |

### Video Settings

**Before starting a session**, you can:
- Toggle between Video Mode and Audio Only
- Choose front or back camera

**During a session**:
- Video mode is locked (stop session to change)
- Mute/unmute works independently

---

## ⚙️ Advanced Configuration

### Adjust Frame Rate (Developers)

```typescript
import { videoStreamService } from '@/AIStylist/services/VideoStreamService';

// Low bandwidth (1 fps)
videoStreamService.setFrameRate(1);

// Balanced (2 fps) - DEFAULT
videoStreamService.setFrameRate(2);

// High quality (5 fps)
videoStreamService.setFrameRate(5);
```

### Adjust Quality

```typescript
// Lower quality for faster streaming
videoStreamService.setQuality(0.5); // 50%

// Balanced - DEFAULT
videoStreamService.setQuality(0.7); // 70%

// High quality
videoStreamService.setQuality(0.9); // 90%
```

---

## 💡 Tips for Best Experience

### 📹 Video Mode
- **Good lighting**: Make sure your outfit is well-lit
- **Stable position**: Hold phone steady or use a stand
- **Full view**: Show your full outfit in frame
- **Front camera**: Better for outfit analysis

### 🎤 Audio Only Mode
- **Faster**: Lower latency, less bandwidth
- **Battery friendly**: Uses less power
- **Privacy**: No video sent to AI
- **Still works**: AI remembers previous images

### 🌐 Network
- **WiFi recommended**: For video mode
- **4G/5G works**: But may be slower
- **Slow connection?**: Use audio-only mode
- **Bandwidth**: Video uses ~140 KB/s at default settings

---

## 🐛 Troubleshooting

### Video Not Working?

1. **Check permissions**: Camera and microphone must be allowed
2. **Try audio-only**: Toggle off video mode
3. **Restart app**: Close and reopen
4. **Check API key**: Verify `EXPO_PUBLIC_GEMINI_API_KEY` is set

### High Latency?

1. **Reduce frame rate**: Lower to 1 fps
2. **Lower quality**: Set to 0.5
3. **Use audio-only**: Disable video
4. **Check network**: Switch to WiFi

### Battery Draining Fast?

1. **Use audio-only mode**: Saves significant battery
2. **Lower frame rate**: Reduce to 1 fps
3. **Shorter sessions**: Take breaks
4. **Close other apps**: Free up resources

---

## 📊 Performance Presets

### Preset 1: Low Bandwidth
```typescript
videoStreamService.updateConfig({
  frameRate: 1,
  quality: 0.5,
});
```
- **Bandwidth**: ~50 KB/s
- **Best for**: Slow connections, battery saving
- **Latency**: Higher

### Preset 2: Balanced (DEFAULT)
```typescript
videoStreamService.updateConfig({
  frameRate: 2,
  quality: 0.7,
});
```
- **Bandwidth**: ~140 KB/s
- **Best for**: Most users
- **Latency**: Moderate

### Preset 3: High Quality
```typescript
videoStreamService.updateConfig({
  frameRate: 5,
  quality: 0.8,
});
```
- **Bandwidth**: ~350 KB/s
- **Best for**: Fast WiFi, detailed analysis
- **Latency**: Lower

---

## 🎯 Use Cases

### 1. Outfit Check
**Mode**: Video Mode (2 fps)
```
"Hey, how does this outfit look for a job interview?"
```
AI can see your outfit and give real-time feedback.

### 2. Quick Question
**Mode**: Audio Only
```
"Should I wear a tie with this shirt?"
```
AI remembers your previous outfit image.

### 3. Detailed Analysis
**Mode**: Video Mode (5 fps)
```
"Walk me through what works and what doesn't in this outfit."
```
AI can see details and provide comprehensive feedback.

### 4. Shopping Help
**Mode**: Video Mode (2 fps)
```
"I'm trying on this jacket. Does it fit well?"
```
AI analyzes fit and style in real-time.

---

## 🔐 Privacy & Security

### What Gets Sent?
- **Video Mode**: Camera frames (2 per second by default)
- **Audio Mode**: Your voice (continuous)
- **Text**: Transcriptions

### What Doesn't Get Sent?
- **No recording**: Frames are not stored
- **No history**: Previous frames are not kept
- **Ephemeral**: Data is processed in real-time only

### Control Your Data
- **Stop anytime**: End call button stops all streaming
- **Audio-only option**: Disable video completely
- **Mute**: Stop audio without ending session

---

## 📱 Platform Support

| Platform | Video Mode | Audio Only | Notes |
|----------|-----------|------------|-------|
| Web | ✅ Full | ✅ Full | Best experience |
| iOS | ⚠️ WebView | ✅ Full | Some limitations |
| Android | ⚠️ WebView | ✅ Full | Some limitations |

---

## 🆘 Need Help?

1. **Check logs**: Look for errors in console
2. **Try audio-only**: Simpler, more reliable
3. **Restart session**: Stop and start again
4. **Review docs**: See `VIDEO_STREAMING_GUIDE.md`

---

## 🎉 You're Ready!

Start your first video session:
1. Open AI Stylist
2. Tap "🚀 Try Gemini Live"
3. Enable video mode
4. Start talking!

The AI can now see your outfit and provide real-time styling advice. Have fun! 👔✨

---

**Last Updated**: November 2025
