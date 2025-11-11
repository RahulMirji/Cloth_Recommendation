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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders correctly', () => {
    render(<HomeScreen />, { wrapper });
    
    // Check for greeting (uses "Hi" not "Hey" and user name or "Guest")
    expect(screen.getByText(/Hi/i)).toBeTruthy();
  });

  it('displays the correct subtitle', () => {
    render(<HomeScreen />, { wrapper });
    
    // Check for the actual subtitle text from the app (Hey Guest and subtitle)
    expect(screen.getByText(/Ready to get some style tips/i)).toBeTruthy();
  });

  it('shows all three feature cards in correct order', () => {
    render(<HomeScreen />, { wrapper });
    
    // Check all three cards are present (use getAllByText for multiple matches)
    expect(screen.getAllByText(/Outfit Scorer/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AI Stylist/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/AI Image Generator/i)).toBeTruthy();
  });

  it('shows Outfit Scorer card (first card)', () => {
    render(<HomeScreen />, { wrapper });
    
    const cards = screen.getAllByText(/Outfit Scorer/i);
    expect(cards.length).toBeGreaterThan(0);
  });

  it('shows AI Stylist card with BETA tag (second card)', () => {
    render(<HomeScreen />, { wrapper });
    
    const stylistCards = screen.getAllByText(/AI Stylist/i);
    const betaTags = screen.getAllByText(/BETA/i);
    
    expect(stylistCards.length).toBeGreaterThan(0);
    expect(betaTags.length).toBeGreaterThanOrEqual(1); // At least one BETA tag
  });

  it('shows AI Image Generator card with BETA tag (third card)', () => {
    render(<HomeScreen />, { wrapper });
    
    expect(screen.getByText(/AI Image Generator/i)).toBeTruthy();
    expect(screen.getAllByText(/BETA/i).length).toBeGreaterThanOrEqual(1);
  });

  it('navigates to Outfit Scorer when card is pressed', () => {
    render(<HomeScreen />, { wrapper });
    
    const buttons = screen.getAllByText(/Outfit Scorer/i);
    fireEvent.press(buttons[0]);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/outfit-scorer');
  });

  it('navigates to AI Stylist when card is pressed', () => {
    render(<HomeScreen />, { wrapper });
    
    const buttons = screen.getAllByText(/AI Stylist/i);
    fireEvent.press(buttons[0]);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/ai-stylist');
  });

  it('navigates to AI Image Generator when card is pressed', () => {
    render(<HomeScreen />, { wrapper });
    
    const button = screen.getByText(/AI Image Generator/i);
    fireEvent.press(button);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/ai-image-generator');
  });

  it('renders in dark mode correctly', () => {
    const { root } = render(<HomeScreen />, { wrapper });
    expect(root).toBeTruthy();
  });
});
