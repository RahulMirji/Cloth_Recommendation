import "@rork/polyfills";
import { BundleInspector } from '@rork/inspector';
import { RorkErrorBoundary } from '@rork/rork-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider, useApp } from '@/contexts/AppContext';
import { useAuthStore } from '@/store/authStore';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading, settings } = useApp();
  const segments = useSegments();
  const router = useRouter();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  // Initialize auth store on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const currentPath = segments[0] ? String(segments[0]) : '';
    const inAuth = currentPath === 'auth';
    const inOnboarding = currentPath === 'onboarding-tutorial';

    // If not authenticated and not in auth or onboarding, show tutorial first
    if (!isAuthenticated && !inAuth && !inOnboarding) {
      router.replace('/onboarding-tutorial' as any);
    } 
    // If authenticated and in auth or onboarding flow, go to home
    else if (isAuthenticated && (inAuth || inOnboarding)) {
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, isLoading, segments]);

  const isDarkMode = settings.isDarkMode;

  return (
    <Stack screenOptions={{ 
      headerBackTitle: 'Back',
      headerStyle: {
        backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
      },
      headerTintColor: isDarkMode ? '#FFFFFF' : '#1F2937',
      headerTitleStyle: {
        color: isDarkMode ? '#FFFFFF' : '#1F2937',
      },
    }}>
      {/* Onboarding Flow */}
      <Stack.Screen name="onboarding-tutorial" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding-user-info" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      
      {/* Authentication */}
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      
      {/* Main App */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false, presentation: 'modal' }} />
      
      {/* Feature Screens */}
      <Stack.Screen
        name="ai-stylist"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="outfit-scorer"
        options={{
          headerShown: true,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BundleInspector><RorkErrorBoundary><RootLayoutNav /></RorkErrorBoundary></BundleInspector>
        </GestureHandlerRootView>
      </AppProvider>
    </QueryClientProvider>
  );
}
