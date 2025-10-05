/**
 * Supabase Client Configuration
 * 
 * Initialize and configure the Supabase client for the application.
 * This client is used throughout the app to interact with Supabase services.
 * 
 * FIXED: Enhanced for React Native/Expo Go compatibility
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '@/types/database.types';

// Supabase configuration - hardcoded to ensure it works on mobile
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wmhiwieooqfwkrdcvqvb.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaGl3aWVvb3Fmd2tyZGN2cXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Nzg3MTksImV4cCI6MjA3NTE1NDcxOX0.R-jk3IOAGVtRXvM2nLpB3gfMXcsrPO6WDLxY5TId6UA';

// Log configuration for debugging
console.log('🔧 Supabase Configuration:', {
  url: supabaseUrl.substring(0, 30) + '...',
  hasAnonKey: !!supabaseAnonKey,
  env: process.env.NODE_ENV
});

// Create Supabase client with React Native/Expo compatible configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Use AsyncStorage for React Native
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for React Native
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  // Disable realtime for better mobile compatibility
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Export types for convenience
export type { Database } from '@/types/database.types';
export type {Tables, TablesInsert, TablesUpdate } from '@/types/database.types';
