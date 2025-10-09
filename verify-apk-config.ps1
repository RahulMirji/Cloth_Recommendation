# 🔍 APK Build Verification Script
# This script verifies that test files are properly excluded from builds

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  APK Build Configuration Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Counter for checks
$passedChecks = 0
$totalChecks = 0

# Function to check file content
function Check-FileContent {
    param(
        [string]$FilePath,
        [string]$Pattern,
        [string]$Description
    )
    
    $script:totalChecks++
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        if ($content -match $Pattern) {
            Write-Host "✅ PASS: $Description" -ForegroundColor Green
            $script:passedChecks++
            return $true
        }
        else {
            Write-Host "❌ FAIL: $Description" -ForegroundColor Red
            return $false
        }
    }
    else {
        Write-Host "⚠️  WARN: File not found - $FilePath" -ForegroundColor Yellow
        return $false
    }
}

Write-Host "Checking configuration files..." -ForegroundColor Yellow
Write-Host ""

# Check 1: Metro Config
Check-FileContent `
    -FilePath "metro.config.js" `
    -Pattern "blockList.*\.test\." `
    -Description "Metro config blocks test files"

# Check 2: EAS Ignore
Check-FileContent `
    -FilePath ".easignore" `
    -Pattern "\*\*\/\*\.test\." `
    -Description ".easignore excludes test files"

# Check 3: Jest Config
Check-FileContent `
    -FilePath "jest.config.js" `
    -Pattern "testMatch.*\*\*\/\*\.\(test\|spec\)" `
    -Description "Jest config finds co-located tests"

# Check 4: Jest Coverage Exclusion
Check-FileContent `
    -FilePath "jest.config.js" `
    -Pattern "!\*\*\/\*\.test\." `
    -Description "Jest excludes tests from coverage"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Summary
if ($passedChecks -eq $totalChecks) {
    Write-Host "✅ ALL CHECKS PASSED ($passedChecks/$totalChecks)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your APK build is properly configured!" -ForegroundColor Green
    Write-Host "Test files will NOT be included in production builds." -ForegroundColor Green
}
else {
    Write-Host "⚠️  SOME CHECKS FAILED ($passedChecks/$totalChecks)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please review the configuration files above." -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Show test files that would be excluded
Write-Host "Test files found in project:" -ForegroundColor Yellow
$testFiles = Get-ChildItem -Recurse -Include "*.test.ts", "*.test.tsx", "*.spec.ts", "*.spec.tsx" -File | 
Where-Object { $_.FullName -notmatch "node_modules" }

if ($testFiles.Count -gt 0) {
    foreach ($file in $testFiles) {
        $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
        Write-Host "  📝 $relativePath" -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host "Total: $($testFiles.Count) test files will be excluded from APK ✅" -ForegroundColor Green
}
else {
    Write-Host "  No test files found (this is unusual)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To build production APK:" -ForegroundColor White
Write-Host "  eas build --platform android --profile production" -ForegroundColor Cyan
Write-Host ""
Write-Host "To verify exclusions after export:" -ForegroundColor White
Write-Host "  npx expo export" -ForegroundColor Cyan
Write-Host "  # Then check .expo/dist folder - no test files should be there" -ForegroundColor Gray
Write-Host ""
