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
import logger from '../../utils/logger';
import { requireAuth } from '../../middleware/auth';

/**
 * Main Lambda handler for booking operations
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    // Handle OPTIONS request (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // Authenticate request
    const authResult = await requireAuth(event);
    if (!authResult.authorized) {
      return authResult.response;
    }

    const user = authResult.user;
    const path = event.path;
    const method = event.httpMethod;
    const pathParams = event.pathParameters || {};

    logger.info('Booking request received', { path, method, userId: user.id });

    // Route to appropriate handler
    if (path.endsWith('/bookings') && method === 'GET') {
      return await handleListBookings(event, headers, user.id);
    }

    if (path.endsWith('/bookings') && method === 'POST') {
      return await handleCreateBooking(event, headers, user.id);
    }

    if (pathParams.id && method === 'GET') {
      return await handleGetBooking(pathParams.id, headers, user.id);
    }

    if (pathParams.id && method === 'PUT') {
      return await handleUpdateBooking(pathParams.id, event, headers, user.id);
    }

    if (pathParams.id && method === 'DELETE') {
      return await handleDeleteBooking(pathParams.id, headers, user.id);
    }

    if (pathParams.id && path.endsWith('/cancel') && method === 'POST') {
      return await handleCancelBooking(pathParams.id, headers, user.id);
    }

    // Route not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Not Found',
        message: `Route ${method} ${path} not found`,
      }),
    };
  } catch (error) {
    logger.error('Booking handler error', {
      error: error instanceof Error ? error.message : 'Unknown',
      path: event.path,
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
    };
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

    // Validate required fields
    if (
      !data.studentId ||
      !data.instructorId ||
      !data.departureAirport ||
      !data.arrivalAirport ||
      !data.scheduledDatetime ||
      !data.trainingLevel
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Missing required fields',
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

/**
 * Handle get booking
 */
async function handleGetBooking(
  id: string,
  headers: Record<string, string>,
  userId: string
): Promise<APIGatewayProxyResult> {
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

