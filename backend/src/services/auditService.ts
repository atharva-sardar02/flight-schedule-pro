/**
 * Audit Service
 * Handles audit logging for all system events
 */

import { Pool } from 'pg';
import { logInfo, logError } from '../utils/logger';

export interface AuditLogEntry {
  eventType: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  data?: any;
  metadata?: any;
}

export class AuditService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Log an event to the audit trail
   */
  async logEvent(entry: AuditLogEntry): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO audit_log (event_type, entity_type, entity_id, user_id, data, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          entry.eventType,
          entry.entityType,
          entry.entityId || null,
          entry.userId || null,
          entry.data ? JSON.stringify(entry.data) : null,
          entry.metadata ? JSON.stringify(entry.metadata) : null,
        ]
      );

      logInfo('Audit event logged', {
        eventType: entry.eventType,
        entityType: entry.entityType,
        entityId: entry.entityId,
      });
    } catch (error: any) {
      logError('Failed to log audit event', error, entry);
      // Don't throw - audit logging failures shouldn't break the main flow
    }
  }

  /**
   * Log weather check event
   */
  async logWeatherCheck(
    bookingId: string,
    weatherValid: boolean,
    weatherData: any,
    userId?: string
  ): Promise<void> {
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

  /**
   * Log conflict detection
   */
  async logConflictDetected(
    bookingId: string,
    conflictReason: string,
    details: any,
    userId?: string
  ): Promise<void> {
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

  /**
   * Log booking status change
   */
  async logStatusChange(
    bookingId: string,
    oldStatus: string,
    newStatus: string,
    reason: string,
    userId?: string
  ): Promise<void> {
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

  /**
   * Log notification sent
   */
  async logNotificationSent(
    userId: string,
    notificationType: string,
    bookingId?: string,
    details?: any
  ): Promise<void> {
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

  /**
   * Log AI rescheduling event
   */
  async logReschedulingEvent(
    bookingId: string,
    eventType: string,
    details: any,
    userId?: string
  ): Promise<void> {
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

  /**
   * Get audit trail for an entity
   */
  async getAuditTrail(
    entityType: string,
    entityId: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM audit_log
         WHERE entity_type = $1 AND entity_id = $2
         ORDER BY timestamp DESC
         LIMIT $3`,
        [entityType, entityId, limit]
      );

      return result.rows;
    } catch (error: any) {
      logError('Failed to retrieve audit trail', error, { entityType, entityId });
      return [];
    }
  }

  /**
   * Get recent events by type
   */
  async getRecentEvents(eventType: string, limit: number = 100): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM audit_log
         WHERE event_type = $1
         ORDER BY timestamp DESC
         LIMIT $2`,
        [eventType, limit]
      );

      return result.rows;
    } catch (error: any) {
      logError('Failed to retrieve recent events', error, { eventType });
      return [];
    }
  }
}

