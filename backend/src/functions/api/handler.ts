/**
 * Main API Gateway Handler
 * Routes requests to appropriate API handlers based on path
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler as authHandler } from './auth';
import { handler as bookingsHandler } from './bookings';
import { availabilityHandler } from './availability';
// Note: reschedule and preferences are handled within their own files
// We'll route to them via their exported handlers if they exist
import { handleLambdaError } from '../../utils/lambdaErrorHandler';
import { logLambdaStart, logLambdaEnd } from '../../utils/logger';

/**
 * Main Lambda handler for API Gateway
 * Routes requests to appropriate handlers based on path
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logLambdaStart('apiGateway', event);

  try {
    const path = event.path;
    const method = event.httpMethod;

    // Route to appropriate handler based on path
    if (path.startsWith('/auth') || path.includes('/login') || path.includes('/register')) {
      return await authHandler(event);
    } else if (path.includes('/bookings')) {
      return await bookingsHandler(event);
    } else if (path.includes('/availability')) {
      return await availabilityHandler(event);
    } else if (path.includes('/reschedule') || path.includes('/preferences')) {
      // For now, return 501 - these will be handled by separate Lambda functions
      // or we can add handlers here later
      return {
        statusCode: 501,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Not Implemented',
          message: 'Reschedule and preferences endpoints require separate Lambda functions',
        }),
      };
    } else if (path === '/health' || path === '/') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ok',
          service: 'flight-schedule-pro-api',
          timestamp: new Date().toISOString(),
        }),
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Not Found',
          message: `Route ${method} ${path} not found`,
        }),
      };
    }
  } catch (error) {
    return handleLambdaError(error, {
      functionName: 'apiGateway',
      event,
      defaultStatusCode: 500,
    });
  } finally {
    logLambdaEnd('apiGateway', true, 200);
  }
}

