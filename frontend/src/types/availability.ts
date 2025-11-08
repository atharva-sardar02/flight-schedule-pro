/**
 * Frontend Availability Types
 * Mirrors backend types with additional UI-specific interfaces
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
 * Helper to get day name
 */
export const getDayName = (day: DayOfWeek): string => {
  return DayOfWeek[day];
};

/**
 * Recurring weekly availability pattern
 */
export interface RecurringAvailability {
  id: string;
  userId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * One-time availability override
 */
export interface AvailabilityOverride {
  id: string;
  userId: string;
  overrideDate: string;
  startTime?: string;
  endTime?: string;
  isBlocked: boolean;
  reason?: string;
  createdAt: string;
}

/**
 * Computed availability slot
 */
export interface AvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  source: 'recurring' | 'override';
  reason?: string;
}

/**
 * Create recurring availability form data
 */
export interface RecurringAvailabilityFormData {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

/**
 * Create override form data
 */
export interface AvailabilityOverrideFormData {
  overrideDate: string;
  startTime?: string;
  endTime?: string;
  isBlocked: boolean;
  reason?: string;
}

/**
 * Availability response from API
 */
export interface AvailabilityResponse {
  userId: string;
  startDate: string;
  endDate: string;
  slots: AvailabilitySlot[];
  recurringPatterns: RecurringAvailability[];
  overrides: AvailabilityOverride[];
}

