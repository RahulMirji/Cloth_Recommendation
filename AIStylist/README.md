# AI Stylist Module

A self-contained, voice-activated conversational AI stylist module with real-time image analysis and streaming responses.

## 📁 Module Structure

```
AIStylist/
├── screens/
│   ├── AIStylistScreen.tsx       # Main AI stylist screen with voice interaction
│   └── index.ts                   # Screen exports
├── components/
│   └── index.ts                   # Component exports (uses global Footer)
├── utils/
│   ├── audioUtils.ts              # Speech-to-text and text-to-speech
│   ├── chatHistory.ts             # Chat conversation persistence
│   ├── chatUtils.ts               # Chat utilities and session management
│   ├── contextManager.ts          # Conversational context management
│   ├── pollinationsAI.ts          # AI text generation
│   ├── storageService.ts          # Image storage service
│   ├── streamingResponseHandler.ts # Real-time response streaming
│   ├── supabaseStorage.ts         # Supabase storage integration
│   ├── visionAPI.ts               # Image analysis and vision API
│   ├── voiceActivityDetection.ts  # Voice activity detection
│   └── index.ts                   # Utils exports
├── types/
│   └── index.ts                   # TypeScript type definitions
├── index.ts                       # Main module exports
└── README.md                       # This file
```

## ✨ Features

### 1. **Voice-Activated Conversational AI**

- Real-time speech-to-text using expo-speech and @react-native-voice/voice
- Natural language understanding for fashion queries
- Text-to-speech responses for hands-free operation
- Continuous conversation with context awareness

### 2. **Image Analysis**

- Camera integration for outfit capture
- Vision API integration for image analysis
- Real-time outfit recommendations based on visual input
- Support for both front and back camera

### 3. **Streaming Responses**

- Instant acknowledgment of user input
- Progressive display of AI responses
- Simulated streaming for better UX
- Quick response suggestions

### 4. **Context Management**

- Multi-turn conversation support
- Context-aware responses
- Reference resolution (e.g., "that blue shirt")
- Conversation history tracking

### 5. **Voice Activity Detection**

- Automatic speech detection
- Noise cancellation
- Hands-free mode
- VAD-based conversation control

### 6. **Data Persistence**

- Chat history saved to Supabase
- Image storage in Supabase Storage
- Session management
- User-specific data isolation

## 🚀 Usage

### Basic Import

```typescript
import { AIStylistScreen } from "@/AIStylist";
```

### Using Utilities

```typescript
import { visionAPI, contextManager, storageService } from "@/AIStylist/utils";
```

### Using Types

```typescript
import type {
  ChatMessage,
  ChatSession,
  VisionMessage,
} from "@/AIStylist/types";
```

## 🔧 Configuration

### Required Permissions

- Camera access
- Microphone access
- Audio playback

### Environment Variables

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Dependencies

- `expo-av` - Audio recording and playback
- `expo-camera` - Camera access
- `expo-speech` - Text-to-speech
- `@react-native-voice/voice` - Speech recognition (native only)
- `expo-file-system` - File storage
- `@supabase/supabase-js` - Backend integration

## 📱 Screen Navigation

```typescript
// Navigate to AI Stylist
router.push("/ai-stylist");
```

## 🎯 API Reference

### SpeechToTextService

```typescript
const speechService = SpeechToTextService.getInstance();

// Start listening
await speechService.startListening(
  (result) => console.log(result.text),
  (error) => console.error(error)
);

// Stop listening
speechService.stopListening();
```

### Vision API

```typescript
import { visionAPI } from "@/AIStylist/utils";

// Analyze image
const response = await visionAPI.analyzeImage(
  base64Image,
  "What do you think of this outfit?"
);
```

### Context Manager

```typescript
import { contextManager } from "@/AIStylist/utils";

// Add conversation exchange
contextManager.addExchange("What about the blue shirt?", [
  { text: "The blue shirt looks great!", score: 0.9 },
]);

// Build context prompt
const contextPrompt = contextManager.buildContextPrompt();
```

### Storage Service

```typescript
import { storageService } from "@/AIStylist/utils";

// Upload image
const uploadResult = await storageService.uploadImage(
  base64Image,
  "outfit_photo"
);
```

## 🧪 Testing

### Test Conversation Flow

1. Launch AI Stylist screen
2. Grant camera and microphone permissions
3. Tap microphone button to start listening
4. Say "What do you think of my outfit?"
5. AI responds with fashion advice
6. Continue conversation naturally

### Test Hands-Free Mode

1. Enable hands-free mode toggle
2. AI automatically starts listening after speaking
3. Use voice activity detection
4. Test continuous conversation

## 🐛 Known Issues

- **Audio Utils**: Some audio functions are stubs and need full implementation
- **Web Platform**: Speech recognition uses Web Speech API (limited browser support)
- **Native Voice**: Requires @react-native-voice/voice on native platforms

## 📝 TODO

- [ ] Implement full speech recognition for audioUtils.ts
- [ ] Add audio transcription service integration
- [ ] Enhance VAD accuracy
- [ ] Add conversation export/import
- [ ] Implement conversation analytics
- [ ] Add multi-language support

## 🤝 Contributing

This module follows the feature modularization pattern:

1. Keep all AI Stylist code self-contained
2. Duplicate small shared utilities (< 200 lines)
3. Use `@/AIStylist/*` import paths
4. Export all public APIs through index.ts
5. Document all public functions

## 📄 License

Part of the AI Dresser application.
