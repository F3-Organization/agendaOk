import { apiClient } from '../../shared/api/api-client';

export interface SubscriptionStatus {
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAST_DUE' | 'TRIAL';
  plan: string;
  currentPeriodEnd?: string;
  checkoutUrl?: string;
}

export interface SubscriptionPayment {
  id: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  amount: number;
  paidAt?: string;
  createdAt: string;
}

export const subscriptionService = {
  getStatus: async (): Promise<SubscriptionStatus> => {
    const response = await apiClient.get('/subscription/status');
    return response.data;
  },

  createCheckout: async (): Promise<{ url: string }> => {
    const response = await apiClient.post('/subscription/checkout');
    return response.data;
  },

  getPaymentHistory: async (): Promise<SubscriptionPayment[]> => {
    const response = await apiClient.get('/subscription/payments');
    return response.data;
  },

  getInvoicePdfUrl: (paymentId: string): string => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return `${API_URL}/subscription/payments/${paymentId}/pdf`;
  }
};
