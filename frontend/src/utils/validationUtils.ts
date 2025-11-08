/**
 * Validation Utility Functions
 * Helper functions for form validation and data validation
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (US)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?1?\s*\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate airport code (ICAO or IATA)
 */
export function isValidAirportCode(code: string): boolean {
  // ICAO: 4 letters, IATA: 3 letters
  const icaoRegex = /^[A-Z]{4}$/;
  const iataRegex = /^[A-Z]{3}$/;
  return icaoRegex.test(code) || iataRegex.test(code);
}

/**
 * Validate aircraft tail number (N-number)
 */
export function isValidTailNumber(tailNumber: string): boolean {
  const nNumberRegex = /^N[0-9]{1,5}[A-Z]{0,2}$/;
  return nNumberRegex.test(tailNumber);
}

/**
 * Validate date is not in the past
 */
export function isValidFutureDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
}

/**
 * Validate time format (HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Validate required field
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  return true;
}

/**
 * Validate number is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate form data
 */
export function validateFormData(
  data: Record<string, any>,
  rules: Record<string, ((value: any) => boolean | { valid: boolean; message: string })>
): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  
  for (const [field, validator] of Object.entries(rules)) {
    const value = data[field];
    const result = validator(value);
    
    if (typeof result === 'boolean') {
      if (!result) {
        errors[field] = `Invalid ${field}`;
      }
    } else {
      if (!result.valid) {
        errors[field] = result.message;
      }
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

