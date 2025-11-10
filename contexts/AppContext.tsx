import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AppSettings {
  useCloudAI: boolean;
  saveHistory: boolean;
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

const DEFAULT_SETTINGS: AppSettings = {
  useCloudAI: true,
  saveHistory: true,
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
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const initialize = async () => {
      console.log('🔄 AppContext - Starting initialization...');
      await Promise.all([loadSettings(), initializeAuth()]);
      console.log('✅ AppContext - Initialization complete');
    };
    initialize();
  }, []);

  // Initialize authentication and listen for changes
  const initializeAuth = async () => {
    try {
      console.log('🔐 AppContext - Checking auth session...');
      
      // Check for existing session with timeout (Supabase might be unreachable)
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('⚠️ Auth unavailable, continuing in offline mode');
          setSession(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        setSession(currentSession);
        setIsAuthenticated(!!currentSession);
        
        console.log('🔐 AppContext - Auth state:', { 
          hasSession: !!currentSession, 
          isAuthenticated: !!currentSession 
        });

        if (currentSession?.user) {
          await loadUserProfileFromSupabase(currentSession.user.id);
        }
      } catch (authError) {
        // Supabase connection failed - continue without auth
        console.warn('⚠️ Supabase unavailable (offline mode)');
        setSession(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          console.log('🔐 AppContext - Auth state changed:', event);
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
      console.error('❌ AppContext - Error initializing auth:', error);
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
    }
    // Don't set isLoading here - let initializeAuth handle it
  };

  const loadUserProfileFromSupabase = async (userId: string) => {
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
        
        setUserProfile(profile);
        
        // Cache profile locally
        await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
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
            await loadUserProfileFromSupabase(userId);
          }
        }
      }
    } catch (error) {
      console.error('Exception loading user profile:', error);
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

  return useMemo(() => ({
    settings,
    userProfile,
    isAuthenticated,
    isLoading,
    session,
    updateSettings,
    updateUserProfile,
    logout,
  }), [settings, userProfile, isAuthenticated, isLoading, session, updateSettings, updateUserProfile, logout]);
});
