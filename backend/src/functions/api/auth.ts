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
    if (path.endsWith('/login') && method === 'POST') {
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
          message: `Route ${method} ${path} not found`,
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
    if (!credentials.email || !credentials.password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Email and password are required',
        }),
      };
    }

    // Authenticate with Cognito
    const tokens = await AuthService.login(credentials);

    // Get user details
    const user = await AuthService.verifyToken(tokens.accessToken);

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
    if (!data.email || !data.password || !data.firstName || !data.lastName || !data.role) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Email, password, firstName, lastName, and role are required',
        }),
      };
    }

    // Register user in Cognito
    const result = await AuthService.register(data);

    // Create user record in database
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query(
        `INSERT INTO users (cognito_user_id, email, first_name, last_name, phone_number, role, training_level, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [result.userId, data.email, data.firstName, data.lastName, data.phoneNumber || null, data.role, data.trainingLevel || null]
      );

      logger.info('User record created in database', { userId: result.userId });
    } finally {
      client.release();
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
    const user = await AuthService.verifyToken(token);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ user }),
    };
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


