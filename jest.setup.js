// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Expo's import.meta registry to avoid "import outside scope" errors
global.__ExpoImportMetaRegistry = {
  register: jest.fn(),
  get: jest.fn(),
};

// Polyfill structuredClone for Jest
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: mockRouter,
  useRouter: () => mockRouter,
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

// Mock react-native-razorpay with proper event emitter
jest.mock('react-native-razorpay', () => {
  const { EventEmitter } = require('events');
  return {
    __esModule: true,
    default: {
      open: jest.fn(() => Promise.resolve({ razorpay_payment_id: 'test_payment_id' })),
    },
  };
});

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
  Cloud: 'Cloud',
  Smartphone: 'Smartphone',
  Shield: 'Shield',
  Info: 'Info',
  Star: 'Star',
  Mail: 'Mail',
  Github: 'Github',
  Linkedin: 'Linkedin',
  Instagram: 'Instagram',
  Twitter: 'Twitter',
  Heart: 'Heart',
  ExternalLink: 'ExternalLink',
  Shirt: 'Shirt',
  Edit3: 'Edit3',
  Phone: 'Phone',
  Calendar: 'Calendar',
  Users: 'Users',
  X: 'X',
  Mic: 'Mic',
  MicOff: 'MicOff',
  RotateCw: 'RotateCw',
  Volume2: 'Volume2',
  Wand2: 'Wand2',
  Download: 'Download',
  CheckCircle: 'CheckCircle',
  XCircle: 'XCircle',
  AlertCircle: 'AlertCircle',
}));

// Mock modularized components (now in feature modules)
jest.mock('@/OutfitScorer/components/OutfitScorerShowcase', () => ({
  OutfitScorerShowcase: () => 'OutfitScorerShowcase',
}));

jest.mock('@/OutfitScorer/components/ProductRecommendations', () => ({
  ProductRecommendationsSection: () => 'ProductRecommendationsSection',
}));

// Mock Footer component
jest.mock('./components/Footer', () => ({
  Footer: () => 'Footer',
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => {}, { virtual: true });

// Comprehensive Animated API mock for TouchableOpacity and other animated components
// Mock Animated.Value class
class MockAnimatedValue {
  constructor(value) {
    this._value = value;
    this._listeners = [];
  }
  
  setValue(value) {
    this._value = value;
    this._listeners.forEach(listener => listener({ value }));
  }
  
  interpolate(config) {
    return new MockAnimatedValue(this._value);
  }
  
  addListener(callback) {
    this._listeners.push(callback);
    return this._listeners.length - 1;
  }
  
  removeListener(id) {
    this._listeners.splice(id, 1);
  }
  
  removeAllListeners() {
    this._listeners = [];
  }
  
  stopAnimation(callback) {
    if (callback) callback(this._value);
  }
  
  resetAnimation(callback) {
    if (callback) callback(this._value);
  }
  
  extractOffset() {}
  
  flattenOffset() {}
  
  setOffset(offset) {
    this._offset = offset;
  }
}

// Mock Animated.ValueXY class
class MockAnimatedValueXY {
  constructor(value) {
    this.x = new MockAnimatedValue(value?.x || 0);
    this.y = new MockAnimatedValue(value?.y || 0);
  }
  
  setValue(value) {
    this.x.setValue(value.x);
    this.y.setValue(value.y);
  }
  
  setOffset(offset) {
    this.x.setOffset(offset.x);
    this.y.setOffset(offset.y);
  }
  
  flattenOffset() {
    this.x.flattenOffset();
    this.y.flattenOffset();
  }
  
  extractOffset() {
    this.x.extractOffset();
    this.y.extractOffset();
  }
  
  stopAnimation(callback) {
    this.x.stopAnimation();
    this.y.stopAnimation();
    if (callback) callback({ x: this.x._value, y: this.y._value });
  }
  
  resetAnimation(callback) {
    this.x.resetAnimation();
    this.y.resetAnimation();
    if (callback) callback({ x: this.x._value, y: this.y._value });
  }
  
  addListener(callback) {
    return this.x.addListener(callback);
  }
  
  removeListener(id) {
    this.x.removeListener(id);
    this.y.removeListener(id);
  }
  
  removeAllListeners() {
    this.x.removeAllListeners();
    this.y.removeAllListeners();
  }
  
  getLayout() {
    return {
      left: this.x,
      top: this.y,
    };
  }
  
  getTranslateTransform() {
    return [
      { translateX: this.x },
      { translateY: this.y },
    ];
  }
}

// Mock animation creator that returns a controllable animation
const createMockAnimation = (value, config) => ({
  start: (callback) => {
    if (callback) {
      callback({ finished: true });
    }
  },
  stop: jest.fn(),
  reset: jest.fn(),
});

// Patch the Animated module directly
const RN = require('react-native');
RN.Animated.Value = MockAnimatedValue;
RN.Animated.ValueXY = MockAnimatedValueXY;
RN.Animated.timing = jest.fn((value, config) => createMockAnimation(value, config));
RN.Animated.spring = jest.fn((value, config) => createMockAnimation(value, config));
RN.Animated.decay = jest.fn((value, config) => createMockAnimation(value, config));
RN.Animated.loop = jest.fn((animation) => ({
  start: (callback) => {
    if (callback) callback({ finished: true });
  },
  stop: jest.fn(),
  reset: jest.fn(),
}));
RN.Animated.parallel = jest.fn((animations, config) => ({
  start: (callback) => {
    if (callback) callback({ finished: true });
  },
  stop: jest.fn(),
  reset: jest.fn(),
}));
RN.Animated.sequence = jest.fn((animations) => ({
  start: (callback) => {
    if (callback) callback({ finished: true });
  },
  stop: jest.fn(),
  reset: jest.fn(),
}));
RN.Animated.stagger = jest.fn((delay, animations) => ({
  start: (callback) => {
    if (callback) callback({ finished: true });
  },
  stop: jest.fn(),
  reset: jest.fn(),
}));
RN.Animated.delay = jest.fn((time) => ({
  start: (callback) => {
    if (callback) callback({ finished: true });
  },
  stop: jest.fn(),
  reset: jest.fn(),
}));
RN.Animated.event = jest.fn((argMapping, config) => jest.fn());

// Mock global fetch
global.fetch = jest.fn();

// Mock Supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
