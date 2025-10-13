import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CreditDisplay } from '../../components/CreditDisplay';

describe('CreditDisplay', () => {
  const mockOnUpgradePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders credit display correctly', () => {
    const { getByText } = render(
      <CreditDisplay 
        credits={50} 
        maxCredits={100} 
        onUpgradePress={mockOnUpgradePress} 
      />
    );

    expect(getByText(/50\/100/)).toBeTruthy();
    expect(getByText(/Credits/i)).toBeTruthy();
  });

  it('shows Pro badge when maxCredits is 100', () => {
    const { getByText } = render(
      <CreditDisplay 
        credits={50} 
        maxCredits={100} 
        onUpgradePress={mockOnUpgradePress} 
      />
    );

    expect(getByText('Pro')).toBeTruthy();
  });

  it('shows upgrade button when not Pro (maxCredits < 100)', () => {
    const { getByText } = render(
      <CreditDisplay 
        credits={3} 
        maxCredits={5} 
        onUpgradePress={mockOnUpgradePress} 
      />
    );

    const upgradeButton = getByText(/Upgrade/i);
    expect(upgradeButton).toBeTruthy();
  });

  it('calls onUpgradePress when upgrade button is pressed', () => {
    const { getByText } = render(
      <CreditDisplay 
        credits={3} 
        maxCredits={5} 
        onUpgradePress={mockOnUpgradePress} 
      />
    );

    const upgradeButton = getByText(/Upgrade/i);
    fireEvent.press(upgradeButton);

    expect(mockOnUpgradePress).toHaveBeenCalledTimes(1);
  });

  it('handles zero credits', () => {
    const { getByText } = render(
      <CreditDisplay 
        credits={0} 
        maxCredits={100} 
        onUpgradePress={mockOnUpgradePress} 
      />
    );

    expect(getByText(/0\/100/)).toBeTruthy();
  });

  it('handles low credits (1 or less)', () => {
    const { toJSON } = render(
      <CreditDisplay 
        credits={1} 
        maxCredits={100} 
        onUpgradePress={mockOnUpgradePress} 
      />
    );

    // Should render with different gradient (red colors)
    expect(toJSON()).toBeTruthy();
  });

  it('displays correct credit ratio', () => {
    const { getByText } = render(
      <CreditDisplay 
        credits={75} 
        maxCredits={100} 
        onUpgradePress={mockOnUpgradePress} 
      />
    );

    expect(getByText('75/100')).toBeTruthy();
  });

  it('handles full credits', () => {
    const { getByText } = render(
      <CreditDisplay 
        credits={100} 
        maxCredits={100} 
        onUpgradePress={mockOnUpgradePress} 
      />
    );

    expect(getByText('100/100')).toBeTruthy();
  });
});

