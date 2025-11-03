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
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAdminAuthContext } from '../contexts/AdminAuthContext';
import { useUserManagement, useAdminStats } from '../hooks';
import { StatsCard, UserListItem, DeleteUserModal, UserDetailsModal, LogoutConfirmModal, DemographicsModal } from '../components';
import { PaymentStatsCard } from '../components/PaymentStatsCard';
import { ModelManagementCard } from '../components/ModelManagementCard';
import type { DashboardUser } from '../types';
import { PaymentSubmission, PaymentStats, STATUS_COLORS, STATUS_LABELS } from '../types/payment.types';
import { getPaymentSubmissions, getPaymentStats, searchPayments, approvePayment, rejectPayment, deletePayment, formatCurrency, formatDate } from '../services/paymentAdminService';
import { getDemographicsData } from '../services/demographicsService';
import { Gender, DemographicsData } from '../types/demographics.types';
import { getThemedAdminColors } from '../constants/config';
import { Footer } from '@/components/Footer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { showCustomAlert } from '@/utils/customAlert';
import { useApp } from '@/contexts/AppContext';

// Local lightweight components (kept inside screen to avoid missing external imports)
const PaymentRequestCard: React.FC<{ payment: any; onPress: () => void }> = ({ payment, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.paymentCard} activeOpacity={0.9}>
      {/* Liquid Prism Glass Effect */}
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.08)', 'rgba(236, 72, 153, 0.04)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Prism orbs */}
      <View style={styles.prismOrb1} />
      <View style={styles.prismOrb2} />
      
      <View style={styles.paymentCardLeft}>
        <View style={styles.thumbnailWrapper}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.2)', 'rgba(236, 72, 153, 0.2)']}
            style={styles.thumbnailGradient}
          />
          <Image source={{ uri: payment.screenshot_url }} style={styles.paymentThumb} />
        </View>
      </View>
      <View style={styles.paymentCardBody}>
        <Text style={styles.paymentCardName}>{payment.user_name}</Text>
        <View style={styles.paymentCardMeta}> 
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.amountGradient}
          >
            <Text style={styles.paymentAmount}>₹ {payment.amount}</Text>
          </LinearGradient>
          <Text style={styles.paymentUTR}> · UTR: {String(payment.utr_number).slice(0, 6)}...</Text>
        </View>
        <Text style={styles.paymentCardSub}>{new Date(payment.submitted_at).toLocaleString()}</Text>
      </View>
      <View style={styles.paymentCardRight}>
        <View style={styles.chevronWrapper}>
          <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const UserProfilePreview: React.FC<{ userName?: string; userEmail?: string; userPhone?: string; userId?: string }> = ({ userName, userEmail, userPhone, userId }) => (
  <View style={styles.userPreviewCard}>
    <View style={styles.userAvatar}>
      <Ionicons name="person" size={28} color="#fff" />
    </View>
    <View style={{ marginLeft: 12 }}>
      <Text style={styles.userPreviewName}>{userName}</Text>
      <Text style={styles.userPreviewInfo}>{userEmail}</Text>
      <Text style={styles.userPreviewInfo}>{userPhone}</Text>
    </View>
  </View>
);

const ScreenshotPreviewModal: React.FC<{ visible: boolean; imageUrl: string; onClose: () => void }> = ({ visible, imageUrl, onClose }) => (
  <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
    <View style={styles.screenshotOverlayFull}>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark">
        <TouchableOpacity style={styles.screenshotCloseArea} onPress={onClose} activeOpacity={1} />
      </BlurView>
      
      {/* Close Button - Positioned at top right */}
      <TouchableOpacity 
        style={styles.screenshotCloseButton} 
        onPress={onClose}
        activeOpacity={0.8}
      >
        <View style={styles.screenshotCloseButtonCircle}>
          <Ionicons name="close" size={28} color="#1f2937" />
        </View>
      </TouchableOpacity>
      
      <Image source={{ uri: imageUrl }} style={styles.screenshotFull} resizeMode="contain" />
    </View>
  </Modal>
);

const ApprovalActionSheet: React.FC<{ visible: boolean; onClose: () => void; onConfirm: (notes?: string) => void; loading?: boolean; amount?: number }> = ({ visible, onClose, onConfirm, loading }) => {
  const [notes, setNotes] = React.useState('');
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Confirm Approval</Text>
          <TextInput placeholder="Admin notes (optional)" value={notes} onChangeText={setNotes} style={styles.sheetInput} />
          <View style={styles.sheetButtons}>
            <TouchableOpacity onPress={onClose} style={[styles.sheetBtn, styles.sheetCancel]}>
              <Text style={[styles.sheetBtnText, styles.sheetBtnTextCancel]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onConfirm(notes)} style={[styles.sheetBtn, styles.sheetConfirm]} disabled={loading}>
              <Text style={[styles.sheetBtnText, styles.sheetBtnTextConfirm]}>{loading ? 'Processing...' : 'Approve'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const RejectReasonModal: React.FC<{ visible: boolean; onClose: () => void; onConfirm: (reason: string) => void; loading?: boolean }> = ({ visible, onClose, onConfirm, loading }) => {
  const [reason, setReason] = React.useState('');
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Reject Payment</Text>
          <TextInput placeholder="Rejection reason" value={reason} onChangeText={setReason} style={styles.sheetInput} />
          <View style={styles.sheetButtons}>
            <TouchableOpacity onPress={onClose} style={[styles.sheetBtn, styles.sheetCancel]}>
              <Text style={[styles.sheetBtnText, styles.sheetBtnTextCancel]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onConfirm(reason)} style={[styles.sheetBtn, styles.sheetConfirm]} disabled={loading || !reason.trim()}>
              <Text style={[styles.sheetBtnText, styles.sheetBtnTextConfirm]}>{loading ? 'Processing...' : 'Reject'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAdminAuthContext();
  const { settings } = useApp();
  const isDarkMode = settings.isDarkMode;
  
  console.log('Dashboard auth state:', { isAuthenticated });
  
  const {
    users,
    isLoading: usersLoading,
    refreshUsers,
    removeUser,
    searchUsers,
  } = useUserManagement();
  const { stats, isLoading: statsLoading, refresh: refreshStats } = useAdminStats();

  // Get themed colors based on user's app theme
  const colors = getThemedAdminColors(isDarkMode);

  const [activeTab, setActiveTab] = useState<'stats' | 'payments' | 'model'>('stats');
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
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Demographics state
  const [showDemographicsModal, setShowDemographicsModal] = useState(false);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [demographicsData, setDemographicsData] = useState<DemographicsData | null>(null);
  const [demographicsLoading, setDemographicsLoading] = useState(false);

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

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔄 LOADING PAYMENT DATA');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const [statsData, paymentsData] = await Promise.all([
        getPaymentStats(),
        getPaymentSubmissions(null),
      ]);

      console.log('✅ Loaded payments:', paymentsData.length);
      console.log('Payment IDs:', paymentsData.map(p => p.id));

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

  // Handle delete payment
  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️ DELETING PAYMENT');
    console.log('Payment ID:', selectedPayment.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      setProcessingPayment(true);
      const result = await deletePayment(selectedPayment.id);

      console.log('Delete result:', result);

      if (result.success) {
        // Close modals first
        setShowDeletePaymentModal(false);
        setShowPaymentDetail(false);
        setSelectedPayment(null);
        
        console.log('✅ Payment deleted, reloading data...');
        
        // Show success message
        showCustomAlert('success', 'Deleted', result.message);
        
        // Reload payment data to update UI
        await loadPaymentData(false);
        
        console.log('✅ Data reloaded after delete');
      } else {
        console.log('❌ Delete failed:', result.message);
        showCustomAlert('error', 'Failed', result.message);
      }
    } catch (error: any) {
      console.error('❌ Delete failed:', error);
      showCustomAlert('error', 'Error', error.message || 'Failed to delete payment');
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
      showCustomAlert('success', 'Success', 'User deleted successfully');
    } else {
      showCustomAlert('error', 'Error', result.error || 'Failed to delete user');
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

  // Handle demographics card click
  const handleDemographicsPress = useCallback(async (gender: Gender) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DEMOGRAPHICS CARD CLICKED');
    console.log('Gender:', gender);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    setSelectedGender(gender);
    setShowDemographicsModal(true);
    setDemographicsLoading(true);
    
    try {
      const data = await getDemographicsData(gender);
      setDemographicsData(data);
      console.log('✅ Demographics data loaded successfully');
    } catch (error: any) {
      console.error('❌ Failed to load demographics:', error);
      showCustomAlert('error', 'Error', error.message || 'Failed to load demographics data');
      setShowDemographicsModal(false);
    } finally {
      setDemographicsLoading(false);
    }
  }, []);

  const closeDemographicsModal = useCallback(() => {
    setShowDemographicsModal(false);
    setSelectedGender(null);
    setDemographicsData(null);
  }, []);

  const renderModel = () => {
    return (
      <View style={styles.statsContainer}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? colors.textDark : colors.text },
          ]}
        >
          AI Model Management
        </Text>
        <ModelManagementCard />
      </View>
    );
  };

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

        {/* Demographics Section Header */}
        <View style={styles.demographicsSectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <LinearGradient
              colors={isDarkMode 
                ? ['#8B5CF6', '#A855F7']
                : ['#667eea', '#764ba2']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sectionTitleAccent}
            />
            <Text
              style={[
                styles.sectionTitle,
                { color: isDarkMode ? colors.textDark : colors.text },
              ]}
            >
              Demographics
            </Text>
          </View>
          <Text
            style={[
              styles.sectionSubtitle,
              { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
            ]}
          >
            Tap a card to view detailed insights
          </Text>
        </View>

        <View style={styles.demographicsGrid}>
          {/* Male Demographics Card */}
          <TouchableOpacity
            style={[
              styles.demographicCard,
              {
                backgroundColor: isDarkMode ? colors.cardDark : colors.card,
                borderColor: isDarkMode ? colors.borderDark : colors.border,
              },
            ]}
            onPress={() => handleDemographicsPress('male')}
            activeOpacity={0.8}
          >
            {/* Gradient Background */}
            <LinearGradient
              colors={isDarkMode 
                ? ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']
                : ['rgba(59, 130, 246, 0.08)', 'rgba(96, 165, 250, 0.04)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.demographicGradient}
            />
            
            {/* Icon with gradient background */}
            <View style={[styles.demographicIconContainer, { backgroundColor: '#3B82F615' }]}>
              <LinearGradient
                colors={['#3B82F6', '#60A5FA']}
                style={styles.demographicIconGradient}
              >
                <Ionicons name="man" size={28} color="#fff" />
              </LinearGradient>
            </View>
            
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
              Male Users
            </Text>
            
            {/* Tap to view indicator */}
            <View style={styles.demographicFooter}>
              <Text style={[styles.tapToView, { color: '#3B82F6' }]}>
                Tap to view details
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#3B82F6" />
            </View>
          </TouchableOpacity>

          {/* Female Demographics Card */}
          <TouchableOpacity
            style={[
              styles.demographicCard,
              {
                backgroundColor: isDarkMode ? colors.cardDark : colors.card,
                borderColor: isDarkMode ? colors.borderDark : colors.border,
              },
            ]}
            onPress={() => handleDemographicsPress('female')}
            activeOpacity={0.8}
          >
            {/* Gradient Background */}
            <LinearGradient
              colors={isDarkMode 
                ? ['rgba(236, 72, 153, 0.1)', 'rgba(236, 72, 153, 0.05)']
                : ['rgba(236, 72, 153, 0.08)', 'rgba(244, 114, 182, 0.04)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.demographicGradient}
            />
            
            {/* Icon with gradient background */}
            <View style={[styles.demographicIconContainer, { backgroundColor: '#EC489915' }]}>
              <LinearGradient
                colors={['#EC4899', '#F472B6']}
                style={styles.demographicIconGradient}
              >
                <Ionicons name="woman" size={28} color="#fff" />
              </LinearGradient>
            </View>
            
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
              Female Users
            </Text>
            
            {/* Tap to view indicator */}
            <View style={styles.demographicFooter}>
              <Text style={[styles.tapToView, { color: '#EC4899' }]}>
                Tap to view details
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#EC4899" />
            </View>
          </TouchableOpacity>
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
            {/* Gradient Background */}
            <LinearGradient
              colors={isDarkMode 
                ? ['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']
                : ['rgba(139, 92, 246, 0.08)', 'rgba(168, 85, 247, 0.04)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.averageAgeGradient}
            />
            
            {/* Icon */}
            <View style={styles.averageAgeIconContainer}>
              <LinearGradient
                colors={['#8B5CF6', '#A855F7']}
                style={styles.averageAgeIconGradient}
              >
                <Ionicons name="analytics" size={28} color="#fff" />
              </LinearGradient>
            </View>
            
            <View style={styles.averageAgeContent}>
              <Text
                style={[
                  styles.averageAgeLabel,
                  { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
                ]}
              >
                Average Age
              </Text>
              <Text
                style={[
                  styles.averageAgeValue,
                  { color: isDarkMode ? colors.textDark : colors.text },
                ]}
              >
                {stats.averageAge} <Text style={styles.averageAgeUnit}>years</Text>
              </Text>
            </View>
            
            {/* Badge */}
            <View style={styles.averageAgeBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            </View>
          </View>
        )}

        {/* User Management Section */}
        <View style={{ marginTop: 32 }}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? colors.textDark : colors.text },
            ]}
          >
            User Management
          </Text>
          {renderUsers()}
        </View>
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

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'model' && styles.tabActive,
            activeTab === 'model' && { borderBottomColor: colors.primary },
          ]}
          onPress={() => setActiveTab('model')}
        >
          <Ionicons
            name="sparkles"
            size={20}
            color={activeTab === 'model' ? colors.primary : isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'model' && { color: colors.primary },
              activeTab !== 'model' && { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
            ]}
          >
            AI Model
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
        {activeTab === 'payments' && renderPayments()}
        {activeTab === 'model' && renderModel()}
        
        {/* Footer with adjusted margins */}
        <View style={styles.footerWrapper}>
          <Footer showSocialLinks={false} showQuickLinks={true} />
        </View>
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

      {/* Demographics Modal */}
      {selectedGender && (
        <DemographicsModal
          visible={showDemographicsModal}
          onClose={closeDemographicsModal}
          gender={selectedGender}
          data={demographicsData}
          isLoading={demographicsLoading}
          isDarkMode={isDarkMode}
        />
      )}

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
                      { backgroundColor: selectedPayment.status ? STATUS_COLORS[selectedPayment.status] : STATUS_COLORS.pending },
                    ]}
                  >
                    <Text style={styles.paymentStatusText}>
                      {selectedPayment.status ? STATUS_LABELS[selectedPayment.status] : STATUS_LABELS.pending}
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
                      {formatCurrency(selectedPayment.amount || 0)}
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
                        name="clock-check"
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
                      source={{ uri: selectedPayment.screenshot_url || '' }}
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

              {/* Delete Button (only for approved/rejected) */}
              {(selectedPayment.status === 'approved' || selectedPayment.status === 'rejected') && (
                <View style={styles.paymentActionsContainer}>
                  <TouchableOpacity
                    onPress={() => setShowDeletePaymentModal(true)}
                    disabled={processingPayment}
                    style={[
                      styles.paymentActionButton,
                      styles.paymentDeleteButton,
                      processingPayment && styles.buttonDisabled,
                    ]}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color="#fff" />
                    <Text style={styles.paymentActionButtonText}>Delete Payment</Text>
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
          imageUrl={selectedPayment.screenshot_url || ''}
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

      {/* Delete Payment Confirmation Modal */}
      <Modal
        visible={showDeletePaymentModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeletePaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalPopup, { backgroundColor: isDarkMode ? colors.backgroundDark : colors.background, width: '85%', maxWidth: 400 }]}>
            <View style={styles.deleteModalHeader}>
              <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
              <Text style={[styles.deleteModalTitle, { color: isDarkMode ? '#f9fafb' : '#111827' }]}>
                Delete Payment?
              </Text>
              <Text style={[styles.deleteModalMessage, { color: isDarkMode ? '#d1d5db' : '#6b7280' }]}>
                This will permanently delete the payment record and revert the user's subscription status. 
                {selectedPayment?.status === 'approved' && ' The user will lose their premium credits and be shown as "Out of Credits".'}
              </Text>
            </View>

            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                onPress={() => setShowDeletePaymentModal(false)}
                disabled={processingPayment}
                style={[styles.deleteModalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeletePayment}
                disabled={processingPayment}
                style={[styles.deleteModalButton, styles.deleteButton]}
              >
                {processingPayment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  footerWrapper: {
    marginHorizontal: -16,
    marginTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionTitleSpaced: {
    marginTop: 24,
  },
  demographicsSectionHeader: {
    marginTop: 32,
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleAccent: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 16,
    opacity: 0.8,
  },
  statsContainer: {},
  demographicsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  demographicCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 180,
  },
  demographicGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  demographicIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  demographicIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demographicValue: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  demographicLabel: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  demographicFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  tapToView: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  demographicChevron: {
    marginTop: 8,
    opacity: 0.5,
  },
  averageAgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  averageAgeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  averageAgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#8B5CF615',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  averageAgeIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  averageAgeContent: {
    flex: 1,
  },
  averageAgeLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  averageAgeValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  averageAgeUnit: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.6,
  },
  averageAgeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B98115',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginHorizontal: -16, // Negative margin to counteract contentContainer padding
  },
  paymentsBackgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  paymentSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    marginHorizontal: 16, // Add horizontal margin for search bar
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
    marginBottom: 16,
    marginHorizontal: 16, // Add horizontal margin for tabs
  },
  paymentTabsContent: {
    gap: 8,
    paddingHorizontal: 2,
  },
  paymentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentTabActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  paymentTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  paymentTabTextActive: {
    color: '#7C3AED',
  },
  paymentBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  paymentBadgeActive: {
    backgroundColor: '#8B5CF6',
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  paymentBadgeTextActive: {
    color: '#fff',
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
  paymentDeleteButton: {
    backgroundColor: '#DC2626',
  },
  paymentActionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Delete Payment Modal Styles
  deleteModalHeader: {
    alignItems: 'center',
    padding: 24,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
  },
  deleteModalMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 0,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Payment Request Card Styles - Beautiful Glass Container
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    marginHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.15)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  prismOrb1: {
    position: 'absolute',
    top: -20,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  prismOrb2: {
    position: 'absolute',
    bottom: -15,
    left: 60,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(236, 72, 153, 0.06)',
  },
  paymentCardLeft: {
    marginRight: 14,
  },
  thumbnailWrapper: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  thumbnailGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  paymentThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
  },
  paymentUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  paymentUserAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCardBody: {
    flex: 1,
  },
  paymentCardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  paymentCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  amountGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  paymentUTR: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  paymentCardSub: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  paymentCardRight: {
    marginLeft: 8,
  },
  chevronWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // User Preview Card Styles
  userPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  userPreviewName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  userPreviewInfo: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  // Screenshot Modal Styles
  screenshotOverlayFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenshotCloseArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  screenshotCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  screenshotCloseButtonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  screenshotFull: {
    width: '90%',
    height: '80%',
    zIndex: 1,
  },
  // Action Sheet Styles
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  sheetInput: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
    marginBottom: 20,
    backgroundColor: '#f9fafb',
  },
  sheetButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sheetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancel: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
  },
  sheetConfirm: {
    backgroundColor: '#8B5CF6',
  },
  sheetBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sheetBtnTextConfirm: {
    color: '#fff',
  },
  sheetBtnTextCancel: {
    color: '#1f2937',
  },
});
