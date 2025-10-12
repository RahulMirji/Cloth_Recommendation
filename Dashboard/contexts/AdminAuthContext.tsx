/**
 * AdminAuthContext
 * 
 * Global context for admin authentication state.
 * This ensures all admin screens share the same auth state.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { verifyAdminCredentials } from '../services/adminService';
import { ADMIN_CONFIG } from '../constants/config';
import type { AdminAuthState } from '../types';

// Storage keys
const ADMIN_SESSION_KEY = '@admin_session';
const ADMIN_SESSION_TIMESTAMP_KEY = '@admin_session_timestamp';
const ADMIN_EMAIL_KEY = '@admin_email';

interface AdminAuthContextType extends AdminAuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetSessionTimeout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
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
      console.log('🔍 Checking admin session...');
      const session = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
      const timestamp = await AsyncStorage.getItem(ADMIN_SESSION_TIMESTAMP_KEY);

      if (session && timestamp) {
        const sessionTime = parseInt(timestamp, 10);
        const now = Date.now();
        const timeDiff = now - sessionTime;

        // Check if session has expired
        if (timeDiff < ADMIN_CONFIG.SESSION_TIMEOUT_MS) {
          console.log('✅ Valid admin session found');
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          startSessionTimeout(ADMIN_CONFIG.SESSION_TIMEOUT_MS - timeDiff);
          return;
        } else {
          console.log('⏰ Admin session expired');
        }
      } else {
        console.log('❌ No admin session found');
      }

      // No valid session
      await clearSession();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('❌ Session check error:', error);
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
      console.log('⏰ Admin session timeout - logging out');
      logout();
    }, timeoutMs);
  }, []);

  /**
   * Login with admin credentials
   */
  const login = useCallback(async (email: string, password: string) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('� ADMIN AUTH CONTEXT - LOGIN CALLED');
    console.log('Email:', email);
    console.log('Password length:', password?.length || 0);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('🔄 Setting loading state...');
    setAuthState((prev) => {
      console.log('Previous state:', prev);
      return { ...prev, isLoading: true, error: null };
    });

    try {
      console.log('📞 Calling verifyAdminCredentials...');
      const result = await verifyAdminCredentials(email, password);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🟢 VERIFY CREDENTIALS RESULT');
      console.log('Result:', JSON.stringify(result, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (result.success) {
        console.log('✅ Credentials verified, storing session...');
        
        // Store session
        console.log('💾 Saving to AsyncStorage...');
        await AsyncStorage.setItem(ADMIN_SESSION_KEY, 'active');
        console.log('✅ Saved ADMIN_SESSION_KEY');
        
        await AsyncStorage.setItem(ADMIN_EMAIL_KEY, email);
        console.log('✅ Saved ADMIN_EMAIL_KEY');
        
        await AsyncStorage.setItem(
          ADMIN_SESSION_TIMESTAMP_KEY,
          Date.now().toString()
        );
        console.log('✅ Saved ADMIN_SESSION_TIMESTAMP_KEY');

        console.log('🔄 Updating auth state to authenticated...');
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        console.log('✅ Auth state updated to authenticated');

        // Start session timeout
        console.log('⏰ Starting session timeout...');
        startSessionTimeout(ADMIN_CONFIG.SESSION_TIMEOUT_MS);
        console.log('✅ Session timeout started');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🟢 LOGIN SUCCESSFUL - RETURNING SUCCESS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return { success: true };
      } else {
        console.log('❌ Credentials verification failed');
        console.log('Error:', result.error);
        
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: result.error || 'Invalid credentials',
        });

        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ EXCEPTION IN LOGIN CONTEXT');
      console.error('Error:', error);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
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
    console.log('🚪 Admin logout...');
    
    // Sign out from Supabase
    try {
      console.log('🔓 Signing out from Supabase...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Supabase sign out error:', error);
      } else {
        console.log('✅ Signed out from Supabase');
      }
    } catch (error) {
      console.error('❌ Exception during Supabase sign out:', error);
    }
    
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
        ADMIN_EMAIL_KEY,
        ADMIN_SESSION_TIMESTAMP_KEY,
      ]);
      console.log('✅ Cleared all admin session data');
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

  return (
    <AdminAuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        resetSessionTimeout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuthContext = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuthContext must be used within AdminAuthProvider');
  }
  return context;
};
