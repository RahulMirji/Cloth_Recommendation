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

// Mock Animated API completely
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Create a mock animated value
  class MockAnimatedValue {
    constructor(value) {
      this._value = value;
    }
    
    setValue(value) {
      this._value = value;
    }
    
    setOffset(offset) {
      this._offset = offset;
    }
    
    flattenOffset() {}
    
    extractOffset() {}
    
    addListener() {
      return 'mock-listener-id';
    }
    
    removeListener() {}
    
    removeAllListeners() {}
    
    stopAnimation() {}
    
    resetAnimation() {}
    
    interpolate() {
      return this;
    }
  }
  
  RN.Animated.timing = (value, config) => ({
    start: (callback) => {
      if (value && value.setValue) {
        value.setValue(config.toValue);
      }
      if (callback) {
        callback({ finished: true });
      }
    },
    stop: jest.fn(),
    reset: jest.fn(),
  });
  
  RN.Animated.spring = (value, config) => ({
    start: (callback) => {
      if (value && value.setValue) {
        value.setValue(config.toValue);
      }
      if (callback) {
        callback({ finished: true });
      }
    },
    stop: jest.fn(),
    reset: jest.fn(),
  });
  
  RN.Animated.decay = (value, config) => ({
    start: (callback) => {
      if (callback) {
        callback({ finished: true });
      }
    },
    stop: jest.fn(),
    reset: jest.fn(),
  });
  
  RN.Animated.loop = (animation) => ({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  });
  
  RN.Animated.parallel = (animations) => ({
    start: (callback) => {
      if (callback) {
        callback({ finished: true });
      }
    },
    stop: jest.fn(),
    reset: jest.fn(),
  });
  
  RN.Animated.sequence = (animations) => ({
    start: (callback) => {
      if (callback) {
        callback({ finished: true });
      }
    },
    stop: jest.fn(),
    reset: jest.fn(),
  });
  
  RN.Animated.stagger = (time, animations) => ({
    start: (callback) => {
      if (callback) {
        callback({ finished: true });
      }
    },
    stop: jest.fn(),
    reset: jest.fn(),
  });
  
  RN.Animated.delay = (time) => ({
    start: (callback) => {
      if (callback) {
        callback({ finished: true });
      }
    },
    stop: jest.fn(),
    reset: jest.fn(),
  });
  
  RN.Animated.Value = MockAnimatedValue;
  RN.Animated.ValueXY = class MockAnimatedValueXY {
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
    stopAnimation() {}
    resetAnimation() {}
    addListener() {
      return 'mock-listener-id';
    }
    removeListener() {}
    getLayout() {
      return {
        left: this.x,
        top: this.y,
      };
    }
  };
  
  return RN;
});

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
