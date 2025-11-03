import React from 'react';
import { render } from '@testing-library/react-native';
import { UserMiniCard } from '../../components/UserMiniCard';
import { DashboardUser } from '../../types';

describe('UserMiniCard', () => {
  const mockUser: DashboardUser = {
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
  };

  it('should render user name', () => {
    const { getByText } = render(
      <UserMiniCard user={mockUser} isDarkMode={false} />
    );

    expect(getByText('John Doe')).toBeTruthy();
  });

  it('should render user email', () => {
    const { getByText } = render(
      <UserMiniCard user={mockUser} isDarkMode={false} />
    );

    expect(getByText('john@example.com')).toBeTruthy();
  });

  it('should render user age when available', () => {
    const { getByText } = render(
      <UserMiniCard user={mockUser} isDarkMode={false} />
    );

    expect(getByText('25')).toBeTruthy();
  });

  it('should handle user without age', () => {
    const userWithoutAge = { ...mockUser, age: null };
    const { getByText, queryByText } = render(
      <UserMiniCard user={userWithoutAge} isDarkMode={false} />
    );

    // Name and email should still be rendered
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john@example.com')).toBeTruthy();
  });

  it('should render in light mode', () => {
    const { toJSON } = render(
      <UserMiniCard user={mockUser} isDarkMode={false} />
    );

    expect(toJSON()).toBeTruthy();
  });

  it('should render in dark mode', () => {
    const { toJSON } = render(
      <UserMiniCard user={mockUser} isDarkMode={true} />
    );

    expect(toJSON()).toBeTruthy();
  });
});
