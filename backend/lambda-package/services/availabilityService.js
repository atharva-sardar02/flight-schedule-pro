"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
const availability_1 = require("../types/availability");
class AvailabilityService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async createRecurringAvailability(userId, data) {
        this.validateTimeFormat(data.startTime);
        this.validateTimeFormat(data.endTime);
        const conflict = await this.checkRecurringConflict(userId, data.dayOfWeek, data.startTime, data.endTime);
        if (conflict.hasConflict) {
            throw new Error(`Time conflict: ${conflict.conflictingSlots[0].reason}`);
        }
        const result = await this.pool.query(`INSERT INTO availability_patterns (user_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [userId, data.dayOfWeek, data.startTime, data.endTime]);
        return this.mapRecurringAvailability(result.rows[0]);
    }
    async getRecurringAvailability(userId) {
        const result = await this.pool.query(`SELECT * FROM availability_patterns WHERE user_id = $1 ORDER BY day_of_week, start_time`, [userId]);
        return result.rows.map(this.mapRecurringAvailability);
    }
    async updateRecurringAvailability(id, userId, data) {
        if (data.startTime)
            this.validateTimeFormat(data.startTime);
        if (data.endTime)
            this.validateTimeFormat(data.endTime);
        const existing = await this.pool.query(`SELECT * FROM availability_patterns WHERE id = $1 AND user_id = $2`, [id, userId]);
        if (existing.rows.length === 0) {
            throw new Error('Recurring availability not found');
        }
        const current = existing.rows[0];
        const dayOfWeek = data.dayOfWeek !== undefined ? data.dayOfWeek : current.day_of_week;
        const startTime = data.startTime || current.start_time;
        const endTime = data.endTime || current.end_time;
        if (data.dayOfWeek !== undefined ||
            data.startTime ||
            data.endTime) {
            const conflict = await this.checkRecurringConflict(userId, dayOfWeek, startTime, endTime, id);
            if (conflict.hasConflict) {
                throw new Error(`Time conflict: ${conflict.conflictingSlots[0].reason}`);
            }
        }
        const updates = [];
        const values = [];
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
        const result = await this.pool.query(`UPDATE availability_patterns
       SET ${updates.join(', ')}
       WHERE id = $${valueIndex} AND user_id = $${valueIndex + 1}
       RETURNING *`, values);
        return this.mapRecurringAvailability(result.rows[0]);
    }
    async deleteRecurringAvailability(id, userId) {
        const result = await this.pool.query(`DELETE FROM availability_patterns WHERE id = $1 AND user_id = $2`, [id, userId]);
        if (result.rowCount === 0) {
            throw new Error('Recurring availability not found');
        }
    }
    async createAvailabilityOverride(userId, data) {
        if (data.startTime)
            this.validateTimeFormat(data.startTime);
        if (data.endTime)
            this.validateTimeFormat(data.endTime);
        const overrideDate = new Date(data.overrideDate);
        if (isNaN(overrideDate.getTime())) {
            throw new Error('Invalid date format');
        }
        const result = await this.pool.query(`INSERT INTO availability_overrides (user_id, override_date, start_time, end_time, is_blocked, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [
            userId,
            data.overrideDate,
            data.startTime || null,
            data.endTime || null,
            data.isBlocked,
            data.reason || null,
        ]);
        return this.mapAvailabilityOverride(result.rows[0]);
    }
    async getAvailabilityOverrides(userId, startDate, endDate) {
        const result = await this.pool.query(`SELECT * FROM availability_overrides
       WHERE user_id = $1 AND override_date BETWEEN $2 AND $3
       ORDER BY override_date, start_time`, [userId, startDate, endDate]);
        return result.rows.map(this.mapAvailabilityOverride);
    }
    async updateAvailabilityOverride(id, userId, data) {
        if (data.startTime)
            this.validateTimeFormat(data.startTime);
        if (data.endTime)
            this.validateTimeFormat(data.endTime);
        const updates = [];
        const values = [];
        let valueIndex = 1;
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
        const result = await this.pool.query(`UPDATE availability_overrides
       SET ${updates.join(', ')}
       WHERE id = $${valueIndex} AND user_id = $${valueIndex + 1}
       RETURNING *`, values);
        if (result.rows.length === 0) {
            throw new Error('Availability override not found');
        }
        return this.mapAvailabilityOverride(result.rows[0]);
    }
    async deleteAvailabilityOverride(id, userId) {
        const result = await this.pool.query(`DELETE FROM availability_overrides WHERE id = $1 AND user_id = $2`, [id, userId]);
        if (result.rowCount === 0) {
            throw new Error('Availability override not found');
        }
    }
    async getAvailability(query) {
        const { userId, startDate, endDate } = query;
        const recurringPatterns = await this.getRecurringAvailability(userId);
        const overrides = await this.getAvailabilityOverrides(userId, startDate, endDate);
        const slots = this.computeAvailabilitySlots(recurringPatterns, overrides, new Date(startDate), new Date(endDate));
        return {
            userId,
            startDate,
            endDate,
            slots,
            recurringPatterns,
            overrides,
        };
    }
    computeAvailabilitySlots(recurringPatterns, overrides, startDate, endDate) {
        const slots = [];
        const overrideMap = new Map();
        overrides.forEach((override) => {
            const overrideDate = override.overrideDate instanceof Date
                ? override.overrideDate
                : new Date(override.overrideDate);
            const dateKey = overrideDate.toISOString().split('T')[0];
            if (!overrideMap.has(dateKey)) {
                overrideMap.set(dateKey, []);
            }
            overrideMap.get(dateKey).push(override);
        });
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay();
            const dayOverrides = overrideMap.get(dateKey) || [];
            if (dayOverrides.length > 0) {
                dayOverrides.forEach((override) => {
                    const overrideDate = override.overrideDate instanceof Date
                        ? override.overrideDate
                        : new Date(override.overrideDate);
                    slots.push({
                        date: overrideDate,
                        startTime: override.startTime || '00:00',
                        endTime: override.endTime || '23:59',
                        isAvailable: !override.isBlocked,
                        source: 'override',
                        reason: override.reason,
                    });
                });
            }
            else {
                const dayPatterns = recurringPatterns.filter((pattern) => pattern.dayOfWeek === dayOfWeek && pattern.isActive);
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
    async checkRecurringConflict(userId, dayOfWeek, startTime, endTime, excludeId) {
        let query = `
      SELECT * FROM availability_patterns
      WHERE user_id = $1
        AND day_of_week = $2
        AND is_active = true
        AND (
          (start_time < $4 AND end_time > $3)
        )
    `;
        const params = [userId, dayOfWeek, startTime, endTime];
        if (excludeId) {
            query += ` AND id != $5`;
            params.push(excludeId);
        }
        const result = await this.pool.query(query, params);
        if (result.rows.length > 0) {
            return {
                hasConflict: true,
                conflictingSlots: result.rows.map((row) => ({
                    date: new Date(),
                    startTime: row.start_time,
                    endTime: row.end_time,
                    reason: `Overlaps with existing availability on ${availability_1.DayOfWeek[row.day_of_week]}`,
                })),
            };
        }
        return {
            hasConflict: false,
            conflictingSlots: [],
        };
    }
    validateTimeFormat(time) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(time)) {
            throw new Error(`Invalid time format: ${time}. Expected HH:MM (24-hour format)`);
        }
    }
    mapRecurringAvailability(row) {
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
    mapAvailabilityOverride(row) {
        return {
            id: row.id,
            userId: row.user_id,
            overrideDate: row.override_date,
            startTime: row.start_time,
            endTime: row.end_time,
            isBlocked: row.is_blocked,
            reason: row.reason,
            createdAt: row.created_at,
        };
    }
}
exports.AvailabilityService = AvailabilityService;
//# sourceMappingURL=availabilityService.js.map