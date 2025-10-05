import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider, useApp } from '@/contexts/AppContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading, settings } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const currentPath = segments[0] ? String(segments[0]) : '';
    const inAuth = currentPath === 'auth';
    const inOnboarding = currentPath === 'onboarding-tutorial';

    console.log('Navigation check:', { isAuthenticated, isLoading, currentPath, inAuth, inOnboarding });

    // If not authenticated and not in auth or onboarding, show tutorial first
    if (!isAuthenticated && !inAuth && !inOnboarding) {
      console.log('Redirecting to onboarding tutorial');
      router.replace('/onboarding-tutorial' as any);
    } 
    // If authenticated and in auth or onboarding flow, go to home
    else if (isAuthenticated && (inAuth || inOnboarding)) {
      console.log('User authenticated, redirecting to home');
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
          <RootLayoutNav />
        </GestureHandlerRootView>
      </AppProvider>
    </QueryClientProvider>
  );
}
