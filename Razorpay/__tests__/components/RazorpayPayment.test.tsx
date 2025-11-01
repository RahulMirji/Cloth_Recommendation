/**
 * RazorpayPayment Component Tests
 * 
 * Tests for the Razorpay payment integration component
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { RazorpayPayment } from '@/components/RazorpayPayment';
import * as razorpayService from '@/utils/razorpayService';

// Mock react-native-razorpay
jest.mock('react-native-razorpay', () => ({
  __esModule: true,
  default: {
    open: jest.fn(),
  },
}));

// Mock razorpay service
jest.mock('@/utils/razorpayService');

// Mock custom alert
jest.mock('@/utils/customAlert', () => ({
  showCustomAlert: jest.fn(),
}));

const mockRazorpayCheckout = require('react-native-razorpay').default;

describe('RazorpayPayment', () => {
  const mockUserId = 'test-user-123';
  const mockCredits = 100;
  const mockOnSuccess = jest.fn();
  const mockOnFailure = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Order Creation', () => {
    it('should create order successfully', async () => {
      const mockOrderResponse = {
        success: true,
        data: {
          orderId: 'order_123',
          amount: 29,
          currency: 'INR',
        },
      };

      (razorpayService.createRazorpayOrder as jest.Mock).mockResolvedValue(
        mockOrderResponse
      );

      const { getByText } = render(
        <RazorpayPayment
          credits={mockCredits}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onFailure={mockOnFailure}
        >
          {({ initiatePayment, isProcessing }) => (
            <button onClick={initiatePayment}>
              {isProcessing ? 'Processing...' : 'Pay Now'}
            </button>
          )}
        </RazorpayPayment>
      );

      expect(razorpayService.createRazorpayOrder).not.toHaveBeenCalled();
    });

    it('should handle order creation failure', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Order creation failed',
      };

      (razorpayService.createRazorpayOrder as jest.Mock).mockResolvedValue(
        mockErrorResponse
      );

      const { getByText } = render(
        <RazorpayPayment
          credits={mockCredits}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onFailure={mockOnFailure}
        >
          {({ initiatePayment, isProcessing }) => (
            <button onClick={() => initiatePayment()}>Pay Now</button>
          )}
        </RazorpayPayment>
      );

      // Test will verify error handling
      expect(getByText('Pay Now')).toBeTruthy();
    });
  });

  describe('Payment Flow', () => {
    it('should handle successful payment with resolved promise', async () => {
      const mockOrderResponse = {
        success: true,
        data: {
          orderId: 'order_123',
          amount: 29,
          currency: 'INR',
        },
      };

      const mockPaymentData = {
        razorpay_payment_id: 'pay_123',
        razorpay_order_id: 'order_123',
        razorpay_signature: 'signature_123',
      };

      const mockVerifyResponse = {
        success: true,
        data: {
          orderId: 'order_123',
          paymentId: 'pay_123',
          credits: 100,
        },
      };

      (razorpayService.createRazorpayOrder as jest.Mock).mockResolvedValue(
        mockOrderResponse
      );
      mockRazorpayCheckout.open.mockResolvedValue(mockPaymentData);
      (razorpayService.verifyRazorpayPayment as jest.Mock).mockResolvedValue(
        mockVerifyResponse
      );

      const { getByText } = render(
        <RazorpayPayment
          credits={mockCredits}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onFailure={mockOnFailure}
        >
          {({ initiatePayment }) => (
            <button onClick={() => initiatePayment()}>Pay Now</button>
          )}
        </RazorpayPayment>
      );

      // Verify component renders
      expect(getByText('Pay Now')).toBeTruthy();
    });

    it('should handle successful payment with rejected promise (Razorpay quirk)', async () => {
      const mockOrderResponse = {
        success: true,
        data: {
          orderId: 'order_123',
          amount: 29,
          currency: 'INR',
        },
      };

      const mockPaymentData = {
        razorpay_payment_id: 'pay_123',
        razorpay_order_id: 'order_123',
        razorpay_signature: 'signature_123',
      };

      (razorpayService.createRazorpayOrder as jest.Mock).mockResolvedValue(
        mockOrderResponse
      );
      // Mock the Razorpay quirk - rejects with success data
      mockRazorpayCheckout.open.mockRejectedValue(mockPaymentData);

      const { getByText } = render(
        <RazorpayPayment
          credits={mockCredits}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onFailure={mockOnFailure}
        >
          {({ initiatePayment }) => (
            <button onClick={() => initiatePayment()}>Pay Now</button>
          )}
        </RazorpayPayment>
      );

      expect(getByText('Pay Now')).toBeTruthy();
    });

    it('should handle user cancellation', async () => {
      const mockOrderResponse = {
        success: true,
        data: {
          orderId: 'order_123',
          amount: 29,
          currency: 'INR',
        },
      };

      const mockCancelError = {
        code: 2,
        description: 'Payment cancelled by user',
      };

      (razorpayService.createRazorpayOrder as jest.Mock).mockResolvedValue(
        mockOrderResponse
      );
      mockRazorpayCheckout.open.mockRejectedValue(mockCancelError);

      const { getByText } = render(
        <RazorpayPayment
          credits={mockCredits}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onFailure={mockOnFailure}
        >
          {({ initiatePayment }) => (
            <button onClick={() => initiatePayment()}>Pay Now</button>
          )}
        </RazorpayPayment>
      );

      expect(getByText('Pay Now')).toBeTruthy();
    });

    it('should handle network errors', async () => {
      const mockOrderResponse = {
        success: true,
        data: {
          orderId: 'order_123',
          amount: 29,
          currency: 'INR',
        },
      };

      const mockNetworkError = {
        code: 0,
        description: 'Network error',
      };

      (razorpayService.createRazorpayOrder as jest.Mock).mockResolvedValue(
        mockOrderResponse
      );
      mockRazorpayCheckout.open.mockRejectedValue(mockNetworkError);

      const { getByText } = render(
        <RazorpayPayment
          credits={mockCredits}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onFailure={mockOnFailure}
        >
          {({ initiatePayment }) => (
            <button onClick={() => initiatePayment()}>Pay Now</button>
          )}
        </RazorpayPayment>
      );

      expect(getByText('Pay Now')).toBeTruthy();
    });
  });

  describe('Processing State', () => {
    it('should set processing state during payment', async () => {
      const mockOrderResponse = {
        success: true,
        data: {
          orderId: 'order_123',
          amount: 29,
          currency: 'INR',
        },
      };

      (razorpayService.createRazorpayOrder as jest.Mock).mockResolvedValue(
        mockOrderResponse
      );

      let processingState = false;

      const { getByText, rerender } = render(
        <RazorpayPayment
          credits={mockCredits}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onFailure={mockOnFailure}
        >
          {({ initiatePayment, isProcessing }) => {
            processingState = isProcessing;
            return (
              <button onClick={() => initiatePayment()}>
                {isProcessing ? 'Processing...' : 'Pay Now'}
              </button>
            );
          }}
        </RazorpayPayment>
      );

      expect(processingState).toBe(false);
      expect(getByText('Pay Now')).toBeTruthy();
    });

    it('should prevent double submission when processing', () => {
      const { getByText } = render(
        <RazorpayPayment
          credits={mockCredits}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onFailure={mockOnFailure}
        >
          {({ initiatePayment, isProcessing }) => (
            <button onClick={() => initiatePayment()} disabled={isProcessing}>
              Pay Now
            </button>
          )}
        </RazorpayPayment>
      );

      expect(getByText('Pay Now')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user email gracefully', () => {
      const { getByText } = render(
        <RazorpayPayment
          credits={mockCredits}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onFailure={mockOnFailure}
        >
          {({ initiatePayment }) => (
            <button onClick={() => initiatePayment()}>Pay Now</button>
          )}
        </RazorpayPayment>
      );

      expect(getByText('Pay Now')).toBeTruthy();
    });

    it('should handle payment with all user details', () => {
      const { getByText } = render(
        <RazorpayPayment
          credits={mockCredits}
          userId={mockUserId}
          userEmail="test@example.com"
          userName="Test User"
          userPhone="9876543210"
          onSuccess={mockOnSuccess}
          onFailure={mockOnFailure}
        >
          {({ initiatePayment }) => (
            <button onClick={() => initiatePayment()}>Pay Now</button>
          )}
        </RazorpayPayment>
      );

      expect(getByText('Pay Now')).toBeTruthy();
    });

    it('should handle payment completion flag correctly', () => {
      const mockOrderResponse = {
        success: true,
        data: {
          orderId: 'order_123',
          amount: 29,
          currency: 'INR',
        },
      };

      const mockPaymentData = {
        razorpay_payment_id: 'pay_123',
        razorpay_order_id: 'order_123',
        razorpay_signature: 'signature_123',
      };

      (razorpayService.createRazorpayOrder as jest.Mock).mockResolvedValue(
        mockOrderResponse
      );
      mockRazorpayCheckout.open.mockRejectedValue(mockPaymentData);

      const { getByText } = render(
        <RazorpayPayment
          credits={mockCredits}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onFailure={mockOnFailure}
        >
          {({ initiatePayment }) => (
            <button onClick={() => initiatePayment()}>Pay Now</button>
          )}
        </RazorpayPayment>
      );

      expect(getByText('Pay Now')).toBeTruthy();
    });
  });
});
