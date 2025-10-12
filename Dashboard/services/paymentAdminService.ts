import { supabase } from '@/lib/supabase';
import {
  PaymentSubmission,
  PaymentStats,
  PaymentStatus,
  ApprovePaymentParams,
  RejectPaymentParams,
  PaymentActionResult,
} from '../types/payment.types';

export const getPaymentSubmissions = async (
  status: PaymentStatus | null = null
): Promise<PaymentSubmission[]> => {
  try {
    const { data, error } = await supabase.rpc('get_payment_submissions', {
      filter_status: status,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

export const getPaymentStats = async (): Promise<PaymentStats> => {
  try {
    const { data, error } = await supabase.rpc('get_payment_stats');

    if (error) {
      throw new Error(error.message);
    }

    return data as PaymentStats;
  } catch (error) {
    throw error;
  }
};

export const approvePayment = async ({
  paymentId,
  adminNotes,
}: ApprovePaymentParams): Promise<PaymentActionResult> => {
  try {
    const { data, error } = await supabase.rpc('approve_payment_request', {
      payment_id: paymentId,
      admin_notes: adminNotes || null,
    });

    if (error) {
      return {
        success: false,
        message: error.message || 'Failed to approve payment',
      };
    }

    return {
      success: true,
      message: 'Payment approved! User has been granted 100 credits.',
      data: data as PaymentSubmission,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
};

export const rejectPayment = async ({
  paymentId,
  rejectionReason,
}: RejectPaymentParams): Promise<PaymentActionResult> => {
  try {
    if (!rejectionReason || rejectionReason.trim() === '') {
      return {
        success: false,
        message: 'Rejection reason is required',
      };
    }

    const { data, error } = await supabase.rpc('reject_payment_request', {
      payment_id: paymentId,
      rejection_reason: rejectionReason,
    });

    if (error) {
      return {
        success: false,
        message: error.message || 'Failed to reject payment',
      };
    }

    return {
      success: true,
      message: 'Payment rejected. User has been notified.',
      data: data as PaymentSubmission,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
};

export const searchPayments = (
  submissions: PaymentSubmission[],
  query: string
): PaymentSubmission[] => {
  if (!query || query.trim() === '') {
    return submissions;
  }

  const lowerQuery = query.toLowerCase().trim();

  return submissions.filter((payment) => {
    const matchesUTR = payment.utr_number?.toLowerCase().includes(lowerQuery);
    const matchesName = payment.user_name?.toLowerCase().includes(lowerQuery);
    const matchesEmail = payment.user_email?.toLowerCase().includes(lowerQuery);
    const matchesPhone = payment.user_phone?.toLowerCase().includes(lowerQuery);

    return matchesUTR || matchesName || matchesEmail || matchesPhone;
  });
};

export const getPaymentById = async (
  paymentId: string
): Promise<PaymentSubmission | null> => {
  try {
    const { data, error } = await supabase
      .from('payment_submissions')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (error) {
      return null;
    }
    
    return data as PaymentSubmission;
  } catch (error) {
    return null;
  }
};

export const formatCurrency = (amount: number): string => {
  return `₹${amount.toFixed(2)}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getDaysUntilExpiry = (expiryDate: string): number => {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
