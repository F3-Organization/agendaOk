import { apiClient } from '../../shared/api/api-client';

export interface WhatsAppQR {
  instance: string;
  base64: string;
  code: string;
}

export interface WhatsAppStatus {
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | string;
  instanceName: string | null;
}

export const whatsappService = {
  getStatus: async (): Promise<WhatsAppStatus> => {
    const response = await apiClient.get('/whatsapp/status');
    return response.data;
  },

  connect: async (): Promise<WhatsAppQR> => {
    const response = await apiClient.post('/whatsapp/connect');
    return response.data;
  },

  disconnect: async (): Promise<void> => {
    await apiClient.delete('/whatsapp/disconnect');
  },
};
