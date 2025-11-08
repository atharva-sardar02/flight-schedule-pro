/**
 * In-App Notifier Service
 * Manages real-time in-app notifications
 * (WebSocket integration would be added in production)
 */

import { Pool } from 'pg';
import { logInfo, logError } from '../../utils/logger';

export interface InAppNotification {
  id: string;
  userId: string;
  bookingId?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  sentAt: Date;
  createdAt: Date;
}

export class InAppNotifier {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create an in-app notification
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    bookingId?: string
  ): Promise<InAppNotification> {
    try {
      const result = await this.pool.query(
        `INSERT INTO notifications (user_id, booking_id, type, title, message, sent_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [userId, bookingId || null, type, title, message]
      );

      const notification = this.mapNotification(result.rows[0]);

      logInfo('In-app notification created', {
        notificationId: notification.id,
        userId,
        type,
      });

      // In production, this would trigger a WebSocket event
      // await this.broadcastToUser(userId, notification);

      return notification;
    } catch (error: any) {
      logError('Failed to create in-app notification', error, {
        userId,
        type,
      });
      throw error;
    }
  }

  /**
   * Get all notifications for a user
   */
  async getNotifications(userId: string, limit: number = 50): Promise<InAppNotification[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows.map(this.mapNotification);
    } catch (error: any) {
      logError('Failed to get notifications', error, { userId });
      return [];
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string): Promise<InAppNotification[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM notifications
         WHERE user_id = $1 AND read = false
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows.map(this.mapNotification);
    } catch (error: any) {
      logError('Failed to get unread notifications', error, { userId });
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`,
        [notificationId, userId]
      );

      logInfo('Notification marked as read', { notificationId, userId });
    } catch (error: any) {
      logError('Failed to mark notification as read', error, {
        notificationId,
        userId,
      });
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
        [userId]
      );

      logInfo('All notifications marked as read', { userId });
    } catch (error: any) {
      logError('Failed to mark all notifications as read', error, { userId });
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await this.pool.query(
        `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
        [notificationId, userId]
      );

      logInfo('Notification deleted', { notificationId, userId });
    } catch (error: any) {
      logError('Failed to delete notification', error, {
        notificationId,
        userId,
      });
    }
  }

  /**
   * Get notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const result = await this.pool.query(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false`,
        [userId]
      );

      return parseInt(result.rows[0].count);
    } catch (error: any) {
      logError('Failed to get unread count', error, { userId });
      return 0;
    }
  }

  /**
   * Map database row to InAppNotification
   */
  private mapNotification(row: any): InAppNotification {
    return {
      id: row.id,
      userId: row.user_id,
      bookingId: row.booking_id,
      type: row.type,
      title: row.title,
      message: row.message,
      read: row.read,
      sentAt: row.sent_at,
      createdAt: row.created_at,
    };
  }

  /**
   * Broadcast notification to user via WebSocket (placeholder)
   * In production, this would use AWS API Gateway WebSocket API
   */
  private async broadcastToUser(userId: string, notification: InAppNotification): Promise<void> {
    // TODO: Implement WebSocket broadcast when API Gateway WebSocket is set up
    logInfo('WebSocket broadcast (placeholder)', {
      userId,
      notificationId: notification.id,
    });
  }
}

