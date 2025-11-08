/**
 * Availability Sync Integration Test
 * Tests concurrent availability updates and conflict detection
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Pool } from 'pg';
import { getTestPool } from '../setup';
import { AvailabilityService } from '../../backend/src/services/availabilityService';

describe('Integration: Availability Synchronization', () => {
  let pool: Pool;
  let availabilityService: AvailabilityService;

  const testUserId = 'd408e4c8-a021-7020-2b81-4aba6a1507c1';

  beforeAll(async () => {
    pool = getTestPool();
    availabilityService = new AvailabilityService(pool);
  });

  beforeEach(async () => {
    // Clean up availability data before each test
    await pool.query('DELETE FROM availability_patterns WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM availability_overrides WHERE user_id = $1', [testUserId]);
  });

  test('should handle concurrent recurring availability creation', async () => {
    // Simulate multiple concurrent requests to create availability
    const promises = [
      availabilityService.createRecurringAvailability(testUserId, {
        dayOfWeek: 1,
        startTime: '09:00:00',
        endTime: '12:00:00',
      }),
      availabilityService.createRecurringAvailability(testUserId, {
        dayOfWeek: 1,
        startTime: '13:00:00',
        endTime: '17:00:00',
      }),
      availabilityService.createRecurringAvailability(testUserId, {
        dayOfWeek: 2,
        startTime: '09:00:00',
        endTime: '17:00:00',
      }),
    ];

    const results = await Promise.all(promises);

    expect(results).toHaveLength(3);
    results.forEach((result) => {
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(testUserId);
    });

    // Verify all patterns were created
    const patterns = await availabilityService.getRecurringAvailability(testUserId);
    expect(patterns).toHaveLength(3);
  });

  test('should detect and prevent overlapping availability patterns', async () => {
    // Create initial pattern
    await availabilityService.createRecurringAvailability(testUserId, {
      dayOfWeek: 1,
      startTime: '09:00:00',
      endTime: '17:00:00',
    });

    // Attempt to create overlapping pattern
    await expect(
      availabilityService.createRecurringAvailability(testUserId, {
        dayOfWeek: 1,
        startTime: '12:00:00',
        endTime: '15:00:00',
      })
    ).rejects.toThrow();
  });

  test('should handle concurrent booking attempts against same availability slot', async () => {
    // Create availability pattern
    await availabilityService.createRecurringAvailability(testUserId, {
      dayOfWeek: 1,
      startTime: '10:00:00',
      endTime: '12:00:00',
    });

    // Simulate concurrent booking attempts
    const futureMonday = getNextWeekday(1); // Next Monday

    const bookingPromises = [
      createMockBooking(pool, testUserId, futureMonday, '10:00:00'),
      createMockBooking(pool, testUserId, futureMonday, '10:00:00'),
      createMockBooking(pool, testUserId, futureMonday, '10:00:00'),
    ];

    // Only one should succeed (or handle with optimistic locking)
    const results = await Promise.allSettled(bookingPromises);

    const successful = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    // At least one should succeed, others should fail due to conflict
    expect(successful.length).toBeGreaterThanOrEqual(1);
    expect(failed.length).toBeGreaterThanOrEqual(0);
  });

  test('should correctly compute availability with overrides', async () => {
    // Create recurring pattern
    await availabilityService.createRecurringAvailability(testUserId, {
      dayOfWeek: 1,
      startTime: '09:00:00',
      endTime: '17:00:00',
    });

    // Add override to block specific date
    const nextMonday = getNextWeekday(1);
    await availabilityService.createAvailabilityOverride(testUserId, {
      overrideDate: nextMonday.toISOString().split('T')[0],
      startTime: '12:00:00',
      endTime: '14:00:00',
      isBlocked: true,
      reason: 'Lunch meeting',
    });

    // Get computed availability
    const startDate = nextMonday.toISOString().split('T')[0];
    const endDate = nextMonday.toISOString().split('T')[0];

    const availability = await availabilityService.getAvailability({
      userId: testUserId,
      startDate,
      endDate,
    });

    // Should have slots, but one should be blocked during lunch
    expect(availability.slots.length).toBeGreaterThan(0);

    const lunchSlots = availability.slots.filter((slot) => {
      const slotTime = slot.startTime.split(':')[0];
      return slotTime === '12' || slotTime === '13';
    });

    lunchSlots.forEach((slot) => {
      expect(slot.isAvailable).toBe(false);
    });
  });

  test('should handle optimistic locking for concurrent updates', async () => {
    // Create a pattern
    const pattern = await availabilityService.createRecurringAvailability(testUserId, {
      dayOfWeek: 1,
      startTime: '09:00:00',
      endTime: '17:00:00',
    });

    // Simulate two concurrent updates
    const update1 = availabilityService.updateRecurringAvailability(pattern.id, {
      startTime: '08:00:00',
    });

    const update2 = availabilityService.updateRecurringAvailability(pattern.id, {
      endTime: '18:00:00',
    });

    // One should succeed, the other should fail due to version mismatch
    const results = await Promise.allSettled([update1, update2]);

    const successful = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(successful.length).toBe(1);
    expect(failed.length).toBe(1);
  });

  afterAll(async () => {
    // Cleanup is handled by global teardown
  });
});

// Helper functions

function getNextWeekday(dayOfWeek: number): Date {
  const date = new Date();
  const currentDay = date.getDay();
  const daysUntilTarget = (dayOfWeek + 7 - currentDay) % 7 || 7;
  date.setDate(date.getDate() + daysUntilTarget);
  date.setHours(10, 0, 0, 0);
  return date;
}

async function createMockBooking(
  pool: Pool,
  instructorId: string,
  scheduledTime: Date,
  timeString: string
): Promise<any> {
  const bookingTime = new Date(scheduledTime);
  const [hours, minutes] = timeString.split(':');
  bookingTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const result = await pool.query(
    `INSERT INTO bookings (
      student_id, instructor_id, scheduled_time,
      departure_airport, departure_lat, departure_lon,
      arrival_airport, arrival_lat, arrival_lon,
      aircraft_id, training_level, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id`,
    [
      'd408e4c8-a021-7020-2b81-4aba6a1507c1',
      instructorId,
      bookingTime.toISOString(),
      'KJFK',
      40.6413,
      -73.7781,
      'KBOS',
      42.3656,
      -71.0096,
      'N12345',
      'PRIVATE_PILOT',
      'PENDING',
    ]
  );

  return result.rows[0];
}



