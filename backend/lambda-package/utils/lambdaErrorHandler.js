"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLambdaError = handleLambdaError;
exports.createSuccessResponse = createSuccessResponse;
exports.withErrorHandling = withErrorHandling;
exports.isRetryableError = isRetryableError;
const logger_1 = require("./logger");
function handleLambdaError(error, context) {
    const functionName = context?.functionName || 'unknown';
    const defaultStatusCode = context?.defaultStatusCode || 500;
    let statusCode = defaultStatusCode;
    let errorMessage = 'Internal Server Error';
    let errorCode;
    let retryable = false;
    let details = undefined;
    if (error instanceof Error) {
        errorMessage = error.message;
        if ('statusCode' in error && typeof error.statusCode === 'number') {
            statusCode = error.statusCode;
        }
        if ('code' in error && typeof error.code === 'string') {
            errorCode = error.code;
        }
        if ('retryable' in error && typeof error.retryable === 'boolean') {
            retryable = error.retryable;
        }
        if ('details' in error) {
            details = error.details;
        }
        if (error.code === 'ECONNREFUSED' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ENOTFOUND' ||
            error.message.includes('timeout')) {
            retryable = true;
            statusCode = 503;
        }
        if (error.message.includes('database') || error.message.includes('connection')) {
            retryable = true;
            statusCode = 503;
        }
        if (error.message.includes('validation') || error.message.includes('invalid')) {
            statusCode = 400;
            retryable = false;
        }
        if (error.message.includes('unauthorized') ||
            error.message.includes('forbidden') ||
            error.message.includes('authentication')) {
            statusCode = 401;
            retryable = false;
        }
    }
    else if (typeof error === 'string') {
        errorMessage = error;
    }
    (0, logger_1.logError)(`Lambda error in ${functionName}`, error instanceof Error ? error : new Error(errorMessage), {
        functionName,
        statusCode,
        retryable,
        errorCode,
        event: context?.event ? JSON.stringify(context.event).substring(0, 500) : undefined,
    });
    const errorResponse = {
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
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
        },
        body: JSON.stringify(errorResponse),
    };
}
function getErrorType(statusCode) {
    if (statusCode >= 400 && statusCode < 500) {
        return 'ClientError';
    }
    else if (statusCode >= 500) {
        return 'ServerError';
    }
    return 'Error';
}
function createSuccessResponse(data, statusCode = 200) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
        },
        body: JSON.stringify(data),
    };
}
function withErrorHandling(handler, options) {
    return async (event) => {
        try {
            return await handler(event);
        }
        catch (error) {
            if (options?.functionName) {
                return handleLambdaError(error, {
                    functionName: options.functionName,
                    event: event,
                    defaultStatusCode: options.defaultStatusCode,
                });
            }
            throw error;
        }
    };
}
function isRetryableError(error) {
    if (error instanceof Error) {
        if (error.code === 'ECONNREFUSED' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ENOTFOUND' ||
            error.message.includes('timeout')) {
            return true;
        }
        if (error.message.includes('database') || error.message.includes('connection')) {
            return true;
        }
        if ('response' in error && error.response?.status >= 500) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=lambdaErrorHandler.js.map