/**
 * User Types and Interfaces (Frontend)
 */

export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}

export enum TrainingLevel {
  STUDENT_PILOT = 'student_pilot',
  PRIVATE_PILOT = 'private_pilot',
  INSTRUMENT_RATED = 'instrument_rated',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string; // Computed or optional name field
  phoneNumber?: string;
  role: UserRole;
  trainingLevel?: TrainingLevel;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  trainingLevel?: TrainingLevel;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}


