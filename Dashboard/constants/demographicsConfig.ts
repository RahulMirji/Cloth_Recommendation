/**
 * Demographics Configuration
 * 
 * Constants and configuration for demographics feature.
 */

import { Gender } from '../types/demographics.types';

/**
 * Age group ranges for categorizing users
 */
export const AGE_GROUPS = [
  { label: 'Under 18', min: 0, max: 17 },
  { label: '18-24', min: 18, max: 24 },
  { label: '25-34', min: 25, max: 34 },
  { label: '35-44', min: 35, max: 44 },
  { label: '45-54', min: 45, max: 54 },
  { label: '55+', min: 55, max: 999 },
  { label: 'Not Specified', min: null, max: null },
] as const;

/**
 * Color schemes for different genders
 */
export const GENDER_COLORS: Record<Gender, {
  primary: string;
  secondary: string;
  gradient: [string, string];
  light: string;
  dark: string;
  chart: string;
}> = {
  male: {
    primary: '#3B82F6',
    secondary: '#60A5FA',
    gradient: ['#3B82F6', '#60A5FA'],
    light: '#DBEAFE',
    dark: '#1E40AF',
    chart: '#3B82F6',
  },
  female: {
    primary: '#EC4899',
    secondary: '#F472B6',
    gradient: ['#EC4899', '#F472B6'],
    light: '#FCE7F3',
    dark: '#BE185D',
    chart: '#EC4899',
  },
};

/**
 * Chart configuration
 */
export const CHART_CONFIG = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
  strokeWidth: 2,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
  propsForLabels: {
    fontSize: 11,
    fontFamily: 'System',
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    strokeWidth: 1,
    stroke: 'rgba(0,0,0,0.05)',
  },
};

/**
 * Chart configuration for dark mode
 */
export const CHART_CONFIG_DARK = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: '#1f2937',
  backgroundGradientTo: '#1f2937',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.6})`,
  strokeWidth: 2,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
  propsForLabels: {
    fontSize: 11,
    fontFamily: 'System',
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    strokeWidth: 1,
    stroke: 'rgba(255,255,255,0.05)',
  },
};

/**
 * Animation duration in milliseconds
 */
export const ANIMATION_DURATION = 300;

/**
 * Number of recent signups to show
 */
export const RECENT_SIGNUPS_LIMIT = 5;

/**
 * Chart dimensions
 */
export const CHART_DIMENSIONS = {
  width: 340, // Will be adjusted based on screen width
  height: 220,
  paddingLeft: 15,
};
