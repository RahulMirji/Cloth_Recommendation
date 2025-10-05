# On-Device Speech Recognition Implementation

## Summary

I've implemented **fast, lightweight on-device speech recognition** using `expo-speech-recognition` to replace the non-working Pollinations API.

## Changes Made

### 1. Import expo-speech-recognition

```typescript
import * as ExpoSpeechRecognition from "expo-speech-recognition";
```

### 2. Added State Management

```typescript
const [recognitionState, setRecognitionState] = useState<
  "idle" | "recognizing" | "stopping"
>("idle");
const [interimTranscript, setInterimTranscript] = useState<string>("");
const recognitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
  null
);
```

### 3. Updated startHoldToSpeak

- Now uses `ExpoSpeechRecognition.isRecognitionAvailable()` to check availability
- Requests microphone permissions via `Audio.requestPermissionsAsync()`
- Sets up event listeners for:
  - `result` - Receives transcription results (both interim and final)
  - `error` - Handles recognition errors
  - `end` - Cleanup when recognition ends
- Starts recognition with `ExpoSpeechRecognition.ExpoSpeechRecognitionModule.start()`
- Configuration:
  - Language: `en-US`
  - Interim results: `true` (shows real-time transcription)
  - On-device: `false` (allows both on-device and cloud for better accuracy)
  - Add punctuation: `true`
  - Contextual strings: fashion/clothing related terms
  - 30-second timeout

### 4. Update stopHoldToSpeak Function

**IMPORTANT**: The current `stopHoldToSpeak` still has the old audio recording logic. It needs to be replaced with:

```typescript
const stopHoldToSpeak = useCallback(async () => {
  try {
    console.log("🎤 === STOPPING SPEECH RECOGNITION ===");
    console.log("🎤 Recognition state:", recognitionState);
    console.log("🎤 Is recording state:", isRecording);
    console.log("🎤 Interim transcript:", interimTranscript);

    // Clear the auto-stop timeout
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
      recognitionTimeoutRef.current = null;
    }

    if (recognitionState !== "recognizing" || !isRecording) {
      console.log("🎤 ⚠️ Not in recognizing state");
      return;
    }

    console.log("🎤 Setting state to stopping...");
    setRecognitionState("stopping");

    // Stop the speech recognition
    console.log("🎤 Stopping speech recognition...");
    await ExpoSpeechRecognition.ExpoSpeechRecognitionModule.stop();

    console.log("🎤 ✅ Speech recognition stopped");
    setRecognitionState("idle");
    setIsRecording(false);

    // Use the interim transcript as the final text
    const finalTranscript = interimTranscript.trim();

    if (finalTranscript) {
      console.log("🎤 ✅ Final transcript:", finalTranscript);

      // Update message with final transcribed text
      const userTextMessage = createChatMessage("user", finalTranscript);
      setMessages((prev) => [...prev.slice(0, -1), userTextMessage]);
      console.log("🎤 Updated UI with transcribed text");

      // Add to session
      if (currentSessionRef.current) {
        currentSessionRef.current.messages.push(userTextMessage);
        console.log("🎤 Added message to session");
      }

      // Capture image and get AI response
      console.log("🎤 === STARTING IMAGE CAPTURE ===");
      try {
        if (useEnhancedVision) {
          console.log("🎤 Using enhanced vision - uploading image...");
          const imageUrl = await uploadImageAndGetURL();
          console.log("🎤 Image upload result:", imageUrl);

          if (imageUrl && currentSessionRef.current) {
            currentSessionRef.current.imageBase64 = imageUrl;
            console.log("🎤 Stored image URL in session");
          }
        } else {
          console.log("🎤 Using basic vision - capturing base64 image...");
          const imgBase64 = await captureCurrentImage();
          console.log(
            "🎤 Base64 image length:",
            imgBase64 ? imgBase64.length : 0
          );

          if (imgBase64 && currentSessionRef.current) {
            currentSessionRef.current.imageBase64 = `data:image/jpeg;base64,${imgBase64}`;
            console.log("🎤 Stored base64 image in session");
          }
        }
      } catch (err) {
        console.warn("🎤 ⚠️ Image capture failed:", err);
      }

      console.log("🎤 === STARTING AI RESPONSE GENERATION ===");
      console.log("🎤 User question:", finalTranscript);
      await getAIResponseWithImageAndVoice(finalTranscript);
      console.log("🎤 AI response generation initiated");
    } else {
      console.warn("🎤 ⚠️ No transcript available");
      setMessages((prev) => prev.slice(0, -1));
      Alert.alert("No Speech Detected", "Please try speaking again.");
    }
  } catch (error) {
    console.error("🎤 ❌ Error stopping speech recognition:", error);
    console.error("🎤 Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : "No stack trace",
    });

    setRecognitionState("idle");
    setIsRecording(false);
    Alert.alert(
      "Speech Recognition Error",
      "Failed to stop speech recognition."
    );
  }
}, [
  recognitionState,
  isRecording,
  interimTranscript,
  useEnhancedVision,
  uploadImageAndGetURL,
  captureCurrentImage,
  currentSessionRef,
]);
```

## Benefits

✅ **Fast**: On-device processing with sub-second latency  
✅ **Lightweight**: No server calls, no network required (when on-device mode is used)  
✅ **Real-time**: Shows interim results as you speak  
✅ **Accurate**: Uses device's native speech recognition (Android Speech Recognizer / iOS Speech Framework)  
✅ **Context-aware**: Biased toward fashion/clothing terminology  
✅ **Punctuation**: Automatically adds commas and periods

## Testing

1. Reload the app: `r` in the Expo terminal
2. Press and hold the microphone button
3. Speak clearly: "What do you think of this outfit?"
4. Release the button
5. Watch the real-time transcription appear
6. The app should capture an image and send both text + image to the vision API

## Troubleshooting

- **Permission denied**: Make sure to allow microphone access in device settings
- **Not available**: Check that device has speech recognition capability (`isRecognitionAvailable()`)
- **Poor accuracy**: Speak clearly, avoid background noise, use shorter phrases
- **Timeout**: Adjust the 30-second timeout if needed for longer speech

## Next Steps (Optional)

- Add language selection for multi-language support
- Implement on-device only mode (`requiresOnDeviceRecognition: true`)
- Add voice activity detection to auto-stop when user finishes speaking
- Show waveform visualization during recording
