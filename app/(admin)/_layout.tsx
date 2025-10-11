/**
 * Admin Routes Layout
 * 
 * Shared layout for admin routes to ensure context is shared
 */

import { Stack } from 'expo-router';
import { AdminAuthProvider } from '@/Dashboard/contexts/AdminAuthContext';

export default function AdminLayout() {
  return (
    <AdminAuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </AdminAuthProvider>
  );
}
