/**
 * Themed Colors Utility
 * Provides dynamic color values based on dark/light mode
 */

const BaseColors = {
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  secondary: '#EC4899',
  secondaryLight: '#F472B6',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  white: '#FFFFFF',
  black: '#000000',
  
  gradient: {
    start: '#8B5CF6',
    end: '#EC4899',
  },
};

/**
 * Get themed colors based on dark mode state
 */
export const getThemedColors = (isDarkMode: boolean) => ({
  ...BaseColors,
  
  // Backgrounds
  background: isDarkMode ? '#1F2937' : '#FFFFFF',
  backgroundSecondary: isDarkMode ? '#374151' : '#F9FAFB',
  backgroundTertiary: isDarkMode ? '#4B5563' : '#F3F4F6',
  
  // Cards and surfaces
  card: isDarkMode ? '#374151' : '#FFFFFF',
  cardSecondary: isDarkMode ? '#4B5563' : '#F9FAFB',
  
  // Text
  text: isDarkMode ? '#F9FAFB' : '#1F2937',
  textSecondary: isDarkMode ? '#D1D5DB' : '#6B7280',
  textLight: isDarkMode ? '#9CA3AF' : '#9CA3AF',
  
  // Borders
  border: isDarkMode ? '#4B5563' : '#E5E7EB',
  borderLight: isDarkMode ? '#374151' : '#F3F4F6',
  
  // Input fields
  input: isDarkMode ? '#374151' : '#FFFFFF',
  inputBorder: isDarkMode ? '#4B5563' : '#E5E7EB',
  inputPlaceholder: isDarkMode ? '#9CA3AF' : '#9CA3AF',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
  
  // Shadows (for elevation)
  shadowColor: isDarkMode ? '#000000' : '#000000',
  
  // Icon background
  iconBackground: isDarkMode ? '#4B5563' : BaseColors.primary + '20',
  
  // Button secondary
  buttonSecondary: isDarkMode ? '#4B5563' : '#FFFFFF',
  buttonSecondaryText: isDarkMode ? '#F9FAFB' : BaseColors.primary,
  buttonSecondaryBorder: isDarkMode ? '#6B7280' : BaseColors.primary,
});

export type ThemedColors = ReturnType<typeof getThemedColors>;

export default getThemedColors;
