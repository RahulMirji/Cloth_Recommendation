import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaymentRequestCard } from '../../components/PaymentRequestCard';
import { PaymentSubmission } from '../../types/payment.types';

describe('PaymentRequestCard', () => {
  const mockPayment: PaymentSubmission = {
    id: '123',
    user_id: 'user-123',
    user_name: 'John Doe',
    user_email: 'john@example.com',
    user_phone: '1234567890',
    plan_id: 'plan-1',
    amount: 29,
    utr_number: 'UTR123456789',
    screenshot_url: 'https://example.com/screenshot.jpg',
    status: 'pending',
    submitted_at: '2025-10-13T10:00:00Z',
    reviewed_at: null,
    reviewed_by: null,
    reviewer_name: null,
    admin_notes: null,
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders payment card correctly', () => {
    const { getByText } = render(
      <PaymentRequestCard payment={mockPayment} onPress={mockOnPress} />
    );

    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText(/UTR: UTR123456789/)).toBeTruthy();
    expect(getByText('Pending')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByText } = render(
      <PaymentRequestCard payment={mockPayment} onPress={mockOnPress} />
    );

    fireEvent.press(getByText('John Doe'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('handles undefined user_name gracefully', () => {
    const paymentWithoutName: PaymentSubmission = { ...mockPayment, user_name: undefined };
    const { getByText } = render(
      <PaymentRequestCard payment={paymentWithoutName} onPress={mockOnPress} />
    );

    expect(getByText('Unknown User')).toBeTruthy();
  });

  it('handles undefined amount gracefully', () => {
    const paymentWithoutAmount: PaymentSubmission = { ...mockPayment, amount: undefined };
    const { getByText } = render(
      <PaymentRequestCard payment={paymentWithoutAmount} onPress={mockOnPress} />
    );

    expect(getByText('₹0.00')).toBeTruthy();
  });

  it('displays approved status correctly', () => {
    const approvedPayment = { ...mockPayment, status: 'approved' as const };
    const { getByText } = render(
      <PaymentRequestCard payment={approvedPayment} onPress={mockOnPress} />
    );

    expect(getByText('Approved')).toBeTruthy();
  });

  it('displays rejected status correctly', () => {
    const rejectedPayment = { ...mockPayment, status: 'rejected' as const };
    const { getByText } = render(
      <PaymentRequestCard payment={rejectedPayment} onPress={mockOnPress} />
    );

    expect(getByText('Rejected')).toBeTruthy();
  });

  it('displays reviewer info when payment is reviewed', () => {
    const reviewedPayment = {
      ...mockPayment,
      status: 'approved' as const,
      reviewed_by: 'admin-123',
      reviewer_name: 'Admin User',
      reviewed_at: '2025-10-13T11:00:00Z',
    };

    const { getByText } = render(
      <PaymentRequestCard payment={reviewedPayment} onPress={mockOnPress} />
    );

    expect(getByText(/By Admin User/)).toBeTruthy();
  });

  it('handles null screenshot_url gracefully', () => {
    const paymentWithoutScreenshot = { ...mockPayment, screenshot_url: null };
    const { toJSON } = render(
      <PaymentRequestCard payment={paymentWithoutScreenshot} onPress={mockOnPress} />
    );

    // Should not crash with empty string fallback
    expect(toJSON()).toBeTruthy();
  });

  it('handles undefined status gracefully', () => {
    const paymentWithoutStatus = { ...mockPayment, status: undefined as any };
    const { getByText } = render(
      <PaymentRequestCard payment={paymentWithoutStatus} onPress={mockOnPress} />
    );

    // Should fall back to pending status
    expect(getByText('Pending')).toBeTruthy();
  });

  it('formats currency correctly', () => {
    const { getByText } = render(
      <PaymentRequestCard payment={mockPayment} onPress={mockOnPress} />
    );

    expect(getByText('₹29.00')).toBeTruthy();
  });

  it('formats date correctly', () => {
    const { getByText } = render(
      <PaymentRequestCard payment={mockPayment} onPress={mockOnPress} />
    );

    // Date should be formatted (exact format may vary by locale)
    const dateElements = getByText(/Oct|13|2025/);
    expect(dateElements).toBeTruthy();
  });
});
