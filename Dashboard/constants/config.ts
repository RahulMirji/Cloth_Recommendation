/**
 * Dashboard Configuration
 * 
 * Configuration constants for the admin dashboard.
 * Colors aligned with main app design system for consistency.
 */

export const ADMIN_CONFIG = {
  // Session configuration
  SESSION_TIMEOUT_MS: 10 * 60 * 1000, // 10 minutes
  
  // Long press configuration for settings button
  LONG_PRESS_DURATION_MS: 3000, // 3 seconds
  
  // Pagination
  USERS_PER_PAGE: 20,
  
  // Refresh intervals
  AUTO_REFRESH_INTERVAL_MS: 30000, // 30 seconds
  
  // Colors - Matching main app design system
  COLORS: {
    // Primary brand colors
    primary: '#8B5CF6', // Purple - matches main app
    primaryDark: '#7C3AED',
    secondary: '#EC4899', // Pink - matches main app
    secondaryLight: '#F472B6',
    
    // Status colors
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    
    // Gradient (for backgrounds and accents)
    gradientStart: '#8B5CF6',
    gradientEnd: '#EC4899',
    
    // Backgrounds
    background: '#FFFFFF',
    backgroundDark: '#1F2937',
    backgroundSecondary: '#F9FAFB',
    backgroundTertiary: '#F3F4F6',
    
    // Cards and surfaces
    card: '#FFFFFF',
    cardDark: '#374151',
    cardSecondary: '#F9FAFB',
    
    // Form container (glassmorphic effect)
    formContainer: 'rgba(225, 195, 245, 1)', // Vibrant pinkish-lavender
    formContainerBorder: 'rgba(255, 255, 255, 0.5)',
    
    // Text
    text: '#1F2937',
    textDark: '#F9FAFB',
    textSecondary: '#6B7280',
    textSecondaryDark: '#D1D5DB',
    textLight: '#9CA3AF',
    
    // Borders
    border: '#E5E7EB',
    borderDark: '#4B5563',
    borderLight: '#F3F4F6',
    
    // Input fields
    input: '#FFFFFF',
    inputBorder: '#E5E7EB',
    inputBorderDark: '#4B5563',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    
    // Icon backgrounds
    iconBackground: 'rgba(139, 92, 246, 0.2)', // primary with 20% opacity
  },
} as const;

// Warning message shown in dev mode
export const DEV_WARNING = `
⚠️ ADMIN DASHBOARD - DEVELOPMENT MODE
This dashboard should be hidden in production builds.
Consider using environment variables or build flags.
`;
