/**
 * Dashboard TypeScript Types
 * 
 * Type definitions for the admin dashboard module.
 */

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

export interface DashboardUser {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  bio: string | null;
  profile_image: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsers: number;
  genderBreakdown: {
    male: number;
    female: number;
    other: number;
    notSpecified: number;
  };
  averageAge: number | null;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  metadata: any;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface DeleteUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export type UserSortField = 'created_at' | 'name' | 'email';
export type SortOrder = 'asc' | 'desc';

export interface UserFilters {
  searchQuery: string;
  gender: string | null;
  sortField: UserSortField;
  sortOrder: SortOrder;
}
