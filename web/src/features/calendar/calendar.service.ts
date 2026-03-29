import { apiClient } from '../../shared/api/api-client';

export interface Appointment {
  id: string;
  title: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  startAt: string;
  endAt: string;
  clientName: string;
  clientPhone: string;
}

export const calendarService = {
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
