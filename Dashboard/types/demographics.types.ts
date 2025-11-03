/**
 * Demographics Types
 * 
 * Type definitions for demographics feature in admin dashboard.
 */

import { DashboardUser } from './index';

export type Gender = 'male' | 'female';

// Alias for testing purposes
export type DemographicUser = DashboardUser;

export interface AgeGroup {
  label: string;
  min: number | null;
  max: number | null;
  count: number;
  percentage: number;
  users: DashboardUser[];
}

export interface AgeStatistics {
  average: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  totalWithAge: number;
  totalWithoutAge: number;
}

export interface DemographicsData {
  gender: Gender;
  totalCount: number;
  ageStatistics: AgeStatistics;
  ageDistribution: AgeGroup[];
  mostCommonAgeGroup: string | null;
  recentSignups: DashboardUser[];
  insights: DemographicsInsights;
}

export interface DemographicsInsights {
  largestAgeGroup: string | null;
  largestAgeGroupCount: number;
  smallestAgeGroup: string | null;
  growthTrend: string;
  ageSpecificationRate: number; // Percentage of users who provided age
  dominantAgeRange: string;
}

export interface DemographicsModalProps {
  visible: boolean;
  onClose: () => void;
  gender: Gender;
  data: DemographicsData | null;
  isLoading: boolean;
  isDarkMode: boolean;
}

export interface AgeDistributionChartProps {
  data: AgeGroup[];
  gender: Gender;
  isDarkMode: boolean;
}

export interface AgeGroupCardProps {
  ageGroup: AgeGroup;
  gender: Gender;
  isDarkMode: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export interface UserMiniCardProps {
  user: DashboardUser;
  isDarkMode: boolean;
}

export interface DemographicsInsightsProps {
  insights: DemographicsInsights;
  gender: Gender;
  isDarkMode: boolean;
}
