import { apiClient } from '../../shared/api/api-client';

export interface SubscriptionStatus {
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  currentPeriodEnd?: string;
  checkoutUrl?: string;
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
};
