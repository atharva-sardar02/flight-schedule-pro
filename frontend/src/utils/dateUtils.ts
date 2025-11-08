/**
 * Date Utility Functions
 * Helper functions for date formatting and manipulation
 */

import { format, formatDistance, formatRelative, isAfter, isBefore, isToday, isTomorrow, parseISO } from 'date-fns';

/**
 * Format a date for display
 */
export function formatDate(date: string | Date, formatString: string = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Format a time for display
 */
export function formatTime(date: string | Date, formatString: string = 'h:mm a'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Format a date and time for display
 */
export function formatDateTime(date: string | Date, formatString: string = 'MMM d, yyyy h:mm a'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

/**
 * Get relative date string (e.g., "today at 3:00 PM", "tomorrow at 10:00 AM")
 */
export function getRelativeDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatRelative(dateObj, new Date());
}

/**
 * Check if a date is in the past
 */
export function isPast(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(dateObj, new Date());
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(dateObj, new Date());
}

/**
 * Check if a date is today
 */
export function isDateToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isToday(dateObj);
}

/**
 * Check if a date is tomorrow
 */
export function isDateTomorrow(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isTomorrow(dateObj);
}

/**
 * Get time until a date in minutes
 */
export function getMinutesUntil(date: string | Date): number {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Get time until a date in hours
 */
export function getHoursUntil(date: string | Date): number {
  return Math.floor(getMinutesUntil(date) / 60);
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hr${hours > 1 ? 's' : ''} ${remainingMinutes} min`;
}

