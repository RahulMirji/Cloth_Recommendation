/**
 * Admin Dashboard Route
 * 
 * Protected route for admin dashboard.
 * Requires authentication via AdminLoginScreen.
 */

import { AdminDashboardScreen } from '@/Dashboard';
import { AdminAuthProvider } from '@/Dashboard/contexts/AdminAuthContext';

export default function AdminDashboardRoute() {
  return (
    <AdminAuthProvider>
      <AdminDashboardScreen />
    </AdminAuthProvider>
  );
}
