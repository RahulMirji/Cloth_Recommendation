/**
 * Root Index Route
 * 
 * This component acts as the entry point.
 * The _layout.tsx handles navigation based on authentication status.
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useApp();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Wait for loading to complete
    if (isLoading) {
      console.log('⏳ Index.tsx - Still loading auth state...');
      return;
    }

    // Only navigate once
    if (hasNavigated.current) {
      console.log('⏭️ Index.tsx - Already navigated, skipping');
      return;
    }

    console.log('🔹 Index.tsx - Auth state ready:', { isAuthenticated, isLoading });

    // Navigate immediately based on auth state
    hasNavigated.current = true;
    
    if (isAuthenticated) {
      console.log('✅ Index.tsx - User is authenticated, navigating to /(tabs)');
      router.replace('/(tabs)');
    } else {
      console.log('🔐 Index.tsx - User is NOT authenticated, navigating to /auth/sign-in');
      router.replace('/auth/sign-in');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading screen while determining auth state
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
