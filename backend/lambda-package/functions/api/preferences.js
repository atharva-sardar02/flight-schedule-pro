"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preferencesHandler = void 0;
const pg_1 = require("pg");
const preferenceRankingService_1 = require("../../services/preferenceRankingService");
const rescheduleOptionsService_1 = require("../../services/rescheduleOptionsService");
const auth_1 = require("../../middleware/auth");
const logger_1 = require("../../utils/logger");
const deadlineCalculator_1 = require("../../utils/deadlineCalculator");
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
const preferencesHandler = async (event) => {
    const startTime = Date.now();
    (0, logger_1.logLambdaStart)('preferencesAPI', event);
    try {
        const user = await (0, auth_1.requireAuth)(event);
        const dbPool = getPool();
        const method = event.httpMethod;
        const pathSegments = event.path.split('/').filter(Boolean);
        (0, logger_1.startPerformanceTimer)(`preferences_${method}_${event.path}`);
        let result;
        if (method === 'POST' && pathSegments.includes('submit')) {
            result = await handleSubmitPreference(event, user, dbPool);
        }
        else if (method === 'GET' && pathSegments.includes('booking')) {
            result = await handleGetPreferences(event, user, dbPool);
        }
        else if (method === 'GET' && pathSegments.includes('my')) {
            result = await handleGetMyPreference(event, user, dbPool);
        }
        else if (method === 'POST' && pathSegments.includes('escalate')) {
            result = await handleManualEscalation(event, user, dbPool);
        }
        else {
            result = {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Not found' }),
            };
        }
        const duration = (0, logger_1.endPerformanceTimer)(`preferences_${method}_${event.path}`);
        (0, logger_1.logLambdaEnd)('preferencesAPI', true, result.statusCode);
        (0, logger_1.logAPICall)(event.path, method, result.statusCode, duration);
        return result;
    }
    catch (error) {
        return (0, lambdaErrorHandler_1.handleLambdaError)(error, {
            functionName: 'preferencesAPI',
            event,
            defaultStatusCode: error.message === 'Unauthorized' ? 401 : 500,
        });
    }
};
exports.preferencesHandler = preferencesHandler;
async function handleSubmitPreference(event, user, pool) {
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
        (0, logger_1.logInfo)('Submitting preference', { bookingId, userId: user.id });
        const service = new preferenceRankingService_1.PreferenceRankingService(pool);
        const existing = await service.getPreference(bookingId, user.id);
        if (!existing) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Preference ranking not found for this booking' }),
            };
        }
        if ((0, deadlineCalculator_1.isDeadlinePassed)(new Date(existing.deadline))) {
            (0, logger_1.logInfo)('Preference submission rejected - deadline passed', {
                bookingId,
                userId: user.id,
                deadline: existing.deadline,
            });
            const auditService = new auditService_1.AuditService(pool);
            await auditService.logEvent({
                eventType: 'preference_submission_rejected',
                entityType: 'booking',
                entityId: bookingId,
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
        const preference = await service.submitPreference({
            bookingId,
            userId: user.id,
            option1Id,
            option2Id,
            option3Id,
            unavailableOptionIds,
        });
        const auditService2 = new auditService_1.AuditService(pool);
        await auditService2.logEvent({
            eventType: 'preference_submitted',
            entityType: 'booking',
            entityId: bookingId,
            userId: user.id,
            metadata: {
                option1Id,
                option2Id,
                option3Id,
                unavailableCount: unavailableOptionIds?.length || 0,
            },
        });
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
    }
    catch (error) {
        (0, logger_1.logError)('Failed to submit preference', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message }),
        };
    }
}
async function handleGetPreferences(event, user, pool) {
    try {
        const bookingId = event.pathParameters?.bookingId;
        if (!bookingId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Booking ID required' }),
            };
        }
        const bookingResult = await pool.query('SELECT student_id, instructor_id FROM bookings WHERE id = $1', [bookingId]);
        if (bookingResult.rows.length === 0) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Booking not found' }),
            };
        }
        const booking = bookingResult.rows[0];
        const isAuthorized = user.id === booking.student_id ||
            user.id === booking.instructor_id ||
            user.role === 'ADMIN';
        if (!isAuthorized) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Not authorized to view these preferences' }),
            };
        }
        const service = new preferenceRankingService_1.PreferenceRankingService(pool);
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
async function handleGetMyPreference(event, user, pool) {
    try {
        const bookingId = event.pathParameters?.bookingId;
        if (!bookingId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Booking ID required' }),
            };
        }
        const service = new preferenceRankingService_1.PreferenceRankingService(pool);
        const preference = await service.getPreference(bookingId, user.id);
        if (!preference) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Preference not found' }),
            };
        }
        const optionsService = new rescheduleOptionsService_1.RescheduleOptionsService(pool);
        const options = await optionsService.getOptionsByBooking(bookingId);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                preference,
                options,
            }),
        };
    }
    catch (error) {
        (0, logger_1.logError)('Failed to get preference', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message }),
        };
    }
}
async function handleManualEscalation(event, user, pool) {
    try {
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
        (0, logger_1.logInfo)('Manual escalation triggered', {
            bookingId,
            adminId: user.id,
            resolution,
        });
        await pool.query(`UPDATE bookings
       SET status = 'ESCALATED',
           updated_at = NOW()
       WHERE id = $1`, [bookingId]);
        const auditService3 = new auditService_1.AuditService(pool);
        await auditService3.logEvent({
            eventType: 'manual_escalation',
            entityType: 'booking',
            entityId: bookingId,
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
    }
    catch (error) {
        (0, logger_1.logError)('Failed to escalate booking', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message }),
        };
    }
}
//# sourceMappingURL=preferences.js.map