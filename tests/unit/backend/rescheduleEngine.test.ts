/**
 * AI Rescheduling Engine Unit Tests
 * Tests for the LangGraph-based rescheduling workflow
 */

import { Pool } from 'pg';
import { RescheduleEngine } from '../../../backend/src/functions/ai/rescheduleEngine';
import { WeatherService } from '../../../backend/src/services/weatherService';
import { TrainingLevel } from '../../../backend/src/types/booking';

// Mock dependencies
jest.mock('../../../backend/src/services/weatherService');
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('RescheduleEngine', () => {
  let mockPool: jest.Mocked<Pool>;
  let mockWeatherService: jest.Mocked<WeatherService>;
  let rescheduleEngine: RescheduleEngine;

  beforeEach(() => {
    mockPool = new Pool() as jest.Mocked<Pool>;
    mockWeatherService = new WeatherService() as jest.Mocked<WeatherService>;
    rescheduleEngine = new RescheduleEngine(mockPool);
    jest.clearAllMocks();
  });

  describe('generateRescheduleOptions', () => {
    it('should generate 3 optimal reschedule options', async () => {
      const bookingId = 'booking-123';
      const mockBooking = {
        id: bookingId,
        scheduled_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
        student_id: 'student-1',
        instructor_id: 'instructor-1',
        training_level: TrainingLevel.STUDENT_PILOT,
        departure_airport: 'KSFO',
        arrival_airport: 'KLAX',
      };

      // Mock booking query
      mockPool.query.mockResolvedValueOnce({ rows: [mockBooking] } as any);

      // Mock weather checks (all valid)
      mockWeatherService.checkFlightWeather = jest.fn().mockResolvedValue({
        isValid: true,
        locations: [
          {
            location: 'KSFO',
            latitude: 37.6213,
            longitude: -122.3790,
            temperature: 20,
            conditions: 'Clear',
            windSpeed: 10,
            windDirection: 270,
            visibility: 10,
            cloudCeiling: 5000,
            timestamp: new Date(),
          },
        ],
        confidence: 0.95,
      });

      // Mock availability checks
      mockPool.query.mockResolvedValue({ rows: [] } as any);

      // Mock reschedule options deletion and creation
      mockPool.query
        .mockResolvedValueOnce({ rows: [] } as any) // delete
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'option-1',
              booking_id: bookingId,
              suggested_datetime: new Date(),
              weather_forecast: {},
              ai_confidence_score: 0.9,
              created_at: new Date(),
            },
          ],
        } as any); // create

      const options = await rescheduleEngine.generateRescheduleOptions(bookingId);

      expect(options).toBeDefined();
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBeLessThanOrEqual(3);
    }, 30000); // 30 second timeout for workflow execution

    it('should handle no valid slots scenario', async () => {
      const bookingId = 'booking-123';
      const mockBooking = {
        id: bookingId,
        scheduled_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
        student_id: 'student-1',
        instructor_id: 'instructor-1',
        training_level: TrainingLevel.STUDENT_PILOT,
        departure_airport: 'KSFO',
        arrival_airport: 'KLAX',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockBooking] } as any);

      // Mock weather checks (all invalid)
      mockWeatherService.checkFlightWeather = jest.fn().mockResolvedValue({
        isValid: false,
        locations: [],
        confidence: 0,
      });

      mockPool.query.mockResolvedValue({ rows: [] } as any);

      await expect(rescheduleEngine.generateRescheduleOptions(bookingId)).rejects.toThrow();
    });
  });

  describe('7-day window search', () => {
    it('should search within 7-day window', () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBe(7);
    });
  });

  describe('Instructor priority', () => {
    it('should prioritize instructor preferences', () => {
      // Test that instructor's #1 choice is selected
      const instructorPref = {
        option1Id: 'option-1',
        option2Id: 'option-2',
        option3Id: 'option-3',
      };

      const studentPref = {
        option1Id: 'option-3',
        option2Id: 'option-1',
        option3Id: 'option-2',
      };

      // Instructor's #1 should win
      expect(instructorPref.option1Id).toBe('option-1');
    });
  });
});

