/**
 * Auth Service Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from '../../../backend/src/services/authService';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { UserRole } from '../../../backend/src/types/user';

// Mock AWS SDK
vi.mock('@aws-sdk/client-cognito-identity-provider');

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockAuthResponse = {
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          IdToken: 'mock-id-token',
          RefreshToken: 'mock-refresh-token',
          ExpiresIn: 3600,
        },
      };

      const mockSend = vi.fn().mockResolvedValue(mockAuthResponse);
      vi.mocked(CognitoIdentityProviderClient.prototype.send).mockImplementation(mockSend);

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'Test123!',
      });

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
      });

      expect(mockSend).toHaveBeenCalledWith(expect.any(InitiateAuthCommand));
    });

    it('should throw error with invalid credentials', async () => {
      const mockSend = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
      vi.mocked(CognitoIdentityProviderClient.prototype.send).mockImplementation(mockSend);

      await expect(
        AuthService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockSignUpResponse = {
        UserSub: 'mock-user-id',
      };

      const mockSend = vi.fn().mockResolvedValue(mockSignUpResponse);
      vi.mocked(CognitoIdentityProviderClient.prototype.send).mockImplementation(mockSend);

      const result = await AuthService.register({
        email: 'newuser@example.com',
        password: 'Test123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      });

      expect(result).toEqual({
        userId: 'mock-user-id',
        email: 'newuser@example.com',
      });

      expect(mockSend).toHaveBeenCalledWith(expect.any(SignUpCommand));
    });

    it('should throw error if registration fails', async () => {
      const mockSend = vi.fn().mockRejectedValue(new Error('Email already exists'));
      vi.mocked(CognitoIdentityProviderClient.prototype.send).mockImplementation(mockSend);

      await expect(
        AuthService.register({
          email: 'existing@example.com',
          password: 'Test123!',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.STUDENT,
        })
      ).rejects.toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify a valid token', async () => {
      const mockGetUserResponse = {
        Username: 'mock-user-id',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'given_name', Value: 'John' },
          { Name: 'family_name', Value: 'Doe' },
          { Name: 'custom:role', Value: 'student' },
        ],
      };

      const mockSend = vi.fn().mockResolvedValue(mockGetUserResponse);
      vi.mocked(CognitoIdentityProviderClient.prototype.send).mockImplementation(mockSend);

      const result = await AuthService.verifyToken('mock-access-token');

      expect(result).toMatchObject({
        id: 'mock-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      });

      expect(mockSend).toHaveBeenCalledWith(expect.any(GetUserCommand));
    });

    it('should throw error with invalid token', async () => {
      const mockSend = vi.fn().mockRejectedValue(new Error('Invalid token'));
      vi.mocked(CognitoIdentityProviderClient.prototype.send).mockImplementation(mockSend);

      await expect(AuthService.verifyToken('invalid-token')).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const mockAuthResponse = {
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 3600,
        },
      };

      const mockSend = vi.fn().mockResolvedValue(mockAuthResponse);
      vi.mocked(CognitoIdentityProviderClient.prototype.send).mockImplementation(mockSend);

      const result = await AuthService.refreshToken('mock-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        idToken: 'new-id-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
      });
    });
  });

  describe('decodeCognitoToken', () => {
    it('should decode JWT token', () => {
      // Create a mock JWT token (header.payload.signature)
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        'cognito:groups': ['Students'],
      };

      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const mockToken = `header.${encodedPayload}.signature`;

      const result = AuthService.decodeCognitoToken(mockToken);

      expect(result).toMatchObject({
        sub: 'user-123',
        email: 'test@example.com',
        'cognito:groups': ['Students'],
      });
    });

    it('should throw error with invalid token format', () => {
      expect(() => AuthService.decodeCognitoToken('invalid-token')).toThrow('Invalid token format');
    });
  });
});


