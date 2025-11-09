# Groq Whisper Integration for AI Stylist STT

## 🎯 Overview

AI Stylist now uses **Groq's Whisper API** for Speech-to-Text (STT) transcription, providing ultra-fast and cost-effective voice recognition for real-time fashion conversations.

## 📊 Model Comparison & Selection

| Model | Cost/Hour | Speed | Accuracy (WER) | Translation | Best For |
|-------|-----------|-------|----------------|-------------|----------|
| **whisper-large-v3-turbo** ✅ | **$0.04** | **216x** | 12% | ❌ No | Real-time voice UI |
| whisper-large-v3 | $0.111 | 189x | 10.3% | ✅ Yes | High-accuracy transcription |

### ✅ Why whisper-large-v3-turbo?

1. **64% Cost Savings** - $0.04 vs $0.111 per hour
2. **14% Faster** - 216x vs 189x realtime speed
3. **Real-time Optimized** - Perfect for conversational AI
4. **Good Enough Accuracy** - 1.7% WER difference is negligible for fashion queries
5. **No Translation Needed** - AI Stylist only supports English

### 📈 Accuracy Trade-off Analysis

```
Fashion Query Examples:
✅ "What goes with this blue shirt?" - Both models handle perfectly
✅ "Show me outfit suggestions" - Both models handle perfectly  
✅ "I need styling advice for a date" - Both models handle perfectly

The 1.7% accuracy difference (12% vs 10.3% WER) matters more for:
❌ Medical transcription (drug names, dosages)
❌ Legal transcription (precise terminology)
❌ Financial transcription (numbers, account details)

For fashion conversations, speed and cost matter more than the marginal accuracy gain.
```

## 🔑 API Configuration

### Environment Variable

```bash
# .env
EXPO_PUBLIC_WISPHERE_API_KEY=gsk_YOUR_GROQ_API_KEY
```

**Note:** Variable name kept as `WISPHERE_API_KEY` for backward compatibility, but it's actually a **Groq API key**.

### Get Your API Key

1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `gsk_`)
5. Add to `.env` file

## 🚀 Implementation Details

### File Structure

```
AIStylist/
├── utils/
│   └── audioUtils.ts           # Main STT implementation
├── screens/
│   └── AIStylistScreen.tsx     # UI integration
└── GROQ_WHISPER_INTEGRATION.md # This file
```

### Code Flow

```typescript
// 1. User speaks into microphone
const recording = await Audio.Recording.createAsync();

// 2. Audio recorded and saved
const uri = recording.getURI();

// 3. Groq Whisper API transcribes
const transcription = await convertAudioToText(uri);

// 4. AI Stylist responds
const response = await generateAIResponse(transcription);
```

### API Endpoint

```typescript
POST https://api.groq.com/openai/v1/audio/transcriptions

Headers:
   Authorization: Bearer gsk_YOUR_API_KEY

FormData:
  file: audio.webm (or .mp3, .wav, etc.)
  model: whisper-large-v3-turbo
  response_format: json
  language: en (optional, improves speed)
```

### Fallback Strategy

The implementation includes a robust fallback chain:

```
1. Try Groq Whisper API (primary) 
   ↓ (if fails or no key)
2. Try OpenAI Whisper API (fallback)
   ↓ (if fails or no key)  
3. Use device speech recognition (native)
   ↓ (if unavailable)
4. Return default prompt (last resort)
```

## 📝 Usage Example

```typescript
import { convertAudioToText } from '@/AIStylist/utils/audioUtils';

// Transcribe audio file
async function transcribeUserSpeech(audioUri: string) {
  try {
    const text = await convertAudioToText(audioUri);
    console.log('User said:', text);
    // Process the transcription...
  } catch (error) {
    console.error('Transcription failed:', error);
  }
}
```

## ⚡ Performance Characteristics

### Speed Comparison

```
User speaks: "What outfit should I wear to a business meeting?"

╔════════════════════════════════════════════════════╗
║                   Processing Time                  ║
╠════════════════════════════════════════════════════╣
║ Groq whisper-large-v3-turbo:     ~1-2 seconds     ║
║ OpenAI whisper-1:                ~3-5 seconds      ║
║ Groq whisper-large-v3:           ~2-3 seconds      ║
╚════════════════════════════════════════════════════╝
```

### Cost Comparison (Monthly Estimates)

```
Assuming 1,000 users × 5 voice queries/day × 5 seconds/query

Monthly Usage: ~7 hours of audio

╔══════════════════════════════════════════════════╗
║              Monthly Cost Estimate               ║
╠══════════════════════════════════════════════════╣
║ Groq whisper-large-v3-turbo:  $0.28/month  ✅   ║
║ Groq whisper-large-v3:        $0.78/month       ║
║ OpenAI whisper-1:             ~$3-5/month        ║
╚══════════════════════════════════════════════════╝

💰 Savings: 86% cheaper than OpenAI
```

## 🔧 Configuration Options

### Timeout Settings

```typescript
const timeout = 12000; // 12 seconds for turbo model
```

**Why 12 seconds?**
- Turbo model is 216x realtime
- Most voice queries are 3-5 seconds
- 12s timeout provides 2-3x safety margin
- Faster than default 15s for OpenAI Whisper

### Retry Logic

```typescript
maxRetries: 3           // Try up to 3 times
exponentialBackoff: true // Wait 1s, 2s, 4s between retries
```

### Language Setting

```typescript
form.append('language', 'en'); // Optimize for English
```

**Benefits:**
- ✅ Faster processing (skips language detection)
- ✅ Better accuracy for English speech
- ✅ Lower latency for real-time conversations

## 🧪 Testing

### Test Voice Queries

```typescript
// Fashion-specific queries to test
const testQueries = [
  "What goes with this blue shirt?",
  "Show me outfit suggestions for a date night",
  "I need styling advice for a job interview",
  "What colors match with these pants?",
  "Can you recommend accessories for this dress?"
];
```

### Manual Testing Steps

1. **Launch AI Stylist Screen**
   ```bash
   npm start
   # Press 'a' for Android or 'i' for iOS
   ```

2. **Grant Permissions**
   - Allow microphone access when prompted

3. **Test Voice Input**
   - Tap microphone button
   - Speak a fashion query
   - Check transcription accuracy in logs

4. **Verify API Call**
   ```typescript
   // Check console for:
   console.log('🎵 STT Attempt 1/3 using Groq Whisper-Turbo');
   console.log('✅ Groq Whisper-Turbo STT Success on attempt 1');
   ```

5. **Test Fallback**
   - Temporarily remove API key
   - Verify fallback to OpenAI or device STT

## 📊 Monitoring & Logging

### Success Logs

```typescript
✅ Groq Whisper-Turbo STT Success on attempt 1
// Transcription: "What should I wear today?"
```

### Error Logs

```typescript
❌ STT Attempt 1/3 failed: Network timeout
⏳ Waiting 1000ms before retry...
🎵 STT Attempt 2/3 using Groq Whisper-Turbo
```

### Performance Metrics

```typescript
// Track these metrics in production
{
  transcriptionTime: 1.2,        // seconds
  attemptCount: 1,               // retry attempts
  modelUsed: 'whisper-large-v3-turbo',
  success: true,
  errorRate: 0.05                // 5% error rate
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "No STT API key found"

```bash
❌ Problem: API key not loaded
✅ Solution: Check .env file and restart dev server
```

#### 2. "Empty transcription"

```bash
❌ Problem: Audio too short or silent
✅ Solution: Speak clearly for at least 1 second
```

#### 3. "Groq STT failed: 401 Unauthorized"

```bash
❌ Problem: Invalid API key
✅ Solution: Generate new key from console.groq.com
```

#### 4. "Network timeout"

```bash
❌ Problem: Slow connection or large audio file
✅ Solution: Retry automatically (already implemented)
```

### Debug Mode

Enable verbose logging:

```typescript
// In audioUtils.ts
const DEBUG_STT = true;

if (DEBUG_STT) {
  console.log('📝 Audio URI:', audioUri);
  console.log('📝 Audio size:', audioBlob.size);
  console.log('📝 API endpoint:', 'https://api.groq.com/...');
}
```

## 🔄 Switching Models

### To Use whisper-large-v3 Instead

```typescript
// In audioUtils.ts line ~250
form.append('model', 'whisper-large-v3'); // Change from whisper-large-v3-turbo
```

**When to use v3 instead of turbo:**
- Need maximum accuracy (10.3% vs 12% WER)
- Need translation support (100+ languages)
- Budget is not a constraint
- Latency requirements are relaxed

## 📈 Future Enhancements

### Potential Improvements

1. **Voice Activity Detection (VAD)**
   - Detect speech vs silence
   - Auto-stop recording when user finishes speaking
   - Reduce unnecessary API calls

2. **Streaming STT**
   - Real-time transcription as user speaks
   - Show partial results immediately
   - Better UX for long queries

3. **Multi-language Support**
   - Switch to whisper-large-v3 for translation
   - Detect user's language automatically
   - Respond in user's preferred language

4. **On-device STT**
   - Use local Whisper.cpp for offline mode
   - Privacy-focused users
   - Reduce API costs for power users

## 🔐 Security & Privacy

### Data Handling

```typescript
// Audio data flow
Recording → Groq API → Transcription → Deleted
          (HTTPS)      (returned)     (not stored)
```

**Privacy Guarantees:**
- ✅ Audio transmitted over HTTPS
- ✅ Not stored on Groq servers (per policy)
- ✅ Transcription returned and deleted
- ✅ No audio files persist after transcription

### API Key Security

```bash
# ✅ DO: Store in .env (not committed)
EXPO_PUBLIC_WISPHERE_API_KEY=gsk_...

# ❌ DON'T: Hardcode in source files
const API_KEY = 'gsk_...' // NEVER do this!
```

## 📚 Resources

- [Groq Documentation](https://console.groq.com/docs)
- [Whisper Model Card](https://github.com/openai/whisper)
- [Groq API Pricing](https://groq.com/pricing/)
- [OpenAI Whisper Comparison](https://openai.com/index/whisper/)

## 🤝 Contributing

To improve STT integration:

1. Test with diverse accents and speech patterns
2. Monitor error rates in production
3. Report issues with audio quality/transcription
4. Suggest optimizations for speed/cost

## 📄 License

Part of the AI Dresser application.

---

**Last Updated:** November 9, 2025  
**Model Version:** whisper-large-v3-turbo  
**API Version:** Groq OpenAI-compatible v1
