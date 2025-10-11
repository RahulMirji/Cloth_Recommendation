/**
 * useUserManagement Hook
 * 
 * Manages user data fetching, filtering, and deletion.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchAllUsers, deleteUser, getUserById } from '../services/adminService';
import type { DashboardUser, UserFilters } from '../types';

export const useUserManagement = () => {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<DashboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    searchQuery: '',
    gender: null,
    sortField: 'created_at',
    sortOrder: 'desc',
  });

  /**
   * Load users from database
   */
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAllUsers(filters);
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  /**
   * Refresh user list
   */
  const refreshUsers = useCallback(async () => {
    await loadUsers();
  }, [loadUsers]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: Partial<UserFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Delete a user
   */
  const removeUser = useCallback(async (userId: string) => {
    try {
      const result = await deleteUser(userId);

      if (result.success) {
        // Remove from local state
        setUsers((prev) => prev.filter((u) => u.user_id !== userId));
        setFilteredUsers((prev) => prev.filter((u) => u.user_id !== userId));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete user' };
    }
  }, []);

  /**
   * Get user by ID
   */
  const getUser = useCallback(async (userId: string) => {
    try {
      const user = await getUserById(userId);
      return user;
    } catch (err) {
      console.error('Error fetching user:', err);
      return null;
    }
  }, []);

  /**
   * Search users locally (instant)
   */
  const searchUsers = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredUsers(users);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowercaseQuery) ||
        user.email.toLowerCase().includes(lowercaseQuery) ||
        user.phone?.toLowerCase().includes(lowercaseQuery)
    );

    setFilteredUsers(filtered);
  }, [users]);

  // Load users on mount and when filters change
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users: filteredUsers,
    allUsers: users,
    isLoading,
    error,
    filters,
    updateFilters,
    refreshUsers,
    removeUser,
    getUser,
    searchUsers,
  };
};
