import { apiClient } from '../../shared/api/api-client';

export interface Appointment {
  id: string;
  title: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  startAt: string;
  endAt: string;
  clientName?: string;
  clientPhone?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  isOwner?: boolean;
}

export interface CreateAppointmentDto {
  title: string;
  clientName: string;
  clientPhone: string;
  startAt: string;
  endAt: string;
}

export const calendarService = {
  createAppointment: async (data: CreateAppointmentDto): Promise<Appointment> => {
    const response = await apiClient.post('/calendar/appointments', data);
    return response.data;
  },

  updateAppointment: async (id: string, data: CreateAppointmentDto): Promise<Appointment> => {
    const response = await apiClient.put(`/calendar/appointments/${id}`, data);
    return response.data;
  },

  deleteAppointment: async (id: string): Promise<void> => {
    await apiClient.delete(`/calendar/appointments/${id}`);
  },

  acceptInvite: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.patch(`/calendar/appointments/${id}/accept`);
    return response.data;
  },
  declineInvite: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.patch(`/calendar/appointments/${id}/decline`);
    return response.data;
  },

  sync: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/calendar/sync');
    return response.data;
  },

  notify: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/calendar/notify');
    return response.data;
  },

  getAppointments: async (): Promise<Appointment[]> => {
    const response = await apiClient.get('/calendar/appointments');
    return response.data;
  },
};
