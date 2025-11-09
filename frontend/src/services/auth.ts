/**
 * Authentication Service (Frontend)
 * Handles API calls for authentication operations
 */

import axios, { AxiosError } from 'axios';
import { LoginCredentials, RegisterData, AuthResponse, AuthTokens } from '../types/user';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Token storage keys
const ACCESS_TOKEN_KEY = 'flight_schedule_access_token';
const REFRESH_TOKEN_KEY = 'flight_schedule_refresh_token';
const ID_TOKEN_KEY = 'flight_schedule_id_token';

export class AuthService {
  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, credentials);

      // Store tokens
      this.setTokens(response.data.tokens);
      
      // Also store user in localStorage for fallback
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message: string }>;
        throw new Error(axiosError.response?.data?.message || 'Login failed');
      }
      throw error;
    }
  }

  /**
   * Register new user
   */
  static async register(data: RegisterData): Promise<{ userId: string; email: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message: string }>;
        throw new Error(axiosError.response?.data?.message || 'Registration failed');
      }
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<AuthTokens> {
    try {
      const refreshToken = this.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post<{ tokens: AuthTokens }>(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      // Store new tokens
      this.setTokens(response.data.tokens);

      return response.data.tokens;
    } catch (error) {
      // Clear tokens on refresh failure
      this.clearTokens();
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<AuthResponse['user']> {
    try {
      const accessToken = this.getAccessToken();

      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data.user;
    } catch (error) {
      // Don't clear tokens on error - let the caller handle it
      // This prevents automatic logout on network errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message: string }>;
        if (axiosError.response?.status === 401) {
          // Only clear tokens on actual auth failure
          this.clearTokens();
        }
      }
      throw new Error('Failed to get current user');
    }
  }

  /**
   * Logout user
   */
  static logout(): void {
    this.clearTokens();
  }

  /**
   * Store tokens in localStorage
   */
  static setTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(ID_TOKEN_KEY, tokens.idToken);
  }

  /**
   * Get access token
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Get ID token
   */
  static getIdToken(): string | null {
    return localStorage.getItem(ID_TOKEN_KEY);
  }

  /**
   * Clear all tokens
   */
  static clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ID_TOKEN_KEY);
    localStorage.removeItem('user');
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export default AuthService;


