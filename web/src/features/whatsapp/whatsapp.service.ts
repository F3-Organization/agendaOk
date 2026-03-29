import { apiClient } from '../../shared/api/api-client';

export interface WhatsAppQR {
  qrcode: {
    base64: string;
  };
  instance: string;
}

export const whatsappService = {
  connect: async (): Promise<WhatsAppQR> => {
    const response = await apiClient.post('/whatsapp/connect');
    return response.data;
  },

  disconnect: async (): Promise<void> => {
    await apiClient.delete('/whatsapp/disconnect');
  },
};
