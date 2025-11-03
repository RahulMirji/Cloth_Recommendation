/**
 * Demographics Service
 * 
 * Service for fetching and processing demographic data.
 */

import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Gender, 
  DemographicsData, 
  AgeGroup, 
  AgeStatistics,
  DemographicsInsights 
} from '../types/demographics.types';
import { DashboardUser } from '../types';
import { AGE_GROUPS, RECENT_SIGNUPS_LIMIT } from '../constants/demographicsConfig';

const ADMIN_EMAIL_KEY = '@admin_email';

/**
 * Categorize age into age group
 */
const categorizeAge = (age: number | null): string => {
  if (age === null) return 'Not Specified';
  
  for (const group of AGE_GROUPS) {
    if (group.min === null && group.max === null) continue;
    if (age >= group.min! && age <= group.max!) {
      return group.label;
    }
  }
  
  return 'Not Specified';
};

/**
 * Calculate median from sorted array
 */
const calculateMedian = (sortedNumbers: number[]): number | null => {
  if (sortedNumbers.length === 0) return null;
  
  const mid = Math.floor(sortedNumbers.length / 2);
  
  if (sortedNumbers.length % 2 === 0) {
    return (sortedNumbers[mid - 1] + sortedNumbers[mid]) / 2;
  }
  
  return sortedNumbers[mid];
};

/**
 * Calculate age statistics
 */
export const calculateAgeStatistics = (users: DashboardUser[]): AgeStatistics => {
  const usersWithAge = users.filter(u => u.age !== null && u.age !== undefined);
  const ages = usersWithAge.map(u => u.age!).sort((a, b) => a - b);
  
  if (ages.length === 0) {
    return {
      average: null,
      median: null,
      min: null,
      max: null,
      totalWithAge: 0,
      totalWithoutAge: users.length,
    };
  }
  
  const sum = ages.reduce((acc, age) => acc + age, 0);
  const average = Math.round(sum / ages.length);
  const median = calculateMedian(ages);
  
  return {
    average,
    median: median ? Math.round(median) : null,
    min: ages[0],
    max: ages[ages.length - 1],
    totalWithAge: usersWithAge.length,
    totalWithoutAge: users.length - usersWithAge.length,
  };
};

/**
 * Calculate age distribution
 */
export const calculateAgeDistribution = (users: DashboardUser[]): AgeGroup[] => {
  const distribution: { [key: string]: DashboardUser[] } = {};
  
  // Initialize all age groups
  AGE_GROUPS.forEach(group => {
    distribution[group.label] = [];
  });
  
  // Categorize users
  users.forEach(user => {
    const category = categorizeAge(user.age);
    distribution[category].push(user);
  });
  
  // Convert to array with counts and percentages
  const totalUsers = users.length;
  
  return AGE_GROUPS.map(group => ({
    label: group.label,
    min: group.min,
    max: group.max,
    count: distribution[group.label].length,
    percentage: totalUsers > 0 
      ? Math.round((distribution[group.label].length / totalUsers) * 100) 
      : 0,
    users: distribution[group.label].sort((a, b) => {
      // Sort by age, then by name
      if (a.age === null) return 1;
      if (b.age === null) return -1;
      if (a.age !== b.age) return a.age - b.age;
      return a.name.localeCompare(b.name);
    }),
  })).filter(group => group.count > 0 || group.label === 'Not Specified');
};

/**
 * Generate insights from demographics data
 */
export const generateInsights = (
  users: DashboardUser[],
  ageDistribution: AgeGroup[],
  ageStatistics: AgeStatistics
): DemographicsInsights => {
  // Find largest and smallest age groups (excluding 'Not Specified')
  const ageGroupsWithData = ageDistribution.filter(
    g => g.label !== 'Not Specified' && g.count > 0
  );
  
  const sortedByCount = [...ageGroupsWithData].sort((a, b) => b.count - a.count);
  
  const largestAgeGroup = sortedByCount[0]?.label || null;
  const largestAgeGroupCount = sortedByCount[0]?.count || 0;
  const smallestAgeGroup = sortedByCount[sortedByCount.length - 1]?.label || null;
  
  // Calculate age specification rate
  const ageSpecificationRate = users.length > 0
    ? Math.round((ageStatistics.totalWithAge / users.length) * 100)
    : 0;
  
  // Determine dominant age range
  let dominantAgeRange = 'Mixed age distribution';
  if (largestAgeGroup && largestAgeGroupCount > users.length * 0.5) {
    dominantAgeRange = `Primarily ${largestAgeGroup}`;
  } else if (largestAgeGroup) {
    dominantAgeRange = `Largest group: ${largestAgeGroup}`;
  }
  
  // Growth trend (simplified - could be enhanced with historical data)
  const recentUsers = users.filter(u => {
    if (!u.created_at) return false;
    const createdDate = new Date(u.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate >= thirtyDaysAgo;
  });
  
  const growthPercentage = users.length > 0
    ? Math.round((recentUsers.length / users.length) * 100)
    : 0;
  
  const growthTrend = growthPercentage > 50
    ? `${growthPercentage}% joined in last 30 days - High growth`
    : growthPercentage > 20
    ? `${growthPercentage}% joined in last 30 days - Moderate growth`
    : `${growthPercentage}% joined in last 30 days - Stable`;
  
  return {
    largestAgeGroup,
    largestAgeGroupCount,
    smallestAgeGroup,
    growthTrend,
    ageSpecificationRate,
    dominantAgeRange,
  };
};

/**
 * Fetch demographics data for a specific gender
 */
export const getDemographicsData = async (
  gender: Gender
): Promise<DemographicsData> => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 FETCHING DEMOGRAPHICS DATA');
    console.log('Gender:', gender);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Get admin email from AsyncStorage
    const adminEmail = await AsyncStorage.getItem(ADMIN_EMAIL_KEY);
    
    if (!adminEmail) {
      throw new Error('Admin email not found in session');
    }
    
    // Fetch users via Edge Function
    const { data, error } = await supabase.functions.invoke('admin-get-users', {
      body: {
        searchQuery: '',
        gender: gender.toLowerCase(),
        sortField: 'created_at',
        sortOrder: 'desc',
      },
      headers: {
        'x-admin-email': adminEmail,
      },
    });
    
    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }
    
    if (data.error) {
      console.error('Edge function returned error:', data.error);
      throw new Error(data.error);
    }
    
    const users: DashboardUser[] = data.users || [];
    
    console.log('✅ Fetched users:', users.length);
    
    // Calculate statistics
    const ageStatistics = calculateAgeStatistics(users);
    const ageDistribution = calculateAgeDistribution(users);
    const insights = generateInsights(users, ageDistribution, ageStatistics);
    
    // Get most common age group
    const sortedDistribution = [...ageDistribution]
      .filter(g => g.label !== 'Not Specified')
      .sort((a, b) => b.count - a.count);
    const mostCommonAgeGroup = sortedDistribution[0]?.label || null;
    
    // Get recent signups
    const recentSignups = users
      .slice(0, RECENT_SIGNUPS_LIMIT)
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    
    const result: DemographicsData = {
      gender,
      totalCount: users.length,
      ageStatistics,
      ageDistribution,
      mostCommonAgeGroup,
      recentSignups,
      insights,
    };
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DEMOGRAPHICS SUMMARY');
    console.log('Total users:', result.totalCount);
    console.log('Average age:', result.ageStatistics.average);
    console.log('Most common:', result.mostCommonAgeGroup);
    console.log('Age groups:', result.ageDistribution.length);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return result;
  } catch (error) {
    console.error('❌ Error fetching demographics:', error);
    throw error;
  }
};
