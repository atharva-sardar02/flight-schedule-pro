/**
 * Authentication Service
 * Handles AWS Cognito integration for user authentication
 */

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  GetUserCommand,
  AdminConfirmSignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { User, UserRole, AuthTokens, LoginRequest, RegisterRequest, CognitoUser } from '../types/user';
import logger from '../utils/logger';

// Initialize Cognito client lazily to ensure env vars are loaded
let cognitoClient: CognitoIdentityProviderClient | null = null;

function getCognitoClient(): CognitoIdentityProviderClient {
  if (!cognitoClient) {
    cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || process.env.COGNITO_REGION || 'us-east-1',
    });
  }
  return cognitoClient;
}

function getUserPoolId(): string {
  const poolId = process.env.COGNITO_USER_POOL_ID;
  if (!poolId) {
    logger.error('COGNITO_USER_POOL_ID is not set in environment variables');
    throw new Error('COGNITO_USER_POOL_ID is not configured');
  }
  return poolId;
}

function getClientId(): string {
  const clientId = process.env.COGNITO_CLIENT_ID;
  if (!clientId) {
    logger.error('COGNITO_CLIENT_ID is not set in environment variables');
    throw new Error('COGNITO_CLIENT_ID is not configured');
  }
  return clientId;
}

export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(credentials: LoginRequest): Promise<AuthTokens> {
    // Mock authentication for local development
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_AUTH === 'true') {
      logger.info('Using mock authentication for local development', { email: credentials.email });
      
      // Generate mock tokens (simple base64 encoded JSON)
      const mockUser = {
        sub: 'mock-user-id',
        email: credentials.email,
        'cognito:groups': ['STUDENT'],
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      };
      
      const mockAccessToken = Buffer.from(JSON.stringify(mockUser)).toString('base64');
      const mockIdToken = Buffer.from(JSON.stringify({ ...mockUser, 'cognito:username': credentials.email })).toString('base64');
      
      return {
        accessToken: `mock.${mockAccessToken}.token`,
        idToken: `mock.${mockIdToken}.token`,
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
      };
    }

    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: getClientId(),
        AuthParameters: {
          USERNAME: credentials.email,
          PASSWORD: credentials.password,
        },
      });

      const response = await getCognitoClient().send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed');
      }

      return {
        accessToken: response.AuthenticationResult.AccessToken!,
        idToken: response.AuthenticationResult.IdToken!,
        refreshToken: response.AuthenticationResult.RefreshToken!,
        expiresIn: response.AuthenticationResult.ExpiresIn!,
      };
    } catch (error) {
      logger.error('Login failed', { email: credentials.email, error });
      throw error;
    }
  }

  /**
   * Register new user
   */
  static async register(data: RegisterRequest): Promise<{ userId: string; email: string }> {
    // Mock registration for local development
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_AUTH === 'true') {
      logger.info('Using mock registration for local development', { email: data.email });
      
      // Generate a mock user ID
      const mockUserId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        userId: mockUserId,
        email: data.email,
      };
    }

    try {
      // Sign up user in Cognito
      const signUpCommand = new SignUpCommand({
        ClientId: getClientId(),
        Username: data.email,
        Password: data.password,
        UserAttributes: [
          { Name: 'email', Value: data.email },
          { Name: 'given_name', Value: data.firstName },
          { Name: 'family_name', Value: data.lastName },
          ...(data.phoneNumber ? [{ Name: 'phone_number', Value: data.phoneNumber }] : []),
        ],
      });

      const signUpResponse = await getCognitoClient().send(signUpCommand);

      if (!signUpResponse.UserSub) {
        throw new Error('User registration failed');
      }

      // Auto-confirm user in development (skip email verification)
      if (process.env.NODE_ENV === 'development' || process.env.AUTO_CONFIRM_USERS === 'true') {
        try {
          const confirmCommand = new AdminConfirmSignUpCommand({
            UserPoolId: getUserPoolId(),
            Username: data.email,
          });
          await getCognitoClient().send(confirmCommand);
          logger.info('User auto-confirmed (development mode)', { email: data.email });
        } catch (confirmError) {
          logger.warn('Failed to auto-confirm user (may already be confirmed)', {
            email: data.email,
            error: confirmError,
          });
        }
      }

      // Add user to appropriate group based on role
      const groupName = this.getRoleGroupName(data.role);
      await this.addUserToGroup(data.email, groupName);

      logger.info('User registered successfully', {
        userId: signUpResponse.UserSub,
        email: data.email,
        role: data.role,
      });

      return {
        userId: signUpResponse.UserSub,
        email: data.email,
      };
    } catch (error) {
      logger.error('Registration failed', { email: data.email, error });
      throw error;
    }
  }

  /**
   * Verify user JWT token and extract user information
   */
  static async verifyToken(accessToken: string): Promise<User> {
    // Mock token verification for local development
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_AUTH === 'true') {
      if (accessToken.startsWith('mock.')) {
        try {
          // Extract the base64 part from mock token
          const parts = accessToken.split('.');
          if (parts.length === 3 && parts[1]) {
            const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            
            logger.info('Using mock token verification', { email: decoded.email });
            
            return {
              id: decoded.sub || 'mock-user-id',
              email: decoded.email || 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              role: (decoded['cognito:groups']?.[0] || 'STUDENT') as UserRole,
              trainingLevel: undefined,
              phoneNumber: undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
        } catch (error) {
          logger.warn('Failed to decode mock token', { error });
        }
      }
    }

    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await getCognitoClient().send(command);

      if (!response.Username) {
        throw new Error('Invalid token');
      }

      // Extract user attributes
      const attributes = response.UserAttributes || [];
      const getAttr = (name: string) => attributes.find((attr) => attr.Name === name)?.Value;

      const user: User = {
        id: response.Username,
        email: getAttr('email') || '',
        firstName: getAttr('given_name') || '',
        lastName: getAttr('family_name') || '',
        phoneNumber: getAttr('phone_number'),
        role: this.extractRole(getAttr('custom:role')),
        trainingLevel: getAttr('custom:training_level') as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return user;
    } catch (error) {
      logger.error('Token verification failed', { error });
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: getClientId(),
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response = await getCognitoClient().send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Token refresh failed');
      }

      return {
        accessToken: response.AuthenticationResult.AccessToken!,
        idToken: response.AuthenticationResult.IdToken!,
        refreshToken: refreshToken, // Refresh token doesn't change
        expiresIn: response.AuthenticationResult.ExpiresIn!,
      };
    } catch (error) {
      logger.error('Token refresh failed', { error });
      throw error;
    }
  }

  /**
   * Add user to Cognito group
   */
  private static async addUserToGroup(username: string, groupName: string): Promise<void> {
    try {
      const command = new AdminAddUserToGroupCommand({
        UserPoolId: getUserPoolId(),
        Username: username,
        GroupName: groupName,
      });

      await getCognitoClient().send(command);
      logger.info('User added to group', { username, groupName });
    } catch (error) {
      logger.error('Failed to add user to group', { username, groupName, error });
      throw error;
    }
  }

  /**
   * Map user role to Cognito group name
   */
  private static getRoleGroupName(role: UserRole): string {
    switch (role) {
      case UserRole.STUDENT:
        return 'Students';
      case UserRole.INSTRUCTOR:
        return 'Instructors';
      case UserRole.ADMIN:
        return 'Admins';
      default:
        return 'Students'; // Default to Students
    }
  }

  /**
   * Extract role from string
   */
  private static extractRole(roleStr: string | undefined): UserRole {
    if (!roleStr) return UserRole.STUDENT;

    switch (roleStr.toLowerCase()) {
      case 'instructor':
        return UserRole.INSTRUCTOR;
      case 'admin':
        return UserRole.ADMIN;
      default:
        return UserRole.STUDENT;
    }
  }

  /**
   * Decode Cognito JWT token (without verification - use verifyToken for security)
   */
  static decodeCognitoToken(token: string): CognitoUser {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        throw new Error('Invalid token format');
      }
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
      return decoded as CognitoUser;
    } catch (error) {
      logger.error('Token decode failed', { error });
      throw new Error('Invalid token format');
    }
  }
}

export default AuthService;


