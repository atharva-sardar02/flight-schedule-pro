/**
 * Booking Service
 * Handles CRUD operations for flight bookings
 */

import { Pool } from 'pg';
import { getDbPool, query } from '../utils/db';
import {
  Booking,
  BookingStatus,
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingWithUsers,
  BookingListFilters,
} from '../types/booking';
import { TrainingLevel } from '../types/weather';
import WeatherService from './weatherService';
import { calculateFlightPath } from '../utils/corridor';
import logger from '../utils/logger';

export class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingRequest): Promise<Booking> {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Validate scheduled datetime is in the future
      const scheduledDate = new Date(data.scheduledDatetime);
      if (scheduledDate <= new Date()) {
        throw new Error('Scheduled datetime must be in the future');
      }

      // Validate student and instructor exist
      const studentCheck = await client.query(
        'SELECT id, role FROM users WHERE id = $1',
        [data.studentId]
      );
      if (studentCheck.rows.length === 0) {
        throw new Error('Student not found');
      }
      if (studentCheck.rows[0].role !== 'STUDENT') {
        throw new Error('User is not a student');
      }

      const instructorCheck = await client.query(
        'SELECT id, role FROM users WHERE id = $1',
        [data.instructorId]
      );
      if (instructorCheck.rows.length === 0) {
        throw new Error('Instructor not found');
      }
      if (instructorCheck.rows[0].role !== 'INSTRUCTOR') {
        throw new Error('User is not an instructor');
      }

      // CHECK FOR BOOKING CONFLICTS
      // Check if student or instructor already has a booking at this time
      const slotStart = new Date(scheduledDate);
      slotStart.setMinutes(slotStart.getMinutes() - 30); // 30 min buffer before
      const slotEnd = new Date(scheduledDate);
      slotEnd.setMinutes(slotEnd.getMinutes() + (data.durationMinutes || 60) + 30); // Duration + 30 min buffer after

      const conflictCheck = await client.query(
        `SELECT id, scheduled_datetime, status, student_id, instructor_id
         FROM bookings
         WHERE status IN ('CONFIRMED', 'AT_RISK', 'RESCHEDULING', 'RESCHEDULED')
           AND scheduled_datetime >= $1
           AND scheduled_datetime <= $2
           AND (student_id = $3 OR instructor_id = $4)`,
        [slotStart, slotEnd, data.studentId, data.instructorId]
      );

      if (conflictCheck.rows.length > 0) {
        const conflictingBooking = conflictCheck.rows[0];
        const conflictType = conflictingBooking.student_id === data.studentId 
          ? 'student' 
          : 'instructor';
        const conflictTime = new Date(conflictingBooking.scheduled_datetime);
        
        throw new Error(
          `Booking conflict: ${conflictType} already has a ${conflictingBooking.status.toLowerCase()} booking at ${conflictTime.toISOString()}. ` +
          `Please choose a different time.`
        );
      }

      // CHECK CALENDAR AVAILABILITY
      // Check if student is available in their calendar
      const { AvailabilityService } = require('./availabilityService');
      const availabilityService = new AvailabilityService(pool);
      const { format } = require('date-fns');
      
      logger.info('Checking availability before creating booking', {
        studentId: data.studentId,
        instructorId: data.instructorId,
        scheduledDate: scheduledDate.toISOString(),
        scheduledDateLocal: scheduledDate.toString(),
        scheduledDateUTC: scheduledDate.toUTCString(),
      });
      
      // Extract date and time components using local timezone
      // Availability times are stored in local timezone (e.g., "09:00" to "17:00")
      // So we need to format the booking time in local timezone to match
      const year = scheduledDate.getFullYear();
      const month = String(scheduledDate.getMonth() + 1).padStart(2, '0');
      const day = String(scheduledDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const hours = String(scheduledDate.getHours()).padStart(2, '0');
      const minutes = String(scheduledDate.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      
      const endHours = String(slotEnd.getHours()).padStart(2, '0');
      const endMinutes = String(slotEnd.getMinutes()).padStart(2, '0');
      const endTimeStr = `${endHours}:${endMinutes}`;
      
      logger.info('Formatted booking time for availability check', {
        dateStr,
        timeStr,
        endTimeStr,
        scheduledDateISO: scheduledDate.toISOString(),
        scheduledDateLocal: scheduledDate.toString(),
      });

      // Check student availability
      const studentAvailability = await availabilityService.getAvailability({
        userId: data.studentId,
        startDate: dateStr,
        endDate: dateStr,
      });

      const studentAvailable = studentAvailability.slots.some((slot) => {
        // Format slot date using local timezone to match booking date formatting
        // slot.date might be a Date object or a string (YYYY-MM-DD)
        let slotDateStr: string;
        if (slot.date instanceof Date) {
          const slotYear = slot.date.getFullYear();
          const slotMonth = String(slot.date.getMonth() + 1).padStart(2, '0');
          const slotDay = String(slot.date.getDate()).padStart(2, '0');
          slotDateStr = `${slotYear}-${slotMonth}-${slotDay}`;
        } else if (typeof slot.date === 'string') {
          // If it's already a YYYY-MM-DD string, use it directly
          slotDateStr = slot.date.substring(0, 10);
        } else {
          const slotDate = new Date(slot.date);
          const slotYear = slotDate.getFullYear();
          const slotMonth = String(slotDate.getMonth() + 1).padStart(2, '0');
          const slotDay = String(slotDate.getDate()).padStart(2, '0');
          slotDateStr = `${slotYear}-${slotMonth}-${slotDay}`;
        }
        
        if (slotDateStr !== dateStr) return false;
        if (!slot.isAvailable) return false;
        // Check if booking time falls within available slot
        const timeMatch = timeStr >= slot.startTime && timeStr <= slot.endTime;
        if (!timeMatch) {
          logger.info('Time mismatch in availability check', {
            bookingTime: timeStr,
            slotStart: slot.startTime,
            slotEnd: slot.endTime,
            slotDate: slotDateStr,
          });
        }
        return timeMatch;
      });

      if (!studentAvailable) {
        throw new Error(
          `Student is not available in their calendar at ${scheduledDate.toISOString()}. ` +
          `Please choose a time when the student is available.`
        );
      }

      // Check instructor availability
      const instructorAvailability = await availabilityService.getAvailability({
        userId: data.instructorId,
        startDate: dateStr,
        endDate: dateStr,
      });

      const instructorAvailable = instructorAvailability.slots.some((slot) => {
        // Format slot date using local timezone to match booking date formatting
        // slot.date might be a Date object or a string (YYYY-MM-DD)
        let slotDateStr: string;
        if (slot.date instanceof Date) {
          const slotYear = slot.date.getFullYear();
          const slotMonth = String(slot.date.getMonth() + 1).padStart(2, '0');
          const slotDay = String(slot.date.getDate()).padStart(2, '0');
          slotDateStr = `${slotYear}-${slotMonth}-${slotDay}`;
        } else if (typeof slot.date === 'string') {
          // If it's already a YYYY-MM-DD string, use it directly
          slotDateStr = slot.date.substring(0, 10);
        } else {
          const slotDate = new Date(slot.date);
          const slotYear = slotDate.getFullYear();
          const slotMonth = String(slotDate.getMonth() + 1).padStart(2, '0');
          const slotDay = String(slotDate.getDate()).padStart(2, '0');
          slotDateStr = `${slotYear}-${slotMonth}-${slotDay}`;
        }
        
        if (slotDateStr !== dateStr) return false;
        if (!slot.isAvailable) return false;
        // Check if booking time falls within available slot
        return timeStr >= slot.startTime && timeStr <= slot.endTime;
      });

      if (!instructorAvailable) {
        throw new Error(
          `Instructor is not available in their calendar at ${scheduledDate.toISOString()}. ` +
          `Please choose a time when the instructor is available.`
        );
      }

      // CHECK FOR BLOCKED TIME SLOTS (Availability Overrides)
      // Check if student has blocked this time
      // Handles both specific time blocks and whole-day blocks (NULL start/end times)
      const studentOverrides = await client.query(
        `SELECT id, override_date, start_time, end_time, is_blocked, reason
         FROM availability_overrides
         WHERE user_id = $1 
           AND override_date = $2
           AND is_blocked = true
           AND (
             (start_time IS NULL AND end_time IS NULL) OR  -- Whole day blocked
             (start_time IS NULL AND end_time >= $3) OR    -- Blocked until end_time
             (end_time IS NULL AND start_time <= $3) OR    -- Blocked from start_time
             (start_time <= $3 AND end_time >= $3)         -- Blocked for specific time range
           )`,
        [data.studentId, dateStr, timeStr]
      );

      if (studentOverrides.rows.length > 0) {
        const blockedOverride = studentOverrides.rows[0];
        throw new Error(
          `Student has blocked this time slot. ` +
          (blockedOverride.reason ? `Reason: ${blockedOverride.reason}. ` : '') +
          `Please choose a different time.`
        );
      }

      // Check if instructor has blocked this time
      // Handles both specific time blocks and whole-day blocks (NULL start/end times)
      const instructorOverrides = await client.query(
        `SELECT id, override_date, start_time, end_time, is_blocked, reason
         FROM availability_overrides
         WHERE user_id = $1 
           AND override_date = $2
           AND is_blocked = true
           AND (
             (start_time IS NULL AND end_time IS NULL) OR  -- Whole day blocked
             (start_time IS NULL AND end_time >= $3) OR    -- Blocked until end_time
             (end_time IS NULL AND start_time <= $3) OR    -- Blocked from start_time
             (start_time <= $3 AND end_time >= $3)         -- Blocked for specific time range
           )`,
        [data.instructorId, dateStr, timeStr]
      );

      if (instructorOverrides.rows.length > 0) {
        const blockedOverride = instructorOverrides.rows[0];
        throw new Error(
          `Instructor has blocked this time slot. ` +
          (blockedOverride.reason ? `Reason: ${blockedOverride.reason}. ` : '') +
          `Please choose a different time.`
        );
      }

      // Perform initial weather validation
      const path = calculateFlightPath(
        {
          latitude: data.departureLatitude,
          longitude: data.departureLongitude,
        },
        {
          latitude: data.arrivalLatitude,
          longitude: data.arrivalLongitude,
        }
      );

      let initialStatus = BookingStatus.CONFIRMED;
      
      // Try weather check, but don't fail if it errors
      try {
        const weatherCheck = await WeatherService.checkWeatherForFlight(
          path,
          data.trainingLevel
        );

        // If weather is invalid, set status to AT_RISK
        initialStatus = weatherCheck.validation.isValid
          ? BookingStatus.CONFIRMED
          : BookingStatus.AT_RISK;

        if (!weatherCheck.validation.isValid) {
          logger.warn('Booking created with weather violations', {
            bookingId: 'pending',
            violations: weatherCheck.validation.violations.length,
          });
        }
      } catch (weatherError: any) {
        // Weather check failed - log but continue with booking creation
        logger.warn('Weather check failed, proceeding with booking creation', {
          error: weatherError.message,
          code: weatherError.code,
        });
        // Default to CONFIRMED if weather check fails
        initialStatus = BookingStatus.CONFIRMED;
      }

        // Insert booking
        const result = await client.query(
          `INSERT INTO bookings (
            student_id, instructor_id, aircraft_id,
            departure_airport, arrival_airport,
            departure_latitude, departure_longitude,
            arrival_latitude, arrival_longitude,
            scheduled_datetime, status, training_level, duration_minutes,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
          RETURNING *`,
          [
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
          ]
        );

        await client.query('COMMIT');

        return this.mapRowToBooking(result.rows[0]);
    } catch (error) {
      // Rollback transaction on any error
      await client.query('ROLLBACK');
      logger.error('Failed to create booking', {
        error: error instanceof Error ? error.message : 'Unknown',
        data,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<Booking | null> {
    const result = await query<Booking>(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    );

    if (result.length === 0) {
      return null;
    }

    return this.mapRowToBooking(result[0] as any);
  }

  /**
   * Get booking with user details
   */
  async getBookingWithUsers(id: string): Promise<BookingWithUsers | null> {
    const result = await query<any>(
      `SELECT 
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
      WHERE b.id = $1`,
      [id]
    );

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

  /**
   * List bookings with filters
   */
  async listBookings(filters: BookingListFilters = {}): Promise<Booking[]> {
    let queryText = 'SELECT * FROM bookings WHERE 1=1';
    const params: any[] = [];
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

    try {
      const result = await query<any>(queryText, params);
      return result.map((row) => this.mapRowToBooking(row));
    } catch (error: any) {
      // If table doesn't exist or database error, return empty array
      // This allows the app to work even if database isn't fully set up
      logger.warn('Failed to query bookings, returning empty array', {
        error: error.message,
        code: error.code,
      });
      return [];
    }
  }

  /**
   * Update booking
   */
  async updateBooking(
    id: string,
    data: UpdateBookingRequest
  ): Promise<Booking> {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if booking exists
      const existing = await client.query(
        'SELECT * FROM bookings WHERE id = $1',
        [id]
      );

      if (existing.rows.length === 0) {
        throw new Error('Booking not found');
      }

      // Build update query dynamically
      const updates: string[] = [];
      const params: any[] = [];
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
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to update booking', {
        id,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete booking
   */
  async deleteBooking(id: string): Promise<void> {
    const result = await query('DELETE FROM bookings WHERE id = $1', [id]);

    if (result.length === 0) {
      throw new Error('Booking not found');
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string): Promise<Booking> {
    return this.updateBooking(id, { status: BookingStatus.CANCELLED });
  }

  /**
   * Map database row to Booking object
   */
  private mapRowToBooking(row: any): Booking {
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
      status: row.status as BookingStatus,
      trainingLevel: row.training_level as TrainingLevel,
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

export default new BookingService();

