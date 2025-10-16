/**
 * Admin Utilities
 * 
 * Utility functions for admin verification and management.
 * Uses Supabase database to verify admin status.
 */

import { supabase } from '@/lib/supabase';

/**
 * Check if a user email is an admin
 * Queries the admin_users table directly
 * 
 * @param email - User email to check
 * @returns Promise<boolean> - true if user is admin
 */
export async function checkIsAdmin(email: string | undefined): Promise<boolean> {
  if (!email) {
    return false;
  }

  try {
    console.log('🔍 Checking admin status for email:', email);
    
    // Query admin_users table directly
    const { data, error } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', email)
      .single();

    if (error) {
      // If error is 'PGRST116' it means no rows found (not an admin)
      if (error.code === 'PGRST116') {
        console.log('ℹ️ User is not an admin:', email);
        return false;
      }
      console.error('❌ Error checking admin status:', error);
      return false;
    }

    console.log('✅ Admin check result: User is admin');
    return data !== null;
  } catch (error) {
    console.error('❌ Exception checking admin status:', error);
    return false;
  }
}

/**
 * Get admin email from admin_users table
 * Useful for verifying admin access
 * 
 * @param email - Email to verify
 * @returns Promise<boolean> - true if email exists in admin_users table
 */
export async function verifyAdminEmail(email: string | undefined): Promise<boolean> {
  if (!email) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', email)
      .single();

    if (error) {
      console.error('❌ Error verifying admin email:', error);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error('❌ Exception verifying admin email:', error);
    return false;
  }
}

/**
 * Get current logged-in user's admin status
 * Checks both session and admin_users table
 * 
 * @returns Promise<{isAdmin: boolean, email: string | null}>
 */
export async function getCurrentUserAdminStatus(): Promise<{
  isAdmin: boolean;
  email: string | null;
}> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.email) {
      return { isAdmin: false, email: null };
    }

    const email = session.user.email;
    const isAdmin = await checkIsAdmin(email);

    return { isAdmin, email };
  } catch (error) {
    console.error('❌ Error getting current user admin status:', error);
    return { isAdmin: false, email: null };
  }
}
