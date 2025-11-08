/**
 * Reschedule Options Service
 * Manages AI-generated rescheduling options
 */

import { Pool } from 'pg';
import { logInfo, logError } from '../utils/logger';

export interface RescheduleOption {
  id: string;
  bookingId: string;
  suggestedDatetime: Date;
  weatherForecast: any;
  aiConfidenceScore: number;
  createdAt: Date;
}

export interface CreateRescheduleOptionRequest {
  bookingId: string;
  suggestedDatetime: Date;
  weatherForecast: any;
  aiConfidenceScore: number;
}

export class RescheduleOptionsService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create multiple reschedule options for a booking
   */
  async createOptions(
    options: CreateRescheduleOptionRequest[]
  ): Promise<RescheduleOption[]> {
    try {
      const results: RescheduleOption[] = [];

      for (const option of options) {
        const result = await this.pool.query(
          `INSERT INTO reschedule_options (booking_id, suggested_datetime, weather_forecast, ai_confidence_score)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [
            option.bookingId,
            option.suggestedDatetime,
            JSON.stringify(option.weatherForecast),
            option.aiConfidenceScore,
          ]
        );

        results.push(this.mapRescheduleOption(result.rows[0]));
      }

      logInfo('Reschedule options created', {
        bookingId: options[0]?.bookingId,
        count: results.length,
      });

      return results;
    } catch (error: any) {
      logError('Failed to create reschedule options', error, { options });
      throw error;
    }
  }

  /**
   * Get all options for a booking
   */
  async getOptionsByBooking(bookingId: string): Promise<RescheduleOption[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM reschedule_options
         WHERE booking_id = $1
         ORDER BY ai_confidence_score DESC, suggested_datetime ASC`,
        [bookingId]
      );

      return result.rows.map(this.mapRescheduleOption);
    } catch (error: any) {
      logError('Failed to get reschedule options', error, { bookingId });
      return [];
    }
  }

  /**
   * Get a specific option
   */
  async getOption(optionId: string): Promise<RescheduleOption | null> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM reschedule_options WHERE id = $1`,
        [optionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRescheduleOption(result.rows[0]);
    } catch (error: any) {
      logError('Failed to get reschedule option', error, { optionId });
      return null;
    }
  }

  /**
   * Delete options for a booking (when regenerating)
   */
  async deleteOptionsByBooking(bookingId: string): Promise<void> {
    try {
      await this.pool.query(
        `DELETE FROM reschedule_options WHERE booking_id = $1`,
        [bookingId]
      );

      logInfo('Reschedule options deleted', { bookingId });
    } catch (error: any) {
      logError('Failed to delete reschedule options', error, { bookingId });
    }
  }

  /**
   * Map database row to RescheduleOption
   */
  private mapRescheduleOption(row: any): RescheduleOption {
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

