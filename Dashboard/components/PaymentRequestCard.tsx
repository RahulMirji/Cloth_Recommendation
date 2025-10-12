// ============================================================================
// Payment Request Card Component
// ============================================================================
// Card component for displaying payment request in list view
// File: Dashboard/components/PaymentRequestCard.tsx
// Created: October 12, 2025
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PaymentSubmission, STATUS_COLORS, STATUS_LABELS } from '../types/payment.types';
import { formatCurrency, formatDate } from '../services/paymentAdminService';

interface PaymentRequestCardProps {
  payment: PaymentSubmission;
  onPress: () => void;
}

export const PaymentRequestCard: React.FC<PaymentRequestCardProps> = ({
  payment,
  onPress,
}) => {
  const statusColor = STATUS_COLORS[payment.status];
  const statusLabel = STATUS_LABELS[payment.status];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
    >
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{statusLabel}</Text>
      </View>

      <View style={styles.content}>
        {/* Left: Screenshot Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: payment.screenshot_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.thumbnailOverlay}>
            <MaterialCommunityIcons name="magnify" size={20} color="#fff" />
          </View>
        </View>

        {/* Middle: Payment Info */}
        <View style={styles.info}>
          {/* User Name */}
          <Text style={styles.userName} numberOfLines={1}>
            {payment.user_name || 'Unknown User'}
          </Text>

          {/* Amount & UTR */}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="currency-inr" size={16} color="#667eea" />
            <Text style={styles.amount}>{formatCurrency(payment.amount)}</Text>
            <View style={styles.dot} />
            <Text style={styles.utr} numberOfLines={1}>
              UTR: {payment.utr_number}
            </Text>
          </View>

          {/* Date */}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#9ca3af" />
            <Text style={styles.date}>{formatDate(payment.submitted_at)}</Text>
          </View>

          {/* Reviewer Info (if processed) */}
          {payment.reviewed_by && payment.reviewer_name && (
            <View style={styles.reviewerRow}>
              <MaterialCommunityIcons name="account-check" size={14} color="#9ca3af" />
              <Text style={styles.reviewerText}>
                By {payment.reviewer_name}
              </Text>
            </View>
          )}
        </View>

        {/* Right: Arrow */}
        <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Now full-width within parent container; parent (payments view) controls horizontal padding
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 8,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667eea',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#d1d5db',
    marginHorizontal: 4,
  },
  utr: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reviewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  reviewerText: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
