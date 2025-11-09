/**
 * Notification Trigger Service
 * Creates notification records in the database
 * (Actual sending will be handled by notification service in PR #10)
 */

import { Pool } from 'pg';
import { logInfo, logError } from '../utils/logger';
import { ConflictDetectionResult } from '../functions/ai/conflictDetector';
import { EmailService } from '../functions/notifications/emailService';
import { InAppNotifier } from '../functions/notifications/inAppNotifier';

export type NotificationType =
  | 'WEATHER_ALERT'
  | 'OPTIONS_AVAILABLE'
  | 'DEADLINE_REMINDER'
  | 'CONFIRMATION'
  | 'ESCALATION';

export interface NotificationData {
  userId: string;
  bookingId?: string;
  type: NotificationType;
  title: string;
  message: string;
}

export class NotificationTrigger {
  private pool: Pool;
  private emailService: EmailService;
  private inAppNotifier: InAppNotifier;

  constructor(pool: Pool) {
    this.pool = pool;
    this.emailService = new EmailService();
    this.inAppNotifier = new InAppNotifier(pool);
  }

  /**
   * Create a notification record and send via email + in-app
   */
  async createNotification(data: NotificationData): Promise<string> {
    try {
      // Create in-app notification
      const notification = await this.inAppNotifier.createNotification(
        data.userId,
        data.type,
        data.title,
        data.message,
        data.bookingId
      );

      logInfo('Notification created', {
        notificationId: notification.id,
        userId: data.userId,
        bookingId: data.bookingId,
        type: data.type,
      });

      return notification.id;
    } catch (error: any) {
      logError('Failed to create notification', error, data);
      throw error;
    }
  }

  /**
   * Trigger weather alert notifications for a conflict
   */
  async triggerWeatherAlert(
    conflict: ConflictDetectionResult,
    booking: any
  ): Promise<void> {
    try {
      const violations = conflict.weatherValidation?.violations || [];
      const violationsList = violations.map((v) => `• ${v}`).join('\n');

      const scheduledTime = new Date(booking.scheduled_time);
      const timeUntilFlight = scheduledTime.getTime() - Date.now();
      const hoursUntilFlight = Math.round(timeUntilFlight / (1000 * 60 * 60));

      const message = `Your scheduled flight from ${booking.departure_airport} to ${booking.arrival_airport} is now AT RISK due to weather conditions.\n\n` +
        `Flight Time: ${scheduledTime.toLocaleString()}\n` +
        `Time Until Flight: ${hoursUntilFlight} hours\n\n` +
        `Weather Violations:\n${violationsList}\n\n` +
        `We are monitoring the situation and will provide rescheduling options if conditions do not improve.`;

      // Notify student (in-app)
      await this.createNotification({
        userId: booking.student_id,
        bookingId: booking.id,
        type: 'WEATHER_ALERT',
        title: `⚠️ Weather Alert for Your Flight on ${scheduledTime.toLocaleDateString()}`,
        message,
      });

      // Send email to student
      await this.emailService.sendWeatherAlert(
        booking.student_email,
        booking.student_first_name,
        {
          scheduledTime,
          departureAirport: booking.departure_airport,
          arrivalAirport: booking.arrival_airport,
          violations,
          hoursUntilFlight,
        }
      );

      // Notify instructor (in-app)
      const instructorMessage = `The scheduled flight on ${scheduledTime.toLocaleDateString()} with ${booking.student_first_name} is now AT RISK due to weather conditions.\n\n` +
        `Flight Time: ${scheduledTime.toLocaleString()}\n` +
        `Student: ${booking.student_first_name}\n` +
        `Route: ${booking.departure_airport} → ${booking.arrival_airport}\n\n` +
        `Weather Violations:\n${violationsList}\n\n` +
        `Please review the situation and prepare for potential rescheduling.`;

      await this.createNotification({
        userId: booking.instructor_id,
        bookingId: booking.id,
        type: 'WEATHER_ALERT',
        title: `⚠️ Weather Alert for Flight with ${booking.student_first_name}`,
        message: instructorMessage,
      });

      // Send email to instructor
      await this.emailService.sendWeatherAlert(
        booking.instructor_email,
        booking.instructor_first_name,
        {
          scheduledTime,
          departureAirport: booking.departure_airport,
          arrivalAirport: booking.arrival_airport,
          violations,
          hoursUntilFlight,
        }
      );

      logInfo('Weather alert notifications triggered (email + in-app)', {
        bookingId: booking.id,
        studentId: booking.student_id,
        instructorId: booking.instructor_id,
      });
    } catch (error: any) {
      logError('Failed to trigger weather alert', error, {
        bookingId: booking.id,
      });
    }
  }

  /**
   * Trigger weather cleared notification
   */
  async triggerWeatherCleared(booking: any): Promise<void> {
    try {
      const scheduledTime = new Date(booking.scheduled_time);

      // Notify student
      await this.createNotification({
        userId: booking.student_id,
        bookingId: booking.id,
        type: 'CONFIRMATION',
        title: `✅ Weather Cleared for Your Flight`,
        message: `Good news! Weather conditions have improved and your flight on ${scheduledTime.toLocaleDateString()} is now CONFIRMED.\n\n` +
          `Flight Time: ${scheduledTime.toLocaleString()}\n` +
          `Route: ${booking.departure_airport} → ${booking.arrival_airport}\n\n` +
          `See you at the airport!`,
      });

      // Notify instructor
      await this.createNotification({
        userId: booking.instructor_id,
        bookingId: booking.id,
        type: 'CONFIRMATION',
        title: `✅ Weather Cleared for Flight with ${booking.student_first_name}`,
        message: `Weather conditions have improved. The flight on ${scheduledTime.toLocaleDateString()} is now CONFIRMED.\n\n` +
          `Flight Time: ${scheduledTime.toLocaleString()}\n` +
          `Student: ${booking.student_first_name}\n` +
          `Route: ${booking.departure_airport} → ${booking.arrival_airport}`,
      });

      logInfo('Weather cleared notifications triggered', {
        bookingId: booking.id,
      });
    } catch (error: any) {
      logError('Failed to trigger weather cleared notification', error, {
        bookingId: booking.id,
      });
    }
  }

  /**
   * Trigger notification when reschedule options are automatically generated
   */
  async triggerRescheduleOptionsAvailable(booking: any, optionsCount: number): Promise<void> {
    try {
      const scheduledTime = new Date(booking.scheduled_time);
      const timeUntilFlight = scheduledTime.getTime() - Date.now();
      const hoursUntilFlight = Math.round(timeUntilFlight / (1000 * 60 * 60));

      // Calculate deadline (30 minutes before flight or 12 hours after notification, whichever comes first)
      const deadline30Min = new Date(scheduledTime.getTime() - 30 * 60 * 1000);
      const deadline12Hours = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const deadline = deadline30Min < deadline12Hours ? deadline30Min : deadline12Hours;
      const hoursUntilDeadline = Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60));

      // Notify student
      const studentMessage = `Our AI has automatically generated ${optionsCount} rescheduling options for your flight due to weather conditions.\n\n` +
        `Flight Time: ${scheduledTime.toLocaleString()}\n` +
        `Route: ${booking.departure_airport} → ${booking.arrival_airport}\n\n` +
        `Please rank your preferences by ${deadline.toLocaleString()} (${hoursUntilDeadline} hours remaining).\n\n` +
        `Visit the rescheduling page to review and rank your options.`;

      await this.createNotification({
        userId: booking.student_id,
        bookingId: booking.id,
        type: 'OPTIONS_AVAILABLE',
        title: `✈️ Rescheduling Options Available for Your Flight`,
        message: studentMessage,
      });

      // Skip email - only use in-app notifications
      // Email sending disabled for demo/production simplicity
      // await this.emailService.sendOptionsAvailable(...)

      // Notify instructor
      const instructorMessage = `Our AI has automatically generated ${optionsCount} rescheduling options for the flight with ${booking.student_first_name} due to weather conditions.\n\n` +
        `Flight Time: ${scheduledTime.toLocaleString()}\n` +
        `Student: ${booking.student_first_name}\n` +
        `Route: ${booking.departure_airport} → ${booking.arrival_airport}\n\n` +
        `Please rank your preferences by ${deadline.toLocaleString()} (${hoursUntilDeadline} hours remaining).`;

      await this.createNotification({
        userId: booking.instructor_id,
        bookingId: booking.id,
        type: 'OPTIONS_AVAILABLE',
        title: `✈️ Rescheduling Options Available for Flight with ${booking.student_first_name}`,
        message: instructorMessage,
      });

      // Skip email - only use in-app notifications
      // Email sending disabled for demo/production simplicity
      // await this.emailService.sendOptionsAvailable(...)

      logInfo('Reschedule options available notifications triggered', {
        bookingId: booking.id,
        studentId: booking.student_id,
        instructorId: booking.instructor_id,
        optionsCount,
      });
    } catch (error: any) {
      logError('Failed to trigger reschedule options available notification', error, {
        bookingId: booking.id,
      });
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM notifications
         WHERE user_id = $1 AND read = false
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error: any) {
      logError('Failed to get unread notifications', error, { userId });
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE notifications SET read = true WHERE id = $1`,
        [notificationId]
      );

      logInfo('Notification marked as read', { notificationId });
    } catch (error: any) {
      logError('Failed to mark notification as read', error, { notificationId });
    }
  }
}

