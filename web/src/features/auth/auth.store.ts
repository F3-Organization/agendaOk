import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Company } from '../company/company.types';
import { companyService } from '../company/company.service';
import { queryClient } from '../../app/providers';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  config: {
    whatsappNumber: string | null;
    syncEnabled: boolean;
    silentWindowStart: string;
    silentWindowEnd: string;
  } | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  companies: Company[];
  maxCompanies: number;
  selectedCompany: Company | null;
  setAuth: (user: User, token: string) => void;
  setCompanies: (companies: Company[], maxCompanies?: number) => void;
  selectCompany: (companyId: string) => Promise<void>;
  addCompany: (company: Company) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      companies: [],
      maxCompanies: 1,
      selectedCompany: null,
      setAuth: (user, token) => {
        if (!token) {
          console.warn('[AuthStore] Attempted to setAuth without a token.');
          return;
        }
        localStorage.setItem('auth_token', token);
        set({ user, token, isAuthenticated: true });
      },
      setCompanies: (companies, maxCompanies) => {
        set({ companies, ...(maxCompanies !== undefined && { maxCompanies }) });
      },
      selectCompany: async (companyId: string) => {
        const { data } = await companyService.select(companyId);
        localStorage.setItem('auth_token', data.token);
        const companies = get().companies;
        const company = companies.find((c) => c.id === companyId) ?? data.company;
        set({ token: data.token, selectedCompany: company });
        // Clear all cached queries so pages refetch with new company context
        queryClient.removeQueries();
      },
      addCompany: (company: Company) => {
        set((state) => ({ companies: [...state.companies, company] }));
      },
      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false, companies: [], selectedCompany: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
