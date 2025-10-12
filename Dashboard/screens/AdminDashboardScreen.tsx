/**
 * AdminDashboardScreen Component
 * 
 * Main admin dashboard for monitoring users and app statistics.
 * Redesigned with modern UI matching main app aesthetic.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdminAuthContext } from '../contexts/AdminAuthContext';
import { useUserManagement, useAdminStats } from '../hooks';
import { StatsCard, UserListItem, DeleteUserModal, UserDetailsModal, LogoutConfirmModal, PaymentStatsCard, PaymentRequestCard, UserProfilePreview, ScreenshotPreviewModal, RejectReasonModal, ApprovalActionSheet } from '../components';
import type { DashboardUser } from '../types';
import { PaymentSubmission, PaymentStats, STATUS_COLORS, STATUS_LABELS } from '../types/payment.types';
import { getPaymentSubmissions, getPaymentStats, searchPayments, approvePayment, rejectPayment, formatCurrency, formatDate } from '../services/paymentAdminService';
import { ADMIN_CONFIG } from '../constants/config';
import { useApp } from '@/contexts/AppContext';
import { Footer } from '@/components/Footer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { showCustomAlert } from '@/utils/customAlert';

export default function AdminDashboardScreen() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🟣 ADMIN DASHBOARD SCREEN RENDERED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const router = useRouter();
  const { settings } = useApp();
  const isDarkMode = settings.isDarkMode;
  const colors = ADMIN_CONFIG.COLORS;

  const { logout, isAuthenticated } = useAdminAuthContext();
  
  console.log('Dashboard auth state:', { isAuthenticated });
  
  const {
    users,
    isLoading: usersLoading,
    refreshUsers,
    removeUser,
    searchUsers,
  } = useUserManagement();
  const { stats, isLoading: statsLoading, refresh: refreshStats } = useAdminStats();

  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'payments'>('stats');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Payment state
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [paymentActiveTab, setPaymentActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [allPayments, setAllPayments] = useState<PaymentSubmission[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentSubmission[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentSubmission | null>(null);
  const [showPaymentDetail, setShowPaymentDetail] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [showApproveSheet, setShowApproveSheet] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🟣 DASHBOARD - Auth Check Effect');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login...');
      router.replace('/(admin)/admin-login' as any);
    } else {
      console.log('✅ Authenticated, staying on dashboard');
    }
  }, [isAuthenticated, router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'payments') {
      await loadPaymentData(false);
    } else {
      await Promise.all([refreshUsers(), refreshStats()]);
    }
    setRefreshing(false);
  }, [refreshUsers, refreshStats, activeTab]);

  // Load payment data
  const loadPaymentData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setPaymentsLoading(true);

      const [statsData, paymentsData] = await Promise.all([
        getPaymentStats(),
        getPaymentSubmissions(null),
      ]);

      setPaymentStats(statsData);
      setAllPayments(paymentsData);
    } catch (error: any) {
      console.log('⚠️ Failed to load payments:', error);
      showCustomAlert('error', 'Error', error.message || 'Failed to load payments');
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  // Load payments when payments tab is active
  React.useEffect(() => {
    if (activeTab === 'payments') {
      loadPaymentData();
    }
  }, [activeTab, loadPaymentData]);

  // Filter payments
  React.useEffect(() => {
    let filtered = allPayments;

    if (paymentActiveTab !== 'all') {
      filtered = filtered.filter((p) => p.status === paymentActiveTab);
    }

    if (paymentSearchQuery.trim()) {
      filtered = searchPayments(filtered, paymentSearchQuery);
    }

    setFilteredPayments(filtered);
  }, [allPayments, paymentActiveTab, paymentSearchQuery]);

  // Handle payment selection
  const handlePaymentPress = (payment: PaymentSubmission) => {
    setSelectedPayment(payment);
    setShowPaymentDetail(true);
  };

  // Close payment detail and refresh
  const handleClosePaymentDetail = () => {
    setShowPaymentDetail(false);
    setSelectedPayment(null);
    // Refresh payments to show any status updates
    if (activeTab === 'payments') {
      loadPaymentData(false);
    }
  };

  // Handle approve payment
  const handleApprovePayment = async (notes?: string) => {
    if (!selectedPayment) return;

    try {
      setProcessingPayment(true);
      const result = await approvePayment({
        paymentId: selectedPayment.id,
        adminNotes: notes,
      });

      if (result.success) {
        showCustomAlert('success', 'Approved!', result.message);
        setShowApproveSheet(false);
        handleClosePaymentDetail();
      } else {
        showCustomAlert('error', 'Failed', result.message);
      }
    } catch (error: any) {
      console.log('⚠️ Approval failed:', error);
      showCustomAlert('error', 'Error', error.message || 'Failed to approve payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle reject payment
  const handleRejectPayment = async (reason: string) => {
    if (!selectedPayment) return;

    try {
      setProcessingPayment(true);
      const result = await rejectPayment({
        paymentId: selectedPayment.id,
        rejectionReason: reason,
      });

      if (result.success) {
        showCustomAlert('info', 'Rejected', result.message);
        setShowRejectModal(false);
        handleClosePaymentDetail();
      } else {
        showCustomAlert('error', 'Failed', result.message);
      }
    } catch (error: any) {
      console.error('❌ Rejection failed:', error);
      showCustomAlert('error', 'Error', error.message || 'Failed to reject payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
      searchUsers(text);
    },
    [searchUsers]
  );

  const handleDeleteUser = useCallback((user: DashboardUser) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedUser?.user_id) return;

    setIsDeleting(true);
    const result = await removeUser(selectedUser.user_id);
    setIsDeleting(false);

    if (result.success) {
      setShowDeleteModal(false);
      setSelectedUser(null);
      Alert.alert('Success', 'User deleted successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to delete user');
    }
  }, [selectedUser, removeUser]);

  const handleLogout = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const confirmLogout = useCallback(async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/(tabs)' as any);
  }, [logout, router]);

  const renderStats = () => {
    if (statsLoading || !stats) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.statsContainer}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? colors.textDark : colors.text },
          ]}
        >
          Overview
        </Text>

        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon="people"
          color={colors.primary}
          isDarkMode={isDarkMode}
        />
        <StatsCard
          title="New Today"
          value={stats.newUsersToday}
          icon="person-add"
          color={colors.success}
          isDarkMode={isDarkMode}
        />
        <StatsCard
          title="This Week"
          value={stats.newUsersThisWeek}
          icon="calendar"
          color={colors.warning}
          isDarkMode={isDarkMode}
        />
        <StatsCard
          title="This Month"
          value={stats.newUsersThisMonth}
          icon="trending-up"
          color="#8B5CF6"
          isDarkMode={isDarkMode}
        />

        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? colors.textDark : colors.text },
            styles.sectionTitleSpaced,
          ]}
        >
          Demographics
        </Text>

        <View style={styles.demographicsGrid}>
          <View
            style={[
              styles.demographicCard,
              {
                backgroundColor: isDarkMode ? colors.cardDark : colors.card,
                borderColor: isDarkMode ? colors.borderDark : colors.border,
              },
            ]}
          >
            <Ionicons name="man" size={24} color="#3B82F6" />
            <Text
              style={[
                styles.demographicValue,
                { color: isDarkMode ? colors.textDark : colors.text },
              ]}
            >
              {stats.genderBreakdown.male}
            </Text>
            <Text
              style={[
                styles.demographicLabel,
                { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
              ]}
            >
              Male
            </Text>
          </View>

          <View
            style={[
              styles.demographicCard,
              {
                backgroundColor: isDarkMode ? colors.cardDark : colors.card,
                borderColor: isDarkMode ? colors.borderDark : colors.border,
              },
            ]}
          >
            <Ionicons name="woman" size={24} color="#EC4899" />
            <Text
              style={[
                styles.demographicValue,
                { color: isDarkMode ? colors.textDark : colors.text },
              ]}
            >
              {stats.genderBreakdown.female}
            </Text>
            <Text
              style={[
                styles.demographicLabel,
                { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
              ]}
            >
              Female
            </Text>
          </View>
        </View>

        {stats.averageAge && (
          <View
            style={[
              styles.averageAgeCard,
              {
                backgroundColor: isDarkMode ? colors.cardDark : colors.card,
                borderColor: isDarkMode ? colors.borderDark : colors.border,
              },
            ]}
          >
            <Ionicons
              name="analytics"
              size={24}
              color={colors.primary}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text
                style={[
                  styles.demographicLabel,
                  { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
                ]}
              >
                Average Age
              </Text>
              <Text
                style={[
                  styles.demographicValue,
                  { color: isDarkMode ? colors.textDark : colors.text },
                ]}
              >
                {stats.averageAge} years
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderUsers = () => {
    if (usersLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.usersContainer}>
        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDarkMode ? colors.cardDark : colors.card,
              borderColor: isDarkMode ? colors.borderDark : colors.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: isDarkMode ? colors.textDark : colors.text },
            ]}
            placeholder="Search by name, email, or phone..."
            placeholderTextColor={
              isDarkMode ? colors.textSecondaryDark : colors.textSecondary
            }
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* User Count */}
        <Text
          style={[
            styles.userCount,
            { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
          ]}
        >
          {users.length} user{users.length !== 1 ? 's' : ''} found
        </Text>

        {/* User List */}
        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="people-outline"
              size={64}
              color={isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
            />
            <Text
              style={[
                styles.emptyText,
                { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
              ]}
            >
              {searchQuery ? 'No users found' : 'No users yet'}
            </Text>
          </View>
        ) : (
          users.map((user) => (
            <UserListItem
              key={user.id}
              user={user}
              onPress={() => {
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('👤 User Clicked:', user.name);
                console.log('User Data:', JSON.stringify(user, null, 2));
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                setSelectedUser(user);
                setShowDetailsModal(true);
              }}
              onDelete={() => handleDeleteUser(user)}
              isDarkMode={isDarkMode}
            />
          ))
        )}
      </View>
    );
  };

  const renderPayments = () => {
    const paymentTabs: { key: typeof paymentActiveTab; label: string; count?: number }[] = [
      { key: 'pending', label: 'Pending', count: paymentStats?.pending_count },
      { key: 'all', label: 'All' },
      { key: 'approved', label: 'Approved', count: paymentStats?.approved_count },
      { key: 'rejected', label: 'Rejected', count: paymentStats?.rejected_count },
    ];

    return (
      <View style={styles.paymentsContainer}>
        {/* Animated Background Gradient */}
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.05)', 'rgba(236, 72, 153, 0.05)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.paymentsBackgroundGradient}
        />
        
        {/* Stats Card */}
        <PaymentStatsCard stats={paymentStats} loading={paymentsLoading} />

        {/* Search Bar */}
        <View
          style={[
            styles.paymentSearchContainer,
            {
              backgroundColor: isDarkMode ? colors.cardDark : colors.card,
              borderColor: isDarkMode ? colors.borderDark : colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
          />
          <TextInput
            style={[
              styles.paymentSearchInput,
              { color: isDarkMode ? colors.textDark : colors.text },
            ]}
            placeholder="Search by name, UTR, email, or phone..."
            placeholderTextColor={
              isDarkMode ? colors.textSecondaryDark : colors.textSecondary
            }
            value={paymentSearchQuery}
            onChangeText={setPaymentSearchQuery}
          />
          {paymentSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setPaymentSearchQuery('')}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color={isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.paymentTabsContainer}
          contentContainerStyle={styles.paymentTabsContent}
        >
          {paymentTabs.map((tab) => {
            const isActive = paymentActiveTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setPaymentActiveTab(tab.key)}
                style={[styles.paymentTab, isActive && styles.paymentTabActive]}
              >
                <Text style={[styles.paymentTabText, isActive && styles.paymentTabTextActive]}>
                  {tab.label}
                </Text>
                {tab.count !== undefined && tab.count > 0 && (
                  <View style={[styles.paymentBadge, isActive && styles.paymentBadgeActive]}>
                    <Text style={[styles.paymentBadgeText, isActive && styles.paymentBadgeTextActive]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Payment List */}
        <View style={styles.paymentListContainer}>
          {paymentsLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary }]}>
                Loading payments...
              </Text>
            </View>
          ) : filteredPayments.length === 0 ? (
            <View style={styles.centerContainer}>
              <MaterialCommunityIcons
                name="inbox-outline"
                size={64}
                color={isDarkMode ? colors.textSecondaryDark : '#d1d5db'}
              />
              <Text style={[styles.emptyTitle, { color: isDarkMode ? colors.textDark : colors.text }]}>
                No Payments Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary }]}>
                {paymentSearchQuery
                  ? 'Try adjusting your search query'
                  : `No ${paymentActiveTab === 'all' ? '' : paymentActiveTab} payments yet`}
              </Text>
            </View>
          ) : (
            filteredPayments.map((payment) => (
              <PaymentRequestCard
                key={payment.id}
                payment={payment}
                onPress={() => handlePaymentPress(payment)}
              />
            ))
          )}
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? colors.backgroundDark : colors.background },
      ]}
    >
      {/* Header with Gradient Accent */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
                <Text style={styles.headerSubtitle}>System Management</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.logoutButtonCircle}>
                  <Ionicons
                    name="log-out-outline"
                    size={22}
                    color={colors.danger}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Tabs with Modern Design */}
      <View
        style={[
          styles.tabs,
          {
            backgroundColor: isDarkMode ? colors.cardDark : colors.card,
            borderBottomColor: isDarkMode ? colors.borderDark : colors.borderLight,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'stats' && styles.tabActive,
            activeTab === 'stats' && { borderBottomColor: colors.primary },
          ]}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons
            name="stats-chart"
            size={20}
            color={activeTab === 'stats' ? colors.primary : isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'stats' && { color: colors.primary },
              activeTab !== 'stats' && { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
            ]}
          >
            Stats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'users' && styles.tabActive,
            activeTab === 'users' && { borderBottomColor: colors.primary },
          ]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'users' ? colors.primary : isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'users' && { color: colors.primary },
              activeTab !== 'users' && { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
            ]}
          >
            Users
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'payments' && styles.tabActive,
            activeTab === 'payments' && { borderBottomColor: colors.primary },
          ]}
          onPress={() => setActiveTab('payments')}
        >
          <Ionicons
            name="card-outline"
            size={20}
            color={activeTab === 'payments' ? colors.primary : isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'payments' && { color: colors.primary },
              activeTab !== 'payments' && { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
            ]}
          >
            Payments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'payments' && renderPayments()}
        
        {/* Footer */}
        <Footer showSocialLinks={false} showQuickLinks={true} />
      </ScrollView>

      {/* Delete Modal */}
      <DeleteUserModal
        visible={showDeleteModal}
        user={selectedUser}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        isDarkMode={isDarkMode}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        visible={showDetailsModal}
        user={selectedUser}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedUser(null);
        }}
        isDarkMode={isDarkMode}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        visible={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
        isDarkMode={isDarkMode}
      />

      {/* Payment Detail Modal */}
      <Modal
        visible={showPaymentDetail}
        animationType="fade"
        transparent={true}
        onRequestClose={handleClosePaymentDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalPopup, { backgroundColor: isDarkMode ? colors.backgroundDark : colors.background }]}>
            {selectedPayment && (
            <>
              {/* Header */}
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.paymentDetailHeader}
              >
                <TouchableOpacity onPress={handleClosePaymentDetail} style={styles.closeButton}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.paymentDetailHeaderContent}>
                  <Text style={styles.paymentDetailHeaderTitle}>Payment Details</Text>
                  <View
                    style={[
                      styles.paymentStatusBadge,
                      { backgroundColor: STATUS_COLORS[selectedPayment.status] },
                    ]}
                  >
                    <Text style={styles.paymentStatusText}>
                      {STATUS_LABELS[selectedPayment.status]}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              <ScrollView
                style={styles.paymentDetailContent}
                showsVerticalScrollIndicator={false}
              >
                {/* User Profile */}
                <UserProfilePreview
                  userName={selectedPayment.user_name}
                  userEmail={selectedPayment.user_email}
                  userPhone={selectedPayment.user_phone}
                  userId={selectedPayment.user_id}
                />

                {/* Transaction Details */}
                <View style={styles.paymentDetailCard}>
                  <Text style={styles.paymentDetailCardTitle}>Transaction Details</Text>

                  <View style={styles.paymentDetailRow}>
                    <MaterialCommunityIcons name="currency-inr" size={20} color={colors.primary} />
                    <Text style={styles.paymentDetailLabel}>Amount:</Text>
                    <Text style={styles.paymentDetailValue}>
                      {formatCurrency(selectedPayment.amount)}
                    </Text>
                  </View>

                  <View style={styles.paymentDetailRow}>
                    <MaterialCommunityIcons name="bank" size={20} color={colors.primary} />
                    <Text style={styles.paymentDetailLabel}>UTR Number:</Text>
                    <Text style={styles.paymentDetailValue}>{selectedPayment.utr_number}</Text>
                  </View>

                  <View style={styles.paymentDetailRow}>
                    <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
                    <Text style={styles.paymentDetailLabel}>Submitted:</Text>
                    <Text style={styles.paymentDetailValue}>
                      {formatDate(selectedPayment.submitted_at)}
                    </Text>
                  </View>

                  {selectedPayment.reviewed_at && (
                    <View style={styles.paymentDetailRow}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={styles.paymentDetailLabel}>Reviewed:</Text>
                      <Text style={styles.paymentDetailValue}>
                        {formatDate(selectedPayment.reviewed_at)}
                      </Text>
                    </View>
                  )}

                  {selectedPayment.reviewer_name && (
                    <View style={styles.paymentDetailRow}>
                      <MaterialCommunityIcons
                        name="account-check"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={styles.paymentDetailLabel}>Reviewer:</Text>
                      <Text style={styles.paymentDetailValue}>
                        {selectedPayment.reviewer_name}
                      </Text>
                    </View>
                  )}

                  {selectedPayment.admin_notes && (
                    <View style={styles.paymentNotesContainer}>
                      <Text style={styles.paymentNotesLabel}>Admin Notes:</Text>
                      <Text style={styles.paymentNotesText}>{selectedPayment.admin_notes}</Text>
                    </View>
                  )}
                </View>

                {/* Payment Screenshot */}
                <View style={styles.paymentDetailCard}>
                  <Text style={styles.paymentDetailCardTitle}>Payment Screenshot</Text>
                  <TouchableOpacity
                    onPress={() => setShowScreenshot(true)}
                    style={styles.paymentScreenshotContainer}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: selectedPayment.screenshot_url }}
                      style={styles.paymentScreenshot}
                      resizeMode="cover"
                    />
                    <View style={styles.paymentScreenshotOverlay}>
                      <MaterialCommunityIcons name="magnify-plus" size={32} color="#fff" />
                      <Text style={styles.paymentScreenshotText}>Tap to view full screen</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Action Buttons (only for pending) */}
              {selectedPayment.status === 'pending' && (
                <View style={styles.paymentActionsContainer}>
                  <TouchableOpacity
                    onPress={() => setShowRejectModal(true)}
                    disabled={processingPayment}
                    style={[
                      styles.paymentActionButton,
                      styles.paymentRejectButton,
                      processingPayment && styles.buttonDisabled,
                    ]}
                  >
                    <MaterialCommunityIcons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.paymentActionButtonText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowApproveSheet(true)}
                    disabled={processingPayment}
                    style={[
                      styles.paymentActionButton,
                      styles.paymentApproveButton,
                      processingPayment && styles.buttonDisabled,
                    ]}
                  >
                    <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                    <Text style={styles.paymentActionButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
          </View>
        </View>
      </Modal>

      {/* Screenshot Preview Modal */}
      {selectedPayment && (
        <ScreenshotPreviewModal
          visible={showScreenshot}
          imageUrl={selectedPayment.screenshot_url}
          onClose={() => setShowScreenshot(false)}
        />
      )}

      {/* Approval Action Sheet */}
      {selectedPayment && (
        <ApprovalActionSheet
          visible={showApproveSheet}
          onClose={() => setShowApproveSheet(false)}
          onConfirm={handleApprovePayment}
          loading={processingPayment}
          amount={selectedPayment.amount}
        />
      )}

      {/* Reject Reason Modal */}
      <RejectReasonModal
        visible={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleRejectPayment}
        loading={processingPayment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Modern Header Styles
  headerContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerGradient: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    fontWeight: '500',
  },
  logoutButton: {
    padding: 4,
  },
  logoutButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  paymentButton: {
    padding: 4,
  },
  paymentButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  sectionTitleSpaced: {
    marginTop: 24,
  },
  statsContainer: {},
  demographicsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  demographicCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  demographicValue: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 8,
  },
  demographicLabel: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  averageAgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  usersContainer: {},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10, // reduced height
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  userCount: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    color: '#9ca3af',
  },
  // Payment styles (matching usersContainer structure)
  paymentsContainer: {
    position: 'relative',
  },
  paymentsBackgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  paymentSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10, // reduced height to match users search
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 1,
  },
  paymentSearchInput: {
    flex: 1,
    fontSize: 15,
  },
  paymentTabsContainer: {
    marginBottom: 12,
  },
  paymentTabsContent: {
    gap: 8,
  },
  paymentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: 'transparent',
  },
  paymentTabActive: {
    // active state will be highlighted via text color only
  },
  paymentTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  paymentTabTextActive: {
    color: '#6b7280',
  },
  paymentBadge: {
    backgroundColor: 'transparent',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paymentBadgeActive: {
    backgroundColor: 'transparent',
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  paymentBadgeTextActive: {
    color: '#374151',
  },
  paymentListContainer: {
    flex: 1,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentDetailHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentDetailHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentDetailContent: {
    maxHeight: 500,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalPopup: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  paymentDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  paymentDetailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentDetailCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  paymentDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    width: 100,
  },
  paymentDetailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  paymentNotesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#667eea',
  },
  paymentNotesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  paymentNotesText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  paymentScreenshotContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 300,
    position: 'relative',
  },
  paymentScreenshot: {
    width: '100%',
    height: '100%',
  },
  paymentScreenshotOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentScreenshotText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  paymentActionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  paymentActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentRejectButton: {
    backgroundColor: '#EF4444',
  },
  paymentApproveButton: {
    backgroundColor: '#10B981',
  },
  paymentActionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
