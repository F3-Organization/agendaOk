import { apiClient } from '../../shared/api/api-client';
import type { Company } from './company.types';

export const companyService = {
  list: () => apiClient.get<{ companies: Company[]; maxCompanies: number }>('/companies'),
  create: (name: string) => apiClient.post<Company>('/companies', { name }),
  select: (id: string) => apiClient.post<{ token: string; company: Company }>(`/companies/${id}/select`),
  update: (id: string, name: string) => apiClient.patch<Company>(`/companies/${id}`, { name }),
  delete: (id: string) => apiClient.delete(`/companies/${id}`),
};
