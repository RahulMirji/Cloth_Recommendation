// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
  Link: 'Link',
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Home: 'Home',
  Settings: 'Settings',
  User: 'User',
  Camera: 'Camera',
  Sparkles: 'Sparkles',
  TrendingUp: 'TrendingUp',
  Upload: 'Upload',
  Zap: 'Zap',
  Moon: 'Moon',
  Sun: 'Sun',
  Bell: 'Bell',
  Lock: 'Lock',
  LogOut: 'LogOut',
  ChevronRight: 'ChevronRight',
}));

// Mock react-native-onboarding-swiper
jest.mock('react-native-onboarding-swiper', () => 'Onboarding');

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => {}, { virtual: true });

// Mock global fetch
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
