/**
 * Demographics Modal Component
 * 
 * Full-screen modal displaying detailed demographics analysis.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DemographicsModalProps } from '../types/demographics.types';
import { AgeDistributionChart } from './AgeDistributionChart';
import { AgeGroupCard } from './AgeGroupCard';
import { GENDER_COLORS } from '../constants/demographicsConfig';
import { getThemedAdminColors } from '../constants/config';

export const DemographicsModal: React.FC<DemographicsModalProps> = ({
  visible,
  onClose,
  gender,
  data,
  isLoading,
  isDarkMode,
}) => {
  const colors = getThemedAdminColors(isDarkMode);
  const genderColors = GENDER_COLORS[gender];
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  
  const toggleGroup = (label: string) => {
    setExpandedGroup(expandedGroup === label ? null : label);
  };
  
  const renderHeader = () => (
    <LinearGradient
      colors={genderColors.gradient}
      style={styles.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <View style={styles.headerIcon}>
            <Ionicons 
              name={gender === 'male' ? 'man' : 'woman'} 
              size={32} 
              color="#fff" 
            />
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.headerTitle}>
          {gender === 'male' ? 'Male' : 'Female'} Demographics
        </Text>
        <Text style={styles.headerSubtitle}>
          {data ? `${data.totalCount} users` : 'Loading...'}
        </Text>
      </View>
    </LinearGradient>
  );
  
  const renderStats = () => {
    if (!data) return null;
    
    return (
      <View style={styles.statsContainer}>
        <View style={[
          styles.statCard,
          {
            backgroundColor: isDarkMode ? colors.cardDark : colors.card,
            borderColor: isDarkMode ? colors.borderDark : colors.border,
          }
        ]}>
          <Ionicons name="trending-up" size={24} color={genderColors.primary} />
          <Text style={[
            styles.statValue,
            { color: isDarkMode ? colors.textDark : colors.text }
          ]}>
            {data.ageStatistics.average ? `${data.ageStatistics.average}` : 'N/A'}
          </Text>
          <Text style={[
            styles.statLabel,
            { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary }
          ]}>
            Average Age
          </Text>
        </View>
        
        <View style={[
          styles.statCard,
          {
            backgroundColor: isDarkMode ? colors.cardDark : colors.card,
            borderColor: isDarkMode ? colors.borderDark : colors.border,
          }
        ]}>
          <Ionicons name="analytics" size={24} color={genderColors.primary} />
          <Text style={[
            styles.statValue,
            { color: isDarkMode ? colors.textDark : colors.text }
          ]}>
            {data.ageStatistics.median ? `${data.ageStatistics.median}` : 'N/A'}
          </Text>
          <Text style={[
            styles.statLabel,
            { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary }
          ]}>
            Median Age
          </Text>
        </View>
        
        <View style={[
          styles.statCard,
          {
            backgroundColor: isDarkMode ? colors.cardDark : colors.card,
            borderColor: isDarkMode ? colors.borderDark : colors.border,
          }
        ]}>
          <Ionicons name="people" size={24} color={genderColors.primary} />
          <Text style={[
            styles.statValue,
            { color: isDarkMode ? colors.textDark : colors.text }
          ]}>
            {data.mostCommonAgeGroup || 'N/A'}
          </Text>
          <Text style={[
            styles.statLabel,
            { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary }
          ]}>
            Most Common
          </Text>
        </View>
      </View>
    );
  };
  
  const renderInsights = () => {
    if (!data) return null;
    
    return (
      <View style={styles.insightsContainer}>
        <Text style={[
          styles.sectionTitle,
          { color: isDarkMode ? colors.textDark : colors.text }
        ]}>
          Key Insights
        </Text>
        
        <View style={[
          styles.insightCard,
          {
            backgroundColor: isDarkMode ? colors.cardDark : colors.card,
            borderColor: isDarkMode ? colors.borderDark : colors.border,
          }
        ]}>
          <View style={[styles.insightIcon, { backgroundColor: '#10B98115' }]}>
            <Ionicons name="trending-up" size={20} color="#10B981" />
          </View>
          <Text style={[
            styles.insightText,
            { color: isDarkMode ? colors.textDark : colors.text }
          ]}>
            {data.insights.growthTrend}
          </Text>
        </View>
        
        <View style={[
          styles.insightCard,
          {
            backgroundColor: isDarkMode ? colors.cardDark : colors.card,
            borderColor: isDarkMode ? colors.borderDark : colors.border,
          }
        ]}>
          <View style={[styles.insightIcon, { backgroundColor: genderColors.primary + '15' }]}>
            <Ionicons name="people" size={20} color={genderColors.primary} />
          </View>
          <Text style={[
            styles.insightText,
            { color: isDarkMode ? colors.textDark : colors.text }
          ]}>
            {data.insights.dominantAgeRange}
          </Text>
        </View>
        
        <View style={[
          styles.insightCard,
          {
            backgroundColor: isDarkMode ? colors.cardDark : colors.card,
            borderColor: isDarkMode ? colors.borderDark : colors.border,
          }
        ]}>
          <View style={[styles.insightIcon, { backgroundColor: '#F59E0B15' }]}>
            <Ionicons name="pie-chart" size={20} color="#F59E0B" />
          </View>
          <Text style={[
            styles.insightText,
            { color: isDarkMode ? colors.textDark : colors.text }
          ]}>
            {data.insights.ageSpecificationRate}% users provided age information
          </Text>
        </View>
      </View>
    );
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={genderColors.primary} />
          <Text style={[
            styles.loadingText,
            { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary }
          ]}>
            Loading demographics data...
          </Text>
        </View>
      );
    }
    
    if (!data) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.danger} />
          <Text style={[
            styles.errorText,
            { color: isDarkMode ? colors.textDark : colors.text }
          ]}>
            Failed to load demographics data
          </Text>
        </View>
      );
    }
    
    return (
      <ScrollView
        style={[
          styles.scrollView,
          { backgroundColor: isDarkMode ? colors.backgroundDark : colors.background }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Summary */}
        {renderStats()}
        
        {/* Insights */}
        {renderInsights()}
        
        {/* Charts */}
        <View style={styles.chartsContainer}>
          <Text style={[
            styles.sectionTitle,
            { color: isDarkMode ? colors.textDark : colors.text }
          ]}>
            Age Distribution Visualization
          </Text>
          <AgeDistributionChart
            data={data.ageDistribution}
            gender={gender}
            isDarkMode={isDarkMode}
          />
        </View>
        
        {/* Age Groups List */}
        <View style={styles.ageGroupsContainer}>
          <Text style={[
            styles.sectionTitle,
            { color: isDarkMode ? colors.textDark : colors.text }
          ]}>
            Detailed Age Breakdown
          </Text>
          {data.ageDistribution.map((group) => (
            <AgeGroupCard
              key={group.label}
              ageGroup={group}
              gender={gender}
              isDarkMode={isDarkMode}
              isExpanded={expandedGroup === group.label}
              onToggle={() => toggleGroup(group.label)}
            />
          ))}
        </View>
        
        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView 
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? colors.backgroundDark : colors.background }
        ]}
        edges={['top']}
      >
        {renderHeader()}
        {renderContent()}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 14,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  insightsContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  chartsContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  ageGroupsContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});
