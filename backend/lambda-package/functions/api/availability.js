"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.availabilityHandler = void 0;
const availabilityService_1 = require("../../services/availabilityService");
const auth_1 = require("../../middleware/auth");
const logger_1 = require("../../utils/logger");
const logger_2 = __importDefault(require("../../utils/logger"));
const lambdaErrorHandler_1 = require("../../utils/lambdaErrorHandler");
const inputValidation_1 = require("../../utils/inputValidation");
const db_1 = require("../../utils/db");
const availabilityHandler = async (event) => {
    const startTime = Date.now();
    (0, logger_1.logLambdaStart)('availabilityAPI', event);
    try {
        const authResult = await (0, auth_1.requireAuth)(event);
        if (!authResult.authorized) {
            return authResult.response;
        }
        const user = authResult.user;
        const availabilityService = new availabilityService_1.AvailabilityService((0, db_1.getDbPool)());
        const method = event.httpMethod;
        const pathSegments = event.path.split('/').filter(Boolean);
        (0, logger_1.startPerformanceTimer)(`availability_${method}_${event.path}`);
        let result;
        if (pathSegments.includes('recurring')) {
            result = await handleRecurringAvailability(event, user, availabilityService);
        }
        else if (pathSegments.includes('overrides')) {
            result = await handleAvailabilityOverrides(event, user, availabilityService);
        }
        else if (method === 'GET' && pathSegments.length === 1) {
            result = await handleGetAvailability(event, user, availabilityService);
        }
        else {
            result = {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Not found' }),
            };
        }
        const duration = (0, logger_1.endPerformanceTimer)(`availability_${method}_${event.path}`);
        (0, logger_1.logLambdaEnd)('availabilityAPI', true, result.statusCode);
        (0, logger_1.logAPICall)(event.path, method, result.statusCode, duration);
        return result;
    }
    catch (error) {
        console.error('=== AVAILABILITY API ERROR ===');
        console.error('Error type:', error?.constructor?.name);
        console.error('Error message:', error?.message);
        console.error('Error code:', error?.code);
        console.error('Error stack:', error?.stack);
        console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('=============================');
        return (0, lambdaErrorHandler_1.handleLambdaError)(error, {
            functionName: 'availabilityAPI',
            event,
            defaultStatusCode: error.message === 'Unauthorized' ? 401 : 500,
        });
    }
};
exports.availabilityHandler = availabilityHandler;
async function handleRecurringAvailability(event, user, service) {
    const method = event.httpMethod;
    const pathSegments = event.path.split('/').filter(Boolean);
    const recurringId = pathSegments[pathSegments.length - 1];
    switch (method) {
        case 'GET':
            const patterns = await service.getRecurringAvailability(user.id);
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patterns),
            };
        case 'POST':
            const createData = JSON.parse(event.body || '{}');
            const createValidation = (0, inputValidation_1.validateRecurringAvailabilityRequest)(createData);
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
            if (recurringId === 'recurring') {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Recurring availability ID required' }),
                };
            }
            const uuidValidation = (0, inputValidation_1.validateUUIDParam)(recurringId, 'recurringId');
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
            if (updateData.startTime || updateData.endTime) {
                const updateValidation = (0, inputValidation_1.validateRecurringAvailabilityRequest)({
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
            const updatedPattern = await service.updateRecurringAvailability(recurringId, user.id, updateData);
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPattern),
            };
        case 'DELETE':
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
async function handleAvailabilityOverrides(event, user, service) {
    const method = event.httpMethod;
    const pathSegments = event.path.split('/').filter(Boolean);
    const overrideId = pathSegments[pathSegments.length - 1];
    switch (method) {
        case 'GET':
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
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(overrides),
            };
        case 'POST':
            const createData = JSON.parse(event.body || '{}');
            const newOverride = await service.createAvailabilityOverride(user.id, createData);
            return {
                statusCode: 201,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOverride),
            };
        case 'PUT':
            if (overrideId === 'overrides') {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Override ID required' }),
                };
            }
            const updateData = JSON.parse(event.body || '{}');
            const updatedOverride = await service.updateAvailabilityOverride(overrideId, user.id, updateData);
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedOverride),
            };
        case 'DELETE':
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
async function handleGetAvailability(event, user, service) {
    try {
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
        const serializedAvailability = {
            ...availability,
            slots: availability.slots.map((slot) => ({
                ...slot,
                date: slot.date instanceof Date ? slot.date.toISOString().split('T')[0] : slot.date,
            })),
            recurringPatterns: availability.recurringPatterns.map((pattern) => ({
                ...pattern,
                createdAt: pattern.createdAt instanceof Date ? pattern.createdAt.toISOString() : pattern.createdAt,
                updatedAt: pattern.updatedAt instanceof Date ? pattern.updatedAt.toISOString() : pattern.updatedAt,
            })),
            overrides: availability.overrides.map((override) => ({
                ...override,
                overrideDate: override.overrideDate instanceof Date
                    ? override.overrideDate.toISOString().split('T')[0]
                    : override.overrideDate,
                createdAt: override.createdAt instanceof Date ? override.createdAt.toISOString() : override.createdAt,
            })),
        };
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(serializedAvailability),
        };
    }
    catch (error) {
        const errorMessage = error?.message || String(error);
        const errorStack = error?.stack || 'No stack trace';
        logger_2.default.error('Get availability failed', {
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
//# sourceMappingURL=availability.js.map