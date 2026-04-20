import { apiClient } from '../../shared/api/api-client';

export interface AdminStats {
  totalUsers: number;
  totalCompanies: number;
  totalProfessionals: number;
  totalAppointments: number;
  subscriptionsByPlan: Array<{ plan: string; status: string; count: string }>;
  recentUsers: Array<{ date: string; count: string }>;
  activeProSubscriptions: number;
  estimatedMRR: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  twoFactorEnabled: boolean;
  subscription: { plan: string; status: string } | null;
  companiesCount: number;
  companies: Array<{ id: string; name: string }>;
  authMethod: 'google' | 'email';
}

export interface AdminCompany {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  subscription: { plan: string; status: string } | null;
  professionalsCount: number;
}

export interface PaginatedResponse<T> {
  pagination: { page: number; limit: number; total: number; totalPages: number };
  [key: string]: any;
}

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const { data } = await apiClient.get<AdminStats>('/admin/stats');
    return data;
  },

  listUsers: async (params?: { search?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ users: AdminUser[]; pagination: PaginatedResponse<AdminUser>['pagination'] }>('/admin/users', { params });
    return data;
  },

  getUser: async (id: string) => {
    const { data } = await apiClient.get(`/admin/users/${id}`);
    return data;
  },

  updateUser: async (id: string, updates: { plan?: string; role?: string }) => {
    const { data } = await apiClient.patch(`/admin/users/${id}`, updates);
    return data;
  },

  impersonateUser: async (id: string) => {
    const { data } = await apiClient.post<{ token: string; user: any; companies: any[] }>(`/admin/users/${id}/impersonate`);
    return data;
  },

  listCompanies: async (params?: { search?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ companies: AdminCompany[]; pagination: PaginatedResponse<AdminCompany>['pagination'] }>('/admin/companies', { params });
    return data;
  },
};
