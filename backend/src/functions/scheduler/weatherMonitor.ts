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
import { RescheduleEngine } from '../ai/rescheduleEngine';
import { RescheduleOptionsService } from '../../services/rescheduleOptionsService';
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
    // Initialize services with error handling
    let weatherService: WeatherService;
    let weatherValidator: WeatherValidator;
    let conflictDetector: ConflictDetector;
    let auditService: AuditService;
    let notificationTrigger: NotificationTrigger;
    let rescheduleEngine: RescheduleEngine;
    let rescheduleOptionsService: RescheduleOptionsService;

    try {
      weatherService = new WeatherService();
      weatherValidator = new WeatherValidator(weatherService);
      conflictDetector = new ConflictDetector(dbPool, weatherValidator);
      auditService = new AuditService(dbPool);
      notificationTrigger = new NotificationTrigger(dbPool);
      rescheduleEngine = new RescheduleEngine(dbPool);
      rescheduleOptionsService = new RescheduleOptionsService(dbPool);
    } catch (initError: any) {
      logError('Failed to initialize services', initError);
      // Return partial success - system can continue with degraded functionality
      return {
        statusCode: 503,
        body: JSON.stringify({
          success: false,
          error: 'Service initialization failed',
          message: 'Weather monitoring services unavailable',
          retryable: true,
          processedCount: 0,
          conflictsDetected: 0,
          notificationsSent: 0,
          errors: 1,
        }),
      };
    }

    logInfo('Weather monitoring cycle started');

    // Check all bookings in the next 48 hours with graceful degradation
    let conflicts: any[] = [];
    try {
      conflicts = await conflictDetector.checkUpcomingBookings(48);
      processedCount = conflicts.length;
      logInfo(`Processed ${processedCount} bookings`);
    } catch (checkError: any) {
      logError('Failed to check upcoming bookings', checkError);
      // Continue with empty conflicts - partial success
      logWarn('Continuing with degraded functionality - no conflict checks performed');
      conflicts = [];
      processedCount = 0;
    }

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

          // Send notifications if needed (with graceful degradation)
          if (conflict.shouldNotify) {
            try {
              await notificationTrigger.triggerWeatherAlert(conflict, booking);
              notificationsSent += 2; // Student + Instructor

              // Audit logging (non-critical - continue on failure)
              try {
                await auditService.logNotificationSent(
                  booking.student_id,
                  'WEATHER_ALERT',
                  booking.id,
                  { severity: conflict.severity }
                );
              } catch (auditError: any) {
                logWarn('Failed to log notification audit', { error: auditError.message });
              }

              try {
                await auditService.logNotificationSent(
                  booking.instructor_id,
                  'WEATHER_ALERT',
                  booking.id,
                  { severity: conflict.severity }
                );
              } catch (auditError: any) {
                logWarn('Failed to log notification audit', { error: auditError.message });
              }
            } catch (notifyError: any) {
              logError('Failed to send notifications', notifyError, {
                bookingId: conflict.bookingId,
              });
              // Continue processing - notification failure is non-critical
            }
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

          // AUTOMATIC AI RESCHEDULING: Generate options if conditions are critical or persist
          // Trigger automatic rescheduling if:
          // 1. Severity is critical (within 2 hours of flight)
          // 2. Booking has been AT_RISK for more than 1 hour and weather hasn't improved
          const scheduledTime = new Date(booking.scheduled_time);
          const timeUntilFlight = scheduledTime.getTime() - Date.now();
          const hoursUntilFlight = timeUntilFlight / (1000 * 60 * 60);
          
          // Check if reschedule options already exist
          const existingOptions = await rescheduleOptionsService.getOptionsByBooking(conflict.bookingId);
          const hasExistingOptions = existingOptions.length > 0;

          // Determine if we should auto-generate reschedule options
          const shouldAutoReschedule = 
            !hasExistingOptions && // Don't regenerate if options already exist
            (
              conflict.severity === 'critical' || // Critical: within 2 hours
              (previousStatus === 'AT_RISK' && hoursUntilFlight <= 12) // Been AT_RISK and flight is within 12 hours
            );

          if (shouldAutoReschedule) {
            try {
              logInfo('Auto-triggering AI rescheduling for weather conflict', {
                bookingId: conflict.bookingId,
                severity: conflict.severity,
                hoursUntilFlight: hoursUntilFlight.toFixed(2),
              });

              // Generate reschedule options using AI
              const options = await rescheduleEngine.generateRescheduleOptions(conflict.bookingId);

              if (options.length > 0) {
                // Update booking status to RESCHEDULING
                await dbPool.query(
                  `UPDATE bookings 
                   SET status = 'RESCHEDULING',
                       updated_at = NOW()
                   WHERE id = $1`,
                  [conflict.bookingId]
                );

                // Log status change
                await auditService.logStatusChange(
                  conflict.bookingId,
                  'AT_RISK',
                  'RESCHEDULING',
                  'AI reschedule options automatically generated',
                  'system'
                );

                // Send notifications that reschedule options are available
                await notificationTrigger.triggerRescheduleOptionsAvailable(booking, options.length);

                logInfo('Automatic AI rescheduling completed', {
                  bookingId: conflict.bookingId,
                  optionsGenerated: options.length,
                });
              } else {
                logWarn('AI rescheduling generated no options', {
                  bookingId: conflict.bookingId,
                });
              }
            } catch (rescheduleError: any) {
              logError('Failed to auto-generate reschedule options', rescheduleError, {
                bookingId: conflict.bookingId,
              });
              // Continue processing - rescheduling failure is non-critical
            }
          }

          logInfo('Conflict processed', {
            bookingId: conflict.bookingId,
            conflictType: conflict.conflictType,
            severity: conflict.severity,
            notificationsSent: conflict.shouldNotify ? 2 : 0,
            autoRescheduleTriggered: shouldAutoReschedule,
          });
        } else {
          // Check if weather has cleared (was AT_RISK, now valid)
          if (previousStatus === 'AT_RISK') {
            try {
              // Update booking status back to CONFIRMED
              await conflictDetector.updateBookingStatus(conflict.bookingId, conflict);

              // Send weather cleared notifications (non-critical)
              try {
                await notificationTrigger.triggerWeatherCleared(booking);
                notificationsSent += 2; // Student + Instructor
              } catch (notifyError: any) {
                logWarn('Failed to send weather cleared notifications', {
                  error: notifyError.message,
                  bookingId: conflict.bookingId,
                });
              }

              // Log status change (non-critical)
              try {
                await auditService.logStatusChange(
                  conflict.bookingId,
                  'AT_RISK',
                  'CONFIRMED',
                  'Weather conditions improved',
                  'system'
                );
              } catch (auditError: any) {
                logWarn('Failed to log status change', { error: auditError.message });
              }

              logInfo('Weather cleared', {
                bookingId: conflict.bookingId,
              });
            } catch (updateError: any) {
              logError('Failed to update booking status', updateError, {
                bookingId: conflict.bookingId,
              });
              // Continue processing other bookings
            }
          }

          // Log weather check (even if valid) - non-critical operation
          try {
            await auditService.logWeatherCheck(
              conflict.bookingId,
              true,
              conflict.weatherValidation,
              'system'
            );
          } catch (auditError: any) {
            logWarn('Failed to log weather check', { error: auditError.message });
          }
        }
      } catch (error: any) {
        errors++;
        logError('Error processing conflict', error, {
          bookingId: conflict.bookingId,
        });
        // Continue processing other bookings
      }
    }

    // Get statistics (non-critical - continue on failure)
    let stats: any = {};
    try {
      stats = await conflictDetector.getConflictStatistics();
    } catch (statsError: any) {
      logWarn('Failed to get conflict statistics', { error: statsError.message });
    }

    logInfo('Weather monitoring cycle completed', {
      processedCount,
      conflictsDetected,
      notificationsSent,
      errors,
      statistics: stats,
    });

    const duration = Date.now() - startTime;
    // Consider success if we processed at least some bookings, even with errors
    const success = errors < processedCount;
    logLambdaEnd('weatherMonitor', Boolean(success), duration);

    // Return success even with some errors (graceful degradation)
    return {
      statusCode: success ? 200 : 207, // 207 Multi-Status for partial success
      body: JSON.stringify({
        success: success,
        processedCount,
        conflictsDetected,
        notificationsSent,
        errors,
        statistics: stats,
        duration,
        degraded: errors > 0,
      }),
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logError('Weather monitoring cycle failed', error);
    logLambdaEnd('weatherMonitor', false, duration);

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
    'detail-type': 'Scheduled Event' as const,
    source: 'manual',
    account: '',
    time: new Date().toISOString(),
    region: 'us-east-1',
    resources: [],
    detail: {},
  });
};

