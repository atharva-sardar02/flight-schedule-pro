/**
 * Frontend Error Handling Utilities
 * Provides user-friendly error messages and handling
 */

import { AxiosError } from 'axios';

export interface UserFriendlyError {
  title: string;
  message: string;
  actionable: boolean;
  retryable: boolean;
}

/**
 * Convert technical errors to user-friendly messages
 */
export function getUserFriendlyError(error: unknown): UserFriendlyError {
  // Network/API errors
  if (error instanceof Error && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;

    // No response (network error)
    if (!axiosError.response) {
      return {
        title: 'Connection Error',
        message:
          'Unable to connect to the server. Please check your internet connection and try again.',
        actionable: true,
        retryable: true,
      };
    }

    // HTTP status codes
    const status = axiosError.response.status;
    const data = axiosError.response.data as any;

    switch (status) {
      case 400:
        // Show validation errors if available
        if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          return {
            title: 'Validation Error',
            message: data.errors.join('. '),
            actionable: true,
            retryable: false,
          };
        }
        return {
          title: 'Invalid Request',
          message:
            data?.message || data?.error || 'The information provided is invalid. Please check and try again.',
          actionable: true,
          retryable: false,
        };

      case 401:
        return {
          title: 'Authentication Required',
          message: 'Your session has expired. Please log in again.',
          actionable: true,
          retryable: false,
        };

      case 403:
        return {
          title: 'Access Denied',
          message: "You don't have permission to perform this action.",
          actionable: false,
          retryable: false,
        };

      case 404:
        return {
          title: 'Not Found',
          message: 'The requested resource could not be found.',
          actionable: false,
          retryable: false,
        };

      case 409:
        return {
          title: 'Conflict',
          message:
            data?.error ||
            'This action conflicts with existing data. Please refresh and try again.',
          actionable: true,
          retryable: true,
        };

      case 429:
        return {
          title: 'Too Many Requests',
          message: 'Please wait a moment before trying again.',
          actionable: false,
          retryable: true,
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          title: 'Server Error',
          message:
            'Our servers are experiencing issues. Please try again in a few moments.',
          actionable: false,
          retryable: true,
        };

      default:
        return {
          title: 'Error',
          message: data?.error || 'An unexpected error occurred. Please try again.',
          actionable: true,
          retryable: true,
        };
    }
  }

  // Generic JavaScript errors
  if (error instanceof Error) {
    return {
      title: 'Application Error',
      message: error.message || 'An unexpected error occurred.',
      actionable: false,
      retryable: false,
    };
  }

  // Unknown error type
  return {
    title: 'Unknown Error',
    message: 'Something went wrong. Please try again.',
    actionable: false,
    retryable: true,
  };
}

/**
 * Log error to monitoring service
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  const errorData = {
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : { message: String(error) },
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorData);
  }

  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    try {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
        keepalive: true, // Ensure request completes even if user navigates away
      }).catch((e) => console.error('Failed to log error:', e));
    } catch (e) {
      console.error('Error logging failed:', e);
    }
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryOperation<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on authentication errors
      if (error instanceof Error && 'isAxiosError' in error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          throw error;
        }
      }

      // Wait before retrying (exponential backoff with jitter)
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;

    // Network errors are retryable
    if (!axiosError.response) {
      return true;
    }

    // 5xx errors and 429 are retryable
    return status ? status >= 500 || status === 429 : false;
  }

  return false;
}

/**
 * Show user-friendly error notification
 */
export function showErrorNotification(error: unknown, context?: string): void {
  const friendlyError = getUserFriendlyError(error);

  // Log the error
  logError(error, { context });

  // In a real app, this would trigger a toast/notification
  // For now, we'll use console
  console.warn(`${friendlyError.title}: ${friendlyError.message}`);
}



