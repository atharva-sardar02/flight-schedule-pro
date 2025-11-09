"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUUID = isValidUUID;
exports.isValidEmail = isValidEmail;
exports.isValidAirportCode = isValidAirportCode;
exports.isValidCoordinate = isValidCoordinate;
exports.isValidLatitude = isValidLatitude;
exports.isValidLongitude = isValidLongitude;
exports.isValidDateString = isValidDateString;
exports.isFutureDate = isFutureDate;
exports.isValidTimeFormat = isValidTimeFormat;
exports.isValidTrainingLevel = isValidTrainingLevel;
exports.isValidBookingStatus = isValidBookingStatus;
exports.isValidUserRole = isValidUserRole;
exports.isValidDayOfWeek = isValidDayOfWeek;
exports.isValidStringLength = isValidStringLength;
exports.isNumberInRange = isNumberInRange;
exports.isValidTailNumber = isValidTailNumber;
exports.isValidDuration = isValidDuration;
exports.sanitizeString = sanitizeString;
exports.sanitizeNumber = sanitizeNumber;
exports.validateCreateBookingRequest = validateCreateBookingRequest;
exports.validateUpdateBookingRequest = validateUpdateBookingRequest;
exports.validateRecurringAvailabilityRequest = validateRecurringAvailabilityRequest;
exports.validateAvailabilityOverrideRequest = validateAvailabilityOverrideRequest;
exports.validateLoginRequest = validateLoginRequest;
exports.validateRegisterRequest = validateRegisterRequest;
exports.validateUUIDParam = validateUUIDParam;
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
}
function isValidAirportCode(code) {
    return /^[A-Z]{4}$/.test(code);
}
function isValidCoordinate(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}
function isValidLatitude(lat) {
    return isValidCoordinate(lat) && lat >= -90 && lat <= 90;
}
function isValidLongitude(lon) {
    return isValidCoordinate(lon) && lon >= -180 && lon <= 180;
}
function isValidDateString(date) {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
}
function isFutureDate(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj > new Date();
}
function isValidTimeFormat(time) {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(time);
}
function isValidTrainingLevel(level) {
    const validLevels = [
        'STUDENT_PILOT',
        'PRIVATE_PILOT',
        'INSTRUMENT_RATED',
        'COMMERCIAL_PILOT',
        'AIRLINE_TRANSPORT_PILOT',
    ];
    return validLevels.includes(level);
}
function isValidBookingStatus(status) {
    const validStatuses = [
        'PENDING',
        'CONFIRMED',
        'AT_RISK',
        'WEATHER_CONFLICT',
        'CANCELLED',
        'COMPLETED',
    ];
    return validStatuses.includes(status);
}
function isValidUserRole(role) {
    const validRoles = ['STUDENT', 'INSTRUCTOR', 'ADMIN'];
    return validRoles.includes(role);
}
function isValidDayOfWeek(day) {
    return Number.isInteger(day) && day >= 0 && day <= 6;
}
function isValidStringLength(str, min, max) {
    return typeof str === 'string' && str.length >= min && str.length <= max;
}
function isNumberInRange(value, min, max) {
    return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
}
function isValidTailNumber(tailNumber) {
    return /^N[0-9]{1,5}[A-Z]{0,2}$/.test(tailNumber);
}
function isValidDuration(duration) {
    return isNumberInRange(duration, 15, 480);
}
function sanitizeString(input) {
    if (typeof input !== 'string') {
        return '';
    }
    return input
        .trim()
        .replace(/[<>]/g, '')
        .replace(/['"]/g, '')
        .replace(/[;\\]/g, '')
        .substring(0, 1000);
}
function sanitizeNumber(value) {
    if (typeof value === 'number') {
        return isNaN(value) ? null : value;
    }
    if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    }
    return null;
}
function validateCreateBookingRequest(data) {
    const errors = [];
    const studentId = typeof data.studentId === 'string' ? data.studentId.trim() : data.studentId;
    const instructorId = typeof data.instructorId === 'string' ? data.instructorId.trim() : data.instructorId;
    if (!studentId || !isValidUUID(studentId)) {
        errors.push('Invalid or missing studentId (must be UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
    }
    if (!instructorId || !isValidUUID(instructorId)) {
        errors.push('Invalid or missing instructorId (must be UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
    }
    if (!data.departureAirport || !isValidAirportCode(data.departureAirport)) {
        errors.push('Invalid or missing departureAirport (must be 4-letter ICAO code)');
    }
    if (!data.arrivalAirport || !isValidAirportCode(data.arrivalAirport)) {
        errors.push('Invalid or missing arrivalAirport (must be 4-letter ICAO code)');
    }
    if (data.departureLatitude !== undefined && !isValidLatitude(data.departureLatitude)) {
        errors.push('Invalid departureLatitude (must be between -90 and 90)');
    }
    if (data.departureLongitude !== undefined && !isValidLongitude(data.departureLongitude)) {
        errors.push('Invalid departureLongitude (must be between -180 and 180)');
    }
    if (data.arrivalLatitude !== undefined && !isValidLatitude(data.arrivalLatitude)) {
        errors.push('Invalid arrivalLatitude (must be between -90 and 90)');
    }
    if (data.arrivalLongitude !== undefined && !isValidLongitude(data.arrivalLongitude)) {
        errors.push('Invalid arrivalLongitude (must be between -180 and 180)');
    }
    if (!data.scheduledDatetime || !isValidDateString(data.scheduledDatetime)) {
        errors.push('Invalid or missing scheduledDatetime (must be ISO 8601 date string)');
    }
    else if (!isFutureDate(data.scheduledDatetime)) {
        errors.push('scheduledDatetime must be in the future');
    }
    if (data.trainingLevel && !isValidTrainingLevel(data.trainingLevel)) {
        errors.push('Invalid trainingLevel');
    }
    if (data.durationMinutes !== undefined && !isValidDuration(data.durationMinutes)) {
        errors.push('Invalid durationMinutes (must be between 15 and 480)');
    }
    const aircraftId = typeof data.aircraftId === 'string' ? data.aircraftId.trim() : data.aircraftId;
    if (aircraftId !== undefined && aircraftId !== null && aircraftId !== '') {
        if (typeof aircraftId !== 'string' || !isValidTailNumber(aircraftId)) {
            errors.push(`Invalid aircraftId "${aircraftId}" (must be valid N-number format: N followed by 1-5 digits, optionally 0-2 letters, e.g., N12345 or N123AB)`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
function validateUpdateBookingRequest(data) {
    const errors = [];
    if (data.scheduledDatetime !== undefined) {
        if (!isValidDateString(data.scheduledDatetime)) {
            errors.push('Invalid scheduledDatetime (must be ISO 8601 date string)');
        }
        else if (!isFutureDate(data.scheduledDatetime)) {
            errors.push('scheduledDatetime must be in the future');
        }
    }
    if (data.status !== undefined && !isValidBookingStatus(data.status)) {
        errors.push('Invalid booking status');
    }
    if (data.durationMinutes !== undefined && !isValidDuration(data.durationMinutes)) {
        errors.push('Invalid durationMinutes (must be between 15 and 480)');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
function validateRecurringAvailabilityRequest(data) {
    const errors = [];
    if (data.dayOfWeek === undefined || !isValidDayOfWeek(data.dayOfWeek)) {
        errors.push('Invalid or missing dayOfWeek (must be 0-6)');
    }
    if (!data.startTime || !isValidTimeFormat(data.startTime)) {
        errors.push('Invalid or missing startTime (must be HH:MM:SS or HH:MM)');
    }
    if (!data.endTime || !isValidTimeFormat(data.endTime)) {
        errors.push('Invalid or missing endTime (must be HH:MM:SS or HH:MM)');
    }
    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        errors.push('startTime must be before endTime');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
function validateAvailabilityOverrideRequest(data) {
    const errors = [];
    if (!data.overrideDate || !isValidDateString(data.overrideDate)) {
        errors.push('Invalid or missing overrideDate (must be ISO 8601 date string)');
    }
    if (data.startTime && !isValidTimeFormat(data.startTime)) {
        errors.push('Invalid startTime (must be HH:MM:SS or HH:MM)');
    }
    if (data.endTime && !isValidTimeFormat(data.endTime)) {
        errors.push('Invalid endTime (must be HH:MM:SS or HH:MM)');
    }
    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        errors.push('startTime must be before endTime');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
function validateLoginRequest(data) {
    const errors = [];
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Invalid or missing email');
    }
    if (!data.password || typeof data.password !== 'string' || data.password.length < 8) {
        errors.push('Invalid or missing password (must be at least 8 characters)');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
function validateRegisterRequest(data) {
    const errors = [];
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Invalid or missing email');
    }
    if (!data.password || typeof data.password !== 'string' || data.password.length < 8) {
        errors.push('Invalid or missing password (must be at least 8 characters)');
    }
    if (!data.firstName || !isValidStringLength(data.firstName, 1, 100)) {
        errors.push('Invalid or missing firstName (must be 1-100 characters)');
    }
    if (!data.lastName || !isValidStringLength(data.lastName, 1, 100)) {
        errors.push('Invalid or missing lastName (must be 1-100 characters)');
    }
    if (data.role && !isValidUserRole(data.role)) {
        errors.push('Invalid user role');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
function validateUUIDParam(param, paramName) {
    if (!param) {
        return {
            valid: false,
            errors: [`Missing ${paramName}`],
        };
    }
    if (!isValidUUID(param)) {
        return {
            valid: false,
            errors: [`Invalid ${paramName} (must be UUID)`],
        };
    }
    return {
        valid: true,
        errors: [],
    };
}
//# sourceMappingURL=inputValidation.js.map