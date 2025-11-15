# Local APK Build Guide

## Prerequisites Check ✅

- ✅ Java 17 installed
- ✅ Android SDK installed at `~/Library/Android/sdk`
- ✅ Project configured with EAS

## Method 1: Local Build with EAS (Recommended)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to EAS
```bash
eas login
```

### Step 3: Build APK Locally
```bash
# Preview build (development)
eas build --platform android --profile preview --local

# OR Production build
eas build --platform android --profile production --local
```

**Note:** Local builds require:
- At least 16GB RAM
- 50GB+ free disk space
- About 30-60 minutes for first build

---

## Method 2: Expo Development Build (Faster)

### Step 1: Set Environment Variables
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

**Add to ~/.zshrc for permanent setup:**
```bash
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Prebuild Android Project
```bash
npx expo prebuild --platform android
```

### Step 4: Build Development APK
```bash
cd android
./gradlew assembleRelease
```

**APK Location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Method 3: Using Expo CLI (Simplest)

### Build Development Client
```bash
npx expo run:android --variant release
```

This will:
1. Prebuild the Android project
2. Build the APK
3. Install on connected device/emulator

---

## Environment Variables Setup

Before building, ensure your `.env` file has all required keys:

```bash
# Check .env exists
cat .env

# Required variables:
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
EXPO_PUBLIC_GEMINI_API_KEY=your_key
EXPO_PUBLIC_WISPHERE_API_KEY=your_key
# ... and others
```

---

## Troubleshooting

### Issue: ANDROID_HOME not set
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
```

### Issue: Gradle build fails
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### Issue: Out of memory
Add to `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### Issue: SDK licenses not accepted
```bash
$ANDROID_HOME/tools/bin/sdkmanager --licenses
```

---

## Build Profiles

Your `eas.json` has these profiles:

1. **development** - Dev client with debugging
2. **preview** - Internal testing APK
3. **production** - Release APK
4. **production-aab** - Google Play Bundle

---

## Quick Start (Recommended)

```bash
# 1. Set environment variables
export ANDROID_HOME=$HOME/Library/Android/sdk

# 2. Build with Expo (easiest)
npx expo run:android --variant release

# OR build with Gradle
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

**Your APK will be at:**
`android/app/build/outputs/apk/release/app-release.apk`

---

## Next Steps After Build

1. **Test the APK:**
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

2. **Share the APK:**
   - APK is unsigned (for testing)
   - For distribution, sign with keystore

3. **Create Signed APK:**
   - Generate keystore
   - Configure in `android/app/build.gradle`
   - Build with signing config

---

## Build Time Estimates

- **First build:** 30-60 minutes
- **Subsequent builds:** 10-20 minutes
- **With cache:** 5-10 minutes
