/**
 * AdminAccessButton Component
 * 
 * Special button shown only to admin users for accessing the admin dashboard.
 * Features elegant gradient design with lock icon and glow effect.
 * Matches the app's design system with dark mode support.
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { checkIsAdmin } from '../utils/adminUtils';

interface AdminAccessButtonProps {
  userEmail?: string;
  isDarkMode?: boolean;
}

/**
 * AdminAccessButton Component
 * Shows admin dashboard access button only for admin users
 */
export function AdminAccessButton({ userEmail, isDarkMode: propIsDarkMode }: AdminAccessButtonProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = propIsDarkMode ?? colorScheme === 'dark';
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check admin status on mount and when email changes
  useEffect(() => {
    checkAdminStatus();
  }, [userEmail]);

  const checkAdminStatus = async () => {
    if (!userEmail) {
      setIsAdmin(false);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    try {
      const adminStatus = await checkIsAdmin(userEmail);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handlePress = () => {
    console.log('🔐 Admin button pressed, navigating to admin login...');
    router.push('/(admin)/admin-login' as any);
  };

  // Don't render if not admin or still checking
  if (isChecking) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#6366F1', '#8B5CF6', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Lock Icon */}
          <View style={styles.iconContainer}>
            <Shield size={20} color={Colors.white} strokeWidth={2.5} />
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Access admin portal</Text>
          </View>

          {/* Arrow/Chevron */}
          <View style={styles.arrowContainer}>
            <Lock size={18} color={Colors.white} strokeWidth={2.5} />
          </View>
        </LinearGradient>

        {/* Glow Effect */}
        <View style={[styles.glow, isDarkMode && styles.glowDark]} />
      </TouchableOpacity>

      {/* Admin Badge */}
      <View style={styles.badge}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badgeGradient}
        >
          <Text style={styles.badgeText}>ADMIN</Text>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    position: 'relative',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FontSizes.small,
    fontWeight: FontWeights.medium,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    opacity: 0.2,
    zIndex: -1,
  },
  glowDark: {
    opacity: 0.4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  badgeGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
});
