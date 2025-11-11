import { Tabs, useRouter } from 'expo-router';
import { Home, Settings, User, Clock, Shirt } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, Image, View, StyleSheet, Text, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { useNavigationTheme } from '@/constants/ThemeConfig';

export default function TabLayout() {
  const router = useRouter();
  const { userProfile, settings } = useApp();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  
  // Pass isDarkMode explicitly to ensure proper theme switching
  const navigationTheme = useNavigationTheme(isDarkMode);

  const ProfileButton = () => (
    <TouchableOpacity
      style={styles.profileButtonContainer}
      onPress={() => router.push('/profile' as any)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.profileButtonGlow,
        userProfile.profileImage && styles.profileButtonGlowActive
      ]}>
        {userProfile.profileImage ? (
          <Image 
            source={{ uri: userProfile.profileImage }} 
            style={styles.profileImage}
          />
        ) : (
          <View style={[
            styles.profilePlaceholder,
            isDarkMode && styles.profilePlaceholderDark
          ]}>
            <User size={18} color={isDarkMode ? Colors.white : Colors.primary} strokeWidth={2.5} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const LogoTitle = () => {
    return (
      <View style={styles.logoContainer}>
        {/* Clothing Icon with Gradient Background and Glow */}
        <View style={styles.logoIconContainer}>
          <LinearGradient
            colors={[Colors.gradient.start, Colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoIconGradient}
          >
            <Shirt size={20} color={Colors.white} strokeWidth={2.5} />
          </LinearGradient>
        </View>
        
        {/* Plain Text without gradient background */}
        <Text style={[styles.logoText, { color: isDarkMode ? Colors.white : Colors.text }]}>
          Style GPT
        </Text>
      </View>
    );
  };

  return (
    <Tabs
      key={`tabs-${isDarkMode ? 'dark' : 'light'}`}
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
          headerShown: false, // Hide default header to make it scrollable
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
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
  profileButtonContainer: {
    marginRight: 16,
  },
  profileButtonGlow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  profileButtonGlowActive: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
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
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  profilePlaceholderDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logoIconContainer: {
    marginRight: 12,
    borderRadius: 10,
    overflow: 'hidden',
    // Enhanced glow effect for icon only
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 10,
  },
  logoIconGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
