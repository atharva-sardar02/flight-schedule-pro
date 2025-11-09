"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferenceRankingService = void 0;
const logger_1 = require("../utils/logger");
const deadlineCalculator_1 = require("../utils/deadlineCalculator");
class PreferenceRankingService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async createPreferenceRankings(bookingId, studentId, instructorId, scheduledTime) {
        try {
            const deadline = (0, deadlineCalculator_1.calculateDeadline)(scheduledTime, new Date());
            await this.pool.query(`INSERT INTO preference_rankings (booking_id, user_id, deadline, unavailable_option_ids)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (booking_id, user_id) DO NOTHING`, [bookingId, studentId, deadline, []]);
            await this.pool.query(`INSERT INTO preference_rankings (booking_id, user_id, deadline, unavailable_option_ids)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (booking_id, user_id) DO NOTHING`, [bookingId, instructorId, deadline, []]);
            (0, logger_1.logInfo)('Preference rankings created', {
                bookingId,
                studentId,
                instructorId,
                deadline: deadline.toISOString(),
            });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to create preference rankings', error, {
                bookingId,
                studentId,
                instructorId,
            });
            throw error;
        }
    }
    async submitPreference(request) {
        try {
            const existing = await this.pool.query(`SELECT deadline FROM preference_rankings WHERE booking_id = $1 AND user_id = $2`, [request.bookingId, request.userId]);
            if (existing.rows.length > 0) {
                const deadline = new Date(existing.rows[0].deadline);
                if ((0, deadlineCalculator_1.isDeadlinePassed)(deadline)) {
                    throw new Error('Preference submission deadline has passed');
                }
            }
            const result = await this.pool.query(`UPDATE preference_rankings
         SET option_1_id = $3,
             option_2_id = $4,
             option_3_id = $5,
             unavailable_option_ids = $6,
             submitted_at = NOW()
         WHERE booking_id = $1 AND user_id = $2
         RETURNING *`, [
                request.bookingId,
                request.userId,
                request.option1Id || null,
                request.option2Id || null,
                request.option3Id || null,
                request.unavailableOptionIds || [],
            ]);
            if (result.rows.length === 0) {
                throw new Error('Preference ranking not found');
            }
            (0, logger_1.logInfo)('Preference submitted', {
                bookingId: request.bookingId,
                userId: request.userId,
            });
            return this.mapPreferenceRanking(result.rows[0]);
        }
        catch (error) {
            (0, logger_1.logError)('Failed to submit preference', error, request);
            throw error;
        }
    }
    async getPreferencesByBooking(bookingId) {
        try {
            const result = await this.pool.query(`SELECT * FROM preference_rankings WHERE booking_id = $1`, [bookingId]);
            return result.rows.map(this.mapPreferenceRanking);
        }
        catch (error) {
            (0, logger_1.logError)('Failed to get preferences', error, { bookingId });
            return [];
        }
    }
    async getPreference(bookingId, userId) {
        try {
            const result = await this.pool.query(`SELECT * FROM preference_rankings WHERE booking_id = $1 AND user_id = $2`, [bookingId, userId]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapPreferenceRanking(result.rows[0]);
        }
        catch (error) {
            (0, logger_1.logError)('Failed to get preference', error, { bookingId, userId });
            return null;
        }
    }
    async areBothPreferencesSubmitted(bookingId) {
        try {
            const result = await this.pool.query(`SELECT COUNT(*) as submitted_count
         FROM preference_rankings
         WHERE booking_id = $1 AND submitted_at IS NOT NULL`, [bookingId]);
            return parseInt(result.rows[0].submitted_count) === 2;
        }
        catch (error) {
            (0, logger_1.logError)('Failed to check preference submission status', error, { bookingId });
            return false;
        }
    }
    async resolveFinalSelection(bookingId) {
        try {
            const preferences = await this.getPreferencesByBooking(bookingId);
            if (preferences.length !== 2) {
                return null;
            }
            const instructorPref = await this.getInstructorPreference(bookingId);
            if (!instructorPref) {
                return null;
            }
            if (instructorPref.option1Id) {
                (0, logger_1.logInfo)('Resolved to instructor #1 choice', {
                    bookingId,
                    optionId: instructorPref.option1Id,
                });
                return instructorPref.option1Id;
            }
            if (instructorPref.option2Id) {
                return instructorPref.option2Id;
            }
            if (instructorPref.option3Id) {
                return instructorPref.option3Id;
            }
            return null;
        }
        catch (error) {
            (0, logger_1.logError)('Failed to resolve final selection', error, { bookingId });
            return null;
        }
    }
    async getInstructorPreference(bookingId) {
        try {
            const result = await this.pool.query(`SELECT pr.*
         FROM preference_rankings pr
         JOIN bookings b ON pr.booking_id = b.id
         WHERE pr.booking_id = $1 AND pr.user_id = b.instructor_id`, [bookingId]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapPreferenceRanking(result.rows[0]);
        }
        catch (error) {
            (0, logger_1.logError)('Failed to get instructor preference', error, { bookingId });
            return null;
        }
    }
    mapPreferenceRanking(row) {
        return {
            id: row.id,
            bookingId: row.booking_id,
            userId: row.user_id,
            option1Id: row.option_1_id,
            option2Id: row.option_2_id,
            option3Id: row.option_3_id,
            unavailableOptionIds: row.unavailable_option_ids || [],
            deadline: row.deadline,
            submittedAt: row.submitted_at,
            createdAt: row.created_at,
        };
    }
}
exports.PreferenceRankingService = PreferenceRankingService;
//# sourceMappingURL=preferenceRankingService.js.map