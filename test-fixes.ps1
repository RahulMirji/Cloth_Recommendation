#!/usr/bin/env pwsh
# 🧪 Phase 1 Fixes Testing Script
# Run this after applying fixes to verify everything works

Write-Host "🧪 Phase 1 Fixes - Testing Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Test 1: Check Voice Module
Write-Host "📋 Test 1: Checking Voice Module Installation..." -ForegroundColor Yellow
$voicePackage = Get-Content package.json | ConvertFrom-Json | Select-Object -ExpandProperty dependencies | Select-Object -ExpandProperty '@react-native-voice/voice'
if ($voicePackage) {
    Write-Host "✅ @react-native-voice/voice installed: $voicePackage" -ForegroundColor Green
}
else {
    Write-Host "❌ @react-native-voice/voice NOT found in package.json" -ForegroundColor Red
    Write-Host "   Run: npm install @react-native-voice/voice" -ForegroundColor Yellow
}
Write-Host ""

# Test 2: Verify File Changes
Write-Host "📋 Test 2: Verifying Fixed Files..." -ForegroundColor Yellow

$files = @(
    "utils\audioUtils.ts",
    "utils\visionAPI.ts",
    "PHASE1_FIXES.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    }
    else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Check for Key Fixes in Code
Write-Host "📋 Test 3: Checking Code Fixes..." -ForegroundColor Yellow

# Check Voice.default fix
$audioUtils = Get-Content "utils\audioUtils.ts" -Raw
if ($audioUtils -match "require\('@react-native-voice/voice'\)\.default") {
    Write-Host "✅ Voice module import fixed (.default added)" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Voice module import may need review" -ForegroundColor Yellow
}

# Check TTS chunking
if ($audioUtils -match "chunkTextIntoSentences") {
    Write-Host "✅ TTS chunking implemented" -ForegroundColor Green
}
else {
    Write-Host "❌ TTS chunking not found" -ForegroundColor Red
}

# Check Vision API timeout
$visionAPI = Get-Content "utils\visionAPI.ts" -Raw
if ($visionAPI -match "10000 \+ \(attempt - 1\) \* 5000") {
    Write-Host "✅ Vision API timeout optimized (10s, 15s, 20s)" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Vision API timeout may need review" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Clear Caches
Write-Host "📋 Test 4: Clearing Caches..." -ForegroundColor Yellow
Write-Host "Would you like to clear caches? (Y/N): " -NoNewline
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host "🧹 Clearing .expo cache..." -ForegroundColor Cyan
    if (Test-Path ".expo") {
        Remove-Item -Recurse -Force .expo
        Write-Host "✅ .expo cache cleared" -ForegroundColor Green
    }
    
    Write-Host "🧹 Clearing node_modules cache..." -ForegroundColor Cyan
    if (Test-Path "node_modules\.cache") {
        Remove-Item -Recurse -Force node_modules\.cache
        Write-Host "✅ node_modules cache cleared" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "✅ Caches cleared! Ready to restart." -ForegroundColor Green
}
else {
    Write-Host "⏭️  Skipping cache clear" -ForegroundColor Yellow
}
Write-Host ""

# Test 5: Instructions
Write-Host "📋 Test 5: Next Steps" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Restart Metro bundler:" -ForegroundColor Cyan
Write-Host "   npx expo start -c" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Or use your custom script:" -ForegroundColor Cyan
Write-Host "   bunx rork start -p 85o9mg6zkxdpc0bkp2pt8 --tunnel" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Test on device:" -ForegroundColor Cyan
Write-Host "   • Scan QR code with Expo Go" -ForegroundColor White
Write-Host "   • Or: npx expo run:android" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣  Test these features:" -ForegroundColor Cyan
Write-Host "   ✓ Press & hold mic button → Should start voice recognition" -ForegroundColor White
Write-Host "   ✓ Say something → Should transcribe correctly" -ForegroundColor White
Write-Host "   ✓ AI response → Should be chunked (2-3 parts)" -ForegroundColor White
Write-Host "   ✓ Vision API → Should respond in 10-15s (not timeout)" -ForegroundColor White
Write-Host ""
Write-Host "5️⃣  Watch logs for:" -ForegroundColor Cyan
Write-Host "   • 🎤 Voice recognition started successfully" -ForegroundColor White
Write-Host "   • 🎵 Chunked response into X parts for streaming TTS" -ForegroundColor White
Write-Host "   • ✅ Vision API success on attempt 1" -ForegroundColor White
Write-Host ""

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🎉 Testing script complete!" -ForegroundColor Green
Write-Host "📖 See PHASE1_FIXES.md for detailed info" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
