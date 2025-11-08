/**
 * Weather Monitor Lambda Function
 * EventBridge-triggered function that checks weather every 10 minutes
 * for all upcoming flights and triggers notifications when conflicts are detected
 */

import { EventBridgeEvent } from 'aws-lambda';
import { Pool } from 'pg';
import { WeatherService } from '../../services/weatherService';
import { WeatherValidator } from '../ai/weatherValidator';
import { ConflictDetector } from '../ai/conflictDetector';
import { AuditService } from '../../services/auditService';
import { NotificationTrigger } from '../../services/notificationTrigger';
import {
  logLambdaStart,
  logLambdaEnd,
  logInfo,
  logError,
  logWarn,
} from '../../utils/logger';

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
 * Weather Monitor Handler
 * Triggered by EventBridge every 10 minutes
 */
export const handler = async (
  event: EventBridgeEvent<'Scheduled Event', any>
): Promise<any> => {
  const startTime = Date.now();
  logLambdaStart('weatherMonitor', event);

  const dbPool = getPool();
  let processedCount = 0;
  let conflictsDetected = 0;
  let notificationsSent = 0;
  let errors = 0;

  try {
    // Initialize services
    const weatherService = new WeatherService();
    const weatherValidator = new WeatherValidator(weatherService);
    const conflictDetector = new ConflictDetector(dbPool, weatherValidator);
    const auditService = new AuditService(dbPool);
    const notificationTrigger = new NotificationTrigger(dbPool);

    logInfo('Weather monitoring cycle started');

    // Check all bookings in the next 48 hours
    const conflicts = await conflictDetector.checkUpcomingBookings(48);
    processedCount = conflicts.length;

    logInfo(`Processed ${processedCount} bookings`);

    // Process each conflict
    for (const conflict of conflicts) {
      try {
        // Get booking details
        const bookingResult = await dbPool.query(
          `SELECT b.*, 
                  u_student.training_level as student_training_level,
                  u_student.email as student_email,
                  u_student.first_name as student_first_name,
                  u_instructor.email as instructor_email,
                  u_instructor.first_name as instructor_first_name,
                  b.status as current_status
           FROM bookings b
           JOIN users u_student ON b.student_id = u_student.id
           JOIN users u_instructor ON b.instructor_id = u_instructor.id
           WHERE b.id = $1`,
          [conflict.bookingId]
        );

        if (bookingResult.rows.length === 0) {
          logWarn('Booking not found', { bookingId: conflict.bookingId });
          continue;
        }

        const booking = bookingResult.rows[0];
        const previousStatus = booking.current_status;

        if (conflict.hasConflict) {
          conflictsDetected++;

          // Update booking status
          await conflictDetector.updateBookingStatus(conflict.bookingId, conflict);

          // Log to audit trail
          await auditService.logConflictDetected(
            conflict.bookingId,
            conflict.conflictType,
            {
              severity: conflict.severity,
              violations: conflict.weatherValidation?.violations,
              confidence: conflict.weatherValidation?.confidence,
            }
          );

          // Send notifications if needed
          if (conflict.shouldNotify) {
            await notificationTrigger.triggerWeatherAlert(conflict, booking);
            notificationsSent += 2; // Student + Instructor

            await auditService.logNotificationSent(
              booking.student_id,
              'WEATHER_ALERT',
              booking.id,
              { severity: conflict.severity }
            );

            await auditService.logNotificationSent(
              booking.instructor_id,
              'WEATHER_ALERT',
              booking.id,
              { severity: conflict.severity }
            );
          }

          // Log status change
          if (previousStatus !== 'AT_RISK') {
            await auditService.logStatusChange(
              conflict.bookingId,
              previousStatus,
              'AT_RISK',
              'Weather conflict detected',
              'system'
            );
          }

          logInfo('Conflict processed', {
            bookingId: conflict.bookingId,
            conflictType: conflict.conflictType,
            severity: conflict.severity,
            notificationsSent: conflict.shouldNotify ? 2 : 0,
          });
        } else {
          // Check if weather has cleared (was AT_RISK, now valid)
          if (previousStatus === 'AT_RISK') {
            // Update booking status back to CONFIRMED
            await conflictDetector.updateBookingStatus(conflict.bookingId, conflict);

            // Send weather cleared notifications
            await notificationTrigger.triggerWeatherCleared(booking);
            notificationsSent += 2; // Student + Instructor

            // Log status change
            await auditService.logStatusChange(
              conflict.bookingId,
              'AT_RISK',
              'CONFIRMED',
              'Weather conditions improved',
              'system'
            );

            logInfo('Weather cleared', {
              bookingId: conflict.bookingId,
            });
          }

          // Log weather check (even if valid)
          await auditService.logWeatherCheck(
            conflict.bookingId,
            true,
            conflict.weatherValidation,
            'system'
          );
        }
      } catch (error: any) {
        errors++;
        logError('Error processing conflict', error, {
          bookingId: conflict.bookingId,
        });
        // Continue processing other bookings
      }
    }

    // Get statistics
    const stats = await conflictDetector.getConflictStatistics();

    logInfo('Weather monitoring cycle completed', {
      processedCount,
      conflictsDetected,
      notificationsSent,
      errors,
      statistics: stats,
    });

    const duration = Date.now() - startTime;
    logLambdaEnd('weatherMonitor', duration, errors === 0);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        processedCount,
        conflictsDetected,
        notificationsSent,
        errors,
        statistics: stats,
        duration,
      }),
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logError('Weather monitoring cycle failed', error);
    logLambdaEnd('weatherMonitor', duration, false);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        processedCount,
        conflictsDetected,
        notificationsSent,
        errors: errors + 1,
      }),
    };
  }
};

/**
 * Manual trigger for testing (can be called via API)
 */
export const manualTrigger = async (): Promise<any> => {
  return handler({
    version: '0',
    id: 'manual-trigger',
    'detail-type': 'Manual Trigger',
    source: 'manual',
    account: '',
    time: new Date().toISOString(),
    region: 'us-east-1',
    resources: [],
    detail: {},
  });
};

