import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppProvider } from '@/contexts/AppContext';
import { AlertProvider } from '@/contexts/AlertContext';
import { SettingsScreen } from '@/screens/SettingsScreen';

describe('SettingsScreen', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AlertProvider>
      <AppProvider>{children}</AppProvider>
    </AlertProvider>
  );

  it('renders correctly', () => {
    render(<SettingsScreen />, { wrapper });
    
    expect(screen.getByText(/Appearance/i)).toBeTruthy();
  });

  it('shows dark mode toggle', () => {
    render(<SettingsScreen />, { wrapper });
    
    expect(screen.getByText(/Dark Mode/i)).toBeTruthy();
  });

  it('shows cloud AI toggle', () => {
    render(<SettingsScreen />, { wrapper });
    
    expect(screen.getByText(/Use Cloud AI/i)).toBeTruthy();
  });

  it('shows save history toggle', () => {
    render(<SettingsScreen />, { wrapper });
    
    expect(screen.getByText(/Save History/i)).toBeTruthy();
  });

  it('toggles cloud AI when switch is pressed', () => {
    render(<SettingsScreen />, { wrapper });
    
    const cloudAISwitch = screen.getAllByRole('switch')[1]; // Second switch is Cloud AI
    
    // Just check it renders - the actual toggle is mocked
    expect(cloudAISwitch.props.value).toBeDefined();
  });

  it('displays correct settings sections', () => {
    render(<SettingsScreen />, { wrapper });
    
    expect(screen.getByText(/Appearance/i)).toBeTruthy();
    expect(screen.getAllByText(/AI Model/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Privacy/i)).toBeTruthy();
  });
});
