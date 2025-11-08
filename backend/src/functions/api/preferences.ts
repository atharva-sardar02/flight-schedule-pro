/**
 * Preferences Lambda API Function
 * Dedicated API for preference submission and deadline management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Pool } from 'pg';
import { PreferenceRankingService } from '../../services/preferenceRankingService';
import { RescheduleOptionsService } from '../../services/rescheduleOptionsService';
import { requireAuth } from '../../middleware/auth';
import { logInfo, logError } from '../../utils/logger';
import { isDeadlinePassed } from '../../utils/deadlineCalculator';
import { auditLog } from '../../services/auditService';

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
 * Main handler for preferences API requests
 */
export const preferencesHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Preferences API request:', {
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
    if (method === 'POST' && pathSegments.includes('submit')) {
      // POST /preferences/submit - Submit preference ranking
      return await handleSubmitPreference(event, user, dbPool);
    } else if (method === 'GET' && pathSegments.includes('booking')) {
      // GET /preferences/booking/:bookingId - Get preferences for a booking
      return await handleGetPreferences(event, user, dbPool);
    } else if (method === 'GET' && pathSegments.includes('my')) {
      // GET /preferences/my/:bookingId - Get current user's preference
      return await handleGetMyPreference(event, user, dbPool);
    } else if (method === 'POST' && pathSegments.includes('escalate')) {
      // POST /preferences/escalate/:bookingId - Manual escalation (admin only)
      return await handleManualEscalation(event, user, dbPool);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error: any) {
    console.error('Preferences route error:', error);

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
 * Submit preference ranking with deadline enforcement
 */
async function handleSubmitPreference(
  event: APIGatewayProxyEvent,
  user: any,
  pool: Pool
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const { bookingId, option1Id, option2Id, option3Id, unavailableOptionIds } = body;

    if (!bookingId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Booking ID required' }),
      };
    }

    logInfo('Submitting preference', { bookingId, userId: user.id });

    const service = new PreferenceRankingService(pool);

    // Get existing preference to check deadline
    const existing = await service.getPreference(bookingId, user.id);
    if (!existing) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Preference ranking not found for this booking' }),
      };
    }

    // Enforce deadline
    if (isDeadlinePassed(new Date(existing.deadline))) {
      logInfo('Preference submission rejected - deadline passed', {
        bookingId,
        userId: user.id,
        deadline: existing.deadline,
      });

      // Audit log
      await auditLog(pool, {
        entityType: 'booking',
        entityId: bookingId,
        action: 'preference_submission_rejected',
        userId: user.id,
        metadata: {
          reason: 'Deadline passed',
          deadline: existing.deadline,
        },
      });

      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Preference submission deadline has passed',
          deadline: existing.deadline,
        }),
      };
    }

    // Submit preference
    const preference = await service.submitPreference({
      bookingId,
      userId: user.id,
      option1Id,
      option2Id,
      option3Id,
      unavailableOptionIds,
    });

    // Audit log
    await auditLog(pool, {
      entityType: 'booking',
      entityId: bookingId,
      action: 'preference_submitted',
      userId: user.id,
      metadata: {
        option1Id,
        option2Id,
        option3Id,
        unavailableCount: unavailableOptionIds?.length || 0,
      },
    });

    // Check if both preferences submitted
    const bothSubmitted = await service.areBothPreferencesSubmitted(bookingId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        preference,
        bothSubmitted,
      }),
    };
  } catch (error: any) {
    logError('Failed to submit preference', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
}

/**
 * Get all preferences for a booking (both student and instructor)
 */
async function handleGetPreferences(
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

    // Verify user is part of this booking (student, instructor, or admin)
    const bookingResult = await pool.query(
      'SELECT student_id, instructor_id FROM bookings WHERE id = $1',
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
    const isAuthorized =
      user.id === booking.student_id ||
      user.id === booking.instructor_id ||
      user.role === 'ADMIN';

    if (!isAuthorized) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not authorized to view these preferences' }),
      };
    }

    const service = new PreferenceRankingService(pool);
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

/**
 * Get current user's preference for a booking
 */
async function handleGetMyPreference(
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

    const service = new PreferenceRankingService(pool);
    const preference = await service.getPreference(bookingId, user.id);

    if (!preference) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Preference not found' }),
      };
    }

    // Get reschedule options for context
    const optionsService = new RescheduleOptionsService(pool);
    const options = await optionsService.getOptionsByBooking(bookingId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preference,
        options,
      }),
    };
  } catch (error: any) {
    logError('Failed to get preference', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
}

/**
 * Manual escalation when deadline passes without both preferences
 * Admin or system can trigger this to force resolution
 */
async function handleManualEscalation(
  event: APIGatewayProxyEvent,
  user: any,
  pool: Pool
): Promise<APIGatewayProxyResult> {
  try {
    // Only admins can manually escalate
    if (user.role !== 'ADMIN') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Admin access required' }),
      };
    }

    const bookingId = event.pathParameters?.bookingId;
    if (!bookingId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Booking ID required' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { resolution, notes } = body;

    logInfo('Manual escalation triggered', {
      bookingId,
      adminId: user.id,
      resolution,
    });

    // Update booking status to escalated
    await pool.query(
      `UPDATE bookings
       SET status = 'ESCALATED',
           updated_at = NOW()
       WHERE id = $1`,
      [bookingId]
    );

    // Audit log
    await auditLog(pool, {
      entityType: 'booking',
      entityId: bookingId,
      action: 'manual_escalation',
      userId: user.id,
      metadata: {
        resolution,
        notes,
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Booking escalated for manual resolution',
      }),
    };
  } catch (error: any) {
    logError('Failed to escalate booking', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
}

