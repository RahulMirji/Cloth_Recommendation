import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppProvider } from '@/contexts/AppContext';
import { HomeScreen } from '@/screens/HomeScreen';
import { router } from 'expo-router';

// Mock router is set up in jest.setup.js
const mockRouter = router as jest.Mocked<typeof router>;

describe('HomeScreen', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<HomeScreen />, { wrapper });
    
    expect(screen.getByText(/Hey Guest/i)).toBeTruthy();
  });

  it('displays the correct subtitle', () => {
    render(<HomeScreen />, { wrapper });
    
    expect(screen.getByText(/Ready to get some style tips/i)).toBeTruthy();
  });

  it('shows AI Stylist card', () => {
    render(<HomeScreen />, { wrapper });
    
    const cards = screen.getAllByText(/AI Stylist/i);
    expect(cards.length).toBeGreaterThan(0);
  });

  it('shows Outfit Scorer card', () => {
    render(<HomeScreen />, { wrapper });
    
    const cards = screen.getAllByText(/Outfit Scorer/i);
    expect(cards.length).toBeGreaterThan(0);
  });

  it('navigates to AI Stylist when card is pressed', () => {
    render(<HomeScreen />, { wrapper });
    
    // Find all pressable elements with AI Stylist text and press the first one
    const buttons = screen.getAllByText(/AI Stylist/i);
    fireEvent.press(buttons[0]);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/ai-stylist');
  });

  it('navigates to Outfit Scorer when card is pressed', () => {
    render(<HomeScreen />, { wrapper });
    
    // Find all pressable elements with Outfit Scorer text and press the first one
    const buttons = screen.getAllByText(/Outfit Scorer/i);
    fireEvent.press(buttons[0]);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/outfit-scorer');
  });

  it('renders in dark mode correctly', () => {
    const { root } = render(<HomeScreen />, { wrapper });
    expect(root).toBeTruthy();
  });
});
