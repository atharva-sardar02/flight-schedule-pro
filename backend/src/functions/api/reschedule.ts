/**
 * Reschedule Lambda API Function
 * Handles HTTP requests for AI rescheduling and preference submission
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Pool } from 'pg';
import { RescheduleEngine } from '../ai/rescheduleEngine';
import { PreferenceRankingService } from '../../services/preferenceRankingService';
import { RescheduleOptionsService } from '../../services/rescheduleOptionsService';
import { WeatherService } from '../../services/weatherService';
import { EmailService } from '../notifications/emailService';
import { requireAuth } from '../../middleware/auth';
import {
  logInfo,
  logError,
  logLambdaStart,
  logLambdaEnd,
  logAPICall,
  startPerformanceTimer,
  endPerformanceTimer,
} from '../../utils/logger';
import { AuditService } from '../../services/auditService';
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
 * Main handler for reschedule API requests
 */
export const rescheduleHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logLambdaStart('rescheduleAPI', event);

  try {
    // Authenticate request
    const authResult = await requireAuth(event);
    
    if (!authResult.authorized) {
      return authResult.response;
    }
    
    const user = authResult.user;

    const dbPool = getPool();
    const method = event.httpMethod;
    const pathSegments = event.path.split('/').filter(Boolean);

    startPerformanceTimer(`reschedule_${method}_${event.path}`);

    let result: APIGatewayProxyResult;

    // Route handling
    if (pathSegments.includes('generate')) {
      // POST /reschedule/generate/:bookingId
      result = await handleGenerateOptions(event, user, dbPool);
    } else if (pathSegments.includes('options')) {
      // GET /reschedule/options/:bookingId
      result = await handleGetOptions(event, user, dbPool);
    } else if (pathSegments.includes('preferences')) {
      // POST /reschedule/preferences - Submit preferences
      // GET /reschedule/preferences/:bookingId - Get preferences
      result = await handlePreferences(event, user, dbPool);
    } else if (pathSegments.includes('confirm')) {
      // POST /reschedule/confirm/:bookingId - Confirm final selection
      result = await handleConfirmReschedule(event, user, dbPool);
    } else {
      result = {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not found' }),
      };
    }

    const duration = endPerformanceTimer(`reschedule_${method}_${event.path}`);
    logLambdaEnd('rescheduleAPI', true, result.statusCode);
    logAPICall(event.path, method, result.statusCode, duration);

    return result;
  } catch (error: any) {
    return handleLambdaError(error, {
      functionName: 'rescheduleAPI',
      event,
      defaultStatusCode: error.message === 'Unauthorized' ? 401 : 500,
    });
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
    // Extract bookingId from path parameters or path segments
    let bookingId = event.pathParameters?.bookingId;
    
    // If not in pathParameters, try to extract from path
    if (!bookingId) {
      const pathSegments = event.path.split('/').filter(Boolean);
      const generateIndex = pathSegments.indexOf('generate');
      if (generateIndex >= 0 && generateIndex < pathSegments.length - 1) {
        bookingId = pathSegments[generateIndex + 1];
      }
    }
    
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
 * Confirm reschedule and update booking with weather re-validation
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

    // Get booking details
    const bookingResult = await pool.query(
      `SELECT b.*, 
              s.email as student_email, s.name as student_name,
              i.email as instructor_email, i.name as instructor_name
       FROM bookings b
       JOIN users s ON b.student_id = s.id
       JOIN users i ON b.instructor_id = i.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Booking not found' }),
      };
    }

    const booking = bookingResult.rows[0];

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

    // RE-VALIDATE WEATHER before confirmation
    logInfo('Re-validating weather before confirmation', {
      bookingId,
      newTime: selectedOption.suggestedDatetime,
    });

    // Re-validate weather using booking airports
    const weatherService = new WeatherService();
    // Get weather for departure and arrival airports
    const departureCoords = { latitude: booking.departure_latitude, longitude: booking.departure_longitude };
    const arrivalCoords = { latitude: booking.arrival_latitude, longitude: booking.arrival_longitude };
    const departureWeather = await weatherService.getWeather(departureCoords);
    const arrivalWeather = await weatherService.getWeather(arrivalCoords);
    
    // Simple validation - check if weather is acceptable
    const weatherValid = {
      isValid: departureWeather.visibility >= 3 && arrivalWeather.visibility >= 3,
      reason: departureWeather.visibility < 3 ? 'Low visibility at departure' : 
              arrivalWeather.visibility < 3 ? 'Low visibility at arrival' : 'Weather acceptable'
    };

    if (!weatherValid.isValid) {
      logInfo('Weather re-validation failed - option no longer suitable', {
        bookingId,
        newTime: selectedOption.suggestedDatetime,
        reason: weatherValid.reason,
      });

      // Audit log
      const auditService = new AuditService(pool);
      await auditService.logEvent({
        entityType: 'booking',
        entityId: bookingId,
        eventType: 'reschedule_revalidation_failed',
        userId: user.id,
        metadata: {
          selectedOptionId,
          newTime: selectedOption.suggestedDatetime,
          reason: weatherValid.reason,
          weatherValid: weatherValid.isValid,
        },
      });

      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Weather conditions no longer suitable',
          reason: weatherValid.reason,
          weatherValid: weatherValid.isValid,
          requiresNewOptions: true,
        }),
      };
    }

    logInfo('Weather re-validation passed - proceeding with confirmation', {
      bookingId,
      newTime: selectedOption.suggestedDatetime,
    });

    // Update booking with new time
    await pool.query(
      `UPDATE bookings
       SET scheduled_time = $1,
           status = 'CONFIRMED',
           updated_at = NOW()
       WHERE id = $2`,
      [selectedOption.suggestedDatetime, bookingId]
    );

    // Audit log
    const auditService2 = new AuditService(pool);
    await auditService2.logEvent({
      eventType: 'booking_rescheduled',
      entityType: 'booking',
      entityId: bookingId,
      userId: user.id,
      metadata: {
        oldTime: booking.scheduled_time,
        newTime: selectedOption.suggestedDatetime,
        selectedOptionId,
        weatherRevalidated: true,
      },
    });

    // Send confirmation notifications
    const emailService = new EmailService();
    
    // Notify student
    await emailService.sendConfirmation(
      booking.student_email,
      booking.student_name,
      {
        newScheduledTime: new Date(selectedOption.suggestedDatetime),
        departureAirport: booking.departure_airport,
        arrivalAirport: booking.arrival_airport,
      }
    );

    // Notify instructor
    await emailService.sendConfirmation(
      booking.instructor_email,
      booking.instructor_name,
      {
        newScheduledTime: new Date(selectedOption.suggestedDatetime),
        departureAirport: booking.departure_airport,
        arrivalAirport: booking.arrival_airport,
      }
    );

    logInfo('Booking rescheduled successfully with notifications sent', {
      bookingId,
      newTime: selectedOption.suggestedDatetime,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        newScheduledTime: selectedOption.suggestedDatetime,
        weatherRevalidated: true,
        notificationsSent: true,
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

