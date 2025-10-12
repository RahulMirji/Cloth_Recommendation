import { supabase } from '@/lib/supabase';
import {
  PaymentSubmission,
  PaymentStats,
  PaymentStatus,
  ApprovePaymentParams,
  RejectPaymentParams,
  PaymentActionResult,
} from '../types/payment.types';

// @ts-nocheck - Supabase types not regenerated yet, ignoring type errors for payment functions

export const getPaymentSubmissions = async (
  status: PaymentStatus | null = null
): Promise<PaymentSubmission[]> => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 FETCHING PAYMENTS');
    console.log('Filter status:', status);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const { data, error } = await supabase.rpc('get_payment_submissions', {
      filter_status: status,
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RPC RESPONSE');
    console.log('Has error:', !!error);
    if (error) {
      console.log('Error details:', JSON.stringify(error, null, 2));
      console.log('Error message:', error.message);
      console.log('Error code:', (error as any).code);
      console.log('Error hint:', (error as any).hint);
      console.log('Error details:', (error as any).details);
    }
    console.log('Has data:', !!data);
    if (data) {
      console.log('Data type:', typeof data);
      console.log('Data is array:', Array.isArray(data));
      console.log('Data length:', Array.isArray(data) ? (data as any).length : 'N/A');
      if (Array.isArray(data) && (data as any).length > 0) {
        console.log('First payment:', JSON.stringify((data as any)[0], null, 2));
        console.log('First payment keys:', Object.keys((data as any)[0]));
      }
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (error) {
      console.log('❌ Throwing error:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Returning data, count:', (data || []).length);
    return data || [];
  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ CATCH BLOCK ERROR');
    console.log('Error type:', typeof error);
    console.log('Error:', error);
    if (error instanceof Error) {
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

export const deletePayment = async (
  paymentId: string
): Promise<PaymentActionResult> => {
  try {
    // @ts-ignore - payment_submissions not in generated types yet
    const { data, error } = await supabase.rpc('delete_payment_submission', {
      payment_id: paymentId,
    });

    if (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete payment',
      };
    }

    return {
      success: true,
      message: 'Payment deleted successfully. User credits have been reverted.',
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
