#!/bin/bash

# Test Groq API Key
echo "🔍 Testing Groq API Key..."
echo ""

# Load the API key from .env
source .env

if [ -z "$EXPO_PUBLIC_WISPHERE_API_KEY" ]; then
    echo "❌ EXPO_PUBLIC_WISPHERE_API_KEY not found in .env"
    exit 1
fi

echo "🔑 API Key Preview: ${EXPO_PUBLIC_WISPHERE_API_KEY:0:10}...${EXPO_PUBLIC_WISPHERE_API_KEY: -4}"
echo "🔑 API Key Length: ${#EXPO_PUBLIC_WISPHERE_API_KEY} characters"
echo ""

# Test with Groq API
echo "📡 Testing API key with Groq Whisper API..."
response=$(curl -s -X POST "https://api.groq.com/openai/v1/audio/transcriptions" \
  -H "Authorization: Bearer $EXPO_PUBLIC_WISPHERE_API_KEY" \
  -F "model=whisper-large-v3-turbo" \
  -F "file=@/dev/null")

echo "Response: $response"
echo ""

if echo "$response" | grep -q "Invalid API Key"; then
    echo "❌ API KEY IS INVALID!"
    echo ""
    echo "⚠️  ACTION REQUIRED:"
    echo "   1. Go to https://console.groq.com/keys"
    echo "   2. Copy the FULL 'STT-Whisper' API key"
    echo "   3. Replace EXPO_PUBLIC_WISPHERE_API_KEY in .env file"
    echo "   4. Run this script again to verify"
    exit 1
elif echo "$response" | grep -q "error"; then
    echo "⚠️  Got error (but not invalid key): $response"
    echo "This might be OK - the key is valid but the request failed for another reason"
    exit 0
else
    echo "✅ API KEY IS VALID!"
    echo "The key works correctly."
    exit 0
fi
