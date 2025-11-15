// Load environment variables from .env file
require('dotenv').config();

// Debug: Log environment variables at build time
console.log('\n🔧 APP.CONFIG.JS - Environment Variables:');
console.log('EXPO_PUBLIC_GEMINI_API_KEY:', process.env.EXPO_PUBLIC_GEMINI_API_KEY ? 'LOADED ✅' : 'MISSING ❌ (using fallback)');
console.log('EXPO_PUBLIC_WISPHERE_API_KEY:', process.env.EXPO_PUBLIC_WISPHERE_API_KEY ? 'LOADED ✅' : 'MISSING ❌ (using fallback)');
if (process.env.EXPO_PUBLIC_WISPHERE_API_KEY) {
  console.log('WISPHERE_API_KEY Preview:', process.env.EXPO_PUBLIC_WISPHERE_API_KEY.substring(0, 10) + '...');
}
if (process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
  console.log('GEMINI_API_KEY Preview:', process.env.EXPO_PUBLIC_GEMINI_API_KEY.substring(0, 10) + '...');
}
console.log('');

module.exports = {
  "expo": {
    "name": "Style GPT",
    "slug": "ai-cloth-recommendation-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "aidryer",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "app.rork.react-native-ai-outfit-recommendation-app-0bkp2pt8",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Allow $(PRODUCT_NAME) to access your camera",
        "NSMicrophoneUsageDescription": "Allow $(PRODUCT_NAME) to access your microphone",
        "NSPhotoLibraryUsageDescription": "Allow $(PRODUCT_NAME) to access your photos",
        "UIBackgroundModes": [
          "audio"
        ]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.rahulmirji.aiclothrecommendationapp",
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ]
    },
    "web": {
      "favicon": "./assets/images/icon.png"
    },
    "plugins": [
      "./plugins/withAndroidXResolution",
      [
        "expo-router",
        {
          "origin": "https://rork.com/"
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera",
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone",
          "recordAudioAndroid": true
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to let you share them with your friends."
        }
      ],
      [
        "expo-av",
        {
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {
        "origin": "https://rork.com/"
      },
      "eas": {
        "projectId": "3087b3fe-4b5a-4714-836c-8765d40344d0"
      },
      // IMPORTANT: API keys must come from environment only (no hardcoded fallbacks)
      // Ensure .env is configured locally. These values are exposed at runtime via Constants.expoConfig.extra
      "geminiApiKey": process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      "groqApiKey": process.env.EXPO_PUBLIC_WISPHERE_API_KEY
    },
    "owner": "rahulmirji07"
  }
};
