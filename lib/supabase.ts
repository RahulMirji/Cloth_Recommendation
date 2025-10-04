/**
 * Supabase Client Configuration
 * 
 * Initialize and configure the Supabase client for the application.
 * This client is used throughout the app to interact with Supabase services.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wmhiwieooqfwkrdcvqvb.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaGl3aWVvb3Fmd2tyZGN2cXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Nzg3MTksImV4cCI6MjA3NTE1NDcxOX0.R-jk3IOAGVtRXvM2nLpB3gfMXcsrPO6WDLxY5TId6UA';

// Create Supabase client with TypeScript types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for React Native
  },
});

// Export types for convenience
export type { Database } from '@/types/database.types';
export type {Tables, TablesInsert, TablesUpdate } from '@/types/database.types';
