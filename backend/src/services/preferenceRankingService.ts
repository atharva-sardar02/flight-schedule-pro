/**
 * Preference Ranking Service
 * Manages student and instructor preference rankings
 */

import { Pool } from 'pg';
import { logInfo, logError } from '../utils/logger';
import { calculateDeadline, isDeadlinePassed } from '../utils/deadlineCalculator';

export interface PreferenceRanking {
  id: string;
  bookingId: string;
  userId: string;
  option1Id?: string;
  option2Id?: string;
  option3Id?: string;
  unavailableOptionIds: string[];
  deadline: Date;
  submittedAt?: Date;
  createdAt: Date;
}

export interface SubmitPreferenceRequest {
  bookingId: string;
  userId: string;
  option1Id?: string;
  option2Id?: string;
  option3Id?: string;
  unavailableOptionIds?: string[];
}

export class PreferenceRankingService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create preference ranking records for student and instructor
   */
  async createPreferenceRankings(
    bookingId: string,
    studentId: string,
    instructorId: string,
    scheduledTime: Date
  ): Promise<void> {
    try {
      const deadline = calculateDeadline(scheduledTime, new Date());

      // Create for student
      await this.pool.query(
        `INSERT INTO preference_rankings (booking_id, user_id, deadline, unavailable_option_ids)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (booking_id, user_id) DO NOTHING`,
        [bookingId, studentId, deadline, []]
      );

      // Create for instructor
      await this.pool.query(
        `INSERT INTO preference_rankings (booking_id, user_id, deadline, unavailable_option_ids)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (booking_id, user_id) DO NOTHING`,
        [bookingId, instructorId, deadline, []]
      );

      logInfo('Preference rankings created', {
        bookingId,
        studentId,
        instructorId,
        deadline: deadline.toISOString(),
      });
    } catch (error: any) {
      logError('Failed to create preference rankings', error, {
        bookingId,
        studentId,
        instructorId,
      });
      throw error;
    }
  }

  /**
   * Submit preference ranking
   */
  async submitPreference(request: SubmitPreferenceRequest): Promise<PreferenceRanking> {
    try {
      // Check if deadline has passed
      const existing = await this.pool.query(
        `SELECT deadline FROM preference_rankings WHERE booking_id = $1 AND user_id = $2`,
        [request.bookingId, request.userId]
      );

      if (existing.rows.length > 0) {
        const deadline = new Date(existing.rows[0].deadline);
        if (isDeadlinePassed(deadline)) {
          throw new Error('Preference submission deadline has passed');
        }
      }

      // Update preference ranking
      const result = await this.pool.query(
        `UPDATE preference_rankings
         SET option_1_id = $3,
             option_2_id = $4,
             option_3_id = $5,
             unavailable_option_ids = $6,
             submitted_at = NOW()
         WHERE booking_id = $1 AND user_id = $2
         RETURNING *`,
        [
          request.bookingId,
          request.userId,
          request.option1Id || null,
          request.option2Id || null,
          request.option3Id || null,
          request.unavailableOptionIds || [],
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Preference ranking not found');
      }

      logInfo('Preference submitted', {
        bookingId: request.bookingId,
        userId: request.userId,
      });

      return this.mapPreferenceRanking(result.rows[0]);
    } catch (error: any) {
      logError('Failed to submit preference', error, request);
      throw error;
    }
  }

  /**
   * Get preferences for a booking
   */
  async getPreferencesByBooking(bookingId: string): Promise<PreferenceRanking[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM preference_rankings WHERE booking_id = $1`,
        [bookingId]
      );

      return result.rows.map(this.mapPreferenceRanking);
    } catch (error: any) {
      logError('Failed to get preferences', error, { bookingId });
      return [];
    }
  }

  /**
   * Get preference for a specific user
   */
  async getPreference(bookingId: string, userId: string): Promise<PreferenceRanking | null> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM preference_rankings WHERE booking_id = $1 AND user_id = $2`,
        [bookingId, userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapPreferenceRanking(result.rows[0]);
    } catch (error: any) {
      logError('Failed to get preference', error, { bookingId, userId });
      return null;
    }
  }

  /**
   * Check if both preferences submitted
   */
  async areBothPreferencesSubmitted(bookingId: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT COUNT(*) as submitted_count
         FROM preference_rankings
         WHERE booking_id = $1 AND submitted_at IS NOT NULL`,
        [bookingId]
      );

      return parseInt(result.rows[0].submitted_count) === 2;
    } catch (error: any) {
      logError('Failed to check preference submission status', error, { bookingId });
      return false;
    }
  }

  /**
   * Resolve final selection using instructor priority
   * Returns the option ID to use for rescheduling
   */
  async resolveFinalSelection(bookingId: string): Promise<string | null> {
    try {
      const preferences = await this.getPreferencesByBooking(bookingId);

      if (preferences.length !== 2) {
        return null;
      }

      // Find instructor's preferences
      const instructorPref = await this.getInstructorPreference(bookingId);
      if (!instructorPref) {
        return null;
      }

      // Instructor priority: use their #1 choice
      if (instructorPref.option1Id) {
        logInfo('Resolved to instructor #1 choice', {
          bookingId,
          optionId: instructorPref.option1Id,
        });
        return instructorPref.option1Id;
      }

      // Fallback to #2 or #3
      if (instructorPref.option2Id) {
        return instructorPref.option2Id;
      }

      if (instructorPref.option3Id) {
        return instructorPref.option3Id;
      }

      return null;
    } catch (error: any) {
      logError('Failed to resolve final selection', error, { bookingId });
      return null;
    }
  }

  /**
   * Get instructor's preference for a booking
   */
  async getInstructorPreference(bookingId: string): Promise<PreferenceRanking | null> {
    try {
      const result = await this.pool.query(
        `SELECT pr.*
         FROM preference_rankings pr
         JOIN bookings b ON pr.booking_id = b.id
         WHERE pr.booking_id = $1 AND pr.user_id = b.instructor_id`,
        [bookingId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapPreferenceRanking(result.rows[0]);
    } catch (error: any) {
      logError('Failed to get instructor preference', error, { bookingId });
      return null;
    }
  }

  /**
   * Map database row to PreferenceRanking
   */
  private mapPreferenceRanking(row: any): PreferenceRanking {
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

