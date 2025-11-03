import React from 'react';
import { render } from '@testing-library/react-native';
import { AgeDistributionChart } from '../../components/AgeDistributionChart';
import { AgeGroup } from '../../types/demographics.types';
import { DashboardUser } from '../../types';

// Mock react-native-chart-kit
jest.mock('react-native-chart-kit', () => ({
  BarChart: 'BarChart',
  PieChart: 'PieChart',
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Path: 'Path',
  G: 'G',
  Text: 'Text',
  Circle: 'Circle',
}));

describe('AgeDistributionChart', () => {
  const mockUsers: DashboardUser[] = [
    {
      id: '1',
      user_id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: null,
      age: 25,
      gender: 'male',
      bio: null,
      profile_image: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockAgeGroups: AgeGroup[] = [
    {
      label: '18-24',
      min: 18,
      max: 24,
      count: 2,
      percentage: 25,
      users: mockUsers,
    },
    {
      label: '25-34',
      min: 25,
      max: 34,
      count: 4,
      percentage: 50,
      users: mockUsers,
    },
    {
      label: '35-44',
      min: 35,
      max: 44,
      count: 2,
      percentage: 25,
      users: mockUsers,
    },
  ];

  it('should render bar chart title', () => {
    const { getByText } = render(
      <AgeDistributionChart data={mockAgeGroups} gender="male" isDarkMode={false} />
    );

    expect(getByText('Age Distribution (Bar Chart)')).toBeTruthy();
  });

  it('should render with male gender', () => {
    const { toJSON } = render(
      <AgeDistributionChart data={mockAgeGroups} gender="male" isDarkMode={false} />
    );

    expect(toJSON()).toBeTruthy();
  });

  it('should render with female gender', () => {
    const { toJSON } = render(
      <AgeDistributionChart data={mockAgeGroups} gender="female" isDarkMode={false} />
    );

    expect(toJSON()).toBeTruthy();
  });

  it('should render in dark mode', () => {
    const { toJSON } = render(
      <AgeDistributionChart data={mockAgeGroups} gender="male" isDarkMode={true} />
    );

    expect(toJSON()).toBeTruthy();
  });

  it('should handle empty data', () => {
    const { getByText } = render(
      <AgeDistributionChart data={[]} gender="male" isDarkMode={false} />
    );

    expect(getByText('No age data available for visualization')).toBeTruthy();
  });

  it('should render total users count', () => {
    const { getByText } = render(
      <AgeDistributionChart data={mockAgeGroups} gender="male" isDarkMode={false} />
    );

    expect(getByText(/Total Users:/)).toBeTruthy();
  });
});
