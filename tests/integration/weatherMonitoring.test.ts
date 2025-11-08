/**
 * Weather Monitoring Integration Tests
 * Tests the complete weather monitoring cycle
 */

import { Pool } from 'pg';
import { WeatherService } from '../../backend/src/services/weatherService';
import { WeatherValidator } from '../../backend/src/functions/ai/weatherValidator';
import { ConflictDetector } from '../../backend/src/functions/ai/conflictDetector';
import { handler as weatherMonitorHandler } from '../../backend/src/functions/scheduler/weatherMonitor';
import { TrainingLevel } from '../../backend/src/types/booking';

// Mock dependencies
jest.mock('../../backend/src/services/weatherService');
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Weather Monitoring Integration', () => {
  let mockPool: jest.Mocked<Pool>;
  let mockWeatherService: jest.Mocked<WeatherService>;

  beforeEach(() => {
    mockPool = new Pool() as jest.Mocked<Pool>;
    mockWeatherService = new WeatherService() as jest.Mocked<WeatherService>;
    jest.clearAllMocks();
  });

  describe('ConflictDetector', () => {
    it('should detect weather conflicts for upcoming bookings', async () => {
      // Mock upcoming bookings
      const mockBookings = [
        {
          id: 'booking-1',
          student_id: 'student-1',
          instructor_id: 'instructor-1',
          scheduled_time: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
          departure_airport: 'KSFO',
          arrival_airport: 'KLAX',
          student_training_level: TrainingLevel.STUDENT_PILOT,
          student_email: 'student@test.com',
          student_first_name: 'John',
          instructor_email: 'instructor@test.com',
          instructor_first_name: 'Jane',
          status: 'CONFIRMED',
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockBookings } as any);

      // Mock weather check - invalid conditions
      mockWeatherService.checkFlightWeather = jest.fn().mockResolvedValue({
        isValid: false,
        locations: [
          {
            location: 'KSFO',
            latitude: 37.6213,
            longitude: -122.3790,
            temperature: 15,
            conditions: 'Thunderstorm',
            windSpeed: 25,
            windDirection: 270,
            visibility: 2,
            cloudCeiling: 500,
            timestamp: new Date(),
          },
        ],
        confidence: 0.9,
      });

      const weatherValidator = new WeatherValidator(mockWeatherService);
      const conflictDetector = new ConflictDetector(mockPool, weatherValidator);

      const conflicts = await conflictDetector.checkUpcomingBookings(48);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].hasConflict).toBe(true);
      expect(conflicts[0].conflictType).toBe('weather');
      expect(conflicts[0].severity).toBe('warning');
    });

    it('should handle multiple bookings efficiently', async () => {
      const mockBookings = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `booking-${i}`,
          student_id: `student-${i}`,
          instructor_id: `instructor-${i}`,
          scheduled_time: new Date(Date.now() + (i + 1) * 60 * 60 * 1000),
          departure_airport: 'KSFO',
          arrival_airport: 'KLAX',
          student_training_level: TrainingLevel.STUDENT_PILOT,
          student_email: `student${i}@test.com`,
          student_first_name: `Student${i}`,
          instructor_email: `instructor${i}@test.com`,
          instructor_first_name: `Instructor${i}`,
          status: 'CONFIRMED',
        }));

      mockPool.query.mockResolvedValueOnce({ rows: mockBookings } as any);

      // Mock weather check - all valid
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

      const weatherValidator = new WeatherValidator(mockWeatherService);
      const conflictDetector = new ConflictDetector(mockPool, weatherValidator);

      const startTime = Date.now();
      const conflicts = await conflictDetector.checkUpcomingBookings(48);
      const duration = Date.now() - startTime;

      expect(conflicts).toHaveLength(10);
      expect(conflicts.every((c) => !c.hasConflict)).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
    });
  });

  describe('WeatherValidator', () => {
    it('should validate weather against training level minimums', async () => {
      // Mock good weather
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

      const weatherValidator = new WeatherValidator(mockWeatherService);
      const result = await weatherValidator.validateFlightWeather(
        'KSFO',
        'KLAX',
        new Date(),
        TrainingLevel.STUDENT_PILOT
      );

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect violations for student pilots in bad weather', async () => {
      // Mock bad weather
      mockWeatherService.checkFlightWeather = jest.fn().mockResolvedValue({
        isValid: false,
        locations: [
          {
            location: 'KSFO',
            latitude: 37.6213,
            longitude: -122.3790,
            temperature: 15,
            conditions: 'Heavy Rain',
            windSpeed: 20, // Exceeds 15 kt limit
            windDirection: 270,
            visibility: 3, // Below 5 mi minimum
            cloudCeiling: 2000, // Below 3000 ft minimum
            timestamp: new Date(),
          },
        ],
        confidence: 0.85,
      });

      const weatherValidator = new WeatherValidator(mockWeatherService);
      const result = await weatherValidator.validateFlightWeather(
        'KSFO',
        'KLAX',
        new Date(),
        TrainingLevel.STUDENT_PILOT
      );

      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some((v) => v.includes('Wind speed'))).toBe(true);
      expect(result.violations.some((v) => v.includes('Visibility'))).toBe(true);
      expect(result.violations.some((v) => v.includes('ceiling'))).toBe(true);
      expect(result.violations.some((v) => v.includes('rain'))).toBe(true);
    });

    it('should allow instrument-rated pilots in more challenging weather', async () => {
      // Mock marginal weather (OK for instrument-rated, not for student)
      mockWeatherService.checkFlightWeather = jest.fn().mockResolvedValue({
        isValid: true,
        locations: [
          {
            location: 'KSFO',
            latitude: 37.6213,
            longitude: -122.3790,
            temperature: 12,
            conditions: 'Overcast',
            windSpeed: 25, // OK for instrument (< 30)
            windDirection: 270,
            visibility: 2, // OK for instrument (> 0.5)
            cloudCeiling: 800, // OK for instrument (> 200)
            timestamp: new Date(),
          },
        ],
        confidence: 0.9,
      });

      const weatherValidator = new WeatherValidator(mockWeatherService);
      const result = await weatherValidator.validateFlightWeather(
        'KSFO',
        'KLAX',
        new Date(),
        TrainingLevel.INSTRUMENT_RATED
      );

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Weather Monitor Handler', () => {
    it('should process weather monitoring cycle', async () => {
      // This is a high-level test that would require more setup
      // In a real environment, this would be an E2E test
      const mockEvent = {
        version: '0',
        id: 'test-event',
        'detail-type': 'Scheduled Event',
        source: 'aws.events',
        account: '123456789',
        time: new Date().toISOString(),
        region: 'us-east-1',
        resources: [],
        detail: {},
      };

      // Mock database queries
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any); // No bookings

      const result = await weatherMonitorHandler(mockEvent as any);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.processedCount).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    it('should complete 10-minute cycle for 100 bookings within time limit', async () => {
      const bookingCount = 100;
      const maxDuration = 60000; // 60 seconds (well under 10 minutes)

      const mockBookings = Array(bookingCount)
        .fill(null)
        .map((_, i) => ({
          id: `booking-${i}`,
          student_id: `student-${i}`,
          instructor_id: `instructor-${i}`,
          scheduled_time: new Date(Date.now() + (i + 1) * 60 * 60 * 1000),
          departure_airport: 'KSFO',
          arrival_airport: 'KLAX',
          student_training_level: TrainingLevel.PRIVATE_PILOT,
          student_email: `student${i}@test.com`,
          student_first_name: `Student${i}`,
          instructor_email: `instructor${i}@test.com`,
          instructor_first_name: `Instructor${i}`,
          status: 'CONFIRMED',
        }));

      mockPool.query.mockResolvedValue({ rows: mockBookings } as any);

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

      const weatherValidator = new WeatherValidator(mockWeatherService);
      const conflictDetector = new ConflictDetector(mockPool, weatherValidator);

      const startTime = Date.now();
      await conflictDetector.checkUpcomingBookings(48);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(maxDuration);
    });
  });

  describe('Simultaneous Conflicts', () => {
    it('should detect multiple bookings with conflicts at the same time', async () => {
      const conflictTime = new Date(Date.now() + 6 * 60 * 60 * 1000);

      const mockBookings = [
        {
          id: 'booking-1',
          student_id: 'student-1',
          instructor_id: 'instructor-1',
          scheduled_time: conflictTime,
          departure_airport: 'KSFO',
          arrival_airport: 'KLAX',
          student_training_level: TrainingLevel.STUDENT_PILOT,
          student_email: 'student1@test.com',
          student_first_name: 'John',
          instructor_email: 'instructor1@test.com',
          instructor_first_name: 'Jane',
          status: 'CONFIRMED',
        },
        {
          id: 'booking-2',
          student_id: 'student-2',
          instructor_id: 'instructor-2',
          scheduled_time: conflictTime,
          departure_airport: 'KJFK',
          arrival_airport: 'KBOS',
          student_training_level: TrainingLevel.PRIVATE_PILOT,
          student_email: 'student2@test.com',
          student_first_name: 'Mike',
          instructor_email: 'instructor2@test.com',
          instructor_first_name: 'Sarah',
          status: 'CONFIRMED',
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockBookings } as any);

      // Both have bad weather
      mockWeatherService.checkFlightWeather = jest.fn().mockResolvedValue({
        isValid: false,
        locations: [
          {
            location: 'KSFO',
            latitude: 37.6213,
            longitude: -122.3790,
            temperature: 15,
            conditions: 'Thunderstorm',
            windSpeed: 25,
            windDirection: 270,
            visibility: 2,
            cloudCeiling: 500,
            timestamp: new Date(),
          },
        ],
        confidence: 0.9,
      });

      const weatherValidator = new WeatherValidator(mockWeatherService);
      const conflictDetector = new ConflictDetector(mockPool, weatherValidator);

      const conflicts = await conflictDetector.checkUpcomingBookings(48);

      expect(conflicts).toHaveLength(2);
      expect(conflicts.every((c) => c.hasConflict)).toBe(true);
      expect(conflicts[0].booking.scheduled_time).toEqual(conflicts[1].booking.scheduled_time);
    });
  });

  describe('Corridor Weather Deterioration', () => {
    it('should detect weather deteriorating along flight corridor', async () => {
      const mockBooking = {
        id: 'booking-1',
        student_id: 'student-1',
        instructor_id: 'instructor-1',
        scheduled_time: new Date(Date.now() + 4 * 60 * 60 * 1000),
        departure_airport: 'KJFK',
        arrival_airport: 'KLAX',
        student_training_level: TrainingLevel.PRIVATE_PILOT,
        student_email: 'student@test.com',
        student_first_name: 'John',
        instructor_email: 'instructor@test.com',
        instructor_first_name: 'Jane',
        status: 'CONFIRMED',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockBooking] } as any);

      // Weather starts good but deteriorates along route
      mockWeatherService.checkFlightWeather = jest.fn().mockResolvedValue({
        isValid: false,
        locations: [
          {
            location: 'KJFK - Departure',
            latitude: 40.6413,
            longitude: -73.7781,
            temperature: 20,
            conditions: 'Clear',
            windSpeed: 10,
            windDirection: 270,
            visibility: 10,
            cloudCeiling: 5000,
            timestamp: new Date(),
          },
          {
            location: 'Midpoint',
            latitude: 39.0,
            longitude: -95.0,
            temperature: 18,
            conditions: 'Overcast',
            windSpeed: 15,
            windDirection: 270,
            visibility: 6,
            cloudCeiling: 2500,
            timestamp: new Date(),
          },
          {
            location: 'KLAX - Arrival',
            latitude: 33.9425,
            longitude: -118.4081,
            temperature: 15,
            conditions: 'Rain',
            windSpeed: 22,
            windDirection: 270,
            visibility: 2, // Below minimum
            cloudCeiling: 1000, // Below minimum
            timestamp: new Date(),
          },
        ],
        confidence: 0.85,
      });

      const weatherValidator = new WeatherValidator(mockWeatherService);
      const conflictDetector = new ConflictDetector(mockPool, weatherValidator);

      const conflicts = await conflictDetector.checkUpcomingBookings(48);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].hasConflict).toBe(true);
      expect(conflicts[0].details).toContain('corridor');
    });
  });

  describe('Dual Weather API Failover', () => {
    it('should failover to secondary API if primary fails', async () => {
      const mockBooking = {
        id: 'booking-1',
        student_id: 'student-1',
        instructor_id: 'instructor-1',
        scheduled_time: new Date(Date.now() + 6 * 60 * 60 * 1000),
        departure_airport: 'KSFO',
        arrival_airport: 'KLAX',
        student_training_level: TrainingLevel.PRIVATE_PILOT,
        student_email: 'student@test.com',
        student_first_name: 'John',
        instructor_email: 'instructor@test.com',
        instructor_first_name: 'Jane',
        status: 'CONFIRMED',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockBooking] } as any);

      // Simulate primary API failure, then success from secondary
      let callCount = 0;
      mockWeatherService.checkFlightWeather = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('OpenWeatherMap API timeout');
        }
        // Secondary API succeeds
        return Promise.resolve({
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
          confidence: 0.9,
        });
      });

      const weatherValidator = new WeatherValidator(mockWeatherService);
      const conflictDetector = new ConflictDetector(mockPool, weatherValidator);

      const conflicts = await conflictDetector.checkUpcomingBookings(48);

      expect(mockWeatherService.checkFlightWeather).toHaveBeenCalledTimes(2);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].hasConflict).toBe(false);
    });

    it('should handle both APIs failing', async () => {
      const mockBooking = {
        id: 'booking-1',
        student_id: 'student-1',
        instructor_id: 'instructor-1',
        scheduled_time: new Date(Date.now() + 6 * 60 * 60 * 1000),
        departure_airport: 'KSFO',
        arrival_airport: 'KLAX',
        student_training_level: TrainingLevel.PRIVATE_PILOT,
        student_email: 'student@test.com',
        student_first_name: 'John',
        instructor_email: 'instructor@test.com',
        instructor_first_name: 'Jane',
        status: 'CONFIRMED',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockBooking] } as any);

      // Both APIs fail
      mockWeatherService.checkFlightWeather = jest
        .fn()
        .mockRejectedValue(new Error('All weather services unavailable'));

      const weatherValidator = new WeatherValidator(mockWeatherService);
      const conflictDetector = new ConflictDetector(mockPool, weatherValidator);

      const conflicts = await conflictDetector.checkUpcomingBookings(48);

      // Should gracefully handle and log error, not crash
      expect(conflicts).toBeDefined();
      expect(conflicts.length).toBeGreaterThanOrEqual(0);
    });
  });
});

