# 🎤 Quick Start: Groq Whisper STT

## TL;DR

✅ **Use `whisper-large-v3-turbo`** for AI Stylist  
✅ **64% cheaper** than regular v3 ($0.04 vs $0.111/hr)  
✅ **14% faster** (216x vs 189x realtime)  
✅ Already integrated and configured!

## 🚀 Getting Started (3 Steps)

### 1. Get API Key

```bash
# Visit: https://console.groq.com/keys
# Sign up → Create API Key → Copy key (starts with gsk_)
```

### 2. Add to .env

```bash
EXPO_PUBLIC_WISPHERE_API_KEY=gsk_YOUR_KEY_HERE
```

### 3. Test Voice Input

```bash
npm start
# Navigate to AI Stylist → Tap microphone → Speak
```

## 📊 Which Model?

| Need | Use This |
|------|----------|
| ⚡ Speed + Low Cost | **whisper-large-v3-turbo** (default) |
| 🎯 Maximum Accuracy | whisper-large-v3 |
| 🌍 Translation | whisper-large-v3 |

**For Fashion Conversations:** Turbo is perfect! 1.7% accuracy difference is negligible.

## 🔧 How It Works

```
User speaks → Recording → Groq API → Transcription → AI Response
             (1-2s)      (HTTPS)      (JSON)         (streaming)
```

## 📝 Code Example

```typescript
import { convertAudioToText } from '@/AIStylist/utils/audioUtils';

const transcript = await convertAudioToText(audioUri);
// Returns: "What outfit should I wear today?"
```

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| No transcription | Check API key in .env |
| Empty result | Speak longer (>1 second) |
| Timeout | Check internet connection |
| 401 Error | Regenerate API key |

## 💰 Cost Estimate

```
1,000 users × 5 queries/day × 5 seconds
= ~$0.28/month (whisper-large-v3-turbo)
= ~$0.78/month (whisper-large-v3)
```

## 📚 Full Documentation

See [GROQ_WHISPER_INTEGRATION.md](./GROQ_WHISPER_INTEGRATION.md) for:
- Detailed comparison
- Performance metrics
- Security best practices
- Advanced configuration

---

**Need help?** Check logs for `🎵 STT` messages or refer to full docs.
