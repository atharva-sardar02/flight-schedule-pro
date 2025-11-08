/**
 * Availability Service Unit Tests
 * Tests for CRUD operations and availability computation
 */

import { Pool } from 'pg';
import { AvailabilityService } from '../../../backend/src/services/availabilityService';
import { DayOfWeek } from '../../../backend/src/types/availability';

// Mock pg Pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    mockPool = new Pool() as jest.Mocked<Pool>;
    service = new AvailabilityService(mockPool);
    jest.clearAllMocks();
  });

  describe('createRecurringAvailability', () => {
    it('should create a new recurring availability pattern', async () => {
      const userId = 'user-123';
      const data = {
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '09:00',
        endTime: '17:00',
      };

      const mockResult = {
        id: 'pattern-123',
        user_id: userId,
        day_of_week: DayOfWeek.MONDAY,
        start_time: '09:00',
        end_time: '17:00',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock conflict check (no conflicts)
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);
      // Mock insert
      mockPool.query.mockResolvedValueOnce({ rows: [mockResult] } as any);

      const result = await service.createRecurringAvailability(userId, data);

      expect(result.id).toBe('pattern-123');
      expect(result.userId).toBe(userId);
      expect(result.dayOfWeek).toBe(DayOfWeek.MONDAY);
      expect(mockPool.query).toHaveBeenCalledTimes(2); // conflict check + insert
    });

    it('should throw error for invalid time format', async () => {
      const userId = 'user-123';
      const data = {
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '25:00', // Invalid
        endTime: '17:00',
      };

      await expect(service.createRecurringAvailability(userId, data)).rejects.toThrow(
        'Invalid time format'
      );
    });

    it('should throw error when there is a time conflict', async () => {
      const userId = 'user-123';
      const data = {
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '09:00',
        endTime: '17:00',
      };

      const mockConflict = {
        id: 'existing-pattern',
        user_id: userId,
        day_of_week: DayOfWeek.MONDAY,
        start_time: '08:00',
        end_time: '12:00',
        is_active: true,
      };

      // Mock conflict check (has conflict)
      mockPool.query.mockResolvedValueOnce({ rows: [mockConflict] } as any);

      await expect(service.createRecurringAvailability(userId, data)).rejects.toThrow(
        'Time conflict'
      );
    });
  });

  describe('getRecurringAvailability', () => {
    it('should retrieve all recurring patterns for a user', async () => {
      const userId = 'user-123';
      const mockPatterns = [
        {
          id: 'pattern-1',
          user_id: userId,
          day_of_week: DayOfWeek.MONDAY,
          start_time: '09:00',
          end_time: '12:00',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'pattern-2',
          user_id: userId,
          day_of_week: DayOfWeek.TUESDAY,
          start_time: '13:00',
          end_time: '17:00',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockPatterns } as any);

      const result = await service.getRecurringAvailability(userId);

      expect(result).toHaveLength(2);
      expect(result[0].dayOfWeek).toBe(DayOfWeek.MONDAY);
      expect(result[1].dayOfWeek).toBe(DayOfWeek.TUESDAY);
    });
  });

  describe('updateRecurringAvailability', () => {
    it('should update a recurring availability pattern', async () => {
      const patternId = 'pattern-123';
      const userId = 'user-123';
      const updateData = {
        startTime: '10:00',
        endTime: '18:00',
      };

      const existingPattern = {
        id: patternId,
        user_id: userId,
        day_of_week: DayOfWeek.MONDAY,
        start_time: '09:00',
        end_time: '17:00',
        is_active: true,
      };

      const updatedPattern = {
        ...existingPattern,
        start_time: '10:00',
        end_time: '18:00',
        updated_at: new Date(),
      };

      // Mock get existing pattern
      mockPool.query.mockResolvedValueOnce({ rows: [existingPattern] } as any);
      // Mock conflict check (no conflicts)
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);
      // Mock update
      mockPool.query.mockResolvedValueOnce({ rows: [updatedPattern] } as any);

      const result = await service.updateRecurringAvailability(patternId, userId, updateData);

      expect(result.startTime).toBe('10:00');
      expect(result.endTime).toBe('18:00');
    });

    it('should throw error when pattern does not exist', async () => {
      const patternId = 'non-existent';
      const userId = 'user-123';

      // Mock get existing pattern (not found)
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      await expect(
        service.updateRecurringAvailability(patternId, userId, { startTime: '10:00' })
      ).rejects.toThrow('Recurring availability not found');
    });
  });

  describe('deleteRecurringAvailability', () => {
    it('should delete a recurring availability pattern', async () => {
      const patternId = 'pattern-123';
      const userId = 'user-123';

      mockPool.query.mockResolvedValueOnce({ rowCount: 1 } as any);

      await service.deleteRecurringAvailability(patternId, userId);

      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM recurring_availability WHERE id = $1 AND user_id = $2',
        [patternId, userId]
      );
    });

    it('should throw error when pattern does not exist', async () => {
      const patternId = 'non-existent';
      const userId = 'user-123';

      mockPool.query.mockResolvedValueOnce({ rowCount: 0 } as any);

      await expect(service.deleteRecurringAvailability(patternId, userId)).rejects.toThrow(
        'Recurring availability not found'
      );
    });
  });

  describe('createAvailabilityOverride', () => {
    it('should create an availability override', async () => {
      const userId = 'user-123';
      const data = {
        overrideDate: '2024-12-25',
        startTime: '09:00',
        endTime: '17:00',
        isBlocked: true,
        reason: 'Holiday',
      };

      const mockResult = {
        id: 'override-123',
        user_id: userId,
        override_date: new Date('2024-12-25'),
        start_time: '09:00',
        end_time: '17:00',
        is_blocked: true,
        reason: 'Holiday',
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockResult] } as any);

      const result = await service.createAvailabilityOverride(userId, data);

      expect(result.id).toBe('override-123');
      expect(result.isBlocked).toBe(true);
      expect(result.reason).toBe('Holiday');
    });

    it('should handle all-day override (no times)', async () => {
      const userId = 'user-123';
      const data = {
        overrideDate: '2024-12-25',
        isBlocked: true,
        reason: 'Holiday',
      };

      const mockResult = {
        id: 'override-123',
        user_id: userId,
        override_date: new Date('2024-12-25'),
        start_time: null,
        end_time: null,
        is_blocked: true,
        reason: 'Holiday',
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockResult] } as any);

      const result = await service.createAvailabilityOverride(userId, data);

      expect(result.startTime).toBeNull();
      expect(result.endTime).toBeNull();
    });
  });

  describe('getAvailabilityOverrides', () => {
    it('should retrieve overrides within date range', async () => {
      const userId = 'user-123';
      const startDate = '2024-12-01';
      const endDate = '2024-12-31';

      const mockOverrides = [
        {
          id: 'override-1',
          user_id: userId,
          override_date: new Date('2024-12-25'),
          start_time: null,
          end_time: null,
          is_blocked: true,
          reason: 'Christmas',
          created_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockOverrides } as any);

      const result = await service.getAvailabilityOverrides(userId, startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0].reason).toBe('Christmas');
    });
  });

  describe('getAvailability', () => {
    it('should compute availability from recurring patterns and overrides', async () => {
      const userId = 'user-123';
      const startDate = '2024-12-01'; // Sunday
      const endDate = '2024-12-07'; // Saturday

      const mockPatterns = [
        {
          id: 'pattern-1',
          user_id: userId,
          day_of_week: DayOfWeek.MONDAY, // 1
          start_time: '09:00',
          end_time: '17:00',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockOverrides = [
        {
          id: 'override-1',
          user_id: userId,
          override_date: new Date('2024-12-25'),
          start_time: null,
          end_time: null,
          is_blocked: true,
          reason: 'Holiday',
          created_at: new Date(),
        },
      ];

      // Mock getRecurringAvailability
      mockPool.query.mockResolvedValueOnce({ rows: mockPatterns } as any);
      // Mock getAvailabilityOverrides
      mockPool.query.mockResolvedValueOnce({ rows: mockOverrides } as any);

      const result = await service.getAvailability({ userId, startDate, endDate });

      expect(result.userId).toBe(userId);
      expect(result.recurringPatterns).toHaveLength(1);
      expect(result.overrides).toHaveLength(1);
      expect(result.slots.length).toBeGreaterThan(0);
    });
  });
});

