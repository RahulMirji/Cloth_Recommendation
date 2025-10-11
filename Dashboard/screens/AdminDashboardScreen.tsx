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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdminAuthContext } from '../contexts/AdminAuthContext';
import { useUserManagement, useAdminStats } from '../hooks';
import { StatsCard, UserListItem, DeleteUserModal, UserDetailsModal, LogoutConfirmModal } from '../components';
import type { DashboardUser } from '../types';
import { ADMIN_CONFIG } from '../constants/config';
import { useApp } from '@/contexts/AppContext';
import { Footer } from '@/components/Footer';

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

  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'activity'>('stats');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    await Promise.all([refreshUsers(), refreshStats()]);
    setRefreshing(false);
  }, [refreshUsers, refreshStats]);

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

  const renderActivity = () => {
    return (
      <View style={styles.activityContainer}>
        <Text
          style={[
            styles.emptyText,
            { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
          ]}
        >
          Activity logs coming soon...
        </Text>
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
            activeTab === 'activity' && styles.tabActive,
            activeTab === 'activity' && { borderBottomColor: colors.primary },
          ]}
          onPress={() => setActiveTab('activity')}
        >
          <Ionicons
            name="time"
            size={20}
            color={activeTab === 'activity' ? colors.primary : isDarkMode ? colors.textSecondaryDark : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'activity' && { color: colors.primary },
              activeTab !== 'activity' && { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary },
            ]}
          >
            Activity
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
        {activeTab === 'activity' && renderActivity()}
        
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
    paddingVertical: 14,
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
  activityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});
