import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';

interface AppSettings {
  useCloudAI: boolean;
  saveHistory: boolean;
  voiceEnabled: boolean;
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
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSettings();
    loadHistory();
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

  const clearAllData = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      setSettings(DEFAULT_SETTINGS);
      setHistory([]);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }, []);

  return useMemo(() => ({
    settings,
    history,
    isLoading,
    updateSettings,
    addToHistory,
    clearHistory,
    clearAllData,
  }), [settings, history, isLoading, updateSettings, addToHistory, clearHistory, clearAllData]);
});
