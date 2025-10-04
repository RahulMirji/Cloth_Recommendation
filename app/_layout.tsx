import "@rork/polyfills";
import { BundleInspector } from '@rork/inspector';
import { RorkErrorBoundary } from '@rork/rork-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider, useApp } from '@/contexts/AppContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const currentPath = segments[0] ? String(segments[0]) : '';
    const inOnboarding = currentPath.includes('onboarding');

    // If not authenticated and not in onboarding flow, show tutorial
    if (!isAuthenticated && !inOnboarding) {
      router.replace('/onboarding-tutorial' as any);
    } 
    // If authenticated and in onboarding flow, go to home
    else if (isAuthenticated && inOnboarding) {
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      {/* Onboarding Flow */}
      <Stack.Screen name="onboarding-tutorial" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding-user-info" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      
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
