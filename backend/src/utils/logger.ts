/**
 * CloudWatch Logger Utility
 * Structured logging for Lambda functions with CloudWatch integration
 */

import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'flight-schedule-pro',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport for local development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
        )
      ),
    }),
  ],
});

// Add file transport for local development
if (process.env.NODE_ENV === 'development') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json(),
    })
  );
}

// Helper methods for structured logging
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error, meta?: any) => {
  logger.error(message, {
    error: error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : undefined,
    ...meta,
  });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Lambda-specific logging helpers
export const logLambdaStart = (functionName: string, event: any) => {
  logger.info(`Lambda function started: ${functionName}`, {
    functionName,
    eventType: event.source || 'unknown',
  });
};

export const logLambdaEnd = (functionName: string, duration: number, success: boolean) => {
  logger.info(`Lambda function completed: ${functionName}`, {
    functionName,
    duration,
    success,
  });
};

export const logWeatherCheck = (bookingId: string, status: string, meta?: any) => {
  logger.info(`Weather check: ${status}`, {
    bookingId,
    status,
    ...meta,
  });
};

export const logConflictDetected = (bookingId: string, reason: string, meta?: any) => {
  logger.warn(`Weather conflict detected`, {
    bookingId,
    reason,
    ...meta,
  });
};

export default logger;
