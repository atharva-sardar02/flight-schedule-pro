/**
 * Availability Types and Interfaces
 * Defines structures for instructor/student availability management
 */

/**
 * Days of the week for recurring availability
 */
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

/**
 * Recurring weekly availability pattern
 */
export interface RecurringAvailability {
  id: string;
  userId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One-time availability override (blocks or adds availability)
 */
export interface AvailabilityOverride {
  id: string;
  userId: string;
  overrideDate: Date;
  startTime?: string; // HH:MM format (null means all day)
  endTime?: string; // HH:MM format (null means all day)
  isBlocked: boolean; // true = not available, false = available
  reason?: string;
  createdAt: Date;
}

/**
 * Computed availability slot (combining recurring + overrides)
 */
export interface AvailabilitySlot {
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  source: 'recurring' | 'override';
  reason?: string;
}

/**
 * Request to create recurring availability
 */
export interface CreateRecurringAvailabilityRequest {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

/**
 * Request to update recurring availability
 */
export interface UpdateRecurringAvailabilityRequest {
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

/**
 * Request to create availability override
 */
export interface CreateAvailabilityOverrideRequest {
  overrideDate: string; // ISO date string (YYYY-MM-DD)
  startTime?: string;
  endTime?: string;
  isBlocked: boolean;
  reason?: string;
}

/**
 * Request to update availability override
 */
export interface UpdateAvailabilityOverrideRequest {
  startTime?: string;
  endTime?: string;
  isBlocked?: boolean;
  reason?: string;
}

/**
 * Query parameters for fetching availability
 */
export interface GetAvailabilityQuery {
  userId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

/**
 * Response for computed availability
 */
export interface AvailabilityResponse {
  userId: string;
  startDate: string;
  endDate: string;
  slots: AvailabilitySlot[];
  recurringPatterns: RecurringAvailability[];
  overrides: AvailabilityOverride[];
}

/**
 * Conflict check result
 */
export interface AvailabilityConflict {
  hasConflict: boolean;
  conflictingSlots: {
    date: Date;
    startTime: string;
    endTime: string;
    reason: string;
  }[];
}

