#!/bin/bash

# Android Emulator Launcher Script
# This script starts the Android emulator for development

EMULATOR_NAME="Medium_Phone_API_36.0"
ANDROID_SDK="$HOME/Library/Android/sdk"

echo "🚀 Starting Android Emulator: $EMULATOR_NAME"

# Check if Android SDK exists
if [ ! -d "$ANDROID_SDK" ]; then
    echo "❌ Android SDK not found at $ANDROID_SDK"
    echo "Please install Android Studio and set up the SDK"
    exit 1
fi

# Check if emulator exists
if ! "$ANDROID_SDK/emulator/emulator" -list-avds | grep -q "$EMULATOR_NAME"; then
    echo "❌ Emulator '$EMULATOR_NAME' not found"
    echo "Available emulators:"
    "$ANDROID_SDK/emulator/emulator" -list-avds
    exit 1
fi

# Start the emulator
echo "✅ Launching emulator..."
"$ANDROID_SDK/emulator/emulator" -avd "$EMULATOR_NAME" &

echo "✅ Emulator started successfully!"
echo "💡 You can now run: npm start"
