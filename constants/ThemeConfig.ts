/**
 * Theme Configuration
 * 
 * Centralized theme settings for navigation bars and UI elements.
 * Automatically adapts to light/dark mode.
 */

import { useColorScheme } from 'react-native';
import Colors from './colors';

export interface NavigationTheme {
  tabBarStyle: {
    backgroundColor: string;
    borderTopWidth: number;
    borderTopColor: string;
    elevation: number;
    shadowOpacity: number;
  };
  headerStyle: {
    backgroundColor: string;
    elevation: number;
    shadowOpacity: number;
    borderBottomWidth: number;
  };
  headerTitleStyle: {
    color: string;
  };
  headerTintColor: string;
  tabBarActiveTintColor: string;
  tabBarInactiveTintColor: string;
}

/**
 * Get navigation theme based on color scheme and app settings
 */
export const useNavigationTheme = (isDarkMode?: boolean): NavigationTheme => {
  const colorScheme = useColorScheme();
  const isDark = isDarkMode !== undefined ? isDarkMode : colorScheme === 'dark';

  return {
    tabBarStyle: {
      backgroundColor: isDark ? '#0F172A' : Colors.white,
      borderTopWidth: 0,
      borderTopColor: 'transparent',
      elevation: 0,
      shadowOpacity: 0,
    },
    headerStyle: {
      backgroundColor: isDark ? '#0F172A' : Colors.white,
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 0,
    },
    headerTitleStyle: {
      color: isDark ? Colors.white : Colors.text,
    },
    headerTintColor: isDark ? Colors.white : Colors.text,
    tabBarActiveTintColor: Colors.primary,
    tabBarInactiveTintColor: isDark ? 'rgba(255, 255, 255, 0.6)' : Colors.textLight,
  };
};

/**
 * Get background color based on color scheme
 */
export const useBackgroundColor = (): string => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? '#0F172A' : Colors.background;
};

/**
 * Get text color based on color scheme
 */
export const useTextColor = (): string => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? Colors.white : Colors.text;
};

/**
 * Get secondary text color based on color scheme
 */
export const useSecondaryTextColor = (): string => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : Colors.textSecondary;
};

/**
 * Check if dark mode is active
 */
export const useIsDarkMode = (): boolean => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark';
};
