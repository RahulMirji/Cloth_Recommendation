/**
 * Basic test suite for Dashboard User Management Hook
 * Tests user management functionality
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useUserManagement } from '../../hooks/useUserManagement';
import * as adminService from '../../services/adminService';

jest.mock('../../services/adminService');

describe('User Management Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (adminService.fetchAllUsers as jest.Mock).mockResolvedValue([]);
  });

  it('should initialize with empty users', async () => {
    const { result } = renderHook(() => useUserManagement());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should have required management functions', async () => {
    const { result } = renderHook(() => useUserManagement());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refreshUsers).toBe('function');
    expect(typeof result.current.removeUser).toBe('function');
    expect(typeof result.current.updateFilters).toBe('function');
  });

  it('should handle filters object', async () => {
    const { result } = renderHook(() => useUserManagement());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.filters).toBeDefined();
    expect(result.current.filters).toHaveProperty('searchQuery');
    expect(result.current.filters).toHaveProperty('gender');
    expect(result.current.filters).toHaveProperty('sortField');
    expect(result.current.filters).toHaveProperty('sortOrder');
  });

  it('should call fetchAllUsers on mount', async () => {
    const { result } = renderHook(() => useUserManagement());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(adminService.fetchAllUsers).toHaveBeenCalled();
  });
});
