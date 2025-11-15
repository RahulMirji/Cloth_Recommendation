#!/bin/bash

# Virtual Try-On Edge Function Test Script
# Tests the deployed virtual-tryon Edge Function

echo "🧪 Testing Virtual Try-On Edge Function..."
echo ""

# Configuration
SUPABASE_URL="https://wmhiwieooqfwkrdcvqvb.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaGl3aWVvb3Fmd2tyZGN2cXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Nzg3MTksImV4cCI6MjA3NTE1NDcxOX0.R-jk3IOAGVtRXvM2nLpB3gfMXcsrPO6WDLxY5TId6UA"

# Small 1x1 pixel PNG as base64 (for testing)
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "📍 Endpoint: ${SUPABASE_URL}/functions/v1/virtual-tryon"
echo "🔑 Using anon key: ${SUPABASE_ANON_KEY:0:20}..."
echo ""
echo "📤 Sending request..."
echo ""

# Make the request
response=$(curl -s -w "\n%{http_code}" -X POST \
  "${SUPABASE_URL}/functions/v1/virtual-tryon" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"userImageBase64\": \"${TEST_IMAGE}\",
    \"outfitImageBase64\": \"${TEST_IMAGE}\"
  }")

# Extract HTTP status code (last line)
http_code=$(echo "$response" | tail -n1)
# Extract response body (all lines except last)
body=$(echo "$response" | sed '$d')

echo "📊 Response Status: ${http_code}"
echo "📦 Response Body:"
echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
echo ""

# Check status
if [ "$http_code" = "200" ]; then
  echo "✅ Test PASSED! Edge Function is working."
else
  echo "❌ Test FAILED! Check the error message above."
fi
