import { apiClient } from '../../shared/api/api-client';

export interface Plan {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  priceInCents: number;
  messageLimit: number | null;
  maxDevices: number;
  features: string[];
  isActive: boolean;
  isPurchasable: boolean;
  sortOrder: number;
}

export interface SubscriptionStatus {
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAST_DUE' | 'TRIAL' | 'PENDING';
  plan: string;
  messageCount: number;
  messageLimit: number | null;
  currentPeriodEnd?: string;
  checkoutUrl?: string;
  amount?: number;
  planName?: string;
  taxId?: string;
  whatsappNumber?: string;
}

export interface SubscriptionPayment {
  id: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  amount: number;
  paidAt?: string;
  createdAt: string;
  paymentMethod?: string | null;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export const subscriptionService = {
  getPlans: async (): Promise<Plan[]> => {
    const response = await apiClient.get('/subscription/plans');
    return response.data;
  },

  getStatus: async (): Promise<SubscriptionStatus> => {
    const response = await apiClient.get('/subscription/status');
    return response.data;
  },

  createCheckout: async (): Promise<{ url: string; planName: string; amount: number }> => {
    const response = await apiClient.post('/subscription/checkout');
    return response.data;
  },

  getPaymentHistory: async (): Promise<SubscriptionPayment[]> => {
    const response = await apiClient.get('/subscription/payments');
    return response.data;
  },

  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const response = await apiClient.get('/subscription/payment-methods');
    return response.data;
  },

  getInvoicePdfUrl: (paymentId: string): string => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return `${API_URL}/subscription/payments/${paymentId}/pdf`;
  },

  downloadInvoicePdf: async (paymentId: string): Promise<void> => {
    const response = await apiClient.get(`/subscription/payments/${paymentId}/pdf`, {
      responseType: 'blob',
    });

    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fatura-${paymentId.split('-')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
