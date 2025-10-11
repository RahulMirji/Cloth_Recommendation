/**
 * useAdminStats Hook
 * 
 * Fetches and manages dashboard statistics.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchDashboardStats, fetchActivityLogs } from '../services/adminService';
import type { DashboardStats, ActivityLog } from '../types';
import { ADMIN_CONFIG } from '../constants/config';

export const useAdminStats = (autoRefresh: boolean = false) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load statistics
   */
  const loadStats = useCallback(async () => {
    try {
      const data = await fetchDashboardStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
    }
  }, []);

  /**
   * Load activity logs
   */
  const loadActivityLogs = useCallback(async (limit: number = 50) => {
    try {
      const logs = await fetchActivityLogs(limit);
      setActivityLogs(logs);
    } catch (err: any) {
      console.error('Failed to load activity logs:', err);
    }
  }, []);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadStats(), loadActivityLogs()]);
    setIsLoading(false);
  }, [loadStats, loadActivityLogs]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, ADMIN_CONFIG.AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  return {
    stats,
    activityLogs,
    isLoading,
    error,
    refresh,
    loadActivityLogs,
  };
};
