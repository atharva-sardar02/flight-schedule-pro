/**
 * Conflict Detector Service
 * Detects schedule conflicts and determines if flights are at risk
 */

import { Pool } from 'pg';
import { WeatherValidator, WeatherValidationResult } from './weatherValidator';
import { BookingStatus, TrainingLevel } from '../../types/booking';
import { logInfo, logWarn, logConflictDetected } from '../../utils/logger';

export interface ConflictDetectionResult {
  bookingId: string;
  hasConflict: boolean;
  conflictType: 'weather' | 'availability' | 'none';
  severity: 'critical' | 'warning' | 'none';
  shouldNotify: boolean;
  weatherValidation?: WeatherValidationResult;
  recommendations: string[];
}

export class ConflictDetector {
  private pool: Pool;
  private weatherValidator: WeatherValidator;

  constructor(pool: Pool, weatherValidator: WeatherValidator) {
    this.pool = pool;
    this.weatherValidator = weatherValidator;
  }

  /**
   * Check all upcoming bookings for weather conflicts
   */
  async checkUpcomingBookings(lookAheadHours: number = 48): Promise<ConflictDetectionResult[]> {
    logInfo('Starting conflict detection for upcoming bookings', { lookAheadHours });

    try {
      // Get all confirmed bookings in the next X hours
      const result = await this.pool.query(
        `SELECT b.*, 
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
         ORDER BY b.scheduled_time ASC`,
        []
      );

      logInfo(`Found ${result.rows.length} bookings to check`);

      const conflicts: ConflictDetectionResult[] = [];

      for (const booking of result.rows) {
        const conflict = await this.checkBookingForConflicts(booking);
        conflicts.push(conflict);

        if (conflict.hasConflict) {
          logConflictDetected(booking.id, conflict.conflictType, {
            severity: conflict.severity,
            violations: conflict.weatherValidation?.violations,
          });
        }
      }

      return conflicts;
    } catch (error: any) {
      logWarn('Error during conflict detection', { error: error.message });
      throw error;
    }
  }

  /**
   * Check a specific booking for conflicts
   */
  async checkBookingForConflicts(booking: any): Promise<ConflictDetectionResult> {
    const bookingId = booking.id;
    const scheduledTime = new Date(booking.scheduled_time);
    const trainingLevel: TrainingLevel = booking.student_training_level;

    logInfo('Checking booking for conflicts', {
      bookingId,
      scheduledTime: scheduledTime.toISOString(),
      trainingLevel,
    });

    // Check weather
    const weatherValidation = await this.weatherValidator.validateFlightWeather(
      booking.departure_airport,
      booking.arrival_airport,
      scheduledTime,
      trainingLevel
    );

    const hasWeatherConflict = !weatherValidation.isValid;

    if (hasWeatherConflict) {
      const timeUntilFlight = scheduledTime.getTime() - Date.now();
      const hoursUntilFlight = timeUntilFlight / (1000 * 60 * 60);

      // Determine severity based on time until flight
      let severity: 'critical' | 'warning' | 'none' = 'none';
      if (hoursUntilFlight <= 2) {
        severity = 'critical';
      } else if (hoursUntilFlight <= 12) {
        severity = 'warning';
      }

      // Should notify if not already at risk, or if severity increased
      const shouldNotify = booking.status === 'CONFIRMED' || severity === 'critical';

      const recommendations = this.generateRecommendations(
        weatherValidation,
        hoursUntilFlight,
        booking
      );

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

    // No conflicts found
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

  /**
   * Generate recommendations based on conflict
   */
  private generateRecommendations(
    weatherValidation: WeatherValidationResult,
    hoursUntilFlight: number,
    booking: any
  ): string[] {
    const recommendations: string[] = [];

    if (hoursUntilFlight <= 2) {
      recommendations.push('URGENT: Flight departure is within 2 hours');
      recommendations.push('Contact student and instructor immediately');
      recommendations.push('Consider canceling or rescheduling');
    } else if (hoursUntilFlight <= 6) {
      recommendations.push('Flight departure is within 6 hours');
      recommendations.push('Monitor weather closely');
      recommendations.push('Prepare rescheduling options');
    } else if (hoursUntilFlight <= 12) {
      recommendations.push('Flight departure is within 12 hours');
      recommendations.push('Continue monitoring weather');
      recommendations.push('Alert student and instructor');
    } else {
      recommendations.push('Flight departure is more than 12 hours away');
      recommendations.push('Mark booking as AT_RISK');
      recommendations.push('Monitor for improvement');
    }

    // Add specific weather violations
    if (weatherValidation.violations.length > 0) {
      recommendations.push('');
      recommendations.push('Weather Violations:');
      weatherValidation.violations.forEach((violation) => {
        recommendations.push(`- ${violation}`);
      });
    }

    return recommendations;
  }

  /**
   * Update booking status based on conflict
   */
  async updateBookingStatus(
    bookingId: string,
    conflict: ConflictDetectionResult
  ): Promise<void> {
    if (!conflict.hasConflict) {
      // If previously at risk but now clear, update to confirmed
      await this.pool.query(
        `UPDATE bookings
         SET status = 'CONFIRMED',
             weather_check_status = 'VALID',
             weather_last_checked = NOW()
         WHERE id = $1 AND status = 'AT_RISK'`,
        [bookingId]
      );
      return;
    }

    // Update to AT_RISK if weather conflict detected
    if (conflict.conflictType === 'weather') {
      await this.pool.query(
        `UPDATE bookings
         SET status = 'AT_RISK',
             weather_check_status = 'INVALID',
             weather_last_checked = NOW()
         WHERE id = $1`,
        [bookingId]
      );

      logInfo('Booking status updated to AT_RISK', {
        bookingId,
        violations: conflict.weatherValidation?.violations.length,
      });
    }
  }

  /**
   * Get conflict statistics
   */
  async getConflictStatistics(): Promise<any> {
    const result = await this.pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'AT_RISK') as at_risk_count,
         COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed_count,
         COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_count,
         COUNT(*) FILTER (WHERE weather_check_status = 'INVALID') as weather_invalid_count
       FROM bookings
       WHERE scheduled_time >= NOW()
         AND scheduled_time <= NOW() + INTERVAL '48 hours'`,
      []
    );

    return result.rows[0];
  }
}

