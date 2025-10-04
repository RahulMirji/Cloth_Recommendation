import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';

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

  useEffect(() => {
    loadSettings();
    loadHistory();
    loadUserProfile();
  }, []);

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

  const loadUserProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('user_profile');
      if (stored) {
        const profile = JSON.parse(stored);
        setUserProfile(profile);
        setIsAuthenticated(!!profile.name && !!profile.email);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
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
      const updated = { ...userProfile, ...updates };
      setUserProfile(updated);
      await AsyncStorage.setItem('user_profile', JSON.stringify(updated));
      if (updated.name && updated.email) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }, [userProfile]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('user_profile');
      setUserProfile(DEFAULT_PROFILE);
      setIsAuthenticated(false);
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
    updateSettings,
    updateUserProfile,
    addToHistory,
    clearHistory,
    clearAllData,
    logout,
  }), [settings, history, userProfile, isAuthenticated, isLoading, updateSettings, updateUserProfile, addToHistory, clearHistory, clearAllData, logout]);
});
