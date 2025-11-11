# Virtual Try-On Testing Guide

## Overview

This document provides comprehensive testing instructions for the Gemini API-powered Virtual Try-On feature.

## Test Files Created

```
VirtualTryOn/__tests__/
├── constants.test.ts           # Constants validation tests
├── geminiApiService.test.ts    # API service unit tests
├── integration.test.ts          # End-to-end integration tests
├── manual-test.ts               # Manual testing script
├── test-utils.ts                # Test utilities and helpers
├── setup.ts                     # Jest setup configuration
├── jest.config.js               # Jest configuration
└── README.md                    # Test documentation
```

## Manual Testing (Recommended)

Since the Jest configuration needs adjustment for React Native, manual testing is the most reliable approach.

### Test 1: Basic Functionality

1. **Open the app** on your device/emulator
2. **Navigate** to Virtual Try-On screen
3. **Upload** a clear photo of yourself
4. **Upload** an outfit image
5. **Click** "Generate Try-On"
6. **Verify**:
   - ✅ Loading indicator appears
   - ✅ Progress message shows
   - ✅ Generation completes within 30-60 seconds
   - ✅ Result image displays correctly
   - ✅ Can save to gallery
   - ✅ Can share image

### Test 2: Error Handling

1. **Test with invalid images**:
   - Very small images (< 100x100)
   - Very large images (> 4000x4000)
   - Corrupted image files
2. **Test network errors**:
   - Turn off internet
   - Try to generate
   - Verify error message appears
3. **Test API errors**:
   - Use invalid API key (temporarily)
   - Verify error handling

### Test 3: Different Image Formats

Test with various image formats:
- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ WebP (.webp)

### Test 4: Performance

1. **Measure generation time**:
   - Should complete in 30-60 seconds
   - Loading indicator should be smooth
   - No app freezing

2. **Memory usage**:
   - App should not crash
   - No memory leaks
   - Images should be properly cleaned up

## Console Log Testing

Monitor console logs during testing:

```
Expected logs:
✅ 🚀 Creating virtual try-on with Gemini API...
✅ 👤 User image: [path]
✅ 👕 Outfit image: [path]
✅ 🔑 API Key: Set ✅
✅ 📸 Converting images to base64...
✅ ✅ Images converted successfully
✅ 📤 Sending request to Gemini API...
✅ 📥 Response received from Gemini API
✅ 💾 Saving generated image...
✅ ✅ Image saved successfully: [path]
```

## API Testing Checklist

### Request Validation
- [ ] API endpoint is correct
- [ ] API key is included
- [ ] Content-Type header is set
- [ ] Timeout is configured
- [ ] Both images are base64 encoded
- [ ] MIME types are correct
- [ ] Prompt is included

### Response Validation
- [ ] Response has candidates array
- [ ] Candidate has content.parts
- [ ] Image data is found in parts
- [ ] Image data is valid base64
- [ ] File is saved successfully
- [ ] File URI is returned

### Error Handling
- [ ] Network errors are caught
- [ ] API errors are caught
- [ ] File errors are caught
- [ ] User-friendly error messages
- [ ] No app crashes

## Test Scenarios

### Scenario 1: Happy Path
```
Input: Valid user photo + Valid outfit photo
Steps:
1. Select user photo
2. Select outfit photo
3. Click generate
Expected: Success, image displayed
```

### Scenario 2: Network Error
```
Input: Valid photos, no internet
Steps:
1. Disable internet
2. Try to generate
Expected: Error message, no crash
```

### Scenario 3: Invalid API Key
```
Input: Valid photos, invalid API key
Steps:
1. Temporarily change API key
2. Try to generate
Expected: API error message
```

### Scenario 4: Large Images
```
Input: 4000x4000 user photo + 4000x4000 outfit
Steps:
1. Select large images
2. Click generate
Expected: Preprocessing works, generation succeeds
```

### Scenario 5: Different Formats
```
Input: PNG user + WebP outfit
Steps:
1. Select different format images
2. Click generate
Expected: Both formats handled correctly
```

## Performance Benchmarks

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Generation Time | < 45s | < 60s | > 60s |
| Image Conversion | < 2s | < 5s | > 5s |
| File Save | < 1s | < 2s | > 2s |
| Memory Usage | < 200MB | < 300MB | > 300MB |

## Debugging Tips

### Enable Verbose Logging

Add to `geminiApiService.ts`:
```typescript
console.log('📊 Request payload:', JSON.stringify(payload, null, 2));
console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
```

### Check Image Conversion

```typescript
console.log('📏 Image size:', base64.length, 'characters');
console.log('📏 First 100 chars:', base64.substring(0, 100));
```

### Monitor API Calls

Use React Native Debugger or Flipper to monitor:
- Network requests
- Response times
- Payload sizes
- Error responses

## Common Issues & Solutions

### Issue: "Buffer doesn't exist"
**Solution**: ✅ Fixed - Using btoa/atob instead

### Issue: "File not found"
**Solution**: Check file permissions and paths

### Issue: "API timeout"
**Solution**: Increase timeout or check network

### Issue: "Invalid base64"
**Solution**: Verify image conversion logic

### Issue: "Out of memory"
**Solution**: Reduce image size before processing

## Test Results Template

```markdown
## Test Run: [Date]

### Environment
- Device: [Device name]
- OS: [Android/iOS version]
- App Version: [Version]

### Test Results

#### Basic Functionality
- [ ] Image upload: PASS/FAIL
- [ ] Generation: PASS/FAIL
- [ ] Display result: PASS/FAIL
- [ ] Save to gallery: PASS/FAIL
- [ ] Share: PASS/FAIL

#### Error Handling
- [ ] Network error: PASS/FAIL
- [ ] Invalid image: PASS/FAIL
- [ ] API error: PASS/FAIL

#### Performance
- Generation time: [X] seconds
- Memory usage: [X] MB
- App stability: PASS/FAIL

### Issues Found
1. [Issue description]
2. [Issue description]

### Notes
[Any additional observations]
```

## Automated Testing (Future)

Once Jest configuration is fixed, run:

```bash
# Unit tests
npm test VirtualTryOn/__tests__/constants.test.ts

# All tests
npm test VirtualTryOn/__tests__/

# With coverage
npm test -- --coverage VirtualTryOn/__tests__/
```

## Continuous Integration

For CI/CD pipelines:

```yaml
# .github/workflows/test.yml
- name: Run Virtual Try-On Tests
  run: npm test VirtualTryOn/__tests__/
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Next Steps

1. ✅ Manual testing completed
2. ⏳ Fix Jest configuration for React Native
3. ⏳ Run automated tests
4. ⏳ Set up CI/CD pipeline
5. ⏳ Add E2E tests with Detox

## Support

For testing issues:
1. Check console logs
2. Review error messages
3. Verify API key is valid
4. Check network connectivity
5. Review this testing guide
