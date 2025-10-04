import { Tabs, useRouter } from 'expo-router';
import { Home, Settings, User } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, Image, View, StyleSheet, Text, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';

import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { useNavigationTheme } from '@/constants/ThemeConfig';

export default function TabLayout() {
  const router = useRouter();
  const { userProfile, settings } = useApp();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  const navigationTheme = useNavigationTheme(isDarkMode);

  const ProfileButton = () => (
    <TouchableOpacity
      style={styles.profileButton}
      onPress={() => router.push('/profile' as any)}
    >
      {userProfile.profileImage ? (
        <Image source={{ uri: userProfile.profileImage }} style={styles.profileImage} />
      ) : (
        <BlurView intensity={20} tint={isDarkMode ? 'dark' : 'light'} style={styles.profilePlaceholder}>
          <User size={20} color={isDarkMode ? Colors.white : Colors.primary} />
        </BlurView>
      )}
    </TouchableOpacity>
  );

  const LogoTitle = () => {
    return (
      <View style={styles.logoContainer}>
        <Text style={[styles.logoText, { color: isDarkMode ? Colors.white : Colors.text }]}>
          AI Cloth Recommendation
        </Text>
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: navigationTheme.tabBarActiveTintColor,
        tabBarInactiveTintColor: navigationTheme.tabBarInactiveTintColor,
        headerShown: true,
        tabBarStyle: navigationTheme.tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600' as const,
        },
        headerStyle: navigationTheme.headerStyle,
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '700' as const,
          ...navigationTheme.headerTitleStyle,
        },
        headerTintColor: navigationTheme.headerTintColor,
        headerRight: () => <ProfileButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: () => <LogoTitle />,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    marginRight: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '20',
  },
  logoContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
