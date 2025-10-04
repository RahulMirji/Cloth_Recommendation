/**
 * Authentication Store (Zustand)
 * 
 * Manages user authentication state and profile data.
 * Uses AsyncStorage for persistence across app restarts.
 * 
 * This store is a wrapper around the existing AppContext logic,
 * keeping all the same functionality while providing a cleaner interface.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/**
 * User Profile Data Structure
 */
export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  age?: string;
  gender?: 'male' | 'female' | 'other' | '';
  bio?: string;
  profileImage?: string;
}

/**
 * App Settings Structure
 */
export interface AppSettings {
  useCloudAI: boolean;
  saveHistory: boolean;
  voiceEnabled: boolean;
  isDarkMode: boolean;
}

/**
 * Analysis History Entry
 */
export interface AnalysisHistory {
  id: string;
  type: 'stylist' | 'scorer';
  timestamp: number;
  result?: string;
  score?: number;
}

/**
 * Authentication Store State
 */
interface AuthState {
  // State
  userProfile: UserProfile;
  isAuthenticated: boolean;
  settings: AppSettings;
  history: AnalysisHistory[];
  isLoading: boolean;

  // Actions
  initializeAuth: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  addToHistory: (entry: Omit<AnalysisHistory, 'id' | 'timestamp'>) => Promise<void>;
  clearHistory: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

// Default values
const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  phone: '',
  age: '',
  gender: '',
  bio: '',
  profileImage: '',
};

const DEFAULT_SETTINGS: AppSettings = {
  useCloudAI: true,
  saveHistory: true,
  voiceEnabled: true,
  isDarkMode: false,
};

// AsyncStorage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  APP_SETTINGS: 'app_settings',
  ANALYSIS_HISTORY: 'analysis_history',
};

/**
 * Create the authentication store
 * 
 * Note: This maintains 100% compatibility with the existing AppContext
 * All logic from AppContext is preserved here
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  userProfile: DEFAULT_PROFILE,
  isAuthenticated: false,
  settings: DEFAULT_SETTINGS,
  history: [],
  isLoading: true,

  /**
   * Initialize authentication state from AsyncStorage
   * Called once when app starts
   */
  initializeAuth: async () => {
    try {
      // Load user profile
      const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        set({
          userProfile: profile,
          isAuthenticated: !!(profile.name && profile.email),
        });
      }

      // Load settings
      const storedSettings = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      if (storedSettings) {
        set({ settings: JSON.parse(storedSettings) });
      }

      // Load history
      const storedHistory = await AsyncStorage.getItem(STORAGE_KEYS.ANALYSIS_HISTORY);
      if (storedHistory) {
        set({ history: JSON.parse(storedHistory) });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Update user profile
   * Saves to AsyncStorage and updates authentication state
   */
  updateUserProfile: async (updates: Partial<UserProfile>) => {
    try {
      const currentProfile = get().userProfile;
      const updatedProfile = { ...currentProfile, ...updates };
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(updatedProfile)
      );
      
      set({
        userProfile: updatedProfile,
        isAuthenticated: !!(updatedProfile.name && updatedProfile.email),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  /**
   * Logout user
   * Clears profile data and sets authenticated to false
   */
  logout: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      set({
        userProfile: DEFAULT_PROFILE,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  },

  /**
   * Update app settings
   * Saves to AsyncStorage
   */
  updateSettings: async (updates: Partial<AppSettings>) => {
    try {
      const currentSettings = get().settings;
      const updatedSettings = { ...currentSettings, ...updates };
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.APP_SETTINGS,
        JSON.stringify(updatedSettings)
      );
      
      set({ settings: updatedSettings });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  /**
   * Add entry to analysis history
   * Only if saveHistory setting is enabled
   */
  addToHistory: async (entry: Omit<AnalysisHistory, 'id' | 'timestamp'>) => {
    try {
      const { settings, history } = get();
      
      if (!settings.saveHistory) return;

      const newEntry: AnalysisHistory = {
        ...entry,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };

      // Keep only last 50 entries
      const updatedHistory = [newEntry, ...history].slice(0, 50);
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.ANALYSIS_HISTORY,
        JSON.stringify(updatedHistory)
      );
      
      set({ history: updatedHistory });
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  },

  /**
   * Clear analysis history
   */
  clearHistory: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ANALYSIS_HISTORY);
      set({ history: [] });
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  },

  /**
   * Clear all app data
   * Resets to default state
   */
  clearAllData: async () => {
    try {
      await AsyncStorage.clear();
      set({
        userProfile: DEFAULT_PROFILE,
        isAuthenticated: false,
        settings: DEFAULT_SETTINGS,
        history: [],
      });
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  },
}));

/**
 * Selector hooks for commonly used values
 * These provide optimized access to specific parts of the state
 */
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useUserProfile = () => useAuthStore((state) => state.userProfile);
export const useAppSettings = () => useAuthStore((state) => state.settings);
export const useIsDarkMode = () => useAuthStore((state) => state.settings.isDarkMode);
