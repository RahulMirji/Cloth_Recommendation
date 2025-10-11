/**
 * useAdminAuth Hook
 * 
 * Manages admin authentication state and session timeout.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyAdminCredentials } from '../services/adminService';
import { ADMIN_CONFIG } from '../constants/config';
import type { AdminAuthState } from '../types';

const ADMIN_SESSION_KEY = '@admin_session';
const ADMIN_SESSION_TIMESTAMP_KEY = '@admin_session_timestamp';

export const useAdminAuth = () => {
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const sessionTimeoutRef = useRef<any>(null);

  /**
   * Check if existing session is still valid
   */
  const checkSession = useCallback(async () => {
    try {
      const session = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
      const timestamp = await AsyncStorage.getItem(ADMIN_SESSION_TIMESTAMP_KEY);

      if (session && timestamp) {
        const sessionTime = parseInt(timestamp, 10);
        const now = Date.now();
        const timeDiff = now - sessionTime;

        // Check if session has expired
        if (timeDiff < ADMIN_CONFIG.SESSION_TIMEOUT_MS) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          startSessionTimeout(ADMIN_CONFIG.SESSION_TIMEOUT_MS - timeDiff);
          return;
        }
      }

      // No valid session
      await clearSession();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Session check error:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: 'Session check failed',
      });
    }
  }, []);

  /**
   * Start session timeout timer
   */
  const startSessionTimeout = useCallback((timeoutMs: number) => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

    sessionTimeoutRef.current = setTimeout(() => {
      logout();
    }, timeoutMs);
  }, []);

  /**
   * Login with admin credentials
   */
  const login = useCallback(async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await verifyAdminCredentials(email, password);

      if (result.success) {
        // Store session
        await AsyncStorage.setItem(ADMIN_SESSION_KEY, 'active');
        await AsyncStorage.setItem(
          ADMIN_SESSION_TIMESTAMP_KEY,
          Date.now().toString()
        );

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Start session timeout
        startSessionTimeout(ADMIN_CONFIG.SESSION_TIMEOUT_MS);

        return { success: true };
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: result.error || 'Invalid credentials',
        });

        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }, [startSessionTimeout]);

  /**
   * Logout and clear session
   */
  const logout = useCallback(async () => {
    await clearSession();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  }, []);

  /**
   * Clear session from storage
   */
  const clearSession = async () => {
    try {
      await AsyncStorage.multiRemove([
        ADMIN_SESSION_KEY,
        ADMIN_SESSION_TIMESTAMP_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  /**
   * Reset session timeout (call on user activity)
   */
  const resetSessionTimeout = useCallback(() => {
    if (authState.isAuthenticated) {
      AsyncStorage.setItem(
        ADMIN_SESSION_TIMESTAMP_KEY,
        Date.now().toString()
      );
      startSessionTimeout(ADMIN_CONFIG.SESSION_TIMEOUT_MS);
    }
  }, [authState.isAuthenticated, startSessionTimeout]);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...authState,
    login,
    logout,
    resetSessionTimeout,
  };
};
