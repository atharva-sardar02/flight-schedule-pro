/**
 * User Types and Interfaces
 * Defines user roles, authentication data structures, and user profile information
 */

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
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
  phoneNumber?: string;
  role: UserRole;
  trainingLevel?: TrainingLevel; // For students and instructors
  createdAt: Date;
  updatedAt: Date;
}

export interface CognitoUser {
  sub: string; // Cognito user ID
  email: string;
  email_verified: boolean;
  'cognito:groups': string[]; // User groups (Students, Instructors, Admins)
  'cognito:username': string;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
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

export interface RefreshTokenRequest {
  refreshToken: string;
}


