import React from 'react';
import { render } from '@testing-library/react-native';
import { PaymentStatsCard } from '../../components/PaymentStatsCard';
import { PaymentStats } from '../../types/payment.types';

describe('PaymentStatsCard', () => {
  const mockStats: PaymentStats = {
    pending_count: 10,
    approved_count: 35,
    rejected_count: 5,
    today_count: 8,
    total_revenue: 1450,
    pending_revenue: 290,
  };

  it('renders stats correctly', () => {
    const { getByText } = render(<PaymentStatsCard stats={mockStats} />);

    expect(getByText('10')).toBeTruthy();
    expect(getByText('35')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
    expect(getByText('8')).toBeTruthy();
  });

  it('renders labels correctly', () => {
    const { getByText } = render(<PaymentStatsCard stats={mockStats} />);

    expect(getByText('Pending')).toBeTruthy();
    expect(getByText('Approved')).toBeTruthy();
    expect(getByText('Rejected')).toBeTruthy();
  });

  it('handles zero stats', () => {
    const zeroStats: PaymentStats = {
      pending_count: 0,
      approved_count: 0,
      rejected_count: 0,
      today_count: 0,
      total_revenue: 0,
      pending_revenue: 0,
    };

    const { getByText, getAllByText } = render(<PaymentStatsCard stats={zeroStats} />);

    const zeros = getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });

  it('handles large numbers', () => {
    const largeStats: PaymentStats = {
      pending_count: 1234,
      approved_count: 7890,
      rejected_count: 875,
      today_count: 156,
      total_revenue: 289971,
      pending_revenue: 35786,
    };

    const { getByText } = render(<PaymentStatsCard stats={largeStats} />);

    expect(getByText('1234')).toBeTruthy();
    expect(getByText('7890')).toBeTruthy();
    expect(getByText('875')).toBeTruthy();
    expect(getByText('156')).toBeTruthy();
  });

  it('renders without crashing when stats are undefined', () => {
    const undefinedStats = {
      pending_count: undefined,
      approved_count: undefined,
      rejected_count: undefined,
      today_count: undefined,
      total_revenue: undefined,
      pending_revenue: undefined,
    } as any;

    const { toJSON } = render(<PaymentStatsCard stats={undefinedStats} />);
    expect(toJSON()).toBeTruthy();
  });
});
