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
import { AvailabilityService } from '../../services/availabilityService';
import { format } from 'date-fns';
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
    // Use the same environment variable names as the main db.ts
    pool = new Pool({
      host: process.env.DATABASE_HOST || process.env.DB_HOST,
      port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432'),
      database: process.env.DATABASE_NAME || process.env.DB_NAME,
      user: process.env.DATABASE_USER || process.env.DB_USER,
      password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } // Allow self-signed certificates for RDS
        : undefined,
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
      // TypeScript type narrowing: when authorized is false, response exists
      return (authResult as { authorized: false; response: APIGatewayProxyResult }).response;
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
    await rescheduleEngine.generateRescheduleOptions(bookingId);

    // Get booking details for airport info
    const bookingResult = await pool.query(
      'SELECT student_id, instructor_id, scheduled_datetime, departure_airport, arrival_airport FROM bookings WHERE id = $1',
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

    // Fetch options from database to ensure proper format (dates as ISO strings)
    const optionsService = new RescheduleOptionsService(pool);
    const options = await optionsService.getOptionsByBooking(bookingId);

    // Create preference rankings for both student and instructor
    // This allows both parties to submit their preferences
    try {
      const scheduledTime = new Date(booking.scheduled_datetime);
      const preferenceService = new PreferenceRankingService(pool);
      
      await preferenceService.createPreferenceRankings(
        bookingId,
        booking.student_id,
        booking.instructor_id,
        scheduledTime
      );
      
      logInfo('Preference rankings created for student and instructor', {
        bookingId,
        studentId: booking.student_id,
        instructorId: booking.instructor_id,
      });
    } catch (error: any) {
      // Log but don't fail - preferences can be created later if needed
      logError('Failed to create preference rankings (non-critical)', error, { bookingId });
    }

    // Map to frontend format (convert Date objects to ISO strings)
    const formattedOptions = options.map(opt => {
      // Parse weather forecast to calculate weather score
      let weatherScore = 0.7; // Default
      try {
        const weatherForecast = typeof opt.weatherForecast === 'string' 
          ? JSON.parse(opt.weatherForecast) 
          : opt.weatherForecast;
        if (weatherForecast && Array.isArray(weatherForecast) && weatherForecast.length > 0) {
          // Calculate average weather score from forecast
          const scores = weatherForecast.map((w: any) => w.score || 0.7);
          weatherScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
        }
      } catch (e) {
        // Use default if parsing fails
      }

      return {
        id: opt.id,
        bookingId: opt.bookingId,
        suggestedDatetime: opt.suggestedDatetime instanceof Date 
          ? opt.suggestedDatetime.toISOString() 
          : new Date(opt.suggestedDatetime).toISOString(),
        departureAirport: booking.departure_airport,
        arrivalAirport: booking.arrival_airport,
        weatherScore: weatherScore,
        confidence: opt.aiConfidenceScore,
        reasoning: 'AI-generated reschedule option based on availability and weather conditions',
        createdAt: opt.createdAt instanceof Date 
          ? opt.createdAt.toISOString() 
          : new Date(opt.createdAt).toISOString(),
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        options: formattedOptions,
        count: formattedOptions.length,
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

    // Get booking details for airport info
    const bookingResult = await pool.query(
      'SELECT departure_airport, arrival_airport FROM bookings WHERE id = $1',
      [bookingId]
    );

    const booking = bookingResult.rows[0] || { departure_airport: '', arrival_airport: '' };

    // Format options for frontend (convert Date objects to ISO strings)
    const formattedOptions = options.map(opt => {
      // Parse weather forecast to calculate weather score
      let weatherScore = 0.7; // Default
      try {
        const weatherForecast = typeof opt.weatherForecast === 'string' 
          ? JSON.parse(opt.weatherForecast) 
          : opt.weatherForecast;
        if (weatherForecast && Array.isArray(weatherForecast) && weatherForecast.length > 0) {
          // Calculate average weather score from forecast
          const scores = weatherForecast.map((w: any) => w.score || 0.7);
          weatherScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
        }
      } catch (e) {
        // Use default if parsing fails
      }

      return {
        id: opt.id,
        bookingId: opt.bookingId,
        suggestedDatetime: opt.suggestedDatetime instanceof Date 
          ? opt.suggestedDatetime.toISOString() 
          : new Date(opt.suggestedDatetime).toISOString(),
        departureAirport: booking.departure_airport,
        arrivalAirport: booking.arrival_airport,
        weatherScore: weatherScore,
        confidence: opt.aiConfidenceScore,
        reasoning: 'AI-generated reschedule option based on availability and weather conditions',
        createdAt: opt.createdAt instanceof Date 
          ? opt.createdAt.toISOString() 
          : new Date(opt.createdAt).toISOString(),
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options: formattedOptions }),
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
              s.email as student_email, 
              CONCAT(s.first_name, ' ', s.last_name) as student_name,
              i.email as instructor_email,
              CONCAT(i.first_name, ' ', i.last_name) as instructor_name
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
    
    // Check if both preferences are submitted
    const bothSubmitted = await preferenceService.areBothPreferencesSubmitted(bookingId);
    if (!bothSubmitted) {
      const allPreferences = await preferenceService.getPreferencesByBooking(bookingId);
      const submittedCount = allPreferences.filter(p => p.submittedAt).length;
      
      logInfo('Cannot confirm reschedule - not all preferences submitted', {
        bookingId,
        totalPreferences: allPreferences.length,
        submittedCount,
      });
      
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Both student and instructor must submit their preferences before confirming',
          submittedCount,
          requiredCount: 2,
        }),
      };
    }
    
    const selectedOptionId = await preferenceService.resolveFinalSelection(bookingId);

    if (!selectedOptionId) {
      // Get more details for debugging
      const allPreferences = await preferenceService.getPreferencesByBooking(bookingId);
      const instructorPref = await preferenceService.getInstructorPreference(bookingId);
      
      logError('Failed to resolve final selection', new Error('No option selected'), {
        bookingId,
        preferencesCount: allPreferences.length,
        hasInstructorPref: !!instructorPref,
        instructorOption1: instructorPref?.option1Id,
        instructorOption2: instructorPref?.option2Id,
        instructorOption3: instructorPref?.option3Id,
      });
      
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'No preference selected. The instructor must rank at least one option.',
          details: instructorPref 
            ? 'Instructor preference exists but no options were ranked'
            : 'Instructor preference not found'
        }),
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

    const newScheduledTime = new Date(selectedOption.suggestedDatetime);

    // RE-VALIDATE AVAILABILITY before confirmation
    // Check student calendar, instructor calendar, and booking conflicts
    logInfo('Re-validating availability before confirmation', {
      bookingId,
      newTime: newScheduledTime.toISOString(),
      studentId: booking.student_id,
      instructorId: booking.instructor_id,
    });

    try {
      // Check student availability
      const availabilityService = new AvailabilityService(pool);
      const dateStr = format(newScheduledTime, 'yyyy-MM-dd');
      const timeStr = format(newScheduledTime, 'HH:mm');
      
      const studentAvailability = await availabilityService.getAvailability({
        userId: booking.student_id,
        startDate: dateStr,
        endDate: dateStr,
      });
      
      const studentAvailable = studentAvailability.slots.some((slot) => {
        const slotDate = format(new Date(slot.date), 'yyyy-MM-dd');
        if (slotDate !== dateStr) return false;
        if (!slot.isAvailable) return false;
        return timeStr >= slot.startTime && timeStr <= slot.endTime;
      });

      // Check instructor availability
      const instructorAvailability = await availabilityService.getAvailability({
        userId: booking.instructor_id,
        startDate: dateStr,
        endDate: dateStr,
      });
      
      const instructorAvailable = instructorAvailability.slots.some((slot) => {
        const slotDate = format(new Date(slot.date), 'yyyy-MM-dd');
        if (slotDate !== dateStr) return false;
        if (!slot.isAvailable) return false;
        return timeStr >= slot.startTime && timeStr <= slot.endTime;
      });

      // Check for booking conflicts
      const slotStart = new Date(newScheduledTime);
      slotStart.setMinutes(slotStart.getMinutes() - 30);
      const slotEnd = new Date(newScheduledTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + 90);

      const conflictResult = await pool.query(
        `SELECT id, scheduled_datetime, status
         FROM bookings
         WHERE status IN ('CONFIRMED', 'AT_RISK', 'RESCHEDULING', 'RESCHEDULED')
           AND scheduled_datetime >= $1
           AND scheduled_datetime <= $2
           AND (student_id = $3 OR instructor_id = $4)
           AND id != $5`,
        [slotStart, slotEnd, booking.student_id, booking.instructor_id, bookingId]
      );

      const hasBookingConflict = conflictResult.rows.length > 0;

      if (!studentAvailable || !instructorAvailable || hasBookingConflict) {
        logInfo('Availability check failed at confirmation', {
          bookingId,
          studentAvailable,
          instructorAvailable,
          hasBookingConflict,
          conflictingBookings: conflictResult.rows.map((r: any) => ({
            id: r.id,
            scheduled: r.scheduled_datetime,
            status: r.status,
          })),
        });

        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Availability conflict detected',
            reason: !studentAvailable 
              ? 'Student is not available at this time'
              : !instructorAvailable
              ? 'Instructor is not available at this time'
              : 'Another booking conflicts with this time',
            requiresNewOptions: true,
            newOptionsGenerated: false,
            message: 'Availability has changed. Please generate new reschedule options.',
          }),
        };
      }

      logInfo('Availability check passed', {
        bookingId,
        newTime: newScheduledTime.toISOString(),
      });
    } catch (availabilityError: any) {
      // Log error but allow confirmation to proceed (graceful degradation)
      logError('Availability re-validation error (proceeding with confirmation)', availabilityError, {
        bookingId,
        newTime: newScheduledTime.toISOString(),
      });
    }

    // RE-VALIDATE WEATHER before confirmation (with timeout and graceful degradation)
    logInfo('Re-validating weather before confirmation', {
      bookingId,
      newTime: selectedOption.suggestedDatetime,
    });

    let weatherValid = { isValid: true, reason: 'Weather check completed' };
    
    try {
      // Set a timeout for weather check (5 seconds max)
      const weatherCheckPromise = (async () => {
        const weatherService = new WeatherService();
        const departureCoords = { latitude: booking.departure_latitude, longitude: booking.departure_longitude };
        const arrivalCoords = { latitude: booking.arrival_latitude, longitude: booking.arrival_longitude };
        
        // Get weather for both airports in parallel
        const [departureWeather, arrivalWeather] = await Promise.all([
          weatherService.getWeather(departureCoords),
          weatherService.getWeather(arrivalCoords)
        ]);
        
        // Simple validation - check if weather is acceptable
        const isValid = departureWeather.visibility >= 3 && arrivalWeather.visibility >= 3;
        return {
          isValid,
          reason: !isValid 
            ? (departureWeather.visibility < 3 ? 'Low visibility at departure' : 'Low visibility at arrival')
            : 'Weather acceptable'
        };
      })();

      // Race against timeout
      const timeoutPromise = new Promise<{ isValid: boolean; reason: string }>((resolve) => {
        setTimeout(() => {
          logInfo('Weather check timeout - proceeding with confirmation', { bookingId });
          resolve({ isValid: true, reason: 'Weather check timed out - proceeding' });
        }, 5000); // 5 second timeout
      });

      weatherValid = await Promise.race([weatherCheckPromise, timeoutPromise]);
    } catch (error: any) {
      // If weather check fails, log but allow confirmation to proceed (graceful degradation)
      logError('Weather re-validation error (proceeding with confirmation)', error, {
        bookingId,
        newTime: selectedOption.suggestedDatetime,
      });
      weatherValid = { isValid: true, reason: 'Weather check failed - proceeding with confirmation' };
    }

    // Only block if weather is explicitly invalid (not on timeout or error)
    if (!weatherValid.isValid && weatherValid.reason !== 'Weather check timed out - proceeding' && weatherValid.reason !== 'Weather check failed - proceeding with confirmation') {
      logInfo('Weather re-validation failed - automatically regenerating options', {
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
          action: 'auto_regenerating_options',
        },
      });

      // AUTOMATICALLY REGENERATE OPTIONS using AI
      try {
        logInfo('Auto-regenerating reschedule options due to weather conflict', { bookingId });
        
        // Delete old options and preferences
        await optionsService.deleteOptionsByBooking(bookingId);
        
        // Delete old preferences
        await pool.query(
          'DELETE FROM preference_rankings WHERE booking_id = $1',
          [bookingId]
        );
        
        // Generate new options using AI
        const rescheduleEngine = new RescheduleEngine(pool);
        await rescheduleEngine.generateRescheduleOptions(bookingId);
        
        // Fetch the newly generated options
        const newOptions = await optionsService.getOptionsByBooking(bookingId);
        
        // Create new preference rankings for the new options
        const scheduledTime = new Date(booking.scheduled_datetime);
        const preferenceService = new PreferenceRankingService(pool);
        
        await preferenceService.createPreferenceRankings(
          bookingId,
          booking.student_id,
          booking.instructor_id,
          scheduledTime
        );
        
        logInfo('New reschedule options generated automatically', {
          bookingId,
          optionsCount: newOptions.length,
        });

        // Trigger notification that new options are available
        try {
          const { NotificationTrigger } = require('../services/notificationTrigger');
          const notificationTrigger = new NotificationTrigger(pool);
          await notificationTrigger.triggerRescheduleOptionsAvailable(booking, newOptions.length);
        } catch (notifError) {
          logError('Failed to send notification for new options', notifError, { bookingId });
        }

        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Weather conditions no longer suitable',
            reason: weatherValid.reason,
            requiresNewOptions: true,
            newOptionsGenerated: true,
            message: 'New reschedule options have been automatically generated. Please review and submit your preferences again.',
            optionsCount: newOptions.length,
          }),
        };
      } catch (regenerateError: any) {
        logError('Failed to auto-regenerate options', regenerateError, { bookingId });
        
        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Weather conditions no longer suitable',
            reason: weatherValid.reason,
            requiresNewOptions: true,
            newOptionsGenerated: false,
            message: 'Weather validation failed. Please manually generate new options.',
          }),
        };
      }
    }

    logInfo('Weather re-validation passed - proceeding with confirmation', {
      bookingId,
      newTime: selectedOption.suggestedDatetime,
    });

    // Update booking with new time and set status to RESCHEDULED
    await pool.query(
      `UPDATE bookings
       SET scheduled_datetime = $1,
           status = 'RESCHEDULED',
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
        oldTime: booking.scheduled_datetime,
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

