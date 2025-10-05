import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AppSettings {
  useCloudAI: boolean;
  saveHistory: boolean;
  voiceEnabled: boolean;
  isDarkMode: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  age?: string;
  gender?: 'male' | 'female' | 'other' | '';
  bio?: string;
  profileImage?: string;
}

interface AnalysisHistory {
  id: string;
  type: 'stylist' | 'scorer';
  timestamp: number;
  result?: string;
  score?: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  useCloudAI: true,
  saveHistory: true,
  voiceEnabled: true,
  isDarkMode: false,
};

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  phone: '',
  age: '',
  gender: '',
  bio: '',
  profileImage: '',
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    loadSettings();
    loadHistory();
    initializeAuth();
  }, []);

  // Initialize authentication and listen for changes
  const initializeAuth = async () => {
    try {
      // Check for existing session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setIsAuthenticated(!!currentSession);

      if (currentSession?.user) {
        await loadUserProfileFromSupabase(currentSession.user.id);
      }

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          console.log('Auth state changed:', event, !!newSession);
          setSession(newSession);
          setIsAuthenticated(!!newSession);

          if (newSession?.user) {
            await loadUserProfileFromSupabase(newSession.user.id);
          } else {
            // User signed out
            setUserProfile(DEFAULT_PROFILE);
            await AsyncStorage.removeItem('user_profile');
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('app_settings');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('analysis_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const loadUserProfileFromSupabase = async (userId: string) => {
    try {
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
        setUserProfile(profile);
        
        // Cache profile locally
        await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem('app_settings', JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }, [settings]);

  const addToHistory = useCallback(async (entry: Omit<AnalysisHistory, 'id' | 'timestamp'>) => {
    if (!settings.saveHistory) return;

    try {
      const newEntry: AnalysisHistory = {
        ...entry,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };

      const updated = [newEntry, ...history].slice(0, 50);
      setHistory(updated);
      await AsyncStorage.setItem('analysis_history', JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }, [settings.saveHistory, history]);

  const clearHistory = useCallback(async () => {
    try {
      setHistory([]);
      await AsyncStorage.removeItem('analysis_history');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, []);

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      // Use functional update to avoid stale closure
      setUserProfile(currentProfile => {
        const updated = { ...currentProfile, ...updates };
        
        // Store in AsyncStorage
        AsyncStorage.setItem('user_profile', JSON.stringify(updated)).catch(error => {
          console.error('Error saving profile to AsyncStorage:', error);
        });
        
        // Update in Supabase if user is authenticated (async)
        if (session?.user) {
          supabase
            .from('user_profiles')
            .update({
              name: updated.name || undefined,
              email: updated.email || undefined,
              phone: updated.phone || undefined,
              age: updated.age ? parseInt(updated.age) : undefined,
              gender: updated.gender || undefined,
              bio: updated.bio || undefined,
              profile_image: updated.profileImage || undefined,
            })
            .eq('user_id', session.user.id)
            .then(({ error }) => {
              if (error) {
                console.error('Error updating profile in Supabase:', error);
              }
            });
        }
        
        return updated;
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }, [session]);

  const logout = useCallback(async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local data
      await AsyncStorage.removeItem('user_profile');
      setUserProfile(DEFAULT_PROFILE);
      setIsAuthenticated(false);
      setSession(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      setSettings(DEFAULT_SETTINGS);
      setHistory([]);
      setUserProfile(DEFAULT_PROFILE);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }, []);

  return useMemo(() => ({
    settings,
    history,
    userProfile,
    isAuthenticated,
    isLoading,
    session,
    updateSettings,
    updateUserProfile,
    addToHistory,
    clearHistory,
    clearAllData,
    logout,
  }), [settings, history, userProfile, isAuthenticated, isLoading, session, updateSettings, updateUserProfile, addToHistory, clearHistory, clearAllData, logout]);
});
