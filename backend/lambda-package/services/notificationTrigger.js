"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTrigger = void 0;
const logger_1 = require("../utils/logger");
const emailService_1 = require("../functions/notifications/emailService");
const inAppNotifier_1 = require("../functions/notifications/inAppNotifier");
class NotificationTrigger {
    pool;
    emailService;
    inAppNotifier;
    constructor(pool) {
        this.pool = pool;
        this.emailService = new emailService_1.EmailService();
        this.inAppNotifier = new inAppNotifier_1.InAppNotifier(pool);
    }
    async createNotification(data) {
        try {
            const notification = await this.inAppNotifier.createNotification(data.userId, data.type, data.title, data.message, data.bookingId);
            (0, logger_1.logInfo)('Notification created', {
                notificationId: notification.id,
                userId: data.userId,
                bookingId: data.bookingId,
                type: data.type,
            });
            return notification.id;
        }
        catch (error) {
            (0, logger_1.logError)('Failed to create notification', error, data);
            throw error;
        }
    }
    async triggerWeatherAlert(conflict, booking) {
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
            await this.createNotification({
                userId: booking.student_id,
                bookingId: booking.id,
                type: 'WEATHER_ALERT',
                title: `⚠️ Weather Alert for Your Flight on ${scheduledTime.toLocaleDateString()}`,
                message,
            });
            await this.emailService.sendWeatherAlert(booking.student_email, booking.student_first_name, {
                scheduledTime,
                departureAirport: booking.departure_airport,
                arrivalAirport: booking.arrival_airport,
                violations,
                hoursUntilFlight,
            });
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
            await this.emailService.sendWeatherAlert(booking.instructor_email, booking.instructor_first_name, {
                scheduledTime,
                departureAirport: booking.departure_airport,
                arrivalAirport: booking.arrival_airport,
                violations,
                hoursUntilFlight,
            });
            (0, logger_1.logInfo)('Weather alert notifications triggered (email + in-app)', {
                bookingId: booking.id,
                studentId: booking.student_id,
                instructorId: booking.instructor_id,
            });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to trigger weather alert', error, {
                bookingId: booking.id,
            });
        }
    }
    async triggerWeatherCleared(booking) {
        try {
            const scheduledTime = new Date(booking.scheduled_time);
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
            (0, logger_1.logInfo)('Weather cleared notifications triggered', {
                bookingId: booking.id,
            });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to trigger weather cleared notification', error, {
                bookingId: booking.id,
            });
        }
    }
    async triggerRescheduleOptionsAvailable(booking, optionsCount) {
        try {
            const scheduledTime = new Date(booking.scheduled_time);
            const timeUntilFlight = scheduledTime.getTime() - Date.now();
            const hoursUntilFlight = Math.round(timeUntilFlight / (1000 * 60 * 60));
            const deadline30Min = new Date(scheduledTime.getTime() - 30 * 60 * 1000);
            const deadline12Hours = new Date(Date.now() + 12 * 60 * 60 * 1000);
            const deadline = deadline30Min < deadline12Hours ? deadline30Min : deadline12Hours;
            const hoursUntilDeadline = Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60));
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
            await this.emailService.sendOptionsAvailable(booking.student_email, booking.student_first_name, {
                originalTime: scheduledTime,
                departureAirport: booking.departure_airport,
                arrivalAirport: booking.arrival_airport,
                optionsCount,
                deadline,
            });
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
            await this.emailService.sendOptionsAvailable(booking.instructor_email, booking.instructor_first_name, {
                originalTime: scheduledTime,
                departureAirport: booking.departure_airport,
                arrivalAirport: booking.arrival_airport,
                optionsCount,
                deadline,
            });
            (0, logger_1.logInfo)('Reschedule options available notifications triggered', {
                bookingId: booking.id,
                studentId: booking.student_id,
                instructorId: booking.instructor_id,
                optionsCount,
            });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to trigger reschedule options available notification', error, {
                bookingId: booking.id,
            });
        }
    }
    async getUnreadNotifications(userId) {
        try {
            const result = await this.pool.query(`SELECT * FROM notifications
         WHERE user_id = $1 AND read = false
         ORDER BY created_at DESC`, [userId]);
            return result.rows;
        }
        catch (error) {
            (0, logger_1.logError)('Failed to get unread notifications', error, { userId });
            return [];
        }
    }
    async markAsRead(notificationId) {
        try {
            await this.pool.query(`UPDATE notifications SET read = true WHERE id = $1`, [notificationId]);
            (0, logger_1.logInfo)('Notification marked as read', { notificationId });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to mark notification as read', error, { notificationId });
        }
    }
}
exports.NotificationTrigger = NotificationTrigger;
//# sourceMappingURL=notificationTrigger.js.map