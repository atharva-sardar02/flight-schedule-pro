"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearMetricsBuffer = exports.getMetricsBuffer = exports.logAPICall = exports.logNotificationSent = exports.logRescheduleAttempt = exports.logBookingCreated = exports.logConflictDetected = exports.logWeatherCheck = exports.logLambdaEnd = exports.logLambdaStart = exports.recordMetric = exports.endPerformanceTimer = exports.startPerformanceTimer = exports.logDebug = exports.logWarn = exports.logError = exports.logInfo = void 0;
const winston_1 = __importDefault(require("winston"));
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
};
winston_1.default.addColors(colors);
const metricsBuffer = [];
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: {
        service: 'flight-schedule-pro',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
    },
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)),
        }),
    ],
});
if (process.env.NODE_ENV === 'development') {
    logger.add(new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston_1.default.format.json(),
    }));
    logger.add(new winston_1.default.transports.File({
        filename: 'logs/combined.log',
        format: winston_1.default.format.json(),
    }));
    logger.add(new winston_1.default.transports.File({
        filename: 'logs/metrics.log',
        level: 'info',
        format: winston_1.default.format.json(),
    }));
}
const logInfo = (message, meta) => {
    logger.info(message, {
        ...meta,
        logType: 'application',
    });
};
exports.logInfo = logInfo;
const logError = (message, error, meta) => {
    const errorDetails = {
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
        if (error.response) {
            errorDetails.error.httpStatus = error.response.status;
            errorDetails.error.httpStatusText = error.response.statusText;
            errorDetails.error.httpData = error.response.data;
        }
        if (error.config) {
            errorDetails.error.request = {
                url: error.config.url,
                method: error.config.method,
                headers: error.config.headers,
            };
        }
        if (error.code && error.code.startsWith('23')) {
            errorDetails.error.databaseError = true;
            errorDetails.error.constraint = error.constraint;
            errorDetails.error.table = error.table;
        }
    }
    logger.error(message, errorDetails);
    (0, exports.recordMetric)('ErrorOccurred', 1, 'Count', {
        ErrorType: error?.name || 'Unknown',
        FunctionName: meta?.functionName || 'unknown',
    });
};
exports.logError = logError;
const logWarn = (message, meta) => {
    logger.warn(message, {
        ...meta,
        logType: 'warning',
    });
};
exports.logWarn = logWarn;
const logDebug = (message, meta) => {
    logger.debug(message, {
        ...meta,
        logType: 'debug',
    });
};
exports.logDebug = logDebug;
const performanceMarks = new Map();
const startPerformanceTimer = (timerName) => {
    performanceMarks.set(timerName, Date.now());
};
exports.startPerformanceTimer = startPerformanceTimer;
const endPerformanceTimer = (timerName, meta) => {
    const startTime = performanceMarks.get(timerName);
    if (!startTime) {
        (0, exports.logWarn)(`Performance timer not found: ${timerName}`);
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
    (0, exports.recordMetric)('PerformanceTimer', duration, 'Milliseconds', {
        TimerName: timerName,
    });
    return duration;
};
exports.endPerformanceTimer = endPerformanceTimer;
const recordMetric = (name, value, unit = 'Count', dimensions) => {
    const metric = {
        name,
        value,
        unit,
        timestamp: new Date(),
        dimensions,
    };
    metricsBuffer.push(metric);
    logger.info(`Metric: ${name}`, {
        metricName: name,
        value,
        unit,
        dimensions,
        logType: 'metric',
    });
    if (process.env.NODE_ENV === 'production') {
        logEMFMetric(name, value, unit, dimensions);
    }
};
exports.recordMetric = recordMetric;
const logEMFMetric = (name, value, unit, dimensions) => {
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
const logLambdaStart = (functionName, event) => {
    (0, exports.startPerformanceTimer)(`lambda_${functionName}`);
    logger.info(`Lambda function started: ${functionName}`, {
        functionName,
        eventType: event.source || event.httpMethod || 'unknown',
        requestId: event.requestContext?.requestId,
        logType: 'lambda_start',
    });
    (0, exports.recordMetric)('LambdaInvocation', 1, 'Count', {
        FunctionName: functionName,
    });
};
exports.logLambdaStart = logLambdaStart;
const logLambdaEnd = (functionName, success, statusCode) => {
    const duration = (0, exports.endPerformanceTimer)(`lambda_${functionName}`);
    logger.info(`Lambda function completed: ${functionName}`, {
        functionName,
        duration,
        success,
        statusCode,
        logType: 'lambda_end',
    });
    (0, exports.recordMetric)('LambdaDuration', duration, 'Milliseconds', {
        FunctionName: functionName,
    });
    (0, exports.recordMetric)(success ? 'LambdaSuccess' : 'LambdaError', 1, 'Count', {
        FunctionName: functionName,
    });
};
exports.logLambdaEnd = logLambdaEnd;
const logWeatherCheck = (bookingId, status, meta) => {
    logger.info(`Weather check: ${status}`, {
        bookingId,
        status,
        ...meta,
        logType: 'weather_check',
    });
    (0, exports.recordMetric)('WeatherCheck', 1, 'Count', {
        Status: status,
    });
};
exports.logWeatherCheck = logWeatherCheck;
const logConflictDetected = (bookingId, reason, meta) => {
    logger.warn(`Weather conflict detected`, {
        bookingId,
        reason,
        ...meta,
        logType: 'conflict',
    });
    (0, exports.recordMetric)('WeatherConflict', 1, 'Count', {
        Reason: reason,
    });
};
exports.logConflictDetected = logConflictDetected;
const logBookingCreated = (bookingId, trainingLevel) => {
    logger.info('Booking created', {
        bookingId,
        trainingLevel,
        logType: 'booking_created',
    });
    (0, exports.recordMetric)('BookingCreated', 1, 'Count', {
        TrainingLevel: trainingLevel,
    });
};
exports.logBookingCreated = logBookingCreated;
const logRescheduleAttempt = (bookingId, success) => {
    logger.info('Reschedule attempt', {
        bookingId,
        success,
        logType: 'reschedule',
    });
    (0, exports.recordMetric)('RescheduleAttempt', 1, 'Count', {
        Success: success.toString(),
    });
};
exports.logRescheduleAttempt = logRescheduleAttempt;
const logNotificationSent = (type, recipient, success) => {
    logger.info('Notification sent', {
        type,
        recipient: recipient.replace(/(.{3}).*(.{3}@.*)/, '$1***$2'),
        success,
        logType: 'notification',
    });
    (0, exports.recordMetric)('NotificationSent', 1, 'Count', {
        Type: type,
        Success: success.toString(),
    });
};
exports.logNotificationSent = logNotificationSent;
const logAPICall = (endpoint, method, statusCode, duration) => {
    logger.info('API call', {
        endpoint,
        method,
        statusCode,
        duration,
        logType: 'api_call',
    });
    (0, exports.recordMetric)('APICall', 1, 'Count', {
        Endpoint: endpoint,
        Method: method,
        StatusCode: statusCode.toString(),
    });
    (0, exports.recordMetric)('APILatency', duration, 'Milliseconds', {
        Endpoint: endpoint,
    });
};
exports.logAPICall = logAPICall;
const getMetricsBuffer = () => {
    return [...metricsBuffer];
};
exports.getMetricsBuffer = getMetricsBuffer;
const clearMetricsBuffer = () => {
    metricsBuffer.length = 0;
};
exports.clearMetricsBuffer = clearMetricsBuffer;
exports.default = logger;
//# sourceMappingURL=logger.js.map