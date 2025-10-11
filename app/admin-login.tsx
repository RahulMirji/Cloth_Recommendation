/**
 * Admin Login Route
 * 
 * Hidden route for admin login.
 * Access: 3-second long press on settings button.
 */

import { AdminLoginScreen } from '@/Dashboard';
import { AdminAuthProvider } from '@/Dashboard/contexts/AdminAuthContext';

export default function AdminLoginRoute() {
  return (
    <AdminAuthProvider>
      <AdminLoginScreen />
    </AdminAuthProvider>
  );
}
