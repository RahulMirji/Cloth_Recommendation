// ============================================================================
// Payment Type Definitions
// ============================================================================
// TypeScript types for payment submission and admin approval system
// File: Dashboard/types/payment.types.ts
// Created: October 12, 2025
// ============================================================================

export interface PaymentSubmission {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_profile_image?: string | null;
  amount?: number;
  utr_number?: string;
  submitted_at?: string | Date;
  reviewed_at?: string | Date | null;
  reviewer_name?: string | null;
  admin_notes?: string | null;
  screenshot_url?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | string;
  plan_id?: string;
  reviewed_by?: string | null;
}

export interface PaymentStats {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  today_count: number;
  total_revenue: number;
  pending_revenue: number;
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovePaymentParams {
  paymentId: string;
  adminNotes?: string;
}

export interface RejectPaymentParams {
  paymentId: string;
  rejectionReason: string;
}

export interface PaymentActionResult {
  success: boolean;
  message: string;
  data?: PaymentSubmission;
}

export const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};
