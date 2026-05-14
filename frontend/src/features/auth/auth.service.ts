import { apiClient } from '../../shared/api/api-client';
import { type LoginInput, type RegisterInput, type AuthUser, type VerifyRegistrationInput } from '@shared/schemas/auth.schema';
import type { Company } from '../company/company.types';
import { companyService } from '../company/company.service';

export interface LoginResponseWithCompanies {
  message: string;
  token?: string;
  user?: AuthUser;
  status?: string;
  tempToken?: string;
  companies?: Company[];
}

export const authService = {
  getAuthUrl: (): { url: string } => {
    return { url: `${apiClient.defaults.baseURL}/auth/google` };
  },

  exchangeCode: async (code: string): Promise<LoginResponseWithCompanies> => {
    const { data } = await apiClient.get(`/auth/google/callback?code=${code}`);
    return data;
  },

  login: async (credentials: LoginInput): Promise<LoginResponseWithCompanies> => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  },

  register: async (userData: RegisterInput): Promise<LoginResponseWithCompanies & { status?: string }> => {
    const { data } = await apiClient.post('/auth/register', userData);
    return data;
  },

  verifyRegistration: async (verificationData: VerifyRegistrationInput): Promise<LoginResponseWithCompanies> => {
    const { data } = await apiClient.post('/auth/register/verify', verificationData);
    return data;
  },

  verify2FA: async (tempToken: string, code: string): Promise<LoginResponseWithCompanies> => {
    const { data } = await apiClient.post('/auth/2fa/login/verify', { tempToken, code });
    return data;
  },

  getMe: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  updateConfig: async (configData: {
    whatsappNumber?: string;
    taxId?: string;
    silentWindowStart?: string;
    silentWindowEnd?: string;
  }): Promise<void> => {
    await apiClient.patch('/auth/config', configData);
  },

  selectCompany: (id: string) => companyService.select(id),
};
