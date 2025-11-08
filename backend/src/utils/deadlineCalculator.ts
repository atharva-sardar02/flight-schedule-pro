/**
 * Deadline Calculator Utility
 * Calculates preference submission deadlines based on flight time
 */

import { addHours, min, subMinutes } from 'date-fns';
import { logInfo } from '../utils/logger';

/**
 * Calculate the preference submission deadline
 * Rule: min(30 minutes before departure, 12 hours after notification)
 */
export function calculateDeadline(
  scheduledTime: Date,
  notificationSentAt: Date = new Date()
): Date {
  // Option 1: 30 minutes before departure
  const thirtyMinutesBeforeDeparture = subMinutes(scheduledTime, 30);

  // Option 2: 12 hours after notification
  const twelveHoursAfterNotification = addHours(notificationSentAt, 12);

  // Take the earlier of the two
  const deadline = min([thirtyMinutesBeforeDeparture, twelveHoursAfterNotification]);

  logInfo('Calculated preference deadline', {
    scheduledTime: scheduledTime.toISOString(),
    notificationSentAt: notificationSentAt.toISOString(),
    deadline: deadline.toISOString(),
    thirtyMinutesBeforeDeparture: thirtyMinutesBeforeDeparture.toISOString(),
    twelveHoursAfterNotification: twelveHoursAfterNotification.toISOString(),
  });

  return deadline;
}

/**
 * Check if a deadline has passed
 */
export function isDeadlinePassed(deadline: Date): boolean {
  return new Date() > deadline;
}

/**
 * Get time remaining until deadline (in minutes)
 */
export function getTimeUntilDeadline(deadline: Date): number {
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
}

/**
 * Format deadline for display
 */
export function formatDeadline(deadline: Date): string {
  const minutesRemaining = getTimeUntilDeadline(deadline);

  if (minutesRemaining === 0) {
    return 'Deadline passed';
  }

  const hours = Math.floor(minutesRemaining / 60);
  const minutes = minutesRemaining % 60;

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
}

/**
 * Check if deadline is approaching (within 2 hours)
 */
export function isDeadlineApproaching(deadline: Date): boolean {
  const minutesRemaining = getTimeUntilDeadline(deadline);
  return minutesRemaining > 0 && minutesRemaining <= 120;
}

