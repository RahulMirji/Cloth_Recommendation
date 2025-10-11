/**
 * Admin Service
 * 
 * Service layer for admin dashboard operations.
 * Handles all interactions with Supabase for admin features.
 */

import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_CONFIG } from '../constants/config';
import type { 
  DashboardUser, 
  DashboardStats, 
  ActivityLog,
  DeleteUserResponse,
  UserFilters 
} from '../types';

// AsyncStorage keys
const ADMIN_EMAIL_KEY = '@admin_email';

/**
 * Verify if the provided credentials match admin credentials
 */
export const verifyAdminCredentials = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🟡 VERIFY ADMIN CREDENTIALS CALLED');
  console.log('Email:', email);
  console.log('Password length:', password?.length || 0);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    console.log('📊 Querying admin_users table...');
    // First check if admin_users table exists and user is in it
    const { data: adminUser, error: adminCheckError } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🟡 DATABASE QUERY RESULT');
    console.log('Admin user data:', adminUser);
    console.log('Admin check error:', adminCheckError);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (adminCheckError || !adminUser) {
      console.log('❌ Admin user not found in database:', email);
      console.log('Error details:', adminCheckError);
      return { 
        success: false, 
        error: 'Invalid admin credentials' 
      };
    }

    console.log('✅ Admin user found in database');
    console.log('🔍 Checking password...');
    console.log('Expected password:', ADMIN_CONFIG.ADMIN_PASSWORD);
    console.log('Provided password:', password);
    console.log('Passwords match?', password === ADMIN_CONFIG.ADMIN_PASSWORD);
    
    // Verify the password matches the configured admin password
    if (password !== ADMIN_CONFIG.ADMIN_PASSWORD) {
      console.log('❌ Password does not match for email:', email);
      return { 
        success: false, 
        error: 'Invalid admin credentials' 
      };
    }

    console.log('✅ Password matches!');
    console.log('🔍 Checking email...');
    console.log('Expected email:', ADMIN_CONFIG.ADMIN_EMAIL);
    console.log('Provided email:', email);
    console.log('Emails match?', email === ADMIN_CONFIG.ADMIN_EMAIL);
    
    // Also verify the email matches the configured admin email
    if (email !== ADMIN_CONFIG.ADMIN_EMAIL) {
      console.log('❌ Email does not match configured admin email:', email);
      return { 
        success: false, 
        error: 'Invalid admin credentials' 
      };
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL CHECKS PASSED - CREDENTIALS VERIFIED');
    console.log('✅ Admin credentials verified successfully for:', email);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { success: true };
  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ EXCEPTION IN VERIFY CREDENTIALS');
    console.error('❌ Admin verification error:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { 
      success: false, 
      error: 'Authentication failed' 
    };
  }
};

/**
 * Check if current authenticated user is an admin
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return false;

    const { data, error } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', user.email)
      .maybeSingle();

    return !error && !!data;
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
};

/**
 * Fetch all users with optional filters
 * Uses Edge Function to bypass RLS
 */
export const fetchAllUsers = async (
  filters?: UserFilters
): Promise<DashboardUser[]> => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 FETCHING ALL USERS via Edge Function');
    console.log('Filters:', filters);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Get admin email from AsyncStorage
    const adminEmail = await AsyncStorage.getItem(ADMIN_EMAIL_KEY);
    
    if (!adminEmail) {
      console.log('❌ Admin email not found in AsyncStorage');
      throw new Error('Admin email not found in session');
    }

    console.log('👤 Admin email:', adminEmail);

    // Call Edge Function with admin email in header
    const { data, error } = await supabase.functions.invoke('admin-get-users', {
      body: {
        searchQuery: filters?.searchQuery || '',
        gender: filters?.gender || null,
        sortField: filters?.sortField || 'created_at',
        sortOrder: filters?.sortOrder || 'desc',
      },
      headers: {
        'x-admin-email': adminEmail,
      },
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 EDGE FUNCTION RESULT');
    console.log('Error:', error);
    console.log('Data:', data);
    console.log('Users count:', data?.users?.length || 0);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    if (data.error) {
      console.error('Edge function returned error:', data.error);
      throw new Error(data.error);
    }

    return data.users || [];
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    throw error;
  }
};

/**
 * Fetch dashboard statistics
 * Uses Edge Function to bypass RLS
 */
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get admin email from AsyncStorage
    const adminEmail = await AsyncStorage.getItem(ADMIN_EMAIL_KEY);
    
    if (!adminEmail) {
      console.log('❌ Admin email not found in AsyncStorage');
      throw new Error('Admin email not found in session');
    }

    // Call Edge Function to get all users
    const { data, error } = await supabase.functions.invoke('admin-get-users', {
      body: {
        searchQuery: '',
        gender: null,
        sortField: 'created_at',
        sortOrder: 'desc',
      },
      headers: {
        'x-admin-email': adminEmail,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    if (data.error) {
      console.error('Edge function returned error:', data.error);
      throw new Error(data.error);
    }

    const users = data.users || [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats: DashboardStats = {
      totalUsers: users?.length || 0,
      newUsersToday: 0,
      newUsersThisWeek: 0,
      newUsersThisMonth: 0,
      activeUsers: 0, // You can enhance this with activity_logs
      genderBreakdown: {
        male: 0,
        female: 0,
        other: 0,
        notSpecified: 0,
      },
      averageAge: null,
    };

    if (users) {
      let totalAge = 0;
      let ageCount = 0;

      users.forEach((user: any) => {
        if (!user.created_at) return;
        const createdAt = new Date(user.created_at);

        // Count new users
        if (createdAt >= todayStart) stats.newUsersToday++;
        if (createdAt >= weekStart) stats.newUsersThisWeek++;
        if (createdAt >= monthStart) stats.newUsersThisMonth++;

        // Gender breakdown
        const gender = user.gender?.toLowerCase();
        if (gender === 'male') stats.genderBreakdown.male++;
        else if (gender === 'female') stats.genderBreakdown.female++;
        else if (gender && gender !== '') stats.genderBreakdown.other++;
        else stats.genderBreakdown.notSpecified++;

        // Average age
        if (user.age) {
          totalAge += user.age;
          ageCount++;
        }
      });

      if (ageCount > 0) {
        stats.averageAge = Math.round(totalAge / ageCount);
      }
    }

    return stats;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

/**
 * Fetch activity logs
 */
export const fetchActivityLogs = async (
  limit: number = 50
): Promise<ActivityLog[]> => {
  try {
    // Fetch activity logs
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Get unique user IDs from activity logs
    const userIds = [...new Set(
      data?.map(log => log.user_id).filter((id): id is string => id !== null)
    )];
    
    // Fetch user profiles using user_id (auth ID)
    let userProfiles: Record<string, { name: string; email: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);
      
      if (profiles) {
        userProfiles = profiles.reduce((acc, profile) => {
          if (profile.user_id) {
            acc[profile.user_id] = {
              name: profile.name,
              email: profile.email
            };
          }
          return acc;
        }, {} as Record<string, { name: string; email: string }>);
      }
    }

    // Transform the data to include user info
    const logs: ActivityLog[] = (data || []).map((log: any) => {
      const userProfile = log.user_id ? userProfiles[log.user_id] : null;
      return {
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        metadata: log.metadata,
        created_at: log.created_at,
        user_name: userProfile?.name || 'Unknown User',
        user_email: userProfile?.email || '',
      };
    });

    return logs;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return []; // Return empty array on error
  }
};

/**
 * Delete a user (requires admin privileges)
 * This will call a Supabase Edge Function
 */
export const deleteUser = async (
  userId: string
): Promise<DeleteUserResponse> => {
  try {
    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'No active session',
      };
    }

    // Call the Edge Function to delete user
    // Note: You need to create this Edge Function in Supabase
    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { userId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      // If Edge Function doesn't exist yet, fallback to direct deletion
      // (This is less secure but works for development)
      console.warn('Edge Function not available, using direct deletion');
      
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      return {
        success: true,
        message: 'User deleted successfully',
      };
    }

    return data || { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete user',
    };
  }
};

/**
 * Get user details by ID
 */
export const getUserById = async (
  userId: string
): Promise<DashboardUser | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};
