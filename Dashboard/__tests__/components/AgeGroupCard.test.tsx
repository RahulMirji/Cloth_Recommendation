import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AgeGroupCard } from '../../components/AgeGroupCard';
import { AgeGroup } from '../../types/demographics.types';
import { DashboardUser } from '../../types';

describe('AgeGroupCard', () => {
  const mockUsers: DashboardUser[] = [
    {
      id: '1',
      user_id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      age: 25,
      gender: 'male',
      bio: null,
      profile_image: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'user2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: null,
      age: 28,
      gender: 'male',
      bio: null,
      profile_image: null,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  const mockAgeGroup: AgeGroup = {
    label: '25-34',
    min: 25,
    max: 34,
    count: 2,
    percentage: 50,
    users: mockUsers,
  };

  it('should render age group label', () => {
    const { getByText } = render(
      <AgeGroupCard
        ageGroup={mockAgeGroup}
        gender="male"
        isDarkMode={false}
        isExpanded={false}
        onToggle={jest.fn()}
      />
    );

    expect(getByText('25-34')).toBeTruthy();
  });

  it('should render user count and percentage', () => {
    const { getByText } = render(
      <AgeGroupCard
        ageGroup={mockAgeGroup}
        gender="male"
        isDarkMode={false}
        isExpanded={false}
        onToggle={jest.fn()}
      />
    );

    expect(getByText('2 users')).toBeTruthy();
    expect(getByText('50%')).toBeTruthy();
  });

  it('should call onToggle when pressed', () => {
    const onToggleMock = jest.fn();
    const { getByText } = render(
      <AgeGroupCard
        ageGroup={mockAgeGroup}
        gender="male"
        isDarkMode={false}
        isExpanded={false}
        onToggle={onToggleMock}
      />
    );

    fireEvent.press(getByText('25-34'));
    expect(onToggleMock).toHaveBeenCalled();
  });

  it('should not show users when not expanded', () => {
    const { queryByText } = render(
      <AgeGroupCard
        ageGroup={mockAgeGroup}
        gender="male"
        isDarkMode={false}
        isExpanded={false}
        onToggle={jest.fn()}
      />
    );

    expect(queryByText('John Doe')).toBeFalsy();
  });

  it('should show users when expanded', () => {
    const { getByText } = render(
      <AgeGroupCard
        ageGroup={mockAgeGroup}
        gender="male"
        isDarkMode={false}
        isExpanded={true}
        onToggle={jest.fn()}
      />
    );

    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('Jane Smith')).toBeTruthy();
  });

  it('should render in dark mode', () => {
    const { toJSON } = render(
      <AgeGroupCard
        ageGroup={mockAgeGroup}
        gender="male"
        isDarkMode={true}
        isExpanded={false}
        onToggle={jest.fn()}
      />
    );

    expect(toJSON()).toBeTruthy();
  });

  it('should handle empty user list', () => {
    const emptyAgeGroup: AgeGroup = {
      ...mockAgeGroup,
      count: 0,
      users: [],
    };

    const { getByText } = render(
      <AgeGroupCard
        ageGroup={emptyAgeGroup}
        gender="male"
        isDarkMode={false}
        isExpanded={false}
        onToggle={jest.fn()}
      />
    );

    expect(getByText('0 users')).toBeTruthy();
  });
});
