# Vision API Integration Guide

## Overview
This document describes the enhanced vision API integration added to the AI Stylist feature, enabling advanced image analysis and continuous live chat functionality.

## Features Added

### 1. Enhanced Vision API Service (`utils/visionAPI.ts`)
- **Pollinations AI Integration**: Direct integration with Pollinations AI vision endpoint
- **Outfit Analysis**: Specialized fashion and style analysis
- **Continuous Chat**: Context-aware vision conversations
- **Multiple Analysis Types**: Quick ratings, detailed feedback, fashion advice

### 2. Supabase Storage Service (`utils/storageService.ts`)
- **Image Upload**: Secure cloud storage for captured images
- **Public URLs**: Get shareable URLs for vision API processing
- **Automatic Cleanup**: Built-in maintenance for old images
- **Bucket Management**: Automatic bucket creation and configuration

### 3. Enhanced AI Stylist Screen (`app/ai-stylist.tsx`)
- **Vision Mode Toggle**: Switch between Enhanced Vision and Basic Vision modes
- **Quick Outfit Analysis**: Instant analysis without starting a chat
- **Live Chat Integration**: Seamless voice + vision interactions
- **Storage Integration**: Automatic image upload and URL generation

## How It Works

### Live Chat Flow
1. **User speaks** → Speech-to-text conversion
2. **Camera captures** → Image uploaded to Supabase storage
3. **Vision API analyzes** → Image URL + user text sent to Pollinations AI
4. **AI responds** → Text-to-speech playback
5. **Repeat** → Continuous conversation loop

### Quick Analysis Flow
1. **User taps "Quick Outfit Analysis"**
2. **Camera captures** → Image uploaded automatically
3. **Vision API analyzes** → Specialized outfit analysis
4. **Results displayed** → Alert with detailed feedback

## API Endpoints Used

### Pollinations AI Vision Endpoint
```bash
curl https://text.pollinations.ai/openai \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai",
    "messages": [
      {
        "role": "user",
        "content": [
          {"type": "text", "text": "Analyze this outfit"},
          {"type": "image_url", "image_url": {"url": "PUBLIC_IMAGE_URL"}}
        ]
      }
    ],
    "max_tokens": 300
  }'
```

## Configuration

### Storage Bucket
- **Bucket Name**: `image-url` (existing Supabase bucket)
- **File Types**: JPEG, PNG, WebP, GIF
- **Folder Structure**: `ai-stylist/timestamp/filename.jpg`
- **Auto Cleanup**: 7 days retention

### Vision API Settings
- **Base URL**: `https://text.pollinations.ai/openai`
- **Model**: `openai`
- **Max Tokens**: 300 (adjustable per use case)

## Usage Examples

### Basic Vision Analysis
```typescript
import { visionAPI } from '@/utils/visionAPI';

const analysis = await visionAPI.analyzeOutfit(imageUrl);
console.log(analysis);
```

### Continuous Chat
```typescript
const response = await visionAPI.continuousVisionChat(
  imageUrl,
  "What do you think of this outfit?",
  previousConversation
);
```

### Image Upload
```typescript
import { storageService } from '@/utils/storageService';

const result = await storageService.uploadCameraImage(imageUri);
if (result.success) {
  console.log('Image URL:', result.publicUrl);
}
```

## UI Features

### Vision Mode Toggle
- **Enhanced Vision**: Uses Supabase storage + Pollinations AI
- **Basic Vision**: Uses local base64 + original processing
- **Toggle Location**: Top center of AI Stylist screen

### Quick Analysis Button
- **Visibility**: Only shown when Enhanced Vision is enabled
- **Function**: Instant outfit analysis without chat
- **Feedback**: Alert popup with detailed analysis

## Error Handling

### Fallback Mechanisms
1. **Storage Failure** → Falls back to Basic Vision mode
2. **Vision API Failure** → Falls back to original text generation
3. **Upload Failure** → Retry with base64 encoding

### User Notifications
- Storage setup issues → Alert with fallback option
- Analysis failures → Error alert with retry suggestion
- Network issues → Graceful degradation

## Performance Considerations

### Image Optimization
- **Quality**: 80% JPEG compression for uploads
- **Size**: Automatic resizing for mobile cameras
- **Format**: JPEG standardization for consistency

### Caching
- **Public URLs**: Cached for session duration
- **Analysis Results**: Stored in conversation history
- **Image Cleanup**: Automatic 7-day retention

## Future Enhancements

### Planned Features
1. **Batch Analysis**: Multiple outfit comparisons
2. **Style History**: Track fashion choices over time
3. **Recommendation Engine**: AI-powered shopping suggestions
4. **Social Sharing**: Share outfit analyses with friends

### API Improvements
1. **Custom Models**: Fine-tuned fashion analysis models
2. **Real-time Streaming**: Live analysis during video calls
3. **Multi-language**: Support for different languages
4. **Advanced Filters**: Specific style categories and preferences

## Troubleshooting

### Common Issues
1. **Camera Permission**: Ensure camera access is granted
2. **Storage Permission**: Verify Supabase credentials
3. **Network Connectivity**: Check internet connection
4. **API Limits**: Monitor usage for rate limiting

### Debug Mode
Enable debug logging by setting:
```typescript
console.log('Vision API debugging enabled');
```

## Security Notes

### Data Privacy
- **Image Storage**: Temporary with automatic cleanup
- **API Calls**: Encrypted HTTPS communication
- **User Data**: No personal information stored with images
- **Session Isolation**: User-specific storage paths

### Access Control
- **Bucket Policies**: Public read, authenticated write
- **Row Level Security**: User-based access control
- **API Keys**: Environment variable protection