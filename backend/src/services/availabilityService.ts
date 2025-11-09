/**
 * Availability Service
 * Handles CRUD operations for instructor/student availability
 */

import { Pool } from 'pg';
import {
  RecurringAvailability,
  AvailabilityOverride,
  AvailabilitySlot,
  CreateRecurringAvailabilityRequest,
  UpdateRecurringAvailabilityRequest,
  CreateAvailabilityOverrideRequest,
  UpdateAvailabilityOverrideRequest,
  GetAvailabilityQuery,
  AvailabilityResponse,
  AvailabilityConflict,
  DayOfWeek,
} from '../types/availability';

export class AvailabilityService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ============================================================================
  // RECURRING AVAILABILITY
  // ============================================================================

  /**
   * Create a new recurring availability pattern
   */
  async createRecurringAvailability(
    userId: string,
    data: CreateRecurringAvailabilityRequest
  ): Promise<RecurringAvailability> {
    // Validate time format
    this.validateTimeFormat(data.startTime);
    this.validateTimeFormat(data.endTime);

    // Check for time conflicts
    const conflict = await this.checkRecurringConflict(
      userId,
      data.dayOfWeek,
      data.startTime,
      data.endTime
    );

    if (conflict.hasConflict) {
      throw new Error(`Time conflict: ${conflict.conflictingSlots[0].reason}`);
    }

    const result = await this.pool.query(
      `INSERT INTO availability_patterns (user_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, data.dayOfWeek, data.startTime, data.endTime]
    );

    return this.mapRecurringAvailability(result.rows[0]);
  }

  /**
   * Get all recurring availability for a user
   */
  async getRecurringAvailability(userId: string): Promise<RecurringAvailability[]> {
    const result = await this.pool.query(
      `SELECT * FROM availability_patterns WHERE user_id = $1 ORDER BY day_of_week, start_time`,
      [userId]
    );

    return result.rows.map(this.mapRecurringAvailability);
  }

  /**
   * Update a recurring availability pattern
   */
  async updateRecurringAvailability(
    id: string,
    userId: string,
    data: UpdateRecurringAvailabilityRequest
  ): Promise<RecurringAvailability> {
    // Validate time format if provided
    if (data.startTime) this.validateTimeFormat(data.startTime);
    if (data.endTime) this.validateTimeFormat(data.endTime);

    // Get existing pattern
    const existing = await this.pool.query(
      `SELECT * FROM availability_patterns WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (existing.rows.length === 0) {
      throw new Error('Recurring availability not found');
    }

    const current = existing.rows[0];
    const dayOfWeek = data.dayOfWeek !== undefined ? data.dayOfWeek : current.day_of_week;
    const startTime = data.startTime || current.start_time;
    const endTime = data.endTime || current.end_time;

    // Check for conflicts if times changed
    if (
      data.dayOfWeek !== undefined ||
      data.startTime ||
      data.endTime
    ) {
      const conflict = await this.checkRecurringConflict(
        userId,
        dayOfWeek,
        startTime,
        endTime,
        id
      );

      if (conflict.hasConflict) {
        throw new Error(`Time conflict: ${conflict.conflictingSlots[0].reason}`);
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (data.dayOfWeek !== undefined) {
      updates.push(`day_of_week = $${valueIndex++}`);
      values.push(data.dayOfWeek);
    }
    if (data.startTime) {
      updates.push(`start_time = $${valueIndex++}`);
      values.push(data.startTime);
    }
    if (data.endTime) {
      updates.push(`end_time = $${valueIndex++}`);
      values.push(data.endTime);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${valueIndex++}`);
      values.push(data.isActive);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id, userId);

    const result = await this.pool.query(
      `UPDATE availability_patterns
       SET ${updates.join(', ')}
       WHERE id = $${valueIndex} AND user_id = $${valueIndex + 1}
       RETURNING *`,
      values
    );

    return this.mapRecurringAvailability(result.rows[0]);
  }

  /**
   * Delete a recurring availability pattern
   */
  async deleteRecurringAvailability(id: string, userId: string): Promise<void> {
    const result = await this.pool.query(
      `DELETE FROM availability_patterns WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Recurring availability not found');
    }
  }

  // ============================================================================
  // AVAILABILITY OVERRIDES
  // ============================================================================

  /**
   * Create an availability override (block or add availability)
   */
  async createAvailabilityOverride(
    userId: string,
    data: CreateAvailabilityOverrideRequest
  ): Promise<AvailabilityOverride> {
    // Validate time format if provided
    if (data.startTime) this.validateTimeFormat(data.startTime);
    if (data.endTime) this.validateTimeFormat(data.endTime);

    // Validate and normalize date (ensure it's YYYY-MM-DD format, no timezone conversion)
    // The date string from frontend is already in YYYY-MM-DD format, use it directly
    const dateMatch = data.overrideDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!dateMatch) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }
    
    // Use the date string directly to avoid timezone conversion
    // PostgreSQL DATE type stores dates without time, so this is safe
    const overrideDateStr = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;

    const result = await this.pool.query(
      `INSERT INTO availability_overrides (user_id, override_date, start_time, end_time, is_blocked, reason)
       VALUES ($1, $2::date, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        overrideDateStr, // Use normalized date string
        data.startTime || null,
        data.endTime || null,
        data.isBlocked,
        data.reason || null,
      ]
    );

    return this.mapAvailabilityOverride(result.rows[0]);
  }

  /**
   * Get all overrides for a user within a date range
   */
  async getAvailabilityOverrides(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<AvailabilityOverride[]> {
    const result = await this.pool.query(
      `SELECT * FROM availability_overrides
       WHERE user_id = $1 AND override_date BETWEEN $2 AND $3
       ORDER BY override_date, start_time`,
      [userId, startDate, endDate]
    );

    return result.rows.map(this.mapAvailabilityOverride);
  }

  /**
   * Update an availability override
   */
  async updateAvailabilityOverride(
    id: string,
    userId: string,
    data: UpdateAvailabilityOverrideRequest
  ): Promise<AvailabilityOverride> {
    // Validate time format if provided
    if (data.startTime) this.validateTimeFormat(data.startTime);
    if (data.endTime) this.validateTimeFormat(data.endTime);

    const updates: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    // Note: overrideDate is not updatable - delete and recreate if date needs to change
    // This prevents accidental date shifts and maintains data integrity

    if (data.startTime !== undefined) {
      updates.push(`start_time = $${valueIndex++}`);
      values.push(data.startTime || null);
    }
    if (data.endTime !== undefined) {
      updates.push(`end_time = $${valueIndex++}`);
      values.push(data.endTime || null);
    }
    if (data.isBlocked !== undefined) {
      updates.push(`is_blocked = $${valueIndex++}`);
      values.push(data.isBlocked);
    }
    if (data.reason !== undefined) {
      updates.push(`reason = $${valueIndex++}`);
      values.push(data.reason || null);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id, userId);

    const result = await this.pool.query(
      `UPDATE availability_overrides
       SET ${updates.join(', ')}
       WHERE id = $${valueIndex} AND user_id = $${valueIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Availability override not found');
    }

    return this.mapAvailabilityOverride(result.rows[0]);
  }

  /**
   * Delete an availability override
   */
  async deleteAvailabilityOverride(id: string, userId: string): Promise<void> {
    const result = await this.pool.query(
      `DELETE FROM availability_overrides WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Availability override not found');
    }
  }

  // ============================================================================
  // COMPUTED AVAILABILITY
  // ============================================================================

  /**
   * Get computed availability for a user within a date range
   * Combines recurring patterns with overrides
   */
  async getAvailability(query: GetAvailabilityQuery): Promise<AvailabilityResponse> {
    const { userId, startDate, endDate } = query;

    // Get recurring patterns
    const recurringPatterns = await this.getRecurringAvailability(userId);

    // Get overrides
    const overrides = await this.getAvailabilityOverrides(userId, startDate, endDate);

    // Parse dates as local dates to avoid timezone shifts
    // If startDate/endDate are strings in YYYY-MM-DD format, parse them as local dates
    let startDateLocal: Date;
    let endDateLocal: Date;
    
    if (typeof startDate === 'string') {
      const startMatch = startDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (startMatch) {
        const year = parseInt(startMatch[1], 10);
        const month = parseInt(startMatch[2], 10) - 1; // Month is 0-indexed
        const day = parseInt(startMatch[3], 10);
        startDateLocal = new Date(year, month, day); // Local date, not UTC
      } else {
        startDateLocal = new Date(startDate);
      }
    } else {
      startDateLocal = startDate;
    }
    
    if (typeof endDate === 'string') {
      const endMatch = endDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (endMatch) {
        const year = parseInt(endMatch[1], 10);
        const month = parseInt(endMatch[2], 10) - 1; // Month is 0-indexed
        const day = parseInt(endMatch[3], 10);
        endDateLocal = new Date(year, month, day); // Local date, not UTC
      } else {
        endDateLocal = new Date(endDate);
      }
    } else {
      endDateLocal = endDate;
    }

    // Compute availability slots
    const slots = this.computeAvailabilitySlots(
      recurringPatterns,
      overrides,
      startDateLocal,
      endDateLocal
    );

    return {
      userId,
      startDate,
      endDate,
      slots,
      recurringPatterns,
      overrides,
    };
  }

  /**
   * Compute availability slots by combining recurring patterns and overrides
   */
  private computeAvailabilitySlots(
    recurringPatterns: RecurringAvailability[],
    overrides: AvailabilityOverride[],
    startDate: Date,
    endDate: Date
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const overrideMap = new Map<string, AvailabilityOverride[]>();

    // Group overrides by date (use date string directly to avoid timezone issues)
    overrides.forEach((override) => {
      // Extract date string directly (YYYY-MM-DD format)
      // overrideDate is a Date object from the type, but we need to format it as YYYY-MM-DD
      const overrideDate = override.overrideDate instanceof Date 
        ? override.overrideDate 
        : new Date(override.overrideDate);
      
      const year = overrideDate.getFullYear();
      const month = String(overrideDate.getMonth() + 1).padStart(2, '0');
      const day = String(overrideDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!overrideMap.has(dateKey)) {
        overrideMap.set(dateKey, []);
      }
      overrideMap.get(dateKey)!.push(override);
    });

    // Iterate through each date in the range
    // startDate and endDate should already be local dates (parsed in getAvailability)
    // Extract components and recreate as local dates to ensure correct day of week
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const startDay = startDate.getDate();
    
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();
    const endDay = endDate.getDate();
    
    // Create fresh local Date objects to ensure correct day of week calculation
    const startLocal = new Date(startYear, startMonth, startDay, 12, 0, 0, 0); // Noon to avoid edge cases
    const endLocal = new Date(endYear, endMonth, endDay, 12, 0, 0, 0);
    
    const currentDate = new Date(startLocal);
    while (currentDate <= endLocal) {
      // Format date as YYYY-MM-DD using local date components
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      // getDay() returns 0-6 (Sunday=0, Monday=1, ..., Saturday=6) in local timezone
      // This should match our DayOfWeek enum values exactly
      const dayOfWeek = currentDate.getDay();

      // Check for overrides first
      const dayOverrides = overrideMap.get(dateKey) || [];

      if (dayOverrides.length > 0) {
        // Overrides take precedence
        dayOverrides.forEach((override) => {
          // Create date object from dateKey (already in local timezone format)
          const [year, month, day] = dateKey.split('-').map(Number);
          const overrideDate = new Date(year, month - 1, day);
          
          slots.push({
            date: overrideDate,
            startTime: override.startTime || '00:00',
            endTime: override.endTime || '23:59',
            isAvailable: !override.isBlocked,
            source: 'override',
            reason: override.reason,
          });
        });
      } else {
        // Use recurring patterns
        const dayPatterns = recurringPatterns.filter(
          (pattern) => pattern.dayOfWeek === dayOfWeek && pattern.isActive
        );

        dayPatterns.forEach((pattern) => {
          slots.push({
            date: new Date(currentDate),
            startTime: pattern.startTime,
            endTime: pattern.endTime,
            isAvailable: true,
            source: 'recurring',
          });
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  // ============================================================================
  // CONFLICT CHECKING
  // ============================================================================

  /**
   * Check for conflicts with existing recurring availability
   */
  private async checkRecurringConflict(
    userId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<AvailabilityConflict> {
    let query = `
      SELECT * FROM availability_patterns
      WHERE user_id = $1
        AND day_of_week = $2
        AND is_active = true
        AND (
          (start_time < $4 AND end_time > $3)
        )
    `;
    const params: any[] = [userId, dayOfWeek, startTime, endTime];

    if (excludeId) {
      query += ` AND id != $5`;
      params.push(excludeId);
    }

    const result = await this.pool.query(query, params);

    if (result.rows.length > 0) {
      return {
        hasConflict: true,
        conflictingSlots: result.rows.map((row) => ({
          date: new Date(), // Recurring patterns don't have specific dates
          startTime: row.start_time,
          endTime: row.end_time,
          reason: `Overlaps with existing availability on ${DayOfWeek[row.day_of_week]}`,
        })),
      };
    }

    return {
      hasConflict: false,
      conflictingSlots: [],
    };
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  /**
   * Validate time format (HH:MM)
   */
  private validateTimeFormat(time: string): void {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      throw new Error(`Invalid time format: ${time}. Expected HH:MM (24-hour format)`);
    }
  }

  // ============================================================================
  // MAPPERS
  // ============================================================================

  /**
   * Map database row to RecurringAvailability
   */
  private mapRecurringAvailability(row: any): RecurringAvailability {
    return {
      id: row.id,
      userId: row.user_id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map database row to AvailabilityOverride
   */
  private mapAvailabilityOverride(row: any): AvailabilityOverride {
    // Convert override_date to Date object (backend type expects Date)
    // PostgreSQL returns DATE as a string in YYYY-MM-DD format
    let overrideDate: Date;
    if (row.override_date instanceof Date) {
      overrideDate = row.override_date;
    } else if (typeof row.override_date === 'string') {
      // Parse YYYY-MM-DD string as local date (not UTC) to avoid timezone shifts
      const dateMatch = row.override_date.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateMatch[3], 10);
        overrideDate = new Date(year, month, day); // Local date, not UTC
      } else {
        overrideDate = new Date(row.override_date);
      }
    } else {
      overrideDate = new Date(row.override_date);
    }

    return {
      id: row.id,
      userId: row.user_id,
      overrideDate,
      startTime: row.start_time,
      endTime: row.end_time,
      isBlocked: row.is_blocked,
      reason: row.reason,
      createdAt: row.created_at,
    };
  }
}

