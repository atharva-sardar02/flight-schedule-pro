/**
 * useAuth Hook
 * Custom hook for authentication state and operations
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthTokens, LoginCredentials, RegisterData, AuthContextType } from '../types/user';
import AuthService from '../services/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      if (AuthService.isAuthenticated()) {
        try {
          const currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // If getCurrentUser fails, try to use stored user data
          console.warn('Failed to fetch current user, checking localStorage', error);
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (e) {
              console.error('Failed to parse stored user', e);
            }
          }
        }

        // Set tokens from localStorage
        const accessToken = AuthService.getAccessToken();
        const refreshToken = AuthService.getRefreshToken();
        const idToken = AuthService.getIdToken();

        if (accessToken && refreshToken && idToken) {
          setTokens({
            accessToken,
            refreshToken,
            idToken,
            expiresIn: 3600, // Default value
          });
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth', error);
      // Don't clear tokens here - let user try to use the app
      // Only clear if we're sure auth is invalid
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await AuthService.login(credentials);
      setUser(response.user);
      setTokens(response.tokens);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await AuthService.register(data);
      // After registration, user needs to log in
    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setTokens(null);
  };

  const refreshToken = async () => {
    try {
      const newTokens = await AuthService.refreshToken();
      setTokens(newTokens);

      // Refresh user data
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Token refresh failed', error);
      logout();
      throw error;
    }
  };

  // Check if authenticated: user exists OR tokens exist (for cases where getCurrentUser fails but tokens are valid)
  const isAuthenticated = !!user || !!(tokens?.accessToken && AuthService.isAuthenticated());

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}


