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

// Load environment variables from .env file in project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Log environment status
console.log('='.repeat(80));
console.log('🔧 Environment Configuration Check');
console.log('='.repeat(80));
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
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
app.use(cors({
  origin: process.env.VITE_API_BASE_URL?.replace(/:\d+$/, ':3000') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'flight-schedule-pro-backend',
    timestamp: new Date().toISOString()
  });
});

// API Routes (will be added as we build features)
app.get('/api', (req, res) => {
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
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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



