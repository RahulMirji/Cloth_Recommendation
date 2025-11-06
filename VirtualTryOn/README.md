# Virtual Try-On Feature

## Overview
The Virtual Try-On feature allows users to upload their photo and a clothing/outfit image, then generates a realistic image showing the user wearing that outfit using pi.ai's Nano Banana (Gemini 2.5 Flash Image) API.

## Implementation Status
✅ Branch created: `virtual-try-on`
✅ Dependencies installed
✅ API service created
✅ Upload screen implemented (following OutfitScorer pattern)
✅ Result screen implemented
✅ Navigation integrated
✅ Home screen card added
✅ Image upload via Supabase Storage (like OutfitScorer)
✅ Proper permission handling
✅ Camera and Gallery options
✅ Dark mode support

## Features Implemented

### 1. Image Upload
- User photo upload via camera or photo library
- Outfit photo upload via camera or photo library
- Image preview with option to retake/reselect
- Support for JPEG/PNG formats
- Image quality optimization (0.8 quality, max 2048x2048)

### 2. API Integration
- PI API service with proper error handling
- Base64 image encoding
- 60-second timeout for API calls
- Proper request/response handling

### 3. Result Display
- Generated image display
- Save to gallery functionality
- Share functionality
- Retry option to try another outfit

### 4. User Experience
- Loading states with progress indicators
- Error handling with user-friendly messages
- Permission requests for camera and media library
- Smooth navigation flow

## File Structure
```
VirtualTryOn/
├── index.ts                          # Main module exports
├── README.md                         # This file
│
├── screens/
│   ├── VirtualTryOnScreen.tsx       # Main upload screen
│   └── VirtualTryOnResultScreen.tsx # Result display screen
│
├── services/
│   └── piApiService.ts              # PI API integration service
│
├── types/
│   └── index.ts                     # TypeScript interfaces & types
│
├── constants/
│   └── index.ts                     # API configuration & constants
│
└── utils/
    └── index.ts                     # Helper functions (future use)
```

## Integration Points
```
app/
├── virtual-try-on.tsx               # Route for upload screen
└── virtual-try-on-result.tsx        # Route for result screen
```

## Dependencies Added
- `axios`: ^1.6.0 - HTTP client for API calls
- `react-native-fs`: ^2.20.0 - File system access
- `@react-native-camera-roll/camera-roll`: Latest - Save images to gallery
- `react-native-share`: Latest - Share functionality

## API Configuration
- **Endpoint**: https://api.piapi.ai/api/v1/task
- **Model**: Gemini 2.5 Flash Image (Nano Banana)
- **API Key**: Configured in `services/piApiService.ts`
- **Pricing**: $0.03 per image

## Usage Flow

1. **Navigate to Virtual Try-On**
   - User taps the "Virtual Try-On" card on the home screen

2. **Upload Photos**
   - Tap "Upload Your Photo" to select/take a photo of yourself
   - Tap "Select Outfit" to choose an outfit image
   - Both images show previews after selection

3. **Generate Try-On**
   - Tap "Generate Try-On" button
   - Wait 15-30 seconds for AI processing
   - View the generated result

4. **Save or Share**
   - Save the generated image to your device gallery
   - Share the image via social media or messaging apps
   - Try another outfit by tapping "Try Another"

## Testing Checklist

### Functional Tests
- [ ] User can upload photo from gallery
- [ ] User can take photo using camera
- [ ] User can upload outfit reference image
- [ ] Both images display correctly in preview
- [ ] Generate button triggers API call
- [ ] Loading state displays during generation
- [ ] Generated image displays in result screen
- [ ] Save to gallery works on iOS and Android
- [ ] Share functionality works correctly
- [ ] Retry generates new image

### Edge Cases
- [ ] Large images (>5MB) are handled
- [ ] Poor network conditions are managed
- [ ] API errors show user-friendly messages
- [ ] Multiple rapid generations are prevented
- [ ] Invalid image formats show error messages
- [ ] Permissions (camera/storage) are requested properly

### Performance
- [ ] Image upload completes within 5 seconds
- [ ] API response received within 15-30 seconds
- [ ] App remains responsive during generation
- [ ] Memory usage stays reasonable

## Known Limitations

1. **Image Size**: Large images are converted to base64, which may cause memory issues on older devices
2. **API Timeout**: 60-second timeout may not be sufficient for very complex images
3. **Offline Mode**: Feature requires internet connection
4. **Cost**: Each generation costs $0.03

## Future Enhancements

### Phase 2 Features
- [ ] Multiple outfit tries (4 variations at once)
- [ ] Outfit history (save previously tried outfits)
- [ ] Social sharing (direct share to Instagram/Facebook)
- [ ] AR preview (real-time camera overlay)
- [ ] Outfit recommendations based on user preferences
- [ ] Body measurements input for better fit visualization
- [ ] Result caching to avoid duplicate generations
- [ ] Free generation limits (e.g., 5 per day)
- [ ] Subscription model for unlimited access

## Cost Optimization Tips

1. **Result Caching**: Store generated images to avoid duplicate API calls
2. **Image Compression**: Further compress images before sending to API
3. **Rate Limiting**: Implement user limits (e.g., 5 generations per day for free users)
4. **Batch Processing**: Generate multiple variations in one API call
5. **Subscription Model**: Offer unlimited generations for premium users

## Troubleshooting

### Common Issues

**Issue**: "Permission Required" error
- **Solution**: Grant camera and photo library permissions in device settings

**Issue**: API timeout
- **Solution**: Check internet connection, try with smaller images

**Issue**: Poor quality results
- **Solution**: Use clear, well-lit photos with visible person and outfit

**Issue**: Save to gallery fails
- **Solution**: Grant media library write permissions

## Development Notes

- Uses Expo's managed workflow
- Compatible with both iOS and Android
- Requires Expo SDK 54+
- Uses expo-router for navigation
- Follows existing app architecture and styling

## Git Commands

```bash
# Switch to the virtual-try-on branch
git checkout virtual-try-on

# View changes
git status

# Commit changes
git add .
git commit -m "Add virtual try-on feature"

# Push to remote
git push origin virtual-try-on

# Merge to master (after testing)
git checkout master
git merge virtual-try-on
```

## Next Steps

1. Test the feature on both iOS and Android devices
2. Optimize image compression for better performance
3. Add analytics tracking for feature usage
4. Implement result caching
5. Add user feedback mechanism
6. Consider adding more prompt variations for different outfit types
7. Implement rate limiting and cost controls
