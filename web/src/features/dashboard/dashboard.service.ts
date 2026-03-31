import { apiClient } from '../../shared/api/api-client';

export interface DashboardStats {
  totalConfirmations: number;
  managedReplies: number;
  conversionRate: string;
  confirmationsChange: string;
  repliesChange: string;
  conversionRateChange: string;
  calendarConnected: boolean;
}


export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },
};
