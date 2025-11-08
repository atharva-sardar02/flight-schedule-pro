/**
 * CloudWatch Logger Utility
 * Structured logging for Lambda functions with CloudWatch integration and custom metrics
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

// Metrics storage (in-memory for Lambda, CloudWatch for production)
interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  dimensions?: Record<string, string>;
}

const metricsBuffer: Metric[] = [];

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
    version: process.env.APP_VERSION || '1.0.0',
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
  logger.add(
    new winston.transports.File({
      filename: 'logs/metrics.log',
      level: 'info',
      format: winston.format.json(),
    })
  );
}

// Helper methods for structured logging
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, {
    ...meta,
    logType: 'application',
  });
};

export const logError = (message: string, error?: Error | any, meta?: any) => {
  const errorDetails: any = {
    ...meta,
    logType: 'error',
    timestamp: new Date().toISOString(),
  };

  if (error) {
    errorDetails.error = {
      message: error.message || String(error),
      stack: error.stack,
      name: error.name || 'UnknownError',
      code: error.code,
    };

    // Add HTTP error details if available
    if (error.response) {
      errorDetails.error.httpStatus = error.response.status;
      errorDetails.error.httpStatusText = error.response.statusText;
      errorDetails.error.httpData = error.response.data;
    }

    // Add request details if available
    if (error.config) {
      errorDetails.error.request = {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers,
      };
    }

    // Add database error details if available
    if (error.code && error.code.startsWith('23')) {
      errorDetails.error.databaseError = true;
      errorDetails.error.constraint = error.constraint;
      errorDetails.error.table = error.table;
    }
  }

  logger.error(message, errorDetails);

  // Record error metric
  recordMetric('ErrorOccurred', 1, 'Count', {
    ErrorType: error?.name || 'Unknown',
    FunctionName: meta?.functionName || 'unknown',
  });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, {
    ...meta,
    logType: 'warning',
  });
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, {
    ...meta,
    logType: 'debug',
  });
};

// Performance tracking
const performanceMarks = new Map<string, number>();

export const startPerformanceTimer = (timerName: string): void => {
  performanceMarks.set(timerName, Date.now());
};

export const endPerformanceTimer = (timerName: string, meta?: any): number => {
  const startTime = performanceMarks.get(timerName);
  if (!startTime) {
    logWarn(`Performance timer not found: ${timerName}`);
    return 0;
  }

  const duration = Date.now() - startTime;
  performanceMarks.delete(timerName);

  logger.info(`Performance: ${timerName}`, {
    duration,
    durationMs: duration,
    timerName,
    ...meta,
    logType: 'performance',
  });

  // Record as metric
  recordMetric('PerformanceTimer', duration, 'Milliseconds', {
    TimerName: timerName,
  });

  return duration;
};

// CloudWatch Custom Metrics
export const recordMetric = (
  name: string,
  value: number,
  unit: string = 'Count',
  dimensions?: Record<string, string>
): void => {
  const metric: Metric = {
    name,
    value,
    unit,
    timestamp: new Date(),
    dimensions,
  };

  metricsBuffer.push(metric);

  // Log metric
  logger.info(`Metric: ${name}`, {
    metricName: name,
    value,
    unit,
    dimensions,
    logType: 'metric',
  });

  // In production, this would push to CloudWatch Metrics
  // For now, we log to CloudWatch Logs with EMF (Embedded Metric Format)
  if (process.env.NODE_ENV === 'production') {
    logEMFMetric(name, value, unit, dimensions);
  }
};

// Embedded Metric Format for CloudWatch
const logEMFMetric = (
  name: string,
  value: number,
  unit: string,
  dimensions?: Record<string, string>
): void => {
  const emfLog = {
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [
        {
          Namespace: 'FlightSchedulePro',
          Dimensions: dimensions ? [Object.keys(dimensions)] : [[]],
          Metrics: [
            {
              Name: name,
              Unit: unit,
            },
          ],
        },
      ],
    },
    ...dimensions,
    [name]: value,
  };

  console.log(JSON.stringify(emfLog));
};

// Lambda-specific logging helpers
export const logLambdaStart = (functionName: string, event: any) => {
  startPerformanceTimer(`lambda_${functionName}`);
  
  logger.info(`Lambda function started: ${functionName}`, {
    functionName,
    eventType: event.source || event.httpMethod || 'unknown',
    requestId: event.requestContext?.requestId,
    logType: 'lambda_start',
  });

  recordMetric('LambdaInvocation', 1, 'Count', {
    FunctionName: functionName,
  });
};

export const logLambdaEnd = (
  functionName: string,
  success: boolean,
  statusCode?: number
) => {
  const duration = endPerformanceTimer(`lambda_${functionName}`);

  logger.info(`Lambda function completed: ${functionName}`, {
    functionName,
    duration,
    success,
    statusCode,
    logType: 'lambda_end',
  });

  recordMetric('LambdaDuration', duration, 'Milliseconds', {
    FunctionName: functionName,
  });

  recordMetric(success ? 'LambdaSuccess' : 'LambdaError', 1, 'Count', {
    FunctionName: functionName,
  });
};

// Business metrics
export const logWeatherCheck = (bookingId: string, status: string, meta?: any) => {
  logger.info(`Weather check: ${status}`, {
    bookingId,
    status,
    ...meta,
    logType: 'weather_check',
  });

  recordMetric('WeatherCheck', 1, 'Count', {
    Status: status,
  });
};

export const logConflictDetected = (bookingId: string, reason: string, meta?: any) => {
  logger.warn(`Weather conflict detected`, {
    bookingId,
    reason,
    ...meta,
    logType: 'conflict',
  });

  recordMetric('WeatherConflict', 1, 'Count', {
    Reason: reason,
  });
};

export const logBookingCreated = (bookingId: string, trainingLevel: string) => {
  logger.info('Booking created', {
    bookingId,
    trainingLevel,
    logType: 'booking_created',
  });

  recordMetric('BookingCreated', 1, 'Count', {
    TrainingLevel: trainingLevel,
  });
};

export const logRescheduleAttempt = (bookingId: string, success: boolean) => {
  logger.info('Reschedule attempt', {
    bookingId,
    success,
    logType: 'reschedule',
  });

  recordMetric('RescheduleAttempt', 1, 'Count', {
    Success: success.toString(),
  });
};

export const logNotificationSent = (
  type: string,
  recipient: string,
  success: boolean
) => {
  logger.info('Notification sent', {
    type,
    recipient: recipient.replace(/(.{3}).*(.{3}@.*)/, '$1***$2'), // Mask email
    success,
    logType: 'notification',
  });

  recordMetric('NotificationSent', 1, 'Count', {
    Type: type,
    Success: success.toString(),
  });
};

export const logAPICall = (
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number
) => {
  logger.info('API call', {
    endpoint,
    method,
    statusCode,
    duration,
    logType: 'api_call',
  });

  recordMetric('APICall', 1, 'Count', {
    Endpoint: endpoint,
    Method: method,
    StatusCode: statusCode.toString(),
  });

  recordMetric('APILatency', duration, 'Milliseconds', {
    Endpoint: endpoint,
  });
};

// Get all buffered metrics (useful for batch sending)
export const getMetricsBuffer = (): Metric[] => {
  return [...metricsBuffer];
};

// Clear metrics buffer
export const clearMetricsBuffer = (): void => {
  metricsBuffer.length = 0;
};

export default logger;
