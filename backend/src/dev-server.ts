import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import logger from './utils/logger';
import { handler as authHandler } from './functions/api/auth';
import { handler as bookingsHandler } from './functions/api/bookings';
import { availabilityHandler } from './functions/api/availability';
import { rescheduleHandler } from './functions/api/reschedule';
import { preferencesHandler } from './functions/api/preferences';
import { AdminConfirmSignUpCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import AuthService from './services/authService';
import { getDbPool } from './utils/db';

// Load environment variables from .env file in backend directory
// When compiled, __dirname is dist/, so ../.env points to backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Log environment status
console.log('='.repeat(80));
console.log('🔧 Environment Configuration Check');
console.log('='.repeat(80));
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('MOCK_AUTH:', process.env.MOCK_AUTH || 'false');
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('COGNITO_USER_POOL_ID:', process.env.COGNITO_USER_POOL_ID);
console.log('COGNITO_CLIENT_ID:', process.env.COGNITO_CLIENT_ID ? '✅ Set' : '❌ Not Set');
console.log('DATABASE_HOST:', process.env.DATABASE_HOST);
console.log('DATABASE_NAME:', process.env.DATABASE_NAME);
console.log('='.repeat(80));
console.log('');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration
// Support multiple origins: localhost for dev, S3/CloudFront for production
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      process.env.VITE_API_BASE_URL?.replace(/:\d+$/, ':3000') || 'http://localhost:3000',
      'http://localhost:3000' // Always allow localhost for development
    ];

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, be more permissive
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Health check endpoint (Express route)
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'flight-schedule-pro-backend',
    timestamp: new Date().toISOString()
  });
});

// Database health check endpoint
app.get('/health/db', async (_req, res) => {
  try {
    const pool = getDbPool();
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    const tableCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    res.json({
      status: 'connected',
      database: process.env.DATABASE_NAME,
      host: process.env.DATABASE_HOST,
      currentTime: result.rows[0].current_time,
      postgresVersion: result.rows[0].postgres_version.split(' ')[0] + ' ' + result.rows[0].postgres_version.split(' ')[1],
      tablesCount: parseInt(tableCount.rows[0].count),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Test route: Health check through auth handler (simulates Lambda behavior)
app.get('/test-health', async (req, res) => {
  try {
    const event = {
      httpMethod: 'GET',
      path: '/health', // Simulate Lambda path
      pathParameters: null,
      queryStringParameters: req.query,
      headers: req.headers as { [key: string]: string },
      body: null,
      isBase64Encoded: false,
      requestContext: {},
      resource: '',
      stageVariables: null,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null
    };

    const result = await authHandler(event as any);
    res.status(result.statusCode);
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value as string);
      });
    }
    res.send(result.body);
  } catch (error) {
    logger.error('Test health route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test route: Root path through auth handler (simulates API Gateway behavior)
// Temporary endpoint to list users (for testing)
app.get('/api/users/list', async (_req, res) => {
  try {
    const pool = getDbPool();
    const result = await pool.query(
      'SELECT id, email, role, first_name, last_name FROM users ORDER BY created_at DESC LIMIT 50'
    );
    res.json({ users: result.rows });
  } catch (error) {
    logger.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/test-root', async (req, res) => {
  try {
    const event = {
      httpMethod: 'GET',
      path: '/flight-schedule-pro-staging-api', // Simulate API Gateway path
      pathParameters: null,
      queryStringParameters: req.query,
      headers: req.headers as { [key: string]: string },
      body: null,
      isBase64Encoded: false,
      requestContext: {},
      resource: '',
      stageVariables: null,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null
    };

    const result = await authHandler(event as any);
    res.status(result.statusCode);
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value as string);
      });
    }
    res.send(result.body);
  } catch (error) {
    logger.error('Test root route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Development-only: Confirm user endpoint (for testing)
  if (process.env.NODE_ENV === 'development') {
    app.post('/dev/confirm-user', async (req, res) => {
      try {
        const { email } = req.body;
        if (!email) {
          res.status(400).json({ error: 'Email is required' });
          return;
        }

        const client = new CognitoIdentityProviderClient({
          region: process.env.AWS_REGION || 'us-east-1',
        });

        const command = new AdminConfirmSignUpCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID!,
          Username: email,
        });

        await client.send(command);
        logger.info('User confirmed via dev endpoint', { email });
        res.json({ success: true, message: `User ${email} confirmed successfully` });
      } catch (error: any) {
        logger.error('Failed to confirm user', { error });
        res.status(500).json({ error: error.message || 'Failed to confirm user' });
      }
    });

    // Sync current user from Cognito to database
    app.post('/dev/sync-user', async (req, res) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          res.status(401).json({ error: 'Authorization header required' });
          return;
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
          res.status(401).json({ error: 'Token required' });
          return;
        }

        // Get user from Cognito
        const user = await AuthService.verifyToken(token);

        // Check if user exists in database
        const pool = getDbPool();
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE cognito_user_id = $1',
          [user.id]
        );

        if (existingUser.rows.length > 0) {
          res.json({
            success: true,
            message: 'User already exists in database',
            userId: existingUser.rows[0].id,
          });
          return;
        }

        // Create user record in database
        const result = await pool.query(
          `INSERT INTO users (cognito_user_id, email, first_name, last_name, phone_number, role, training_level, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           RETURNING id`,
          [
            user.id,
            user.email,
            user.firstName,
            user.lastName,
            user.phoneNumber || null,
            user.role,
            user.trainingLevel || null,
          ]
        );

        logger.info('User synced to database', { userId: result.rows[0].id, email: user.email });
        res.json({
          success: true,
          message: 'User synced to database successfully',
          userId: result.rows[0].id,
        });
      } catch (error: any) {
        logger.error('Failed to sync user', { error });
        res.status(500).json({ error: error.message || 'Failed to sync user' });
      }
    });
  }

// API Routes (will be added as we build features)
app.get('/api', (_req, res) => {
  res.json({ 
    message: 'Flight Schedule Pro API',
    version: '0.1.0',
    endpoints: [
      'GET /health - Health check',
      'GET /api - API info',
      'POST /auth/register - User registration',
      'POST /auth/login - User login',
      'POST /auth/refresh - Refresh token',
      'GET /auth/me - Get current user',
      'GET /bookings - List bookings',
      'POST /bookings - Create booking',
      'GET /bookings/:id - Get booking',
      'PUT /bookings/:id - Update booking',
      'DELETE /bookings/:id - Delete booking',
      'POST /bookings/:id/cancel - Cancel booking',
      'GET /availability - Get availability',
      'GET /availability/recurring - List recurring patterns',
      'POST /availability/recurring - Create recurring pattern',
      'PUT /availability/recurring/:id - Update recurring pattern',
      'DELETE /availability/recurring/:id - Delete recurring pattern',
      'GET /availability/overrides - List overrides',
      'POST /availability/overrides - Create override',
      'PUT /availability/overrides/:id - Update override',
      'DELETE /availability/overrides/:id - Delete override',
      'POST /reschedule/generate/:bookingId - Generate AI options',
      'GET /reschedule/options/:bookingId - Get reschedule options',
      'POST /reschedule/preferences - Submit preferences',
      'GET /reschedule/preferences/:bookingId - Get preferences',
      'POST /reschedule/confirm/:bookingId - Confirm reschedule',
      'POST /preferences/submit - Submit preference ranking',
      'GET /preferences/booking/:bookingId - Get all preferences',
      'GET /preferences/my/:bookingId - Get my preference',
      'POST /preferences/escalate/:bookingId - Manual escalation (admin)'
    ]
  });
});

// Auth Routes
app.use('/auth', async (req, res) => {
  try {
    // Convert Express request to Lambda event format
    const event = {
      httpMethod: req.method,
      path: req.path,
      pathParameters: null,
      queryStringParameters: req.query,
      headers: req.headers as { [key: string]: string },
      body: JSON.stringify(req.body),
      isBase64Encoded: false,
      requestContext: {},
      resource: '',
      stageVariables: null,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null
    };

    const result = await authHandler(event as any);
    
    // Convert Lambda response to Express response
    res.status(result.statusCode);
    
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value as string);
      });
    }
    
    res.send(result.body);
  } catch (error) {
    logger.error('Auth route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bookings Routes
app.use('/bookings/:id?/:action?', async (req, res) => {
  try {
    const event = {
      httpMethod: req.method,
      path: `/bookings${req.params.id ? `/${req.params.id}` : ''}${req.params.action ? `/${req.params.action}` : ''}`,
      pathParameters: req.params.id ? { id: req.params.id } : null,
      queryStringParameters: req.query,
      headers: req.headers as { [key: string]: string },
      body: req.body ? JSON.stringify(req.body) : null,
      isBase64Encoded: false,
      requestContext: {},
      resource: '',
      stageVariables: null,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null
    };

    const result = await bookingsHandler(event as any);
    
    res.status(result.statusCode);
    
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value as string);
      });
    }
    
    res.send(result.body);
  } catch (error) {
    logger.error('Bookings route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Availability Routes
app.use('/availability/:type?/:id?', async (req, res) => {
  try {
    let path = '/availability';
    if (req.params.type) {
      path += `/${req.params.type}`;
      if (req.params.id) {
        path += `/${req.params.id}`;
      }
    }

    const event = {
      httpMethod: req.method,
      path: path,
      pathParameters: req.params.id ? { id: req.params.id } : null,
      queryStringParameters: req.query,
      headers: req.headers as { [key: string]: string },
      body: req.body ? JSON.stringify(req.body) : null,
      isBase64Encoded: false,
      requestContext: {},
      resource: '',
      stageVariables: null,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null
    };

    const result = await availabilityHandler(event as any);
    
    res.status(result.statusCode);
    
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value as string);
      });
    }
    
    res.send(result.body);
  } catch (error) {
    logger.error('Availability route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reschedule Routes
app.use('/reschedule/:action?/:bookingId?', async (req, res) => {
  try {
    let path = '/reschedule';
    if (req.params.action) {
      path += `/${req.params.action}`;
      if (req.params.bookingId) {
        path += `/${req.params.bookingId}`;
      }
    }

    const event = {
      httpMethod: req.method,
      path: path,
      pathParameters: req.params.bookingId ? { bookingId: req.params.bookingId } : null,
      queryStringParameters: req.query,
      headers: req.headers as { [key: string]: string },
      body: req.body ? JSON.stringify(req.body) : null,
      isBase64Encoded: false,
      requestContext: {},
      resource: '',
      stageVariables: null,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null
    };

    const result = await rescheduleHandler(event as any);
    
    res.status(result.statusCode);
    
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value as string);
      });
    }
    
    res.send(result.body);
  } catch (error) {
    logger.error('Reschedule route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Preferences Routes
app.use('/preferences/:action?/:bookingId?', async (req, res) => {
  try {
    let path = '/preferences';
    if (req.params.action) {
      path += `/${req.params.action}`;
      if (req.params.bookingId) {
        path += `/${req.params.bookingId}`;
      }
    }

    const event = {
      httpMethod: req.method,
      path: path,
      pathParameters: req.params.bookingId ? { bookingId: req.params.bookingId } : null,
      queryStringParameters: req.query,
      headers: req.headers as { [key: string]: string },
      body: req.body ? JSON.stringify(req.body) : null,
      isBase64Encoded: false,
      requestContext: {},
      resource: '',
      stageVariables: null,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null
    };

    const result = await preferencesHandler(event as any);
    
    res.status(result.statusCode);
    
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value as string);
      });
    }
    
    res.send(result.body);
  } catch (error) {
    logger.error('Preferences route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Backend development server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API info: http://localhost:${PORT}/api`);
});

export default app;



