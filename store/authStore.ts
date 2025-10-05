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
  isDarkMode: boolean;
}

/**
 * Authentication Store State
 */
interface AuthState {
  // State
  userProfile: UserProfile;
  isAuthenticated: boolean;
  settings: AppSettings;
  isLoading: boolean;
  session: Session | null;

  // Actions
  initializeAuth: () => Promise<void>;
  loadUserProfileFromSupabase: (userId: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
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
  isDarkMode: false,
};

// AsyncStorage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  APP_SETTINGS: 'app_settings',
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
   * Creates profile if it doesn't exist (fallback for legacy users)
   */
  loadUserProfileFromSupabase: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is okay (we'll create it)
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
        
        set({ userProfile: profile });
        
        // Cache profile locally
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_PROFILE,
          JSON.stringify(profile)
        );
      } else {
        // Profile doesn't exist, create it with user's auth email
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const newProfile = {
            user_id: userId,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert(newProfile);
          
          if (insertError) {
            console.error('Error creating fallback profile:', insertError);
          } else {
            // Reload the profile
            await get().loadUserProfileFromSupabase(userId);
          }
        }
      }
    } catch (error) {
      console.error('Exception loading user profile:', error);
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


}));

/**
 * Selector hook for dark mode
 * Provides optimized access to isDarkMode setting
 */
export const useIsDarkMode = () => useAuthStore((state) => state.settings.isDarkMode);
