/**
 * Bookings Lambda Function
 * Handles CRUD operations for flight bookings
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import BookingService from '../../services/bookingService';
import {
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingListFilters,
} from '../../types/booking';
import logger, {
  logLambdaStart,
  logLambdaEnd,
  logAPICall,
  startPerformanceTimer,
  endPerformanceTimer,
} from '../../utils/logger';
import { requireAuth } from '../../middleware/auth';
import { handleLambdaError } from '../../utils/lambdaErrorHandler';
import {
  validateCreateBookingRequest,
  validateUpdateBookingRequest,
  validateUUIDParam,
} from '../../utils/inputValidation';

/**
 * Main Lambda handler for booking operations
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();
  logLambdaStart('bookingsAPI', event);
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    // Handle OPTIONS request (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
      logLambdaEnd('bookingsAPI', true, 200);
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // Authenticate request
    const authResult = await requireAuth(event);
    if (!authResult.authorized) {
      logLambdaEnd('bookingsAPI', false, 401);
      logAPICall(event.path, event.httpMethod, 401, Date.now() - startTime);
      return (authResult as any).response;
    }

    const user = authResult.user;
    const path = event.path;
    const method = event.httpMethod;
    const pathParams = event.pathParameters || {};

    logger.info('Booking request received', { path, method, userId: user.id });
    startPerformanceTimer(`bookings_${method}_${path}`);

    let result: APIGatewayProxyResult;

    // Route to appropriate handler
    if (path.endsWith('/bookings') && method === 'GET') {
      result = await handleListBookings(event, headers, user.id);
    } else if (path.endsWith('/bookings') && method === 'POST') {
      result = await handleCreateBooking(event, headers, user.id);
    } else if (pathParams.id && method === 'GET') {
      result = await handleGetBooking(pathParams.id, headers, user.id);
    } else if (pathParams.id && method === 'PUT') {
      result = await handleUpdateBooking(pathParams.id, event, headers, user.id);
    } else if (pathParams.id && method === 'DELETE') {
      result = await handleDeleteBooking(pathParams.id, headers, user.id);
    } else if (pathParams.id && path.endsWith('/cancel') && method === 'POST') {
      result = await handleCancelBooking(pathParams.id, headers, user.id);
    } else {
      // Route not found
      result = {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Not Found',
          message: `Route ${method} ${path} not found`,
        }),
      };
    }

    const duration = endPerformanceTimer(`bookings_${method}_${path}`);
    logLambdaEnd('bookingsAPI', true, result.statusCode);
    logAPICall(path, method, result.statusCode, duration);

    return result;
  } catch (error) {
    return handleLambdaError(error, {
      functionName: 'bookingsAPI',
      event,
      defaultStatusCode: 500,
    });
  }
}

/**
 * Handle list bookings
 */
async function handleListBookings(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>,
  userId: string
): Promise<APIGatewayProxyResult> {
  try {
    const queryParams = event.queryStringParameters || {};
    const filters: BookingListFilters = {};

    if (queryParams.studentId) filters.studentId = queryParams.studentId;
    if (queryParams.instructorId) filters.instructorId = queryParams.instructorId;
    if (queryParams.status) filters.status = queryParams.status as any;
    if (queryParams.trainingLevel)
      filters.trainingLevel = queryParams.trainingLevel as any;
    if (queryParams.startDate) filters.startDate = queryParams.startDate;
    if (queryParams.endDate) filters.endDate = queryParams.endDate;
    if (queryParams.limit) filters.limit = parseInt(queryParams.limit, 10);
    if (queryParams.offset) filters.offset = parseInt(queryParams.offset, 10);

    const bookings = await BookingService.listBookings(filters);

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
  } catch (error) {
    logger.error('List bookings failed', {
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

/**
 * Handle create booking
 */
async function handleCreateBooking(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>,
  userId: string
): Promise<APIGatewayProxyResult> {
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

    const data: CreateBookingRequest = JSON.parse(event.body);

    // Trim string fields to remove whitespace
    if (data.studentId) data.studentId = String(data.studentId).trim();
    if (data.instructorId) data.instructorId = String(data.instructorId).trim();
    if (data.aircraftId) data.aircraftId = String(data.aircraftId).trim();

    // Validate input
    const validation = validateCreateBookingRequest(data);
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

    const booking = await BookingService.createBooking(data);

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
  } catch (error) {
    logger.error('Create booking failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Failed to create booking',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      }),
    };
  }
}

/**
 * Handle get booking
 */
async function handleGetBooking(
  id: string,
  headers: Record<string, string>,
  userId: string
): Promise<APIGatewayProxyResult> {
  // Validate UUID parameter
  const uuidValidation = validateUUIDParam(id, 'bookingId');
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
    const booking = await BookingService.getBookingWithUsers(id);

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
  } catch (error) {
    logger.error('Get booking failed', {
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

/**
 * Handle update booking
 */
async function handleUpdateBooking(
  id: string,
  event: APIGatewayProxyEvent,
  headers: Record<string, string>,
  userId: string
): Promise<APIGatewayProxyResult> {
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

    const data: UpdateBookingRequest = JSON.parse(event.body);

    // Validate UUID parameter
    const uuidValidation = validateUUIDParam(id, 'bookingId');
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

    // Validate input
    const validation = validateUpdateBookingRequest(data);
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

    const booking = await BookingService.updateBooking(id, data);

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
  } catch (error) {
    logger.error('Update booking failed', {
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

/**
 * Handle delete booking
 */
async function handleDeleteBooking(
  id: string,
  headers: Record<string, string>,
  userId: string
): Promise<APIGatewayProxyResult> {
  // Validate UUID parameter
  const uuidValidation = validateUUIDParam(id, 'bookingId');
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
    await BookingService.deleteBooking(id);

    return {
      statusCode: 204,
      headers,
      body: '',
    };
  } catch (error) {
    logger.error('Delete booking failed', {
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

/**
 * Handle cancel booking
 */
async function handleCancelBooking(
  id: string,
  headers: Record<string, string>,
  userId: string
): Promise<APIGatewayProxyResult> {
  try {
    const booking = await BookingService.cancelBooking(id);

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
  } catch (error) {
    logger.error('Cancel booking failed', {
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

