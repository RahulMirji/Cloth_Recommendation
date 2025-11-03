/**
 * Age Distribution Chart Component
 * 
 * Displays bar and pie charts for age distribution visualization.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { AgeDistributionChartProps } from '../types/demographics.types';
import { 
  GENDER_COLORS, 
  CHART_CONFIG, 
  CHART_CONFIG_DARK 
} from '../constants/demographicsConfig';

const screenWidth = Dimensions.get('window').width;

export const AgeDistributionChart: React.FC<AgeDistributionChartProps> = ({
  data,
  gender,
  isDarkMode,
}) => {
  const colors = GENDER_COLORS[gender];
  
  // Filter out 'Not Specified' for charts
  const chartData = data.filter(g => g.label !== 'Not Specified' && g.count > 0);
  
  if (chartData.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={[
          styles.emptyText,
          { color: isDarkMode ? '#9ca3af' : '#6b7280' }
        ]}>
          No age data available for visualization
        </Text>
      </View>
    );
  }
  
  // Prepare bar chart data
  const barChartData = {
    labels: chartData.map(g => g.label),
    datasets: [{
      data: chartData.map(g => g.count),
      colors: chartData.map(() => (opacity = 1) => colors.primary),
    }],
  };
  
  // Prepare pie chart data with colors
  const pieColors = [
    colors.primary,
    colors.secondary,
    '#8B5CF6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
  ];
  
  const pieChartData = chartData.map((group, index) => ({
    name: group.label,
    population: group.count,
    color: pieColors[index % pieColors.length],
    legendFontColor: isDarkMode ? '#d1d5db' : '#6b7280',
    legendFontSize: 12,
  }));
  
  const baseChartConfig = isDarkMode ? CHART_CONFIG_DARK : CHART_CONFIG;
  
  const chartConfig = {
    ...baseChartConfig,
    color: (opacity = 1) => colors.primary + Math.round(opacity * 255).toString(16).padStart(2, '0'),
    strokeWidth: 2,
  };
  
  return (
    <View style={styles.container}>
      {/* Bar Chart Section */}
      <View style={styles.chartSection}>
        <Text style={[
          styles.chartTitle,
          { color: isDarkMode ? '#f3f4f6' : '#1f2937' }
        ]}>
          Age Distribution (Bar Chart)
        </Text>
        <View style={styles.chartWrapper}>
          <BarChart
            data={barChartData}
            width={screenWidth - 60}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
            segments={4}
            withInnerLines
            withCustomBarColorFromData
            flatColor
          />
        </View>
      </View>
      
      {/* Pie Chart Section */}
      <View style={styles.chartSection}>
        <Text style={[
          styles.chartTitle,
          { color: isDarkMode ? '#f3f4f6' : '#1f2937' }
        ]}>
          Age Distribution (Pie Chart)
        </Text>
        <View style={styles.chartWrapper}>
          <PieChart
            data={pieChartData}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            hasLegend={true}
            center={[10, 10]}
            absolute={false}
          />
        </View>
      </View>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={[
          styles.legendTitle,
          { color: isDarkMode ? '#d1d5db' : '#6b7280' }
        ]}>
          Total Users: {data.reduce((sum, g) => sum + g.count, 0)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  chartSection: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  chartWrapper: {
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  legendContainer: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
