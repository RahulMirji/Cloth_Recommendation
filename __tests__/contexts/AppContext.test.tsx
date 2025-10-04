import { renderHook, act } from '@testing-library/react-native';
import { AppProvider, useApp } from '@/contexts/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('AppContext', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  it('provides initial values', () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: AppProvider,
    });

    expect(result.current.userProfile).toEqual({
      name: '',
      email: '',
      phone: '',
      age: '',
      gender: '',
      bio: '',
      profileImage: '',
    });

    expect(result.current.settings).toEqual({
      useCloudAI: true,
      saveHistory: true,
      voiceEnabled: true,
      isDarkMode: false,
    });
  });

  it('updates user profile', async () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: AppProvider,
    });

    const newProfile = {
      name: 'John Doe',
      email: 'john@example.com',
      age: '25',
      gender: 'male' as const,
    };

    await act(async () => {
      await result.current.updateUserProfile(newProfile);
    });

    expect(result.current.userProfile.name).toBe('John Doe');
    expect(result.current.userProfile.email).toBe('john@example.com');
  });

  it('updates settings', async () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: AppProvider,
    });

    await act(async () => {
      await result.current.updateSettings({ isDarkMode: true });
    });

    expect(result.current.settings.isDarkMode).toBe(true);
  });

  it('adds analysis to history', async () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: AppProvider,
    });

    const newAnalysis = {
      id: '123',
      type: 'stylist' as const,
      timestamp: Date.now(),
      result: 'Great outfit!',
    };

    await act(async () => {
      await result.current.addToHistory(newAnalysis);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]).toMatchObject({
      type: 'stylist',
      result: 'Great outfit!',
    });
    expect(result.current.history[0].id).toBeDefined();
    expect(result.current.history[0].timestamp).toBeDefined();
  });

  it('persists data to AsyncStorage', async () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: AppProvider,
    });

    const newProfile = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };

    await act(async () => {
      await result.current.updateUserProfile(newProfile);
    });

    // Verify AsyncStorage.setItem was called with the updated profile
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'user_profile',
      expect.stringContaining('Jane Doe')
    );
    
    // Verify the profile is in state
    expect(result.current.userProfile.name).toBe('Jane Doe');
    expect(result.current.userProfile.email).toBe('jane@example.com');
  });
});
