/**
 * API Configuration
 * Central configuration for API base URL
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: 30000, // 30 seconds
};

export default API_CONFIG;


