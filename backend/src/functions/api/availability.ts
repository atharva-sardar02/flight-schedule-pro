/**
 * Availability Lambda API Function
 * Handles HTTP requests for availability management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AvailabilityService } from '../../services/availabilityService';
import { requireAuth } from '../../middleware/auth';
import {
  logLambdaStart,
  logLambdaEnd,
  logAPICall,
  startPerformanceTimer,
  endPerformanceTimer,
} from '../../utils/logger';
import logger from '../../utils/logger';
import { handleLambdaError } from '../../utils/lambdaErrorHandler';
import {
  validateRecurringAvailabilityRequest,
  validateAvailabilityOverrideRequest,
  validateUUIDParam,
} from '../../utils/inputValidation';
import { getDbPool } from '../../utils/db';

/**
 * Main handler for availability API requests
 */
export const availabilityHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logLambdaStart('availabilityAPI', event);

  try {
    // Authenticate request
    const authResult = await requireAuth(event);
    if (!authResult.authorized) {
      return (authResult as any).response;
    }
    const user = (authResult as any).user;

    const availabilityService = new AvailabilityService(getDbPool());
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
    // Log detailed error information
    console.error('=== AVAILABILITY API ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error stack:', error?.stack);
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('=============================');
    
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
      
      // Validate input
      const createValidation = validateRecurringAvailabilityRequest(createData);
      if (!createValidation.valid) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Validation Error',
            message: 'Invalid input data',
            errors: createValidation.errors,
          }),
        };
      }
      
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
      
      // Validate UUID parameter
      const uuidValidation = validateUUIDParam(recurringId, 'recurringId');
      if (!uuidValidation.valid) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Validation Error',
            message: uuidValidation.errors[0],
          }),
        };
      }
      
      const updateData = JSON.parse(event.body || '{}');
      
      // Validate input (partial validation for updates)
      if (updateData.startTime || updateData.endTime) {
        const updateValidation = validateRecurringAvailabilityRequest({
          dayOfWeek: updateData.dayOfWeek || 0,
          startTime: updateData.startTime || '00:00:00',
          endTime: updateData.endTime || '23:59:59',
        });
        if (!updateValidation.valid) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Validation Error',
              message: 'Invalid time format',
              errors: updateValidation.errors,
            }),
          };
        }
      }
      
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

/**
 * Format date as YYYY-MM-DD string using local date components
 * This prevents timezone shifts when serializing to JSON
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format override date as YYYY-MM-DD string using local date components
 * This prevents timezone shifts when serializing to JSON
 */
function formatOverrideDate(overrideDate: Date): string {
  return formatDateLocal(overrideDate);
}

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
      
      // Format override dates as YYYY-MM-DD strings (not ISO strings) to avoid timezone shifts
      const formattedOverrides = overrides.map((override) => ({
        ...override,
        overrideDate: formatOverrideDate(override.overrideDate),
        createdAt: override.createdAt instanceof Date ? override.createdAt.toISOString() : override.createdAt,
      }));
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedOverrides),
      };

    case 'POST':
      // POST /availability/overrides - Create new override
      const createData = JSON.parse(event.body || '{}');
      const newOverride = await service.createAvailabilityOverride(user.id, createData);
      
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOverride,
          overrideDate: formatOverrideDate(newOverride.overrideDate),
          createdAt: newOverride.createdAt instanceof Date ? newOverride.createdAt.toISOString() : newOverride.createdAt,
        }),
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
        body: JSON.stringify({
          ...updatedOverride,
          overrideDate: formatOverrideDate(updatedOverride.overrideDate),
          createdAt: updatedOverride.createdAt instanceof Date ? updatedOverride.createdAt.toISOString() : updatedOverride.createdAt,
        }),
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
  try {
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

    // Serialize dates to YYYY-MM-DD strings using local date components (not UTC)
    const serializedAvailability = {
      ...availability,
      slots: availability.slots.map((slot) => ({
        ...slot,
        date: slot.date instanceof Date ? formatDateLocal(slot.date) : slot.date,
      })),
      recurringPatterns: availability.recurringPatterns.map((pattern) => ({
        ...pattern,
        createdAt: pattern.createdAt instanceof Date ? pattern.createdAt.toISOString() : pattern.createdAt,
        updatedAt: pattern.updatedAt instanceof Date ? pattern.updatedAt.toISOString() : pattern.updatedAt,
      })),
      overrides: availability.overrides.map((override) => ({
        ...override,
        overrideDate: formatOverrideDate(override.overrideDate),
        createdAt: override.createdAt instanceof Date ? override.createdAt.toISOString() : override.createdAt,
      })),
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serializedAvailability),
    };
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    const errorStack = error?.stack || 'No stack trace';
    
    logger.error('Get availability failed', {
      error: errorMessage,
      stack: errorStack,
      userId: user.id,
      queryParams: event.queryStringParameters,
      errorType: error?.constructor?.name,
      errorCode: error?.code,
    });

    console.error('Full error object:', error);
    console.error('Error message:', errorMessage);
    console.error('Error stack:', errorStack);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to get availability',
        message: errorMessage || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
      }),
    };
  }
}

