/**
 * Input Validation Utilities
 * Comprehensive validation schemas for all API endpoints
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate airport code (ICAO format: 4 letters)
 */
export function isValidAirportCode(code: string): boolean {
  return /^[A-Z]{4}$/.test(code);
}

/**
 * Validate coordinates (latitude/longitude)
 */
export function isValidCoordinate(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function isValidLatitude(lat: number): boolean {
  return isValidCoordinate(lat) && lat >= -90 && lat <= 90;
}

export function isValidLongitude(lon: number): boolean {
  return isValidCoordinate(lon) && lon >= -180 && lon <= 180;
}

/**
 * Validate date string (ISO 8601)
 */
export function isValidDateString(date: string): boolean {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
}

/**
 * Validate future date
 */
export function isFutureDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
}

/**
 * Validate time format (HH:MM:SS or HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(time);
}

/**
 * Validate training level
 */
export function isValidTrainingLevel(level: string): boolean {
  const validLevels = [
    'STUDENT_PILOT',
    'PRIVATE_PILOT',
    'INSTRUMENT_RATED',
    'COMMERCIAL_PILOT',
    'AIRLINE_TRANSPORT_PILOT',
  ];
  return validLevels.includes(level);
}

/**
 * Validate booking status
 */
export function isValidBookingStatus(status: string): boolean {
  const validStatuses = [
    'PENDING',
    'CONFIRMED',
    'AT_RISK',
    'RESCHEDULING',
    'RESCHEDULED',
    'WEATHER_CONFLICT',
    'CANCELLED',
    'COMPLETED',
  ];
  return validStatuses.includes(status);
}

/**
 * Validate user role
 */
export function isValidUserRole(role: string): boolean {
  const validRoles = ['STUDENT', 'INSTRUCTOR', 'ADMIN'];
  return validRoles.includes(role);
}

/**
 * Validate day of week (0-6, Sunday-Saturday)
 */
export function isValidDayOfWeek(day: number): boolean {
  return Number.isInteger(day) && day >= 0 && day <= 6;
}

/**
 * Validate string length
 */
export function isValidStringLength(str: string, min: number, max: number): boolean {
  return typeof str === 'string' && str.length >= min && str.length <= max;
}

/**
 * Validate number range
 */
export function isNumberInRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
}

/**
 * Validate aircraft tail number (N-number)
 */
export function isValidTailNumber(tailNumber: string): boolean {
  return /^N[0-9]{1,5}[A-Z]{0,2}$/.test(tailNumber);
}

/**
 * Validate duration in minutes
 */
export function isValidDuration(duration: number): boolean {
  return isNumberInRange(duration, 15, 480); // 15 minutes to 8 hours
}

/**
 * Sanitize string input (prevent XSS and SQL injection)
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[;\\]/g, '') // Remove semicolons and backslashes
    .substring(0, 1000); // Limit length
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(value: any): number | null {
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Validate CreateBookingRequest
 */
export function validateCreateBookingRequest(data: any): ValidationResult {
  const errors: string[] = [];

  // Trim string values to remove whitespace
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
  } else if (!isFutureDate(data.scheduledDatetime)) {
    errors.push('scheduledDatetime must be in the future');
  }

  if (data.trainingLevel && !isValidTrainingLevel(data.trainingLevel)) {
    errors.push('Invalid trainingLevel');
  }

  if (data.durationMinutes !== undefined && !isValidDuration(data.durationMinutes)) {
    errors.push('Invalid durationMinutes (must be between 15 and 480)');
  }

  // aircraftId is optional, but if provided must be valid
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

/**
 * Validate UpdateBookingRequest
 */
export function validateUpdateBookingRequest(data: any): ValidationResult {
  const errors: string[] = [];

  if (data.scheduledDatetime !== undefined) {
    if (!isValidDateString(data.scheduledDatetime)) {
      errors.push('Invalid scheduledDatetime (must be ISO 8601 date string)');
    } else if (!isFutureDate(data.scheduledDatetime)) {
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

/**
 * Validate RecurringAvailabilityRequest
 */
export function validateRecurringAvailabilityRequest(data: any): ValidationResult {
  const errors: string[] = [];

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

/**
 * Validate AvailabilityOverrideRequest
 */
export function validateAvailabilityOverrideRequest(data: any): ValidationResult {
  const errors: string[] = [];

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

/**
 * Validate LoginRequest
 */
export function validateLoginRequest(data: any): ValidationResult {
  const errors: string[] = [];

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

/**
 * Validate RegisterRequest
 */
export function validateRegisterRequest(data: any): ValidationResult {
  const errors: string[] = [];

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

/**
 * Validate path parameter (UUID)
 */
export function validateUUIDParam(param: string | undefined, paramName: string): ValidationResult {
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

