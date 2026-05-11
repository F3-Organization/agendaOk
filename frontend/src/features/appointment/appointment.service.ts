import { apiClient } from '../../shared/api/api-client';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Appointment {
  id: string;
  companyId: string;
  clientName: string;
  clientPhone: string;
  title: string;
  startAt: string;
  endAt?: string;
  status: AppointmentStatus;
  isNotified: boolean;
  notes?: string;
  professionalId?: string;
  createdAt: string;
}

export interface AppointmentInput {
  clientName: string;
  clientPhone: string;
  title: string;
  startAt: string;
  endAt?: string;
  notes?: string;
  professionalId?: string;
}

export const appointmentService = {
  getAll: async (): Promise<Appointment[]> => {
    const { data } = await apiClient.get('/appointments');
    return data;
  },

  create: async (input: AppointmentInput): Promise<Appointment> => {
    const { data } = await apiClient.post('/appointments', input);
    return data;
  },

  update: async (id: string, input: Partial<AppointmentInput> & { status?: AppointmentStatus }): Promise<void> => {
    await apiClient.patch(`/appointments/${id}`, input);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/appointments/${id}`);
  },
};
