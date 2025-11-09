"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InAppNotifier = void 0;
const logger_1 = require("../../utils/logger");
class InAppNotifier {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async createNotification(userId, type, title, message, bookingId) {
        try {
            const result = await this.pool.query(`INSERT INTO notifications (user_id, booking_id, type, title, message, sent_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`, [userId, bookingId || null, type, title, message]);
            const notification = this.mapNotification(result.rows[0]);
            (0, logger_1.logInfo)('In-app notification created', {
                notificationId: notification.id,
                userId,
                type,
            });
            return notification;
        }
        catch (error) {
            (0, logger_1.logError)('Failed to create in-app notification', error, {
                userId,
                type,
            });
            throw error;
        }
    }
    async getNotifications(userId, limit = 50) {
        try {
            const result = await this.pool.query(`SELECT * FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`, [userId, limit]);
            return result.rows.map(this.mapNotification);
        }
        catch (error) {
            (0, logger_1.logError)('Failed to get notifications', error, { userId });
            return [];
        }
    }
    async getUnreadNotifications(userId) {
        try {
            const result = await this.pool.query(`SELECT * FROM notifications
         WHERE user_id = $1 AND read = false
         ORDER BY created_at DESC`, [userId]);
            return result.rows.map(this.mapNotification);
        }
        catch (error) {
            (0, logger_1.logError)('Failed to get unread notifications', error, { userId });
            return [];
        }
    }
    async markAsRead(notificationId, userId) {
        try {
            await this.pool.query(`UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`, [notificationId, userId]);
            (0, logger_1.logInfo)('Notification marked as read', { notificationId, userId });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to mark notification as read', error, {
                notificationId,
                userId,
            });
        }
    }
    async markAllAsRead(userId) {
        try {
            await this.pool.query(`UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`, [userId]);
            (0, logger_1.logInfo)('All notifications marked as read', { userId });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to mark all notifications as read', error, { userId });
        }
    }
    async deleteNotification(notificationId, userId) {
        try {
            await this.pool.query(`DELETE FROM notifications WHERE id = $1 AND user_id = $2`, [notificationId, userId]);
            (0, logger_1.logInfo)('Notification deleted', { notificationId, userId });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to delete notification', error, {
                notificationId,
                userId,
            });
        }
    }
    async getUnreadCount(userId) {
        try {
            const result = await this.pool.query(`SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false`, [userId]);
            return parseInt(result.rows[0].count);
        }
        catch (error) {
            (0, logger_1.logError)('Failed to get unread count', error, { userId });
            return 0;
        }
    }
    mapNotification(row) {
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
    async broadcastToUser(userId, notification) {
        (0, logger_1.logInfo)('WebSocket broadcast (placeholder)', {
            userId,
            notificationId: notification.id,
        });
    }
}
exports.InAppNotifier = InAppNotifier;
//# sourceMappingURL=inAppNotifier.js.map