"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const bookingService_1 = __importDefault(require("../../services/bookingService"));
const logger_1 = __importStar(require("../../utils/logger"));
const auth_1 = require("../../middleware/auth");
const lambdaErrorHandler_1 = require("../../utils/lambdaErrorHandler");
const inputValidation_1 = require("../../utils/inputValidation");
async function handler(event) {
    const startTime = Date.now();
    (0, logger_1.logLambdaStart)('bookingsAPI', event);
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    };
    try {
        if (event.httpMethod === 'OPTIONS') {
            (0, logger_1.logLambdaEnd)('bookingsAPI', true, 200);
            return {
                statusCode: 200,
                headers,
                body: '',
            };
        }
        const authResult = await (0, auth_1.requireAuth)(event);
        if (!authResult.authorized) {
            (0, logger_1.logLambdaEnd)('bookingsAPI', false, 401);
            (0, logger_1.logAPICall)(event.path, event.httpMethod, 401, Date.now() - startTime);
            return authResult.response;
        }
        const user = authResult.user;
        const path = event.path;
        const method = event.httpMethod;
        const pathParams = event.pathParameters || {};
        logger_1.default.info('Booking request received', { path, method, userId: user.id });
        (0, logger_1.startPerformanceTimer)(`bookings_${method}_${path}`);
        let result;
        if (path.endsWith('/bookings') && method === 'GET') {
            result = await handleListBookings(event, headers, user.id);
        }
        else if (path.endsWith('/bookings') && method === 'POST') {
            result = await handleCreateBooking(event, headers, user.id);
        }
        else if (pathParams.id && method === 'GET') {
            result = await handleGetBooking(pathParams.id, headers, user.id);
        }
        else if (pathParams.id && method === 'PUT') {
            result = await handleUpdateBooking(pathParams.id, event, headers, user.id);
        }
        else if (pathParams.id && method === 'DELETE') {
            result = await handleDeleteBooking(pathParams.id, headers, user.id);
        }
        else if (pathParams.id && path.endsWith('/cancel') && method === 'POST') {
            result = await handleCancelBooking(pathParams.id, headers, user.id);
        }
        else {
            result = {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'Not Found',
                    message: `Route ${method} ${path} not found`,
                }),
            };
        }
        const duration = (0, logger_1.endPerformanceTimer)(`bookings_${method}_${path}`);
        (0, logger_1.logLambdaEnd)('bookingsAPI', true, result.statusCode);
        (0, logger_1.logAPICall)(path, method, result.statusCode, duration);
        return result;
    }
    catch (error) {
        return (0, lambdaErrorHandler_1.handleLambdaError)(error, {
            functionName: 'bookingsAPI',
            event,
            defaultStatusCode: 500,
        });
    }
}
async function handleListBookings(event, headers, userId) {
    try {
        const queryParams = event.queryStringParameters || {};
        const filters = {};
        if (queryParams.studentId)
            filters.studentId = queryParams.studentId;
        if (queryParams.instructorId)
            filters.instructorId = queryParams.instructorId;
        if (queryParams.status)
            filters.status = queryParams.status;
        if (queryParams.trainingLevel)
            filters.trainingLevel = queryParams.trainingLevel;
        if (queryParams.startDate)
            filters.startDate = queryParams.startDate;
        if (queryParams.endDate)
            filters.endDate = queryParams.endDate;
        if (queryParams.limit)
            filters.limit = parseInt(queryParams.limit, 10);
        if (queryParams.offset)
            filters.offset = parseInt(queryParams.offset, 10);
        const bookings = await bookingService_1.default.listBookings(filters);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                bookings: bookings.map((b) => ({
                    ...b,
                    scheduledDatetime: b.scheduledDatetime.toISOString(),
                    createdAt: b.createdAt.toISOString(),
                    updatedAt: b.updatedAt.toISOString(),
                    rescheduledToDatetime: b.rescheduledToDatetime?.toISOString(),
                })),
            }),
        };
    }
    catch (error) {
        logger_1.default.error('List bookings failed', {
            error: error instanceof Error ? error.message : 'Unknown',
        });
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to list bookings',
                message: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
}
async function handleCreateBooking(event, headers, userId) {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Bad Request',
                    message: 'Request body is required',
                }),
            };
        }
        const data = JSON.parse(event.body);
        if (data.studentId)
            data.studentId = String(data.studentId).trim();
        if (data.instructorId)
            data.instructorId = String(data.instructorId).trim();
        if (data.aircraftId)
            data.aircraftId = String(data.aircraftId).trim();
        const validation = (0, inputValidation_1.validateCreateBookingRequest)(data);
        if (!validation.valid) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Validation Error',
                    message: 'Invalid input data',
                    errors: validation.errors,
                }),
            };
        }
        const booking = await bookingService_1.default.createBooking(data);
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                booking: {
                    ...booking,
                    scheduledDatetime: booking.scheduledDatetime.toISOString(),
                    createdAt: booking.createdAt.toISOString(),
                    updatedAt: booking.updatedAt.toISOString(),
                },
            }),
        };
    }
    catch (error) {
        logger_1.default.error('Create booking failed', {
            error: error instanceof Error ? error.message : 'Unknown',
        });
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Failed to create booking',
                message: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
}
async function handleGetBooking(id, headers, userId) {
    const uuidValidation = (0, inputValidation_1.validateUUIDParam)(id, 'bookingId');
    if (!uuidValidation.valid) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Validation Error',
                message: uuidValidation.errors[0],
            }),
        };
    }
    try {
        const booking = await bookingService_1.default.getBookingWithUsers(id);
        if (!booking) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'Not Found',
                    message: 'Booking not found',
                }),
            };
        }
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                booking: {
                    ...booking,
                    scheduledDatetime: booking.scheduledDatetime.toISOString(),
                    createdAt: booking.createdAt.toISOString(),
                    updatedAt: booking.updatedAt.toISOString(),
                    rescheduledToDatetime: booking.rescheduledToDatetime?.toISOString(),
                },
            }),
        };
    }
    catch (error) {
        logger_1.default.error('Get booking failed', {
            id,
            error: error instanceof Error ? error.message : 'Unknown',
        });
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to get booking',
                message: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
}
async function handleUpdateBooking(id, event, headers, userId) {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Bad Request',
                    message: 'Request body is required',
                }),
            };
        }
        const data = JSON.parse(event.body);
        const uuidValidation = (0, inputValidation_1.validateUUIDParam)(id, 'bookingId');
        if (!uuidValidation.valid) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Validation Error',
                    message: uuidValidation.errors[0],
                }),
            };
        }
        const validation = (0, inputValidation_1.validateUpdateBookingRequest)(data);
        if (!validation.valid) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Validation Error',
                    message: 'Invalid input data',
                    errors: validation.errors,
                }),
            };
        }
        const booking = await bookingService_1.default.updateBooking(id, data);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                booking: {
                    ...booking,
                    scheduledDatetime: booking.scheduledDatetime.toISOString(),
                    createdAt: booking.createdAt.toISOString(),
                    updatedAt: booking.updatedAt.toISOString(),
                    rescheduledToDatetime: booking.rescheduledToDatetime?.toISOString(),
                },
            }),
        };
    }
    catch (error) {
        logger_1.default.error('Update booking failed', {
            id,
            error: error instanceof Error ? error.message : 'Unknown',
        });
        if (error instanceof Error && error.message === 'Booking not found') {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'Not Found',
                    message: 'Booking not found',
                }),
            };
        }
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Failed to update booking',
                message: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
}
async function handleDeleteBooking(id, headers, userId) {
    const uuidValidation = (0, inputValidation_1.validateUUIDParam)(id, 'bookingId');
    if (!uuidValidation.valid) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Validation Error',
                message: uuidValidation.errors[0],
            }),
        };
    }
    try {
        await bookingService_1.default.deleteBooking(id);
        return {
            statusCode: 204,
            headers,
            body: '',
        };
    }
    catch (error) {
        logger_1.default.error('Delete booking failed', {
            id,
            error: error instanceof Error ? error.message : 'Unknown',
        });
        if (error instanceof Error && error.message === 'Booking not found') {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'Not Found',
                    message: 'Booking not found',
                }),
            };
        }
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to delete booking',
                message: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
}
async function handleCancelBooking(id, headers, userId) {
    try {
        const booking = await bookingService_1.default.cancelBooking(id);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                booking: {
                    ...booking,
                    scheduledDatetime: booking.scheduledDatetime.toISOString(),
                    createdAt: booking.createdAt.toISOString(),
                    updatedAt: booking.updatedAt.toISOString(),
                },
            }),
        };
    }
    catch (error) {
        logger_1.default.error('Cancel booking failed', {
            id,
            error: error instanceof Error ? error.message : 'Unknown',
        });
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Failed to cancel booking',
                message: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
}
//# sourceMappingURL=bookings.js.map