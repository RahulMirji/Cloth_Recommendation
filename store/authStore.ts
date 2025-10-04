/**
 * Authentication Store (Zustand)
 * 
 * Manages user authentication state and profile data.
 * Uses AsyncStorage for persistence across app restarts.
 * Integrates with Supabase for real-time user data synchronization.
 * 
 * This store is a wrapper around the existing AppContext logic,
 * keeping all the same functionality while providing a cleaner interface.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

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
  session: Session | null;

  // Actions
  initializeAuth: () => Promise<void>;
  loadUserProfileFromSupabase: (userId: string) => Promise<void>;
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
  session: null,

  /**
   * Initialize authentication state from AsyncStorage and Supabase
   * Called once when app starts
   * Sets up auth state listener to automatically fetch user data on login
   */
  initializeAuth: async () => {
    try {
      // Check for existing Supabase session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession?.user) {
        set({ session: currentSession, isAuthenticated: true });
        // Fetch user profile from Supabase
        await get().loadUserProfileFromSupabase(currentSession.user.id);
      } else {
        // No session, load from local storage
        const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          set({
            userProfile: profile,
            isAuthenticated: !!(profile.name && profile.email),
          });
        }
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

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        set({ session: newSession, isAuthenticated: !!newSession });

        if (newSession?.user) {
          // User logged in - fetch profile from Supabase
          await get().loadUserProfileFromSupabase(newSession.user.id);
        } else {
          // User logged out - clear profile
          set({ userProfile: DEFAULT_PROFILE });
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Load user profile from Supabase
   * Fetches user data from the user_profiles table and updates the store
   */
  loadUserProfileFromSupabase: async (userId: string) => {
    try {
      console.log('Fetching user profile from Supabase for user:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile from Supabase:', error);
        return;
      }

      if (data) {
        const profile: UserProfile = {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          age: data.age?.toString() || '',
          gender: (data.gender as 'male' | 'female' | 'other' | '') || '',
          bio: data.bio || '',
          profileImage: data.profile_image || '',
        };
        
        console.log('User profile loaded from Supabase:', profile);
        
        set({ userProfile: profile });
        
        // Cache profile locally
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_PROFILE,
          JSON.stringify(profile)
        );
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  },

  /**
   * Update user profile
   * Saves to both AsyncStorage and Supabase
   */
  updateUserProfile: async (updates: Partial<UserProfile>) => {
    try {
      const currentProfile = get().userProfile;
      const session = get().session;
      const updatedProfile = { ...currentProfile, ...updates };
      
      // Update local state
      set({
        userProfile: updatedProfile,
        isAuthenticated: !!(updatedProfile.name && updatedProfile.email),
      });
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(updatedProfile)
      );

      // Update in Supabase if user is authenticated
      if (session?.user) {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            name: updatedProfile.name || undefined,
            email: updatedProfile.email || undefined,
            phone: updatedProfile.phone || undefined,
            age: updatedProfile.age ? parseInt(updatedProfile.age) : undefined,
            gender: updatedProfile.gender || undefined,
            bio: updatedProfile.bio || undefined,
            profile_image: updatedProfile.profileImage || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', session.user.id);

        if (error) {
          console.error('Error updating profile in Supabase:', error);
          throw error;
        }
        
        console.log('User profile updated in Supabase');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  /**
   * Logout user
   * Signs out from Supabase and clears all local data
   */
  logout: async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local data
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      
      set({
        userProfile: DEFAULT_PROFILE,
        isAuthenticated: false,
        session: null,
      });
      
      console.log('User logged out successfully');
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
