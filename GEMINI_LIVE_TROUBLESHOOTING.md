# Gemini Live Troubleshooting Guide

## Button Not Working / Nothing Happens When Clicking

### Solution 1: Restart the App (Most Common)
After adding new routes or screens, Expo needs to reload:

1. **Stop the development server** (Ctrl+C in terminal)
2. **Clear Metro bundler cache**:
   ```bash
   npx expo start --clear
   ```
3. **Reload the app** on your device/emulator
4. Try clicking the button again

### Solution 2: Check Console Logs
Open your terminal and look for these logs when you click the button:
- `🚀 Gemini Live button pressed` - Button click registered
- `✅ Navigation initiated` - Navigation started
- `🎨 GeminiLiveScreen rendered` - Screen loaded
- `📱 Platform: android` - Platform detected
- `🔑 API Key present: true` - API key found

If you don't see these logs, the button might not be visible or clickable.

### Solution 3: Check Button Visibility
The button only shows when:
- `isConversationActive === false` (no active chat)
- You're on the AI Stylist screen

To reset:
1. If you're in a conversation, click "Quit Chat"
2. The button should appear below "AI Stylist" title

### Solution 4: Verify API Key
Check your `.env` file has:
```bash
EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

Then restart the dev server:
```bash
npx expo start --clear
```

### Solution 5: Check Route Registration
Verify the route file exists:
```bash
ls -la app/gemini-live.tsx
```

Should show the file. If not, the route wasn't created properly.

### Solution 6: Rebuild the App
If nothing else works, do a full rebuild:

**For Android:**
```bash
# Stop the server
# Delete build cache
rm -rf android/app/build
rm -rf .expo

# Restart
npx expo start --clear
```

**For iOS:**
```bash
# Stop the server
# Delete build cache
rm -rf ios/build
rm -rf .expo

# Restart
npx expo start --clear
```

## WebView Shows "Connecting..." Forever

This is expected behavior on mobile. The Gemini Live SDK doesn't work in WebView environments due to:
- Limited ES module support
- WebSocket restrictions
- Audio/Video API differences

### What You Should See:
1. Click "🚀 Try Gemini Live"
2. Screen opens with "Check Compatibility" button
3. Click it to test camera/microphone
4. Get a message explaining web browser is needed for full experience
5. Option to go back to standard mode

### For Full Gemini Live Experience:
Use a **web browser** on desktop/laptop:
1. Open your app URL in Chrome/Safari/Firefox
2. Navigate to AI Stylist
3. Click "🚀 Try Gemini Live"
4. Full real-time conversation works!

## Error: "API key not configured"

1. Check `.env` file exists in project root
2. Verify it contains: `EXPO_PUBLIC_GEMINI_API_KEY=your_key`
3. Get API key from: https://aistudio.google.com/app/apikey
4. Restart dev server: `npx expo start --clear`

## Error: "Cannot read properties of undefined"

This happens when the Gemini SDK fails to load in WebView.

**Solution:** This is why we created the compatibility check version. Make sure you're using the latest code:
```bash
git pull origin gemini-live
npx expo start --clear
```

## Button Appears But Screen is Black

1. Check console for errors
2. Verify WebView is installed:
   ```bash
   npm list react-native-webview
   ```
3. If not installed:
   ```bash
   npm install react-native-webview
   npx expo start --clear
   ```

## Camera Permission Issues

### Android:
1. Go to Settings > Apps > Your App > Permissions
2. Enable Camera and Microphone
3. Restart the app

### iOS:
1. Go to Settings > Privacy > Camera
2. Enable for your app
3. Go to Settings > Privacy > Microphone
4. Enable for your app
5. Restart the app

## Still Not Working?

### Check These:
1. ✅ Expo dev server is running
2. ✅ Device/emulator is connected
3. ✅ No error messages in terminal
4. ✅ API key is set in `.env`
5. ✅ App was restarted after adding route
6. ✅ Button is visible on screen

### Get Debug Info:
Look at the console output when clicking the button. Share these logs:
```
🚀 Gemini Live button pressed
✅ Navigation initiated
🎨 GeminiLiveScreen rendered
📱 Platform: android
🔑 API Key present: true
```

### Alternative: Use Standard AI Stylist
The standard AI Stylist mode works perfectly on mobile and provides:
- Full outfit analysis
- Voice input (hold-to-speak)
- Image capture
- AI conversation
- All the same AI intelligence

Just without the real-time streaming aspect of Gemini Live.

## Quick Fix Checklist

- [ ] Restart dev server with `npx expo start --clear`
- [ ] Reload app on device
- [ ] Check console logs
- [ ] Verify API key in `.env`
- [ ] Ensure no active conversation (click "Quit Chat" if needed)
- [ ] Check button is visible on screen
- [ ] Try on web browser for full experience

## Contact

If you're still having issues, please provide:
1. Platform (Android/iOS/Web)
2. Console logs when clicking button
3. Screenshot of the screen
4. Error messages (if any)
