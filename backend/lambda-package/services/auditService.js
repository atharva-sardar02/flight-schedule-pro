"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const logger_1 = require("../utils/logger");
class AuditService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async logEvent(entry) {
        try {
            await this.pool.query(`INSERT INTO audit_log (event_type, entity_type, entity_id, user_id, data, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`, [
                entry.eventType,
                entry.entityType,
                entry.entityId || null,
                entry.userId || null,
                entry.data ? JSON.stringify(entry.data) : null,
                entry.metadata ? JSON.stringify(entry.metadata) : null,
            ]);
            (0, logger_1.logInfo)('Audit event logged', {
                eventType: entry.eventType,
                entityType: entry.entityType,
                entityId: entry.entityId,
            });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to log audit event', error, entry);
        }
    }
    async logWeatherCheck(bookingId, weatherValid, weatherData, userId) {
        await this.logEvent({
            eventType: 'WEATHER_CHECK',
            entityType: 'booking',
            entityId: bookingId,
            userId,
            data: {
                weatherValid,
                weatherData,
                timestamp: new Date().toISOString(),
            },
        });
    }
    async logConflictDetected(bookingId, conflictReason, details, userId) {
        await this.logEvent({
            eventType: 'CONFLICT_DETECTED',
            entityType: 'booking',
            entityId: bookingId,
            userId,
            data: {
                reason: conflictReason,
                details,
                timestamp: new Date().toISOString(),
            },
        });
    }
    async logStatusChange(bookingId, oldStatus, newStatus, reason, userId) {
        await this.logEvent({
            eventType: 'STATUS_CHANGE',
            entityType: 'booking',
            entityId: bookingId,
            userId,
            data: {
                oldStatus,
                newStatus,
                reason,
                timestamp: new Date().toISOString(),
            },
        });
    }
    async logNotificationSent(userId, notificationType, bookingId, details) {
        await this.logEvent({
            eventType: 'NOTIFICATION_SENT',
            entityType: 'notification',
            entityId: bookingId,
            userId,
            data: {
                notificationType,
                details,
                timestamp: new Date().toISOString(),
            },
        });
    }
    async logReschedulingEvent(bookingId, eventType, details, userId) {
        await this.logEvent({
            eventType: `RESCHEDULE_${eventType}`,
            entityType: 'booking',
            entityId: bookingId,
            userId,
            data: {
                ...details,
                timestamp: new Date().toISOString(),
            },
        });
    }
    async getAuditTrail(entityType, entityId, limit = 100) {
        try {
            const result = await this.pool.query(`SELECT * FROM audit_log
         WHERE entity_type = $1 AND entity_id = $2
         ORDER BY timestamp DESC
         LIMIT $3`, [entityType, entityId, limit]);
            return result.rows;
        }
        catch (error) {
            (0, logger_1.logError)('Failed to retrieve audit trail', error, { entityType, entityId });
            return [];
        }
    }
    async getRecentEvents(eventType, limit = 100) {
        try {
            const result = await this.pool.query(`SELECT * FROM audit_log
         WHERE event_type = $1
         ORDER BY timestamp DESC
         LIMIT $2`, [eventType, limit]);
            return result.rows;
        }
        catch (error) {
            (0, logger_1.logError)('Failed to retrieve recent events', error, { eventType });
            return [];
        }
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=auditService.js.map