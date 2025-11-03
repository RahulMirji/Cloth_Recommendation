import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../lib/supabase';
import {
  calculateAgeStatistics,
  calculateAgeDistribution,
  generateInsights,
  getDemographicsData,
} from '../../services/demographicsService';
import { DemographicUser } from '../../types/demographics.types';

// Mock Supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('demographicsService', () => {
  const mockUsers: DemographicUser[] = [
    {
      id: '1',
      user_id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      age: 25,
      gender: 'male',
      bio: 'Test bio',
      profile_image: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'user2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '0987654321',
      age: 30,
      gender: 'male',
      bio: null,
      profile_image: null,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
    {
      id: '3',
      user_id: 'user3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: null,
      age: 45,
      gender: 'male',
      bio: null,
      profile_image: null,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    },
    {
      id: '4',
      user_id: 'user4',
      name: 'Alice Williams',
      email: 'alice@example.com',
      phone: null,
      age: null,
      gender: 'male',
      bio: null,
      profile_image: null,
      created_at: '2024-01-04T00:00:00Z',
      updated_at: '2024-01-04T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDemographicsData', () => {
    it('should fetch demographics data for male users', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('admin@example.com');
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { users: mockUsers },
        error: null,
      });

      const result = await getDemographicsData('male');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@admin_email');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('admin-get-users', {
        body: {
          searchQuery: '',
          gender: 'male',
          sortField: 'created_at',
          sortOrder: 'desc',
        },
        headers: {
          'x-admin-email': 'admin@example.com',
        },
      });
      expect(result.gender).toBe('male');
      expect(result.totalCount).toBe(4);
      expect(result.ageStatistics).toBeDefined();
      expect(result.ageDistribution).toBeDefined();
      expect(result.insights).toBeDefined();
    });

    it('should throw error if admin email not found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await expect(getDemographicsData('male')).rejects.toThrow('Admin email not found in session');
    });

    it('should handle edge function error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('admin@example.com');
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Edge function error'),
      });

      await expect(getDemographicsData('male')).rejects.toThrow();
    });

    it('should handle empty user list', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('admin@example.com');
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      const result = await getDemographicsData('female');

      expect(result.totalCount).toBe(0);
      expect(result.gender).toBe('female');
    });
  });

  describe('calculateAgeStatistics', () => {
    it('should calculate correct statistics for users with ages', () => {
      const stats = calculateAgeStatistics(mockUsers);

      expect(stats.totalWithAge).toBe(3);
      expect(stats.totalWithoutAge).toBe(1);
      expect(stats.average).toBe(33); // (25 + 30 + 45) / 3 = 33.33, rounded to 33
      expect(stats.median).toBe(30);
      expect(stats.min).toBe(25);
      expect(stats.max).toBe(45);
    });

    it('should handle all users without age', () => {
      const usersWithoutAge: DemographicUser[] = [
        { 
          id: '1', 
          user_id: 'user1',
          name: 'Test User',
          email: 'test@example.com', 
          phone: null,
          age: null, 
          gender: 'male', 
          bio: null,
          profile_image: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const stats = calculateAgeStatistics(usersWithoutAge);

      expect(stats.totalWithAge).toBe(0);
      expect(stats.totalWithoutAge).toBe(1);
      expect(stats.average).toBeNull();
      expect(stats.median).toBeNull();
      expect(stats.min).toBeNull();
      expect(stats.max).toBeNull();
    });

    it('should handle empty user array', () => {
      const stats = calculateAgeStatistics([]);

      expect(stats.totalWithAge).toBe(0);
      expect(stats.totalWithoutAge).toBe(0);
      expect(stats.average).toBeNull();
      expect(stats.median).toBeNull();
      expect(stats.min).toBeNull();
      expect(stats.max).toBeNull();
    });

    it('should calculate median correctly for even number of ages', () => {
      const users: DemographicUser[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Test 1',
          email: 'test1@example.com',
          phone: null,
          age: 20,
          gender: 'male',
          bio: null,
          profile_image: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          user_id: 'user2',
          name: 'Test 2',
          email: 'test2@example.com',
          phone: null,
          age: 30,
          gender: 'male',
          bio: null,
          profile_image: null,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      const stats = calculateAgeStatistics(users);

      expect(stats.median).toBe(25); // (20 + 30) / 2 = 25
      expect(stats.average).toBe(25);
    });
  });

  describe('calculateAgeDistribution', () => {
    it('should correctly distribute users into age groups', () => {
      const distribution = calculateAgeDistribution(mockUsers);

      expect(distribution.length).toBeGreaterThan(0);
      
      const group25_34 = distribution.find((d) => d.label === '25-34');
      expect(group25_34?.count).toBe(2);
      expect(group25_34?.users).toHaveLength(2);

      const group45_54 = distribution.find((d) => d.label === '45-54');
      expect(group45_54?.count).toBe(1);
      expect(group45_54?.users).toHaveLength(1);

      const notSpecified = distribution.find((d) => d.label === 'Not Specified');
      expect(notSpecified?.count).toBe(1);
      expect(notSpecified?.users).toHaveLength(1);
    });

    it('should handle users at age boundaries', () => {
      const users: DemographicUser[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Test 1',
          email: 'test1@example.com',
          phone: null,
          age: 18,
          gender: 'male',
          bio: null,
          profile_image: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          user_id: 'user2',
          name: 'Test 2',
          email: 'test2@example.com',
          phone: null,
          age: 24,
          gender: 'male',
          bio: null,
          profile_image: null,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        {
          id: '3',
          user_id: 'user3',
          name: 'Test 3',
          email: 'test3@example.com',
          phone: null,
          age: 25,
          gender: 'male',
          bio: null,
          profile_image: null,
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
        },
      ];

      const distribution = calculateAgeDistribution(users);

      const group18_24 = distribution.find((d) => d.label === '18-24');
      expect(group18_24?.count).toBe(2);

      const group25_34 = distribution.find((d) => d.label === '25-34');
      expect(group25_34?.count).toBe(1);
    });

    it('should calculate percentages correctly', () => {
      const distribution = calculateAgeDistribution(mockUsers);

      const group25_34 = distribution.find((d) => d.label === '25-34');
      expect(group25_34?.percentage).toBe(50); // 2 out of 4 users = 50%

      const group45_54 = distribution.find((d) => d.label === '45-54');
      expect(group45_54?.percentage).toBe(25); // 1 out of 4 users = 25%
    });

    it('should handle empty user array', () => {
      const distribution = calculateAgeDistribution([]);

      // Should only return Not Specified group when empty
      expect(distribution.length).toBe(1);
      expect(distribution[0].label).toBe('Not Specified');
      expect(distribution[0].count).toBe(0);
    });
  });

  describe('generateInsights', () => {
    it('should generate insights based on statistics and distribution', () => {
      const ageStatistics = calculateAgeStatistics(mockUsers);
      const ageDistribution = calculateAgeDistribution(mockUsers);

      const insights = generateInsights(mockUsers, ageDistribution, ageStatistics);

      expect(insights.largestAgeGroup).toBe('25-34');
      expect(insights.largestAgeGroupCount).toBe(2);
      expect(insights.ageSpecificationRate).toBe(75); // 3 out of 4 users = 75%
      expect(insights.dominantAgeRange).toContain('Largest group: 25-34');
    });

    it('should handle case with no users with age', () => {
      const usersWithoutAge: DemographicUser[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
          phone: null,
          age: null,
          gender: 'male',
          bio: null,
          profile_image: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const ageStatistics = calculateAgeStatistics(usersWithoutAge);
      const ageDistribution = calculateAgeDistribution(usersWithoutAge);

      const insights = generateInsights(usersWithoutAge, ageDistribution, ageStatistics);

      expect(insights.largestAgeGroup).toBeNull();
      expect(insights.ageSpecificationRate).toBe(0);
      expect(insights.dominantAgeRange).toBe('Mixed age distribution');
    });

    it('should calculate growth trend correctly', () => {
      const recentUsers: DemographicUser[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Recent User',
          email: 'recent@example.com',
          phone: null,
          age: 25,
          gender: 'male',
          bio: null,
          profile_image: null,
          created_at: new Date().toISOString(), // Today
          updated_at: new Date().toISOString(),
        },
      ];

      const ageStatistics = calculateAgeStatistics(recentUsers);
      const ageDistribution = calculateAgeDistribution(recentUsers);

      const insights = generateInsights(recentUsers, ageDistribution, ageStatistics);

      expect(insights.growthTrend).toContain('100%');
      expect(insights.growthTrend).toContain('High growth');
    });
  });
});
