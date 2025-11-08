/**
 * Lambda Error Handler Utility
 * Provides consistent error handling and response formatting for Lambda functions
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { logError, logWarn } from './logger';

export interface LambdaError {
  message: string;
  code?: string;
  statusCode?: number;
  retryable?: boolean;
  details?: any;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  retryable?: boolean;
  details?: any;
}

/**
 * Handle errors in Lambda functions and return appropriate responses
 */
export function handleLambdaError(
  error: unknown,
  context?: {
    functionName?: string;
    event?: any;
    defaultStatusCode?: number;
  }
): APIGatewayProxyResult {
  const functionName = context?.functionName || 'unknown';
  const defaultStatusCode = context?.defaultStatusCode || 500;

  // Extract error information
  let statusCode = defaultStatusCode;
  let errorMessage = 'Internal Server Error';
  let errorCode: string | undefined;
  let retryable = false;
  let details: any = undefined;

  if (error instanceof Error) {
    errorMessage = error.message;

    // Check for specific error types
    if ('statusCode' in error && typeof (error as any).statusCode === 'number') {
      statusCode = (error as any).statusCode;
    }

    if ('code' in error && typeof (error as any).code === 'string') {
      errorCode = (error as any).code;
    }

    if ('retryable' in error && typeof (error as any).retryable === 'boolean') {
      retryable = (error as any).retryable;
    }

    if ('details' in error) {
      details = (error as any).details;
    }

    // Network/timeout errors are retryable
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.message.includes('timeout')
    ) {
      retryable = true;
      statusCode = 503; // Service Unavailable
    }

    // Database connection errors
    if (error.message.includes('database') || error.message.includes('connection')) {
      retryable = true;
      statusCode = 503;
    }

    // Validation errors
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      statusCode = 400; // Bad Request
      retryable = false;
    }

    // Authentication/authorization errors
    if (
      error.message.includes('unauthorized') ||
      error.message.includes('forbidden') ||
      error.message.includes('authentication')
    ) {
      statusCode = 401; // Unauthorized
      retryable = false;
    }
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // Log error with context
  logError(`Lambda error in ${functionName}`, error instanceof Error ? error : new Error(errorMessage), {
    functionName,
    statusCode,
    retryable,
    errorCode,
    event: context?.event ? JSON.stringify(context.event).substring(0, 500) : undefined,
  });

  // Build error response
  const errorResponse: ErrorResponse = {
    error: getErrorType(statusCode),
    message: errorMessage,
  };

  if (errorCode) {
    errorResponse.code = errorCode;
  }

  if (retryable) {
    errorResponse.retryable = retryable;
  }

  if (details && process.env.NODE_ENV === 'development') {
    errorResponse.details = details;
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(errorResponse),
  };
}

/**
 * Get error type based on status code
 */
function getErrorType(statusCode: number): string {
  if (statusCode >= 400 && statusCode < 500) {
    return 'ClientError';
  } else if (statusCode >= 500) {
    return 'ServerError';
  }
  return 'Error';
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse(
  data: any,
  statusCode: number = 200
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(data),
  };
}

/**
 * Wrap Lambda handler with error handling
 */
export function withErrorHandling<TEvent = any, TResult = APIGatewayProxyResult>(
  handler: (event: TEvent) => Promise<TResult>,
  options?: {
    functionName?: string;
    defaultStatusCode?: number;
  }
) {
  return async (event: TEvent): Promise<TResult> => {
    try {
      return await handler(event);
    } catch (error) {
      if (options?.functionName) {
        return handleLambdaError(error, {
          functionName: options.functionName,
          event: event as any,
          defaultStatusCode: options.defaultStatusCode,
        }) as TResult;
      }
      throw error;
    }
  };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.message.includes('timeout')
    ) {
      return true;
    }

    // Database connection errors
    if (error.message.includes('database') || error.message.includes('connection')) {
      return true;
    }

    // 5xx errors from HTTP responses
    if ('response' in error && (error as any).response?.status >= 500) {
      return true;
    }
  }

  return false;
}

