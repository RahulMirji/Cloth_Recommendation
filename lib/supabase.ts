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

// Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.\n' +
    'Required: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

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
