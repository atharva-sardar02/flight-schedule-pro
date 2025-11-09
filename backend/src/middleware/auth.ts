/**
 * Authentication Middleware
 * JWT validation middleware for Lambda functions
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import AuthService from '../services/authService';
import { User } from '../types/user';
import logger from '../utils/logger';
import { getDbPool } from '../utils/db';

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  user?: User;
}

/**
 * Extract JWT token from Authorization header
 */
export function extractToken(event: APIGatewayProxyEvent): string | null {
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
}

/**
 * Middleware to verify JWT token and attach user to event
 */
export async function requireAuth(
  event: APIGatewayProxyEvent
): Promise<{ authorized: true; user: User } | { authorized: false; response: APIGatewayProxyResult }> {
  try {
    const token = extractToken(event);

    if (!token) {
      logger.warn('Missing authorization token', {
        path: event.path,
        method: event.httpMethod,
      });

      return {
        authorized: false,
        response: {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Unauthorized',
            message: 'Missing authorization token',
          }),
        },
      };
    }

    // Verify token with Cognito
    const cognitoUser = await AuthService.verifyToken(token);

    let user;
    
    // For mock auth, try to find or create user in database
    if (process.env.MOCK_AUTH === 'true') {
      try {
        const pool = getDbPool();
        // Try to find user by email (since we don't have cognito_user_id with mock auth)
        const dbUser = await pool.query(
          'SELECT id, email, first_name, last_name, phone_number, role, training_level, created_at, updated_at FROM users WHERE email = $1',
          [cognitoUser.email]
        );

        if (dbUser.rows.length > 0) {
          // User exists - use database ID
          const userRow = dbUser.rows[0];
          user = {
            id: userRow.id,
            email: userRow.email,
            firstName: userRow.first_name,
            lastName: userRow.last_name,
            phoneNumber: userRow.phone_number,
            role: userRow.role,
            trainingLevel: userRow.training_level,
            createdAt: userRow.created_at,
            updatedAt: userRow.updated_at,
          };
          logger.info('Found user in database for mock auth', { userId: user.id, email: user.email, path: event.path });
        } else {
          // User doesn't exist - create one
          const insertResult = await pool.query(
            `INSERT INTO users (email, first_name, last_name, role, training_level, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             RETURNING id, email, first_name, last_name, phone_number, role, training_level, created_at, updated_at`,
            [cognitoUser.email, cognitoUser.firstName || 'User', cognitoUser.lastName || 'Name', cognitoUser.role, cognitoUser.trainingLevel || null]
          );
          
          const userRow = insertResult.rows[0];
          user = {
            id: userRow.id,
            email: userRow.email,
            firstName: userRow.first_name,
            lastName: userRow.last_name,
            phoneNumber: userRow.phone_number,
            role: userRow.role,
            trainingLevel: userRow.training_level,
            createdAt: userRow.created_at,
            updatedAt: userRow.updated_at,
          };
          logger.info('Created user in database for mock auth', { userId: user.id, email: user.email, path: event.path });
        }
      } catch (dbError: any) {
        // If database fails, fall back to Cognito user info
        logger.warn('Database lookup/create failed for mock auth, using Cognito user info', { 
          error: dbError.message,
          email: cognitoUser.email,
          path: event.path
        });
        user = cognitoUser;
      }
    } else {
      // Look up database user ID using Cognito user ID
      const pool = getDbPool();
      const dbUser = await pool.query(
        'SELECT id, email, first_name, last_name, phone_number, role, training_level, created_at, updated_at FROM users WHERE cognito_user_id = $1',
        [cognitoUser.id]
      );

      if (dbUser.rows.length === 0) {
        // User exists in Cognito but not in database - use Cognito user info
        logger.warn('User found in Cognito but not in database', { cognitoUserId: cognitoUser.id, path: event.path });
        user = cognitoUser;
      } else {
        // Return user with database ID
        const userRow = dbUser.rows[0];
        user = {
          id: userRow.id, // Use database ID, not Cognito ID
          email: userRow.email,
          firstName: userRow.first_name,
          lastName: userRow.last_name,
          phoneNumber: userRow.phone_number,
          role: userRow.role,
          trainingLevel: userRow.training_level,
          createdAt: userRow.created_at,
          updatedAt: userRow.updated_at,
        };
      }
    }

    logger.info('User authenticated', {
      userId: user.id,
      email: user.email,
      role: user.role,
      path: event.path,
    });

    return {
      authorized: true,
      user,
    };
  } catch (error) {
    logger.error('Authentication failed', { error, path: event.path });

    return {
      authorized: false,
      response: {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        }),
      },
    };
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: User, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * Check if MFA is required for user role
 */
export function requiresMFA(user: User): boolean {
  // Admin roles require MFA
  return (user.role as string) === 'ADMIN';
}

/**
 * Verify MFA token (if required)
 * Note: This is a placeholder - actual MFA verification should be done via Cognito
 */
export async function verifyMFA(user: User, mfaToken?: string): Promise<boolean> {
  if (!requiresMFA(user)) {
    return true; // MFA not required for this role
  }

  if (!mfaToken) {
    return false; // MFA required but token not provided
  }

  // In production, verify MFA token with Cognito
  // For now, return true if token is provided
  return mfaToken.length > 0;
}

/**
 * Middleware to check user role
 */
export function requireRole(
  user: User,
  allowedRoles: string[]
): { authorized: true } | { authorized: false; response: APIGatewayProxyResult } {
  if (!hasRole(user, allowedRoles)) {
    logger.warn('Insufficient permissions', {
      userId: user.id,
      userRole: user.role,
      requiredRoles: allowedRoles,
    });

    return {
      authorized: false,
      response: {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'Insufficient permissions',
        }),
      },
    };
  }

  return { authorized: true };
}


