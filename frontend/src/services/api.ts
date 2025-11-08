/**
 * API Configuration
 * Central Axios instance for making API requests
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Use the same key as AuthService
    const token = localStorage.getItem('flight_schedule_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear all tokens and redirect to login
      localStorage.removeItem('flight_schedule_access_token');
      localStorage.removeItem('flight_schedule_refresh_token');
      localStorage.removeItem('flight_schedule_id_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

