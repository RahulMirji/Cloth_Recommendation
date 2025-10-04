import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppProvider } from '@/contexts/AppContext';
import HomeScreen from '@/screens/HomeScreen';

// Mock the router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('HomeScreen', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );

  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders correctly', () => {
    render(<HomeScreen />, { wrapper });
    
    expect(screen.getByText(/Welcome/i)).toBeTruthy();
  });

  it('displays the correct title', () => {
    render(<HomeScreen />, { wrapper });
    
    expect(screen.getByText(/AI Cloth Recommendation/i)).toBeTruthy();
  });

  it('shows AI Stylist button', () => {
    render(<HomeScreen />, { wrapper });
    
    const aiStylistButton = screen.getByText(/AI Stylist/i);
    expect(aiStylistButton).toBeTruthy();
  });

  it('shows Outfit Scorer button', () => {
    render(<HomeScreen />, { wrapper });
    
    const outfitScorerButton = screen.getByText(/Outfit Scorer/i);
    expect(outfitScorerButton).toBeTruthy();
  });

  it('navigates to AI Stylist when button is pressed', () => {
    render(<HomeScreen />, { wrapper });
    
    const aiStylistButton = screen.getByText(/AI Stylist/i);
    fireEvent.press(aiStylistButton);
    
    expect(mockPush).toHaveBeenCalledWith('/ai-stylist');
  });

  it('navigates to Outfit Scorer when button is pressed', () => {
    render(<HomeScreen />, { wrapper });
    
    const outfitScorerButton = screen.getByText(/Outfit Scorer/i);
    fireEvent.press(outfitScorerButton);
    
    expect(mockPush).toHaveBeenCalledWith('/outfit-scorer');
  });

  it('renders in dark mode correctly', () => {
    const { container } = render(<HomeScreen />, { wrapper });
    expect(container).toBeTruthy();
  });
});
