import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';

import { AppProvider, useApp } from '@/contexts/AppContext';
import { AlertProvider } from '@/contexts/AlertContext';
import Colors from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading, settings } = useApp();
  const segments = useSegments();
  const router = useRouter();
  const [navigationReady, setNavigationReady] = React.useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Mark navigation as ready after auth state is determined
    if (!navigationReady) {
      setNavigationReady(true);
    }

    const currentPath = segments[0] ? String(segments[0]) : '';
    const inAuth = currentPath === 'auth';
    const inOnboarding = 
      currentPath === 'onboarding-tutorial' || 
      currentPath === 'onboarding-user-info' || 
      currentPath === 'onboarding';
    const inTabs = currentPath === '(tabs)';
    const inIndex = !currentPath || currentPath === 'index';

    console.log('🔹 _layout.tsx navigation check:', {
      isAuthenticated,
      currentPath,
      inAuth,
      inOnboarding,
      inTabs,
      inIndex
    });

    // Prevent showing any route until auth is checked
    if (inIndex) {
      // Let index.tsx handle the initial routing
      return;
    }

    // Only redirect if in wrong place
    if (isAuthenticated && (inAuth || inOnboarding)) {
      // Authenticated users shouldn't be on auth/onboarding pages
      console.log('✅ Redirecting authenticated user from', currentPath, 'to /(tabs)');
      setTimeout(() => router.replace('/(tabs)' as any), 0);
    } else if (!isAuthenticated && inTabs) {
      // Unauthenticated users shouldn't be in main app
      console.log('🔐 Redirecting unauthenticated user from', currentPath, 'to /auth/sign-in');
      setTimeout(() => router.replace('/auth/sign-in' as any), 0);
    }
  }, [isAuthenticated, isLoading, segments, navigationReady]);

  const isDarkMode = settings.isDarkMode;

  // Don't render routes until auth state is determined
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
        <AlertProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </AlertProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}
