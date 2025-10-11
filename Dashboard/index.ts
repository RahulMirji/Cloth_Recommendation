/**
 * Dashboard Module Entry Point
 * 
 * Admin dashboard for monitoring user signups and managing users.
 * Access: 3-second long press on settings button in bottom navigation.
 * 
 * @module Dashboard
 */

export { default as AdminDashboardScreen } from './screens/AdminDashboardScreen';
export { default as AdminLoginScreen } from './screens/AdminLoginScreen';

// Contexts
export { AdminAuthProvider, useAdminAuthContext } from './contexts/AdminAuthContext';

// Components
export * from './components';

// Hooks
export * from './hooks';

// Services
export * from './services';

// Types
export * from './types';

// Constants
export { ADMIN_CONFIG } from './constants/config';
