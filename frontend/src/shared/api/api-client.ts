import axios from 'axios';
import i18n from 'i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token and locale
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Send current UI language as Accept-Language for i18n backend errors
    const lang = i18n.language || 'pt';
    config.headers['Accept-Language'] = lang.startsWith('en') ? 'en' : 'pt-BR';

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Redirect to login if on protected route (handled by router/store usually)
    }
    return Promise.reject(error);
  }
);
