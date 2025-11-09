"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictDetector = void 0;
const logger_1 = require("../../utils/logger");
class ConflictDetector {
    pool;
    weatherValidator;
    constructor(pool, weatherValidator) {
        this.pool = pool;
        this.weatherValidator = weatherValidator;
    }
    async checkUpcomingBookings(lookAheadHours = 48) {
        (0, logger_1.logInfo)('Starting conflict detection for upcoming bookings', { lookAheadHours });
        try {
            const result = await this.pool.query(`SELECT b.*, 
                u_student.training_level as student_training_level,
                u_student.email as student_email,
                u_student.first_name as student_first_name,
                u_instructor.email as instructor_email,
                u_instructor.first_name as instructor_first_name
         FROM bookings b
         JOIN users u_student ON b.student_id = u_student.id
         JOIN users u_instructor ON b.instructor_id = u_instructor.id
         WHERE b.status IN ('CONFIRMED', 'AT_RISK')
           AND b.scheduled_time >= NOW()
           AND b.scheduled_time <= NOW() + INTERVAL '${lookAheadHours} hours'
         ORDER BY b.scheduled_time ASC`, []);
            (0, logger_1.logInfo)(`Found ${result.rows.length} bookings to check`);
            const conflicts = [];
            for (const booking of result.rows) {
                const conflict = await this.checkBookingForConflicts(booking);
                conflicts.push(conflict);
                if (conflict.hasConflict) {
                    (0, logger_1.logConflictDetected)(booking.id, conflict.conflictType, {
                        severity: conflict.severity,
                        violations: conflict.weatherValidation?.violations,
                    });
                }
            }
            return conflicts;
        }
        catch (error) {
            (0, logger_1.logWarn)('Error during conflict detection', { error: error.message });
            throw error;
        }
    }
    async checkBookingForConflicts(booking) {
        const bookingId = booking.id;
        const scheduledTime = new Date(booking.scheduled_time);
        const trainingLevel = booking.student_training_level;
        (0, logger_1.logInfo)('Checking booking for conflicts', {
            bookingId,
            scheduledTime: scheduledTime.toISOString(),
            trainingLevel,
        });
        const weatherValidation = await this.weatherValidator.validateFlightWeather(booking.departure_airport, booking.arrival_airport, scheduledTime, trainingLevel);
        const hasWeatherConflict = !weatherValidation.isValid;
        if (hasWeatherConflict) {
            const timeUntilFlight = scheduledTime.getTime() - Date.now();
            const hoursUntilFlight = timeUntilFlight / (1000 * 60 * 60);
            let severity = 'none';
            if (hoursUntilFlight <= 2) {
                severity = 'critical';
            }
            else if (hoursUntilFlight <= 12) {
                severity = 'warning';
            }
            const shouldNotify = booking.status === 'CONFIRMED' || severity === 'critical';
            const recommendations = this.generateRecommendations(weatherValidation, hoursUntilFlight, booking);
            return {
                bookingId,
                hasConflict: true,
                conflictType: 'weather',
                severity,
                shouldNotify,
                weatherValidation,
                recommendations,
            };
        }
        return {
            bookingId,
            hasConflict: false,
            conflictType: 'none',
            severity: 'none',
            shouldNotify: false,
            weatherValidation,
            recommendations: [],
        };
    }
    generateRecommendations(weatherValidation, hoursUntilFlight, booking) {
        const recommendations = [];
        if (hoursUntilFlight <= 2) {
            recommendations.push('URGENT: Flight departure is within 2 hours');
            recommendations.push('Contact student and instructor immediately');
            recommendations.push('Consider canceling or rescheduling');
        }
        else if (hoursUntilFlight <= 6) {
            recommendations.push('Flight departure is within 6 hours');
            recommendations.push('Monitor weather closely');
            recommendations.push('Prepare rescheduling options');
        }
        else if (hoursUntilFlight <= 12) {
            recommendations.push('Flight departure is within 12 hours');
            recommendations.push('Continue monitoring weather');
            recommendations.push('Alert student and instructor');
        }
        else {
            recommendations.push('Flight departure is more than 12 hours away');
            recommendations.push('Mark booking as AT_RISK');
            recommendations.push('Monitor for improvement');
        }
        if (weatherValidation.violations.length > 0) {
            recommendations.push('');
            recommendations.push('Weather Violations:');
            weatherValidation.violations.forEach((violation) => {
                recommendations.push(`- ${violation}`);
            });
        }
        return recommendations;
    }
    async updateBookingStatus(bookingId, conflict) {
        if (!conflict.hasConflict) {
            await this.pool.query(`UPDATE bookings
         SET status = 'CONFIRMED',
             weather_check_status = 'VALID',
             weather_last_checked = NOW()
         WHERE id = $1 AND status = 'AT_RISK'`, [bookingId]);
            return;
        }
        if (conflict.conflictType === 'weather') {
            await this.pool.query(`UPDATE bookings
         SET status = 'AT_RISK',
             weather_check_status = 'INVALID',
             weather_last_checked = NOW()
         WHERE id = $1`, [bookingId]);
            (0, logger_1.logInfo)('Booking status updated to AT_RISK', {
                bookingId,
                violations: conflict.weatherValidation?.violations.length,
            });
        }
    }
    async getConflictStatistics() {
        const result = await this.pool.query(`SELECT 
         COUNT(*) FILTER (WHERE status = 'AT_RISK') as at_risk_count,
         COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed_count,
         COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_count,
         COUNT(*) FILTER (WHERE weather_check_status = 'INVALID') as weather_invalid_count
       FROM bookings
       WHERE scheduled_time >= NOW()
         AND scheduled_time <= NOW() + INTERVAL '48 hours'`, []);
        return result.rows[0];
    }
}
exports.ConflictDetector = ConflictDetector;
//# sourceMappingURL=conflictDetector.js.map