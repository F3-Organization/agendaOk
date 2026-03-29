import { apiClient } from '../../shared/api/api-client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const authService = {
  getAuthUrl: async (): Promise<{ url: string }> => {
    const response = await apiClient.get('/auth/google');
    // Note: The controller actually redirects (302), so if we use a Link it works. 
    // If we want the URL specifically, we'd need to adjust the backend or just use window.location.href.
    return { url: `${apiClient.defaults.baseURL}/auth/google` };
  },

  exchangeCode: async (code: string): Promise<{ token: string; user: User }> => {
    const { data } = await apiClient.get(`/auth/google/callback?code=${code}`);
    return data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
