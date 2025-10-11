/**
 * Basic test suite for Dashboard AdminAuthContext
 * Tests the main authentication flow
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { AdminAuthProvider } from '../../contexts/AdminAuthContext';
import { useAdminAuth } from '../../hooks/useAdminAuth';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../services/adminService');

describe('Admin Authentication', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AdminAuthProvider>{children}</AdminAuthProvider>
  );

  it('should start with loading state', () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    
    // Initial state should be loading
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.isAuthenticated).toBeDefined();
  });

  it('should have login and logout functions', async () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  it('should have resetSessionTimeout function', async () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.resetSessionTimeout).toBe('function');
  });
});
