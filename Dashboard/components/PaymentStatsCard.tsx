import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
            <View style={[styles.badge, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.badgeText}></Text>
            </View>
            <Text style={styles.statValue}>{stats.pending_count}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.badge, { backgroundColor: '#10b981' }]}>
              <Text style={styles.badgeText}></Text>
            </View>
            <Text style={styles.statValue}>{stats.approved_count}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.badgeText}></Text>
            </View>
            <Text style={styles.statValue}>{stats.rejected_count}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.badge, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.badgeText}></Text>
            </View>
            <Text style={styles.statValue}>{stats.today_count}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        <View style={styles.revenueSection}>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueValue}>
              {formatCurrency(stats.total_revenue)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.revenueItem}>
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
    marginHorizontal: 16, // Add horizontal margin to match search bar
    marginVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  prismLeft: {
    position: 'absolute',
    left: -30,
    top: -20,
    width: 160,
    height: 160,
    transform: [{ rotate: '-25deg' }],
    borderRadius: 80,
    opacity: 0.6,
  },
  prismRight: {
    position: 'absolute',
    right: -40,
    bottom: -30,
    width: 200,
    height: 200,
    transform: [{ rotate: '20deg' }],
    borderRadius: 120,
    opacity: 0.5,
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
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  revenueItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  revenueLabel: {
    fontSize: 12,
    color: '#e0e7ff',
    marginBottom: 6,
    fontWeight: '500',
  },
  revenueValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});
