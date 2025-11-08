/**
 * Unit tests for booking service
 */

import BookingService from '../../../../backend/src/services/bookingService';
import {
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingStatus,
} from '../../../../backend/src/types/booking';
import { TrainingLevel } from '../../../../backend/src/types/weather';
import { getDbPool } from '../../../../backend/src/utils/db';

// Mock dependencies
jest.mock('../../../../backend/src/utils/db');
jest.mock('../../../../backend/src/services/weatherService');
jest.mock('../../../../backend/src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  connect: jest.fn().mockResolvedValue(mockClient),
};

(getDbPool as jest.Mock).mockReturnValue(mockPool);

// Import after mocks
import WeatherService from '../../../../backend/src/services/weatherService';

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    const validRequest: CreateBookingRequest = {
      studentId: '550e8400-e29b-41d4-a716-446655440001',
      instructorId: '550e8400-e29b-41d4-a716-446655440002',
      aircraftId: 'N12345',
      departureAirport: 'KJFK',
      arrivalAirport: 'KLAX',
      departureLatitude: 40.6413,
      departureLongitude: -73.7781,
      arrivalLatitude: 33.9416,
      arrivalLongitude: -118.4085,
      scheduledDatetime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      trainingLevel: TrainingLevel.PRIVATE_PILOT,
      durationMinutes: 120,
    };

    it('should create a booking successfully', async () => {
      // Mock student check
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: validRequest.studentId, role: 'STUDENT' }],
      });

      // Mock instructor check
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: validRequest.instructorId, role: 'INSTRUCTOR' }],
      });

      // Mock weather check
      (WeatherService.checkWeatherForFlight as jest.Mock).mockResolvedValueOnce({
        validation: { isValid: true, violations: [], confidence: 95 },
      });

      // Mock booking insert
      const mockBooking = {
        id: '660e8400-e29b-41d4-a716-446655440003',
        student_id: validRequest.studentId,
        instructor_id: validRequest.instructorId,
        aircraft_id: validRequest.aircraftId,
        departure_airport: validRequest.departureAirport,
        arrival_airport: validRequest.arrivalAirport,
        departure_latitude: validRequest.departureLatitude,
        departure_longitude: validRequest.departureLongitude,
        arrival_latitude: validRequest.arrivalLatitude,
        arrival_longitude: validRequest.arrivalLongitude,
        scheduled_datetime: validRequest.scheduledDatetime,
        status: BookingStatus.CONFIRMED,
        training_level: validRequest.trainingLevel,
        duration_minutes: validRequest.durationMinutes,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockBooking] });

      const result = await BookingService.createBooking(validRequest);

      expect(result.id).toBe(mockBooking.id);
      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should set status to AT_RISK if weather is invalid', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: validRequest.studentId, role: 'STUDENT' }],
      });

      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: validRequest.instructorId, role: 'INSTRUCTOR' }],
      });

      // Mock weather check with violations
      (WeatherService.checkWeatherForFlight as jest.Mock).mockResolvedValueOnce({
        validation: {
          isValid: false,
          violations: [{ type: 'visibility', location: {}, actual: 2, required: 3 }],
          confidence: 95,
        },
      });

      const mockBooking = {
        id: '660e8400-e29b-41d4-a716-446655440003',
        student_id: validRequest.studentId,
        instructor_id: validRequest.instructorId,
        aircraft_id: validRequest.aircraftId,
        departure_airport: validRequest.departureAirport,
        arrival_airport: validRequest.arrivalAirport,
        departure_latitude: validRequest.departureLatitude,
        departure_longitude: validRequest.departureLongitude,
        arrival_latitude: validRequest.arrivalLatitude,
        arrival_longitude: validRequest.arrivalLongitude,
        scheduled_datetime: validRequest.scheduledDatetime,
        status: BookingStatus.AT_RISK,
        training_level: validRequest.trainingLevel,
        duration_minutes: validRequest.durationMinutes,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockBooking] });

      const result = await BookingService.createBooking(validRequest);

      expect(result.status).toBe(BookingStatus.AT_RISK);
    });

    it('should reject booking with past datetime', async () => {
      const pastRequest = {
        ...validRequest,
        scheduledDatetime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      };

      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: validRequest.studentId, role: 'STUDENT' }],
      });

      await expect(BookingService.createBooking(pastRequest)).rejects.toThrow(
        'Scheduled datetime must be in the future'
      );

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should reject if student not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(BookingService.createBooking(validRequest)).rejects.toThrow(
        'Student not found'
      );

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should reject if user is not a student', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: validRequest.studentId, role: 'INSTRUCTOR' }],
      });

      await expect(BookingService.createBooking(validRequest)).rejects.toThrow(
        'User is not a student'
      );

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should reject if instructor not found', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: validRequest.studentId, role: 'STUDENT' }],
      });

      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(BookingService.createBooking(validRequest)).rejects.toThrow(
        'Instructor not found'
      );

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('updateBooking', () => {
    const bookingId = '660e8400-e29b-41d4-a716-446655440003';

    it('should update booking successfully', async () => {
      const updateData: UpdateBookingRequest = {
        status: BookingStatus.COMPLETED,
        durationMinutes: 150,
      };

      // Mock existing booking check
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: bookingId, status: BookingStatus.CONFIRMED }],
      });

      // Mock update
      const mockUpdatedBooking = {
        id: bookingId,
        status: BookingStatus.COMPLETED,
        duration_minutes: 150,
        student_id: '550e8400-e29b-41d4-a716-446655440001',
        instructor_id: '550e8400-e29b-41d4-a716-446655440002',
        departure_airport: 'KJFK',
        arrival_airport: 'KLAX',
        departure_latitude: 40.6413,
        departure_longitude: -73.7781,
        arrival_latitude: 33.9416,
        arrival_longitude: -118.4085,
        scheduled_datetime: new Date(),
        training_level: TrainingLevel.PRIVATE_PILOT,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockUpdatedBooking] });

      const result = await BookingService.updateBooking(bookingId, updateData);

      expect(result.status).toBe(BookingStatus.COMPLETED);
      expect(result.durationMinutes).toBe(150);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should reject update if booking not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        BookingService.updateBooking(bookingId, { status: BookingStatus.COMPLETED })
      ).rejects.toThrow('Booking not found');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should reject update with no fields', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: bookingId }],
      });

      await expect(BookingService.updateBooking(bookingId, {})).rejects.toThrow(
        'No fields to update'
      );

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking by updating status', async () => {
      const bookingId = '660e8400-e29b-41d4-a716-446655440003';

      // Mock existing booking check
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: bookingId, status: BookingStatus.CONFIRMED }],
      });

      // Mock update
      const mockCancelledBooking = {
        id: bookingId,
        status: BookingStatus.CANCELLED,
        student_id: '550e8400-e29b-41d4-a716-446655440001',
        instructor_id: '550e8400-e29b-41d4-a716-446655440002',
        departure_airport: 'KJFK',
        arrival_airport: 'KLAX',
        departure_latitude: 40.6413,
        departure_longitude: -73.7781,
        arrival_latitude: 33.9416,
        arrival_longitude: -118.4085,
        scheduled_datetime: new Date(),
        training_level: TrainingLevel.PRIVATE_PILOT,
        duration_minutes: 120,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockCancelledBooking] });

      const result = await BookingService.cancelBooking(bookingId);

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });
});

