/**
 * Reschedule Lambda API Function
 * Handles HTTP requests for AI rescheduling and preference submission
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Pool } from 'pg';
import { RescheduleEngine } from '../ai/rescheduleEngine';
import { PreferenceRankingService } from '../../services/preferenceRankingService';
import { RescheduleOptionsService } from '../../services/rescheduleOptionsService';
import { requireAuth } from '../../middleware/auth';
import { logInfo, logError } from '../../utils/logger';

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
 * Main handler for reschedule API requests
 */
export const rescheduleHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Reschedule API request:', {
    path: event.path,
    method: event.httpMethod,
  });

  try {
    // Authenticate request
    const user = await requireAuth(event);
    console.log('Authenticated user:', user);

    const dbPool = getPool();
    const method = event.httpMethod;
    const pathSegments = event.path.split('/').filter(Boolean);

    // Route handling
    if (pathSegments.includes('generate')) {
      // POST /reschedule/generate/:bookingId
      return await handleGenerateOptions(event, user, dbPool);
    } else if (pathSegments.includes('options')) {
      // GET /reschedule/options/:bookingId
      return await handleGetOptions(event, user, dbPool);
    } else if (pathSegments.includes('preferences')) {
      // POST /reschedule/preferences - Submit preferences
      // GET /reschedule/preferences/:bookingId - Get preferences
      return await handlePreferences(event, user, dbPool);
    } else if (pathSegments.includes('confirm')) {
      // POST /reschedule/confirm/:bookingId - Confirm final selection
      return await handleConfirmReschedule(event, user, dbPool);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error: any) {
    console.error('Reschedule route error:', error);

    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};

/**
 * Generate reschedule options using AI
 */
async function handleGenerateOptions(
  event: APIGatewayProxyEvent,
  user: any,
  pool: Pool
): Promise<APIGatewayProxyResult> {
  try {
    const bookingId = event.pathParameters?.bookingId;
    if (!bookingId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Booking ID required' }),
      };
    }

    logInfo('Generating reschedule options', { bookingId, userId: user.id });

    const rescheduleEngine = new RescheduleEngine(pool);
    const options = await rescheduleEngine.generateRescheduleOptions(bookingId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        options,
        count: options.length,
      }),
    };
  } catch (error: any) {
    logError('Failed to generate options', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
}

/**
 * Get existing reschedule options for a booking
 */
async function handleGetOptions(
  event: APIGatewayProxyEvent,
  user: any,
  pool: Pool
): Promise<APIGatewayProxyResult> {
  try {
    const bookingId = event.pathParameters?.bookingId;
    if (!bookingId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Booking ID required' }),
      };
    }

    const service = new RescheduleOptionsService(pool);
    const options = await service.getOptionsByBooking(bookingId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options }),
    };
  } catch (error: any) {
    logError('Failed to get options', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
}

/**
 * Handle preference submission and retrieval
 */
async function handlePreferences(
  event: APIGatewayProxyEvent,
  user: any,
  pool: Pool
): Promise<APIGatewayProxyResult> {
  const service = new PreferenceRankingService(pool);

  if (event.httpMethod === 'POST') {
    // Submit preferences
    try {
      const body = JSON.parse(event.body || '{}');
      const preference = await service.submitPreference({
        ...body,
        userId: user.id,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, preference }),
      };
    } catch (error: any) {
      logError('Failed to submit preferences', error);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message }),
      };
    }
  } else if (event.httpMethod === 'GET') {
    // Get preferences for a booking
    try {
      const bookingId = event.pathParameters?.bookingId;
      if (!bookingId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Booking ID required' }),
        };
      }

      const preferences = await service.getPreferencesByBooking(bookingId);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      };
    } catch (error: any) {
      logError('Failed to get preferences', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
}

/**
 * Confirm reschedule and update booking
 */
async function handleConfirmReschedule(
  event: APIGatewayProxyEvent,
  user: any,
  pool: Pool
): Promise<APIGatewayProxyResult> {
  try {
    const bookingId = event.pathParameters?.bookingId;
    if (!bookingId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Booking ID required' }),
      };
    }

    // Resolve final selection using instructor priority
    const preferenceService = new PreferenceRankingService(pool);
    const selectedOptionId = await preferenceService.resolveFinalSelection(bookingId);

    if (!selectedOptionId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No preference selected' }),
      };
    }

    // Get the selected option
    const optionsService = new RescheduleOptionsService(pool);
    const selectedOption = await optionsService.getOption(selectedOptionId);

    if (!selectedOption) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Selected option not found' }),
      };
    }

    // Update booking with new time
    await pool.query(
      `UPDATE bookings
       SET scheduled_time = $1,
           status = 'CONFIRMED',
           updated_at = NOW()
       WHERE id = $2`,
      [selectedOption.suggestedDatetime, bookingId]
    );

    logInfo('Booking rescheduled successfully', {
      bookingId,
      newTime: selectedOption.suggestedDatetime,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        newScheduledTime: selectedOption.suggestedDatetime,
      }),
    };
  } catch (error: any) {
    logError('Failed to confirm reschedule', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
}

