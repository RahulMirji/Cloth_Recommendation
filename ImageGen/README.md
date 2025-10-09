# Image Generator Module

A self-contained, modular implementation of the AI-powered image generation feature using Pollinations API.

## 📁 Module Structure

```
ImageGen/
├── screens/              # Main screen components
│   ├── ImageGeneratorScreen.tsx
│   └── index.ts
├── components/           # Reusable UI components
│   ├── ExploreSection.tsx
│   └── index.ts
├── utils/               # Utility functions
│   └── index.ts
├── hooks/               # Custom React hooks
│   └── index.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── docs/                # Documentation
│   └── README.md
├── index.ts            # Main module exports
└── README.md           # This file
```

## 🚀 Features

### AI Image Generation
- **Text-to-Image**: Generate custom images from text prompts
- **Pollinations API**: High-quality AI image generation
- **Customizable Options**: Width, height, enhancement settings
- **Instant Generation**: Fast image generation with loading states

### User Experience
- **Simple Interface**: Clean, intuitive prompt input
- **Loading Animations**: Smooth fade-in and scale animations
- **Error Handling**: Graceful error messages and validation
- **Dark Mode**: Full dark mode support

### Image Management
- **Download**: Save generated images to device
- **Platform Support**: Works on Android, iOS, and Web
- **High Resolution**: Generate up to 1024x1024 images
- **No Watermarks**: Clean images without logos

## 📦 Usage

### Basic Import

```typescript
import { ImageGeneratorScreen } from '@/ImageGen';
```

### Using Components

```typescript
import { ExploreSection } from '@/ImageGen/components';
```

### Route Integration

The module is integrated into the main app via route wrapper:

```typescript
// app/ai-image-generator.tsx
export { default } from '@/ImageGen/screens/ImageGeneratorScreen';
```

This allows seamless navigation:
```typescript
router.push('/ai-image-generator');
```

## 🔧 Configuration

### API Configuration
The module uses Pollinations API with the following default settings:
- **Base URL**: `https://image.pollinations.ai/prompt/`
- **Width**: 1024px
- **Height**: 1024px
- **Logo**: Disabled
- **Enhancement**: Enabled

### Customization
You can modify generation parameters in `ExploreSection.tsx`:
```typescript
const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&enhance=true`;
```

## 🎯 Key Components

### ImageGeneratorScreen
The main screen component that provides:
- Screen layout and structure
- Dark mode support
- Scroll view for content
- Integration with ExploreSection

### ExploreSection
The core image generation component:
- **Prompt Input**: Text input for user prompts
- **Generate Button**: Trigger image generation
- **Image Display**: Show generated images with animations
- **Download Button**: Save images to device
- **Loading States**: Activity indicators during generation
- **Error Handling**: Validation and error messages

## 🧪 Testing

The module has been tested with:
- ✅ Image generation from text prompts
- ✅ Loading states and animations
- ✅ Error handling and validation
- ✅ Download functionality
- ✅ Dark mode support
- ✅ Navigation and routing
- ✅ Platform compatibility (Android/iOS/Web)

### Test Cases

#### Basic Image Generation
```
Input: "A futuristic cityscape at sunset"
Expected: Image generated and displayed with smooth animation
Result: ✅ Pass
```

#### Empty Prompt Validation
```
Input: "" (empty)
Expected: Alert message "Please enter a description"
Result: ✅ Pass
```

#### Download Functionality
```
Action: Click download button on generated image
Expected: Image saved to device gallery
Result: ✅ Pass (platform-dependent)
```

## 📝 API Reference

### ExploreSection Props
```typescript
// No props required - uses internal state management
<ExploreSection />
```

### Image Generation
```typescript
// Automatic URL generation based on prompt
const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&enhance=true`;
```

### Download Function
```typescript
// Platform-specific download handling
const downloadImage = async () => {
  // iOS/Android: Save to MediaLibrary
  // Web: Download via link
};
```

## 🎨 Styling

The module uses the centralized color scheme from `@/constants/colors`:
- **Primary**: Blue (#007AFF)
- **Success**: Green (#34C759)
- **Accent**: Purple/Pink gradients
- **Background**: Light/Dark mode support

### Animations
- **Fade In**: 600ms duration
- **Scale**: Spring animation (tension: 50, friction: 7)
- **Loading**: Spinner animation

## 🔄 Integration with Main App

The Image Generator module is integrated via:
1. **Route Wrapper**: `app/ai-image-generator.tsx`
2. **Tab Navigation**: Accessible from main tabs
3. **Direct Navigation**: `router.push('/ai-image-generator')`

## 🐛 Known Issues

1. **Platform-Specific Downloads**: Download functionality varies by platform
   - iOS: Uses MediaLibrary
   - Android: Uses MediaLibrary  
   - Web: Uses download link

2. **API Rate Limits**: Pollinations API may have rate limits
   - Solution: Implement debouncing or queuing

3. **Large Images**: High-resolution images may take longer
   - Current: Loading state indicates progress
   - Future: Consider progress indicators

## 📚 Dependencies

### Core Dependencies
- `expo-linear-gradient`: Gradient backgrounds
- `lucide-react-native`: Icon components
- `expo-file-system`: File operations
- `expo-media-library`: Image saving (mobile)

### Internal Dependencies
- `@/constants/colors`: Color scheme
- `@/constants/fonts`: Typography
- `@/contexts/AppContext`: App settings
- `@/hooks/useCustomAlert`: Alert system

## 🎓 Future Enhancements

### Planned Features
1. **Image History**: Save and view previously generated images
2. **Style Presets**: Quick-access style templates
3. **Batch Generation**: Generate multiple variations
4. **Image Editing**: Basic editing tools
5. **Gallery View**: Grid view of generated images
6. **Sharing**: Share images directly to social media
7. **Advanced Options**: More generation parameters
8. **Model Selection**: Choose different AI models

### Potential Utilities to Extract
1. **imageGenerator.ts**: Core generation logic
   ```typescript
   - generateImageUrl(prompt, options)
   - validatePrompt(prompt)
   - encodePromptForUrl(prompt)
   ```

2. **imageDownloader.ts**: Download logic
   ```typescript
   - downloadImage(url, filename)
   - saveToGallery(imageData)
   - shareImage(imageData)
   ```

3. **imageHistory.ts**: History management
   ```typescript
   - saveToHistory(image)
   - getHistory()
   - clearHistory()
   ```

## 🔗 Related Modules

- **OutfitScorer**: Outfit scoring and analysis module
- **AIStylist**: AI-powered fashion assistant module

## 📊 Statistics

### Module Size
- **Main Screen**: 61 lines
- **Core Component**: 525 lines
- **Total**: ~586 lines of code

### API Usage
- **Pollinations AI**: Free tier
- **Image Format**: JPEG/PNG
- **Max Resolution**: 1024x1024 (configurable)

## 📄 License

Part of the AI Cloth Recommendation App.

## 👥 Contributing

When adding new features:
1. Keep utilities in the `utils/` folder
2. Update the index.ts exports
3. Add TypeScript types to `types/`
4. Document in this README
5. Test all functionality before committing

## 📞 Support

For issues or questions:
- Check the documentation in `docs/`
- Review the test cases
- Refer to OutfitScorer/AIStylist patterns

---

**Last Updated**: October 9, 2025  
**Module Version**: 1.0.0  
**Status**: ✅ Fully Functional
