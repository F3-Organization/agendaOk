import { apiClient } from '../../shared/api/api-client';

export interface Professional {
  id: string;
  companyId: string;
  name: string;
  specialty?: string;
  workingHours?: Record<string, Array<{ start: string; end: string }>>;
  appointmentDuration: number;
  active: boolean;
  userId?: string;
  invitedEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BotConfig {
  businessType?: string;
  businessDescription?: string;
  botGreeting?: string;
  botInstructions?: string;
  address?: string;
  workingHours?: Record<string, Array<{ start: string; end: string }>>;
  servicesOffered?: string[];
  botEnabled?: boolean;
  hasWhatsappNumber?: boolean;
  hasBusinessDescription?: boolean;
}

export const professionalService = {
  list: async () => {
    const { data } = await apiClient.get<Professional[]>('/company/professionals');
    return data;
  },
  create: (data: Partial<Professional>) => apiClient.post<Professional>('/company/professionals', data),
  update: (id: string, data: Partial<Professional>) => apiClient.put<void>(`/company/professionals/${id}`, data),
  delete: (id: string) => apiClient.delete(`/company/professionals/${id}`),
  invite: (id: string, email: string) =>
    apiClient.post<{ status: string }>(`/company/professionals/${id}/invite`, { email }),
  getBotConfig: async () => {
    const { data } = await apiClient.get<BotConfig>('/company/bot-config');
    return data;
  },
  updateBotConfig: async (data: Partial<BotConfig>) => {
    await apiClient.put<void>('/company/bot-config', data);
  },
};
