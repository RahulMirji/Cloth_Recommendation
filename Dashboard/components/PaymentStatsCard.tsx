import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PaymentStats } from '../types/payment.types';
import { formatCurrency } from '../services/paymentAdminService';

interface PaymentStatsCardProps {
  stats: PaymentStats | null;
  loading?: boolean;
}

export const PaymentStatsCard: React.FC<PaymentStatsCardProps> = ({
  stats,
  loading = false,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
      </View>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,255,255,0.06)', 'transparent']}
        style={styles.prismLeft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.03)', 'transparent']}
        style={styles.prismRight}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <LinearGradient
        colors={['#9AE6B4', '#60A5FA']}
        start={{ x: 0.0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.95]}
        style={styles.gradient}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.03)']}
          style={styles.glossOverlay}
        />

        <Text style={styles.title}>Payment Overview</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']}
              style={styles.badgeGlow}
            />
            <View style={[styles.badge, { backgroundColor: '#f59e0b' }]}>
              <Ionicons name="time-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.pending_count}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statItem}>
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
              style={styles.badgeGlow}
            />
            <View style={[styles.badge, { backgroundColor: '#10b981' }]}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.approved_count}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>

          <View style={styles.statItem}>
            <LinearGradient
              colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)']}
              style={styles.badgeGlow}
            />
            <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
              <Ionicons name="close-circle-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.rejected_count}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>

          <View style={styles.statItem}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
              style={styles.badgeGlow}
            />
            <View style={[styles.badge, { backgroundColor: '#3b82f6' }]}>
              <Ionicons name="calendar-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.today_count}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        <View style={styles.revenueSection}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.1)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.revenueItem}>
            <View style={styles.revenueIconWrapper}>
              <Ionicons name="wallet-outline" size={16} color="#fff" />
            </View>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueValue}>
              {formatCurrency(stats.total_revenue)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.revenueItem}>
            <View style={styles.revenueIconWrapper}>
              <Ionicons name="time-outline" size={16} color="#fff" />
            </View>
            <Text style={styles.revenueLabel}>Pending Revenue</Text>
            <Text style={styles.revenueValue}>
              {formatCurrency(stats.pending_revenue)}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  gradient: {
    padding: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  prismLeft: {
    position: 'absolute',
    left: -40,
    top: -30,
    width: 180,
    height: 180,
    transform: [{ rotate: '-25deg' }],
    borderRadius: 90,
    opacity: 0.7,
  },
  prismRight: {
    position: 'absolute',
    right: -50,
    bottom: -40,
    width: 220,
    height: 220,
    transform: [{ rotate: '20deg' }],
    borderRadius: 110,
    opacity: 0.6,
  },
  glossOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 120,
    opacity: 0.6,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    position: 'relative',
  },
  badgeGlow: {
    position: 'absolute',
    top: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  badgeText: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#e0e7ff',
    fontWeight: '500',
  },
  revenueSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  revenueItem: {
    flex: 1,
    alignItems: 'center',
  },
  revenueIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  revenueLabel: {
    fontSize: 12,
    color: '#e0e7ff',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  revenueValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
