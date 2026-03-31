import { apiClient } from '../../shared/api/api-client';
import { type LoginInput, type RegisterInput, type AuthUser, type LoginResponse, type VerifyRegistrationInput } from '@shared/schemas/auth.schema';

export const authService = {
  getAuthUrl: (): { url: string } => {
    return { url: `${apiClient.defaults.baseURL}/auth/google` };
  },

  exchangeCode: async (code: string): Promise<LoginResponse> => {
    const { data } = await apiClient.get(`/auth/google/callback?code=${code}`);
    return data;
  },

  login: async (credentials: LoginInput): Promise<LoginResponse> => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  },

  register: async (userData: RegisterInput): Promise<LoginResponse & { status?: string }> => {
    const { data } = await apiClient.post('/auth/register', userData);
    return data;
  },

  verifyRegistration: async (verificationData: VerifyRegistrationInput): Promise<LoginResponse> => {
    const { data } = await apiClient.post('/auth/register/verify', verificationData);
    return data;
  },

  getMe: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  updateConfig: async (configData: { whatsappNumber?: string; syncEnabled?: boolean }): Promise<void> => {
    await apiClient.patch('/auth/config', configData);
  },
};

