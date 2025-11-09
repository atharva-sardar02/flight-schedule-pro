/**
 * Authentication Lambda Function
 * Handles login, register, and token refresh operations
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import AuthService from '../../services/authService';
import { LoginRequest, RegisterRequest, RefreshTokenRequest } from '../../types/user';
import logger, {
  logLambdaStart,
  logLambdaEnd,
  logAPICall,
  startPerformanceTimer,
  endPerformanceTimer,
} from '../../utils/logger';
import { Pool } from 'pg';
import { getDbPool } from '../../utils/db';
import { handleLambdaError } from '../../utils/lambdaErrorHandler';
import { validateLoginRequest, validateRegisterRequest } from '../../utils/inputValidation';

/**
 * Main Lambda handler for authentication operations
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();
  logLambdaStart('authAPI', event);
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    // Handle OPTIONS request (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
      logLambdaEnd('authAPI', true, 200);
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    const path = event.path;
    const method = event.httpMethod;

    logger.info('Auth request received', { path, method });
    startPerformanceTimer(`auth_${method}_${path}`);

    let result: APIGatewayProxyResult;

    // Route to appropriate handler
    // Handle health check - support various path formats from API Gateway
    const normalizedPath = path.toLowerCase().trim();
    const isHealthCheck = normalizedPath === '/' || 
                         normalizedPath === '/health' || 
                         normalizedPath.endsWith('/health') ||
                         normalizedPath === '/flight-schedule-pro-staging-api' ||
                         normalizedPath.endsWith('/flight-schedule-pro-staging-api') ||
                         normalizedPath.includes('health') ||
                         (normalizedPath === '' && method === 'GET');
    
    if (isHealthCheck && method === 'GET') {
      // Health check endpoint
      result = {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          service: 'flight-schedule-pro-api',
          timestamp: new Date().toISOString(),
          path: path, // Include path for debugging
        }),
      };
    } else if (path.endsWith('/login') && method === 'POST') {
      result = await handleLogin(event, headers);
    } else if (path.endsWith('/register') && method === 'POST') {
      result = await handleRegister(event, headers);
    } else if (path.endsWith('/refresh') && method === 'POST') {
      result = await handleRefreshToken(event, headers);
    } else if (path.endsWith('/me') && method === 'GET') {
      result = await handleGetCurrentUser(event, headers);
    } else {
      // Route not found
      result = {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Not Found',
          message: `Route ${method} ${path} not found. Available routes: /health, /auth/login, /auth/register, /auth/refresh, /auth/me`,
        }),
      };
    }

    const duration = endPerformanceTimer(`auth_${method}_${path}`);
    logLambdaEnd('authAPI', true, result.statusCode);
    logAPICall(path, method, result.statusCode, duration);

    return result;
  } catch (error) {
    return handleLambdaError(error, {
      functionName: 'authAPI',
      event,
      defaultStatusCode: 500,
    });
  }
}

/**
 * Handle user login
 */
async function handleLogin(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Request body is required',
        }),
      };
    }

    const credentials: LoginRequest = JSON.parse(event.body);

    // Validate input
    const validation = validateLoginRequest(credentials);
    if (!validation.valid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation Error',
          message: 'Invalid input data',
          errors: validation.errors,
        }),
      };
    }

    // Authenticate with Cognito
    const tokens = await AuthService.login(credentials);

    // Get user details from Cognito
    const cognitoUser = await AuthService.verifyToken(tokens.accessToken);

    // Look up database user ID using Cognito user ID
    let user;
    try {
    const pool = getDbPool();
    const dbUser = await pool.query(
      'SELECT id, email, first_name, last_name, phone_number, role, training_level, created_at, updated_at FROM users WHERE cognito_user_id = $1',
      [cognitoUser.id]
    );

    if (dbUser.rows.length === 0) {
      // User exists in Cognito but not in database - use Cognito user info
      logger.warn('User found in Cognito but not in database', { cognitoUserId: cognitoUser.id });
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
    } catch (dbError: any) {
      // If database table doesn't exist or query fails, use Cognito user info
      logger.warn('Database lookup failed, using Cognito user info', { 
        error: dbError.message,
        cognitoUserId: cognitoUser.id 
      });
      user = cognitoUser;
    }

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user,
        tokens,
      }),
    };
  } catch (error: any) {
    logger.error('Login failed', { error, email: event.body ? JSON.parse(event.body).email : 'unknown' });

    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        error: 'Authentication Failed',
        message: error.message || 'Invalid email or password',
      }),
    };
  }
}

/**
 * Handle user registration
 */
async function handleRegister(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Request body is required',
        }),
      };
    }

    const data: RegisterRequest = JSON.parse(event.body);

    // Log the received data for debugging
    logger.info('Registration request received', { 
      email: data.email, 
      role: data.role,
      roleType: typeof data.role 
    });

    // Validate input
    const validation = validateRegisterRequest(data);
    if (!validation.valid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation Error',
          message: 'Invalid input data',
          errors: validation.errors,
        }),
      };
    }

    // Register user in Cognito
    const result = await AuthService.register(data);

    // Create user record in database
    try {
      const pool = getDbPool();
      const client = await pool.connect();

      try {
        // Check if user already exists (by email or cognito_user_id)
        const existing = await client.query(
          'SELECT id FROM users WHERE email = $1 OR cognito_user_id = $2',
          [data.email, result.userId]
        );

        if (existing.rows.length > 0) {
          logger.info('User already exists in database', { 
            userId: existing.rows[0].id,
            email: data.email,
            cognitoUserId: result.userId
          });
        } else {
          // Ensure role is uppercase to match database constraint
          const roleUpper = (data.role || 'STUDENT').toUpperCase();
          
          await client.query(
            `INSERT INTO users (cognito_user_id, email, first_name, last_name, phone_number, role, training_level, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
            [result.userId, data.email, data.firstName, data.lastName, data.phoneNumber || null, roleUpper, data.trainingLevel || null]
          );
          logger.info('User record created in database', { 
            userId: result.userId,
            email: data.email,
            role: roleUpper
          });
        }
      } finally {
        client.release();
      }
    } catch (dbError: any) {
      logger.error('Failed to create user record in database', { 
        error: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        constraint: dbError.constraint,
        email: data.email,
        cognitoUserId: result.userId,
        role: data.role,
        stack: dbError.stack
      });
      // Don't throw - registration in Cognito succeeded, so return success
      // User can be added to database later via sync or manual process
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'User registered successfully',
        userId: result.userId,
        email: result.email,
      }),
    };
  } catch (error: any) {
    logger.error('Registration failed', { error });

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Registration Failed',
        message: error.message || 'Could not register user',
      }),
    };
  }
}

/**
 * Handle token refresh
 */
async function handleRefreshToken(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Request body is required',
        }),
      };
    }

    const data: RefreshTokenRequest = JSON.parse(event.body);

    if (!data.refreshToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Refresh token is required',
        }),
      };
    }

    // Refresh tokens
    const tokens = await AuthService.refreshToken(data.refreshToken);

    logger.info('Token refreshed successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ tokens }),
    };
  } catch (error: any) {
    logger.error('Token refresh failed', { error });

    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        error: 'Token Refresh Failed',
        message: error.message || 'Invalid refresh token',
      }),
    };
  }
}

/**
 * Get current user details
 */
async function handleGetCurrentUser(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;

    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Missing authorization token',
        }),
      };
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Missing authorization token',
        }),
      };
    }
    const cognitoUser = await AuthService.verifyToken(token);

    // Look up user in database
    try {
    const pool = getDbPool();
    const dbUser = await pool.query(
      'SELECT id, email, first_name, last_name, phone_number, role, training_level, created_at, updated_at FROM users WHERE cognito_user_id = $1',
      [cognitoUser.id]
    );

    if (dbUser.rows.length === 0) {
      // User exists in Cognito but not in database - return Cognito user info
      logger.warn('User found in Cognito but not in database', { cognitoUserId: cognitoUser.id });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: cognitoUser }),
      };
    }

    // Return user with database ID
    const userRow = dbUser.rows[0];
    const user = {
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ user }),
    };
    } catch (dbError: any) {
      // If database table doesn't exist, return Cognito user info
      logger.warn('Database lookup failed, using Cognito user info', { 
        error: dbError.message,
        cognitoUserId: cognitoUser.id 
      });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: cognitoUser }),
      };
    }
  } catch (error: any) {
    logger.error('Get current user failed', { error });

    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      }),
    };
  }
}


