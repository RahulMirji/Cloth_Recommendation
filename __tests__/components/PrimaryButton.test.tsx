import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { PrimaryButton } from '@/components/PrimaryButton';

describe('PrimaryButton', () => {
  it('renders correctly', () => {
    render(<PrimaryButton title="Test Button" onPress={() => {}} />);
    
    expect(screen.getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    render(<PrimaryButton title="Click Me" onPress={onPressMock} />);
    
    const button = screen.getByText('Click Me');
    fireEvent.press(button);
    
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<PrimaryButton title="Submit" onPress={() => {}} loading />);
    
    expect(screen.queryByText('Submit')).toBeNull();
  });

  it('is disabled when disabled prop is true', () => {
    const onPressMock = jest.fn();
    render(<PrimaryButton title="Disabled" onPress={onPressMock} disabled />);
    
    const button = screen.getByText('Disabled');
    fireEvent.press(button);
    
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('renders with custom variant', () => {
    render(
      <PrimaryButton title="Secondary" onPress={() => {}} variant="secondary" />
    );
    
    expect(screen.getByText('Secondary')).toBeTruthy();
  });
});
