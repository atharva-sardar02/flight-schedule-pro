"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RescheduleOptionsService = void 0;
const logger_1 = require("../utils/logger");
class RescheduleOptionsService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async createOptions(options) {
        try {
            const results = [];
            for (const option of options) {
                const result = await this.pool.query(`INSERT INTO reschedule_options (booking_id, suggested_datetime, weather_forecast, ai_confidence_score)
           VALUES ($1, $2, $3, $4)
           RETURNING *`, [
                    option.bookingId,
                    option.suggestedDatetime,
                    JSON.stringify(option.weatherForecast),
                    option.aiConfidenceScore,
                ]);
                results.push(this.mapRescheduleOption(result.rows[0]));
            }
            (0, logger_1.logInfo)('Reschedule options created', {
                bookingId: options[0]?.bookingId,
                count: results.length,
            });
            return results;
        }
        catch (error) {
            (0, logger_1.logError)('Failed to create reschedule options', error, { options });
            throw error;
        }
    }
    async getOptionsByBooking(bookingId) {
        try {
            const result = await this.pool.query(`SELECT * FROM reschedule_options
         WHERE booking_id = $1
         ORDER BY ai_confidence_score DESC, suggested_datetime ASC`, [bookingId]);
            return result.rows.map(this.mapRescheduleOption);
        }
        catch (error) {
            (0, logger_1.logError)('Failed to get reschedule options', error, { bookingId });
            return [];
        }
    }
    async getOption(optionId) {
        try {
            const result = await this.pool.query(`SELECT * FROM reschedule_options WHERE id = $1`, [optionId]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRescheduleOption(result.rows[0]);
        }
        catch (error) {
            (0, logger_1.logError)('Failed to get reschedule option', error, { optionId });
            return null;
        }
    }
    async deleteOptionsByBooking(bookingId) {
        try {
            await this.pool.query(`DELETE FROM reschedule_options WHERE booking_id = $1`, [bookingId]);
            (0, logger_1.logInfo)('Reschedule options deleted', { bookingId });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to delete reschedule options', error, { bookingId });
        }
    }
    mapRescheduleOption(row) {
        return {
            id: row.id,
            bookingId: row.booking_id,
            suggestedDatetime: row.suggested_datetime,
            weatherForecast: row.weather_forecast,
            aiConfidenceScore: parseFloat(row.ai_confidence_score),
            createdAt: row.created_at,
        };
    }
}
exports.RescheduleOptionsService = RescheduleOptionsService;
//# sourceMappingURL=rescheduleOptionsService.js.map