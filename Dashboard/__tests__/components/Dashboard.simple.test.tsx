/**
 * Basic test suite for Dashboard Components
 * Tests component structure and props
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { StatsCard } from '../../components/StatsCard';
import type { DashboardUser } from '../../types';

describe('Dashboard Components', () => {
  describe('StatsCard', () => {
    it('should render with required props', () => {
      const { getByText } = render(
        <StatsCard 
          title="Test" 
          value="100" 
          icon="people" 
          color="#FF0000"
          isDarkMode={false}
        />
      );

      expect(getByText('Test')).toBeTruthy();
      expect(getByText('100')).toBeTruthy();
    });

    it('should handle dark mode', () => {
      const { getByText } = render(
        <StatsCard 
          title="Test" 
          value="100" 
          icon="people" 
          color="#FF0000"
          isDarkMode={true}
        />
      );

      expect(getByText('Test')).toBeTruthy();
    });
  });

  describe('Dashboard Types', () => {
    it('should have Dashboard User type defined', () => {
      const mockUser: DashboardUser = {
        id: '1',
        user_id: '1',
        name: 'Test User',
        email: 'test@example.com',
        phone: null,
        age: 25,
        gender: 'male',
        bio: null,
        profile_image: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: null,
      };

      expect(mockUser.id).toBe('1');
      expect(mockUser.email).toBe('test@example.com');
    });
  });
});
