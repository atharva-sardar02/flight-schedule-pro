"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualTrigger = exports.handler = void 0;
const pg_1 = require("pg");
const weatherService_1 = require("../../services/weatherService");
const weatherValidator_1 = require("../ai/weatherValidator");
const conflictDetector_1 = require("../ai/conflictDetector");
const auditService_1 = require("../../services/auditService");
const notificationTrigger_1 = require("../../services/notificationTrigger");
const rescheduleEngine_1 = require("../ai/rescheduleEngine");
const rescheduleOptionsService_1 = require("../../services/rescheduleOptionsService");
const logger_1 = require("../../utils/logger");
let pool;
function getPool() {
    if (!pool) {
        pool = new pg_1.Pool({
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
const handler = async (event) => {
    const startTime = Date.now();
    (0, logger_1.logLambdaStart)('weatherMonitor', event);
    const dbPool = getPool();
    let processedCount = 0;
    let conflictsDetected = 0;
    let notificationsSent = 0;
    let errors = 0;
    try {
        let weatherService;
        let weatherValidator;
        let conflictDetector;
        let auditService;
        let notificationTrigger;
        let rescheduleEngine;
        let rescheduleOptionsService;
        try {
            weatherService = new weatherService_1.WeatherService();
            weatherValidator = new weatherValidator_1.WeatherValidator(weatherService);
            conflictDetector = new conflictDetector_1.ConflictDetector(dbPool, weatherValidator);
            auditService = new auditService_1.AuditService(dbPool);
            notificationTrigger = new notificationTrigger_1.NotificationTrigger(dbPool);
            rescheduleEngine = new rescheduleEngine_1.RescheduleEngine(dbPool);
            rescheduleOptionsService = new rescheduleOptionsService_1.RescheduleOptionsService(dbPool);
        }
        catch (initError) {
            (0, logger_1.logError)('Failed to initialize services', initError);
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
        (0, logger_1.logInfo)('Weather monitoring cycle started');
        let conflicts = [];
        try {
            conflicts = await conflictDetector.checkUpcomingBookings(48);
            processedCount = conflicts.length;
            (0, logger_1.logInfo)(`Processed ${processedCount} bookings`);
        }
        catch (checkError) {
            (0, logger_1.logError)('Failed to check upcoming bookings', checkError);
            (0, logger_1.logWarn)('Continuing with degraded functionality - no conflict checks performed');
            conflicts = [];
            processedCount = 0;
        }
        for (const conflict of conflicts) {
            try {
                const bookingResult = await dbPool.query(`SELECT b.*, 
                  u_student.training_level as student_training_level,
                  u_student.email as student_email,
                  u_student.first_name as student_first_name,
                  u_instructor.email as instructor_email,
                  u_instructor.first_name as instructor_first_name,
                  b.status as current_status
           FROM bookings b
           JOIN users u_student ON b.student_id = u_student.id
           JOIN users u_instructor ON b.instructor_id = u_instructor.id
           WHERE b.id = $1`, [conflict.bookingId]);
                if (bookingResult.rows.length === 0) {
                    (0, logger_1.logWarn)('Booking not found', { bookingId: conflict.bookingId });
                    continue;
                }
                const booking = bookingResult.rows[0];
                const previousStatus = booking.current_status;
                if (conflict.hasConflict) {
                    conflictsDetected++;
                    await conflictDetector.updateBookingStatus(conflict.bookingId, conflict);
                    await auditService.logConflictDetected(conflict.bookingId, conflict.conflictType, {
                        severity: conflict.severity,
                        violations: conflict.weatherValidation?.violations,
                        confidence: conflict.weatherValidation?.confidence,
                    });
                    if (conflict.shouldNotify) {
                        try {
                            await notificationTrigger.triggerWeatherAlert(conflict, booking);
                            notificationsSent += 2;
                            try {
                                await auditService.logNotificationSent(booking.student_id, 'WEATHER_ALERT', booking.id, { severity: conflict.severity });
                            }
                            catch (auditError) {
                                (0, logger_1.logWarn)('Failed to log notification audit', { error: auditError.message });
                            }
                            try {
                                await auditService.logNotificationSent(booking.instructor_id, 'WEATHER_ALERT', booking.id, { severity: conflict.severity });
                            }
                            catch (auditError) {
                                (0, logger_1.logWarn)('Failed to log notification audit', { error: auditError.message });
                            }
                        }
                        catch (notifyError) {
                            (0, logger_1.logError)('Failed to send notifications', notifyError, {
                                bookingId: conflict.bookingId,
                            });
                        }
                    }
                    if (previousStatus !== 'AT_RISK') {
                        await auditService.logStatusChange(conflict.bookingId, previousStatus, 'AT_RISK', 'Weather conflict detected', 'system');
                    }
                    const scheduledTime = new Date(booking.scheduled_time);
                    const timeUntilFlight = scheduledTime.getTime() - Date.now();
                    const hoursUntilFlight = timeUntilFlight / (1000 * 60 * 60);
                    const existingOptions = await rescheduleOptionsService.getOptionsByBooking(conflict.bookingId);
                    const hasExistingOptions = existingOptions.length > 0;
                    const shouldAutoReschedule = !hasExistingOptions &&
                        (conflict.severity === 'critical' ||
                            (previousStatus === 'AT_RISK' && hoursUntilFlight <= 12));
                    if (shouldAutoReschedule) {
                        try {
                            (0, logger_1.logInfo)('Auto-triggering AI rescheduling for weather conflict', {
                                bookingId: conflict.bookingId,
                                severity: conflict.severity,
                                hoursUntilFlight: hoursUntilFlight.toFixed(2),
                            });
                            const options = await rescheduleEngine.generateRescheduleOptions(conflict.bookingId);
                            if (options.length > 0) {
                                await dbPool.query(`UPDATE bookings 
                   SET status = 'RESCHEDULING',
                       updated_at = NOW()
                   WHERE id = $1`, [conflict.bookingId]);
                                await auditService.logStatusChange(conflict.bookingId, 'AT_RISK', 'RESCHEDULING', 'AI reschedule options automatically generated', 'system');
                                await notificationTrigger.triggerRescheduleOptionsAvailable(booking, options.length);
                                (0, logger_1.logInfo)('Automatic AI rescheduling completed', {
                                    bookingId: conflict.bookingId,
                                    optionsGenerated: options.length,
                                });
                            }
                            else {
                                (0, logger_1.logWarn)('AI rescheduling generated no options', {
                                    bookingId: conflict.bookingId,
                                });
                            }
                        }
                        catch (rescheduleError) {
                            (0, logger_1.logError)('Failed to auto-generate reschedule options', rescheduleError, {
                                bookingId: conflict.bookingId,
                            });
                        }
                    }
                    (0, logger_1.logInfo)('Conflict processed', {
                        bookingId: conflict.bookingId,
                        conflictType: conflict.conflictType,
                        severity: conflict.severity,
                        notificationsSent: conflict.shouldNotify ? 2 : 0,
                        autoRescheduleTriggered: shouldAutoReschedule,
                    });
                }
                else {
                    if (previousStatus === 'AT_RISK') {
                        try {
                            await conflictDetector.updateBookingStatus(conflict.bookingId, conflict);
                            try {
                                await notificationTrigger.triggerWeatherCleared(booking);
                                notificationsSent += 2;
                            }
                            catch (notifyError) {
                                (0, logger_1.logWarn)('Failed to send weather cleared notifications', {
                                    error: notifyError.message,
                                    bookingId: conflict.bookingId,
                                });
                            }
                            try {
                                await auditService.logStatusChange(conflict.bookingId, 'AT_RISK', 'CONFIRMED', 'Weather conditions improved', 'system');
                            }
                            catch (auditError) {
                                (0, logger_1.logWarn)('Failed to log status change', { error: auditError.message });
                            }
                            (0, logger_1.logInfo)('Weather cleared', {
                                bookingId: conflict.bookingId,
                            });
                        }
                        catch (updateError) {
                            (0, logger_1.logError)('Failed to update booking status', updateError, {
                                bookingId: conflict.bookingId,
                            });
                        }
                    }
                    try {
                        await auditService.logWeatherCheck(conflict.bookingId, true, conflict.weatherValidation, 'system');
                    }
                    catch (auditError) {
                        (0, logger_1.logWarn)('Failed to log weather check', { error: auditError.message });
                    }
                }
            }
            catch (error) {
                errors++;
                (0, logger_1.logError)('Error processing conflict', error, {
                    bookingId: conflict.bookingId,
                });
            }
        }
        let stats = {};
        try {
            stats = await conflictDetector.getConflictStatistics();
        }
        catch (statsError) {
            (0, logger_1.logWarn)('Failed to get conflict statistics', { error: statsError.message });
        }
        (0, logger_1.logInfo)('Weather monitoring cycle completed', {
            processedCount,
            conflictsDetected,
            notificationsSent,
            errors,
            statistics: stats,
        });
        const duration = Date.now() - startTime;
        const success = errors < processedCount;
        (0, logger_1.logLambdaEnd)('weatherMonitor', Boolean(success), duration);
        return {
            statusCode: success ? 200 : 207,
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
    }
    catch (error) {
        const duration = Date.now() - startTime;
        (0, logger_1.logError)('Weather monitoring cycle failed', error);
        (0, logger_1.logLambdaEnd)('weatherMonitor', false, duration);
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
exports.handler = handler;
const manualTrigger = async () => {
    return (0, exports.handler)({
        version: '0',
        id: 'manual-trigger',
        'detail-type': 'Scheduled Event',
        source: 'manual',
        account: '',
        time: new Date().toISOString(),
        region: 'us-east-1',
        resources: [],
        detail: {},
    });
};
exports.manualTrigger = manualTrigger;
//# sourceMappingURL=weatherMonitor.js.map