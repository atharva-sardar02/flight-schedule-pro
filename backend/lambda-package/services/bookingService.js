"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const db_1 = require("../utils/db");
const booking_1 = require("../types/booking");
const weatherService_1 = __importDefault(require("./weatherService"));
const corridor_1 = require("../utils/corridor");
const logger_1 = __importDefault(require("../utils/logger"));
class BookingService {
    async createBooking(data) {
        const pool = (0, db_1.getDbPool)();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const scheduledDate = new Date(data.scheduledDatetime);
            if (scheduledDate <= new Date()) {
                throw new Error('Scheduled datetime must be in the future');
            }
            const studentCheck = await client.query('SELECT id, role FROM users WHERE id = $1', [data.studentId]);
            if (studentCheck.rows.length === 0) {
                throw new Error('Student not found');
            }
            if (studentCheck.rows[0].role !== 'STUDENT') {
                throw new Error('User is not a student');
            }
            const instructorCheck = await client.query('SELECT id, role FROM users WHERE id = $1', [data.instructorId]);
            if (instructorCheck.rows.length === 0) {
                throw new Error('Instructor not found');
            }
            if (instructorCheck.rows[0].role !== 'INSTRUCTOR') {
                throw new Error('User is not an instructor');
            }
            const path = (0, corridor_1.calculateFlightPath)({
                latitude: data.departureLatitude,
                longitude: data.departureLongitude,
            }, {
                latitude: data.arrivalLatitude,
                longitude: data.arrivalLongitude,
            });
            try {
                const weatherCheck = await weatherService_1.default.checkWeatherForFlight(path, data.trainingLevel);
                const initialStatus = weatherCheck.validation.isValid
                    ? booking_1.BookingStatus.CONFIRMED
                    : booking_1.BookingStatus.AT_RISK;
                if (!weatherCheck.validation.isValid) {
                    logger_1.default.warn('Booking created with weather violations', {
                        bookingId: 'pending',
                        violations: weatherCheck.validation.violations.length,
                    });
                }
                const result = await client.query(`INSERT INTO bookings (
            student_id, instructor_id, aircraft_id,
            departure_airport, arrival_airport,
            departure_latitude, departure_longitude,
            arrival_latitude, arrival_longitude,
            scheduled_datetime, status, training_level, duration_minutes,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
          RETURNING *`, [
                    data.studentId,
                    data.instructorId,
                    data.aircraftId || null,
                    data.departureAirport,
                    data.arrivalAirport,
                    data.departureLatitude,
                    data.departureLongitude,
                    data.arrivalLatitude,
                    data.arrivalLongitude,
                    scheduledDate,
                    initialStatus,
                    data.trainingLevel,
                    data.durationMinutes || 60,
                ]);
                await client.query('COMMIT');
                return this.mapRowToBooking(result.rows[0]);
            }
            catch (weatherError) {
                logger_1.default.error('Weather validation failed during booking creation', {
                    error: weatherError instanceof Error ? weatherError.message : 'Unknown',
                });
                const result = await client.query(`INSERT INTO bookings (
            student_id, instructor_id, aircraft_id,
            departure_airport, arrival_airport,
            departure_latitude, departure_longitude,
            arrival_latitude, arrival_longitude,
            scheduled_datetime, status, training_level, duration_minutes,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
          RETURNING *`, [
                    data.studentId,
                    data.instructorId,
                    data.aircraftId || null,
                    data.departureAirport,
                    data.arrivalAirport,
                    data.departureLatitude,
                    data.departureLongitude,
                    data.arrivalLatitude,
                    data.arrivalLongitude,
                    scheduledDate,
                    booking_1.BookingStatus.CONFIRMED,
                    data.trainingLevel,
                    data.durationMinutes || 60,
                ]);
                await client.query('COMMIT');
                return this.mapRowToBooking(result.rows[0]);
            }
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.default.error('Failed to create booking', {
                error: error instanceof Error ? error.message : 'Unknown',
                data,
            });
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getBookingById(id) {
        const result = await (0, db_1.query)('SELECT * FROM bookings WHERE id = $1', [id]);
        if (result.length === 0) {
            return null;
        }
        return this.mapRowToBooking(result[0]);
    }
    async getBookingWithUsers(id) {
        const result = await (0, db_1.query)(`SELECT 
        b.*,
        s.id as student_id_full,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        s.email as student_email,
        i.id as instructor_id_full,
        i.first_name as instructor_first_name,
        i.last_name as instructor_last_name,
        i.email as instructor_email
      FROM bookings b
      JOIN users s ON b.student_id = s.id
      JOIN users i ON b.instructor_id = i.id
      WHERE b.id = $1`, [id]);
        if (result.length === 0) {
            return null;
        }
        const row = result[0];
        const booking = this.mapRowToBooking(row);
        return {
            ...booking,
            student: {
                id: row.student_id_full,
                firstName: row.student_first_name,
                lastName: row.student_last_name,
                email: row.student_email,
            },
            instructor: {
                id: row.instructor_id_full,
                firstName: row.instructor_first_name,
                lastName: row.instructor_last_name,
                email: row.instructor_email,
            },
        };
    }
    async listBookings(filters = {}) {
        let queryText = 'SELECT * FROM bookings WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        if (filters.studentId) {
            queryText += ` AND student_id = $${paramIndex}`;
            params.push(filters.studentId);
            paramIndex++;
        }
        if (filters.instructorId) {
            queryText += ` AND instructor_id = $${paramIndex}`;
            params.push(filters.instructorId);
            paramIndex++;
        }
        if (filters.status) {
            queryText += ` AND status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }
        if (filters.trainingLevel) {
            queryText += ` AND training_level = $${paramIndex}`;
            params.push(filters.trainingLevel);
            paramIndex++;
        }
        if (filters.startDate) {
            queryText += ` AND scheduled_datetime >= $${paramIndex}`;
            params.push(new Date(filters.startDate));
            paramIndex++;
        }
        if (filters.endDate) {
            queryText += ` AND scheduled_datetime <= $${paramIndex}`;
            params.push(new Date(filters.endDate));
            paramIndex++;
        }
        queryText += ' ORDER BY scheduled_datetime ASC';
        if (filters.limit) {
            queryText += ` LIMIT $${paramIndex}`;
            params.push(filters.limit);
            paramIndex++;
        }
        if (filters.offset) {
            queryText += ` OFFSET $${paramIndex}`;
            params.push(filters.offset);
            paramIndex++;
        }
        const result = await (0, db_1.query)(queryText, params);
        return result.map((row) => this.mapRowToBooking(row));
    }
    async updateBooking(id, data) {
        const pool = (0, db_1.getDbPool)();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const existing = await client.query('SELECT * FROM bookings WHERE id = $1', [id]);
            if (existing.rows.length === 0) {
                throw new Error('Booking not found');
            }
            const updates = [];
            const params = [];
            let paramIndex = 1;
            if (data.aircraftId !== undefined) {
                updates.push(`aircraft_id = $${paramIndex}`);
                params.push(data.aircraftId || null);
                paramIndex++;
            }
            if (data.scheduledDatetime !== undefined) {
                updates.push(`scheduled_datetime = $${paramIndex}`);
                params.push(new Date(data.scheduledDatetime));
                paramIndex++;
            }
            if (data.status !== undefined) {
                updates.push(`status = $${paramIndex}`);
                params.push(data.status);
                paramIndex++;
            }
            if (data.durationMinutes !== undefined) {
                updates.push(`duration_minutes = $${paramIndex}`);
                params.push(data.durationMinutes);
                paramIndex++;
            }
            if (updates.length === 0) {
                throw new Error('No fields to update');
            }
            updates.push(`updated_at = NOW()`);
            params.push(id);
            const queryText = `UPDATE bookings SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
            const result = await client.query(queryText, params);
            await client.query('COMMIT');
            return this.mapRowToBooking(result.rows[0]);
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.default.error('Failed to update booking', {
                id,
                error: error instanceof Error ? error.message : 'Unknown',
            });
            throw error;
        }
        finally {
            client.release();
        }
    }
    async deleteBooking(id) {
        const result = await (0, db_1.query)('DELETE FROM bookings WHERE id = $1', [id]);
        if (result.length === 0) {
            throw new Error('Booking not found');
        }
    }
    async cancelBooking(id) {
        return this.updateBooking(id, { status: booking_1.BookingStatus.CANCELLED });
    }
    mapRowToBooking(row) {
        return {
            id: row.id,
            studentId: row.student_id,
            instructorId: row.instructor_id,
            aircraftId: row.aircraft_id,
            departureAirport: row.departure_airport,
            arrivalAirport: row.arrival_airport,
            departureLatitude: parseFloat(row.departure_latitude),
            departureLongitude: parseFloat(row.departure_longitude),
            arrivalLatitude: parseFloat(row.arrival_latitude),
            arrivalLongitude: parseFloat(row.arrival_longitude),
            scheduledDatetime: new Date(row.scheduled_datetime),
            status: row.status,
            trainingLevel: row.training_level,
            durationMinutes: row.duration_minutes,
            originalBookingId: row.original_booking_id,
            rescheduledToDatetime: row.rescheduled_to_datetime
                ? new Date(row.rescheduled_to_datetime)
                : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
}
exports.BookingService = BookingService;
exports.default = new BookingService();
//# sourceMappingURL=bookingService.js.map