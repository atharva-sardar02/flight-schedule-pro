"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rescheduleHandler = void 0;
const pg_1 = require("pg");
const rescheduleEngine_1 = require("../ai/rescheduleEngine");
const preferenceRankingService_1 = require("../../services/preferenceRankingService");
const rescheduleOptionsService_1 = require("../../services/rescheduleOptionsService");
const weatherService_1 = require("../../services/weatherService");
const emailService_1 = require("../notifications/emailService");
const auth_1 = require("../../middleware/auth");
const logger_1 = require("../../utils/logger");
const auditService_1 = require("../../services/auditService");
const lambdaErrorHandler_1 = require("../../utils/lambdaErrorHandler");
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
const rescheduleHandler = async (event) => {
    const startTime = Date.now();
    (0, logger_1.logLambdaStart)('rescheduleAPI', event);
    try {
        const user = await (0, auth_1.requireAuth)(event);
        const dbPool = getPool();
        const method = event.httpMethod;
        const pathSegments = event.path.split('/').filter(Boolean);
        (0, logger_1.startPerformanceTimer)(`reschedule_${method}_${event.path}`);
        let result;
        if (pathSegments.includes('generate')) {
            result = await handleGenerateOptions(event, user, dbPool);
        }
        else if (pathSegments.includes('options')) {
            result = await handleGetOptions(event, user, dbPool);
        }
        else if (pathSegments.includes('preferences')) {
            result = await handlePreferences(event, user, dbPool);
        }
        else if (pathSegments.includes('confirm')) {
            result = await handleConfirmReschedule(event, user, dbPool);
        }
        else {
            result = {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Not found' }),
            };
        }
        const duration = (0, logger_1.endPerformanceTimer)(`reschedule_${method}_${event.path}`);
        (0, logger_1.logLambdaEnd)('rescheduleAPI', true, result.statusCode);
        (0, logger_1.logAPICall)(event.path, method, result.statusCode, duration);
        return result;
    }
    catch (error) {
        return (0, lambdaErrorHandler_1.handleLambdaError)(error, {
            functionName: 'rescheduleAPI',
            event,
            defaultStatusCode: error.message === 'Unauthorized' ? 401 : 500,
        });
    }
};
exports.rescheduleHandler = rescheduleHandler;
async function handleGenerateOptions(event, user, pool) {
    try {
        const bookingId = event.pathParameters?.bookingId;
        if (!bookingId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Booking ID required' }),
            };
        }
        (0, logger_1.logInfo)('Generating reschedule options', { bookingId, userId: user.id });
        const rescheduleEngine = new rescheduleEngine_1.RescheduleEngine(pool);
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
    }
    catch (error) {
        (0, logger_1.logError)('Failed to generate options', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message }),
        };
    }
}
async function handleGetOptions(event, user, pool) {
    try {
        const bookingId = event.pathParameters?.bookingId;
        if (!bookingId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Booking ID required' }),
            };
        }
        const service = new rescheduleOptionsService_1.RescheduleOptionsService(pool);
        const options = await service.getOptionsByBooking(bookingId);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ options }),
        };
    }
    catch (error) {
        (0, logger_1.logError)('Failed to get options', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message }),
        };
    }
}
async function handlePreferences(event, user, pool) {
    const service = new preferenceRankingService_1.PreferenceRankingService(pool);
    if (event.httpMethod === 'POST') {
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
        }
        catch (error) {
            (0, logger_1.logError)('Failed to submit preferences', error);
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: error.message }),
            };
        }
    }
    else if (event.httpMethod === 'GET') {
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
        }
        catch (error) {
            (0, logger_1.logError)('Failed to get preferences', error);
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
async function handleConfirmReschedule(event, user, pool) {
    try {
        const bookingId = event.pathParameters?.bookingId;
        if (!bookingId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Booking ID required' }),
            };
        }
        const bookingResult = await pool.query(`SELECT b.*, 
              s.email as student_email, s.name as student_name,
              i.email as instructor_email, i.name as instructor_name
       FROM bookings b
       JOIN users s ON b.student_id = s.id
       JOIN users i ON b.instructor_id = i.id
       WHERE b.id = $1`, [bookingId]);
        if (bookingResult.rows.length === 0) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Booking not found' }),
            };
        }
        const booking = bookingResult.rows[0];
        const preferenceService = new preferenceRankingService_1.PreferenceRankingService(pool);
        const selectedOptionId = await preferenceService.resolveFinalSelection(bookingId);
        if (!selectedOptionId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'No preference selected' }),
            };
        }
        const optionsService = new rescheduleOptionsService_1.RescheduleOptionsService(pool);
        const selectedOption = await optionsService.getOption(selectedOptionId);
        if (!selectedOption) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Selected option not found' }),
            };
        }
        (0, logger_1.logInfo)('Re-validating weather before confirmation', {
            bookingId,
            newTime: selectedOption.suggestedDatetime,
        });
        const weatherService = new weatherService_1.WeatherService();
        const departureCoords = { latitude: booking.departure_latitude, longitude: booking.departure_longitude };
        const arrivalCoords = { latitude: booking.arrival_latitude, longitude: booking.arrival_longitude };
        const departureWeather = await weatherService.getWeather(departureCoords);
        const arrivalWeather = await weatherService.getWeather(arrivalCoords);
        const weatherValid = {
            isValid: departureWeather.visibility >= 3 && arrivalWeather.visibility >= 3,
            reason: departureWeather.visibility < 3 ? 'Low visibility at departure' :
                arrivalWeather.visibility < 3 ? 'Low visibility at arrival' : 'Weather acceptable'
        };
        if (!weatherValid.isValid) {
            (0, logger_1.logInfo)('Weather re-validation failed - option no longer suitable', {
                bookingId,
                newTime: selectedOption.suggestedDatetime,
                reason: weatherValid.reason,
            });
            const auditService = new auditService_1.AuditService(pool);
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
        (0, logger_1.logInfo)('Weather re-validation passed - proceeding with confirmation', {
            bookingId,
            newTime: selectedOption.suggestedDatetime,
        });
        await pool.query(`UPDATE bookings
       SET scheduled_time = $1,
           status = 'CONFIRMED',
           updated_at = NOW()
       WHERE id = $2`, [selectedOption.suggestedDatetime, bookingId]);
        const auditService2 = new auditService_1.AuditService(pool);
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
        const emailService = new emailService_1.EmailService();
        await emailService.sendConfirmation(booking.student_email, booking.student_name, {
            newScheduledTime: new Date(selectedOption.suggestedDatetime),
            departureAirport: booking.departure_airport,
            arrivalAirport: booking.arrival_airport,
        });
        await emailService.sendConfirmation(booking.instructor_email, booking.instructor_name, {
            newScheduledTime: new Date(selectedOption.suggestedDatetime),
            departureAirport: booking.departure_airport,
            arrivalAirport: booking.arrival_airport,
        });
        (0, logger_1.logInfo)('Booking rescheduled successfully with notifications sent', {
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
    }
    catch (error) {
        (0, logger_1.logError)('Failed to confirm reschedule', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message }),
        };
    }
}
//# sourceMappingURL=reschedule.js.map