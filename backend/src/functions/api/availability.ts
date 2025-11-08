/**
 * Availability Lambda API Function
 * Handles HTTP requests for availability management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Pool } from 'pg';
import { AvailabilityService } from '../../services/availabilityService';
import { requireAuth } from '../../middleware/auth';
import {
  logLambdaStart,
  logLambdaEnd,
  logAPICall,
  startPerformanceTimer,
  endPerformanceTimer,
} from '../../utils/logger';
import { handleLambdaError } from '../../utils/lambdaErrorHandler';

// Initialize database pool
let pool: Pool;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

/**
 * Main handler for availability API requests
 */
export const availabilityHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();
  logLambdaStart('availabilityAPI', event);

  try {
    // Authenticate request
    const user = await requireAuth(event);

    const availabilityService = new AvailabilityService(getPool());
    const method = event.httpMethod;
    const pathSegments = event.path.split('/').filter(Boolean);

    startPerformanceTimer(`availability_${method}_${event.path}`);

    let result: APIGatewayProxyResult;

    // Route handling
    if (pathSegments.includes('recurring')) {
      result = await handleRecurringAvailability(event, user, availabilityService);
    } else if (pathSegments.includes('overrides')) {
      result = await handleAvailabilityOverrides(event, user, availabilityService);
    } else if (method === 'GET' && pathSegments.length === 1) {
      // GET /availability - Get computed availability
      result = await handleGetAvailability(event, user, availabilityService);
    } else {
      result = {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not found' }),
      };
    }

    const duration = endPerformanceTimer(`availability_${method}_${event.path}`);
    logLambdaEnd('availabilityAPI', true, result.statusCode);
    logAPICall(event.path, method, result.statusCode, duration);

    return result;
  } catch (error: any) {
    return handleLambdaError(error, {
      functionName: 'availabilityAPI',
      event,
      defaultStatusCode: error.message === 'Unauthorized' ? 401 : 500,
    });
  }
};

// ============================================================================
// RECURRING AVAILABILITY HANDLERS
// ============================================================================

async function handleRecurringAvailability(
  event: APIGatewayProxyEvent,
  user: any,
  service: AvailabilityService
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const pathSegments = event.path.split('/').filter(Boolean);
  const recurringId = pathSegments[pathSegments.length - 1];

  switch (method) {
    case 'GET':
      // GET /availability/recurring - List all recurring patterns
      const patterns = await service.getRecurringAvailability(user.id);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patterns),
      };

    case 'POST':
      // POST /availability/recurring - Create new recurring pattern
      const createData = JSON.parse(event.body || '{}');
      const newPattern = await service.createRecurringAvailability(user.id, createData);
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPattern),
      };

    case 'PUT':
      // PUT /availability/recurring/:id - Update recurring pattern
      if (recurringId === 'recurring') {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Recurring availability ID required' }),
        };
      }
      const updateData = JSON.parse(event.body || '{}');
      const updatedPattern = await service.updateRecurringAvailability(
        recurringId,
        user.id,
        updateData
      );
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPattern),
      };

    case 'DELETE':
      // DELETE /availability/recurring/:id - Delete recurring pattern
      if (recurringId === 'recurring') {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Recurring availability ID required' }),
        };
      }
      await service.deleteRecurringAvailability(recurringId, user.id);
      return {
        statusCode: 204,
        headers: { 'Content-Type': 'application/json' },
        body: '',
      };

    default:
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
  }
}

// ============================================================================
// AVAILABILITY OVERRIDE HANDLERS
// ============================================================================

async function handleAvailabilityOverrides(
  event: APIGatewayProxyEvent,
  user: any,
  service: AvailabilityService
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const pathSegments = event.path.split('/').filter(Boolean);
  const overrideId = pathSegments[pathSegments.length - 1];

  switch (method) {
    case 'GET':
      // GET /availability/overrides?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
      const startDate = event.queryStringParameters?.startDate;
      const endDate = event.queryStringParameters?.endDate;

      if (!startDate || !endDate) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'startDate and endDate query parameters required' }),
        };
      }

      const overrides = await service.getAvailabilityOverrides(user.id, startDate, endDate);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrides),
      };

    case 'POST':
      // POST /availability/overrides - Create new override
      const createData = JSON.parse(event.body || '{}');
      const newOverride = await service.createAvailabilityOverride(user.id, createData);
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOverride),
      };

    case 'PUT':
      // PUT /availability/overrides/:id - Update override
      if (overrideId === 'overrides') {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Override ID required' }),
        };
      }
      const updateData = JSON.parse(event.body || '{}');
      const updatedOverride = await service.updateAvailabilityOverride(
        overrideId,
        user.id,
        updateData
      );
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOverride),
      };

    case 'DELETE':
      // DELETE /availability/overrides/:id - Delete override
      if (overrideId === 'overrides') {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Override ID required' }),
        };
      }
      await service.deleteAvailabilityOverride(overrideId, user.id);
      return {
        statusCode: 204,
        headers: { 'Content-Type': 'application/json' },
        body: '',
      };

    default:
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
  }
}

// ============================================================================
// COMPUTED AVAILABILITY HANDLER
// ============================================================================

async function handleGetAvailability(
  event: APIGatewayProxyEvent,
  user: any,
  service: AvailabilityService
): Promise<APIGatewayProxyResult> {
  // GET /availability?userId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
  const queryUserId = event.queryStringParameters?.userId || user.id;
  const startDate = event.queryStringParameters?.startDate;
  const endDate = event.queryStringParameters?.endDate;

  if (!startDate || !endDate) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'startDate and endDate query parameters required' }),
    };
  }

  // Validate date range (max 90 days)
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays > 90) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Date range cannot exceed 90 days' }),
    };
  }

  const availability = await service.getAvailability({
    userId: queryUserId,
    startDate,
    endDate,
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(availability),
  };
}

