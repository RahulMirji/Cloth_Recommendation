/**
 * Tests for Payment Deletion Functionality
 */
import { deletePayment } from '../../services/paymentAdminService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

describe('Payment Deletion Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deletePayment', () => {
    it('successfully deletes a payment', async () => {
      const mockPaymentId = '123e4567-e89b-12d3-a456-426614174000';
      
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: { success: true, message: 'Payment deleted successfully' },
        error: null,
      });

      const result = await deletePayment(mockPaymentId);

      expect(supabase.rpc).toHaveBeenCalledWith('delete_payment_submission', {
        payment_id: mockPaymentId,
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Payment deleted successfully. User credits have been reverted.');
    });

    it('handles deletion error from database', async () => {
      const mockPaymentId = '123e4567-e89b-12d3-a456-426614174000';
      
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Payment not found' },
      });

      const result = await deletePayment(mockPaymentId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Payment not found');
    });

    it('handles RLS policy blocking deletion', async () => {
      const mockPaymentId = '123e4567-e89b-12d3-a456-426614174000';
      
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Delete blocked by RLS or constraints' },
      });

      const result = await deletePayment(mockPaymentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Delete blocked');
    });

    it('handles network errors', async () => {
      const mockPaymentId = '123e4567-e89b-12d3-a456-426614174000';
      
      (supabase.rpc as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await deletePayment(mockPaymentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });

    it('handles unexpected errors gracefully', async () => {
      const mockPaymentId = '123e4567-e89b-12d3-a456-426614174000';
      
      (supabase.rpc as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      const result = await deletePayment(mockPaymentId);

      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
    });

    it('reverts credits for approved payments', async () => {
      const mockPaymentId = '123e4567-e89b-12d3-a456-426614174000';
      
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: { 
          success: true, 
          message: 'Payment deleted',
          credits_removed: 100 
        },
        error: null,
      });

      const result = await deletePayment(mockPaymentId);

      expect(result.success).toBe(true);
    });

    it('does not revert credits for pending payments', async () => {
      const mockPaymentId = '123e4567-e89b-12d3-a456-426614174000';
      
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: { 
          success: true, 
          message: 'Payment deleted',
          credits_removed: 0 
        },
        error: null,
      });

      const result = await deletePayment(mockPaymentId);

      expect(result.success).toBe(true);
    });

    it('validates payment ID format', async () => {
      const invalidPaymentId = 'invalid-uuid';
      
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid UUID format' },
      });

      const result = await deletePayment(invalidPaymentId);

      expect(result.success).toBe(false);
    });

    it('handles database function not found error', async () => {
      const mockPaymentId = '123e4567-e89b-12d3-a456-426614174000';
      
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'function delete_payment_submission does not exist' },
      });

      const result = await deletePayment(mockPaymentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('does not exist');
    });
  });
});
