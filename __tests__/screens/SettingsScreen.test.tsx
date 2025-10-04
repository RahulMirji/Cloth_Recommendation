import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppProvider } from '@/contexts/AppContext';
import { SettingsScreen } from '@/screens/SettingsScreen';

describe('SettingsScreen', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );

  it('renders correctly', () => {
    render(<SettingsScreen />, { wrapper });
    
    expect(screen.getByText(/Settings/i)).toBeTruthy();
  });

  it('shows dark mode toggle', () => {
    render(<SettingsScreen />, { wrapper });
    
    expect(screen.getByText(/Dark Mode/i)).toBeTruthy();
  });

  it('shows notifications toggle', () => {
    render(<SettingsScreen />, { wrapper });
    
    expect(screen.getByText(/Notifications/i)).toBeTruthy();
  });

  it('shows language option', () => {
    render(<SettingsScreen />, { wrapper });
    
    expect(screen.getByText(/Language/i)).toBeTruthy();
  });

  it('toggles dark mode when switch is pressed', async () => {
    render(<SettingsScreen />, { wrapper });
    
    const darkModeSwitch = screen.getAllByRole('switch')[0];
    fireEvent(darkModeSwitch, 'valueChange', true);
    
    await waitFor(() => {
      expect(darkModeSwitch.props.value).toBe(true);
    });
  });

  it('displays correct settings sections', () => {
    render(<SettingsScreen />, { wrapper });
    
    expect(screen.getByText(/Appearance/i)).toBeTruthy();
    expect(screen.getByText(/Preferences/i)).toBeTruthy();
  });
});
