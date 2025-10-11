/**
 * Dashboard Configuration
 * 
 * Configuration constants for the admin dashboard.
 */

export const ADMIN_CONFIG = {
  // Admin credentials (change these to your actual credentials)
  ADMIN_EMAIL: 'devprahulmirji@gmail.com', // Change this to your email
  ADMIN_PASSWORD: 'connect', // Change this to a secure password
  
  // Session configuration
  SESSION_TIMEOUT_MS: 10 * 60 * 1000, // 10 minutes
  
  // Long press configuration for settings button
  LONG_PRESS_DURATION_MS: 3000, // 3 seconds
  
  // Pagination
  USERS_PER_PAGE: 20,
  
  // Refresh intervals
  AUTO_REFRESH_INTERVAL_MS: 30000, // 30 seconds
  
  // Colors
  COLORS: {
    primary: '#4F46E5',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    background: '#F9FAFB',
    backgroundDark: '#1F2937',
    card: '#FFFFFF',
    cardDark: '#374151',
    text: '#1F2937',
    textDark: '#F9FAFB',
    textSecondary: '#6B7280',
    textSecondaryDark: '#9CA3AF',
    border: '#E5E7EB',
    borderDark: '#4B5563',
  },
} as const;

// Warning message shown in dev mode
export const DEV_WARNING = `
⚠️ ADMIN DASHBOARD - DEVELOPMENT MODE
This dashboard should be hidden in production builds.
Consider using environment variables or build flags.
`;
