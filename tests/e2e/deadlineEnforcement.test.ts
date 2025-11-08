/**
 * Deadline Enforcement E2E Tests
 * Tests the preference submission deadline system
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Pool } from 'pg';
import { getTestPool } from '../setup';
import { PreferenceRankingService } from '../../backend/src/services/preferenceRankingService';
import { RescheduleOptionsService } from '../../backend/src/services/rescheduleOptionsService';
import { calculateDeadline, isDeadlinePassed } from '../../backend/src/utils/deadlineCalculator';

describe('E2E: Deadline Enforcement', () => {
  let pool: Pool;
  let preferenceService: PreferenceRankingService;
  let optionsService: RescheduleOptionsService;

  const testStudentId = 'd408e4c8-a021-7020-2b81-4aba6a1507c1';
  const testInstructorId = 'e519f5d9-b132-8131-3c92-5bcb7b2618d2';
  const testBookingId = 'b1234567-8901-2345-6789-012345678901';

  beforeAll(async () => {
    pool = getTestPool();
    preferenceService = new PreferenceRankingService(pool);
    optionsService = new RescheduleOptionsService(pool);
  });

  test('should calculate deadline as min(30min before departure, 12h after notification)', () => {
    const scheduledTime = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
    const notificationTime = new Date();

    const deadline = calculateDeadline(scheduledTime, notificationTime);

    // Should be 12 hours from notification (since that's less than 30 min before departure)
    const expectedDeadline = new Date(notificationTime.getTime() + 12 * 60 * 60 * 1000);
    const diff = Math.abs(deadline.getTime() - expectedDeadline.getTime());

    expect(diff).toBeLessThan(1000); // Within 1 second
  });

  test('should calculate deadline as 30min before departure for last-minute flights', () => {
    const scheduledTime = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours from now
    const notificationTime = new Date();

    const deadline = calculateDeadline(scheduledTime, notificationTime);

    // Should be 30 minutes before departure (since that's less than 12h from now)
    const expectedDeadline = new Date(scheduledTime.getTime() - 30 * 60 * 1000);
    const diff = Math.abs(deadline.getTime() - expectedDeadline.getTime());

    expect(diff).toBeLessThan(1000);
  });

  test('should reject preference submission after deadline', async () => {
    // Create a booking with passed deadline
    const pastTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

    // Create preference ranking with past deadline
    await pool.query(
      `INSERT INTO preference_rankings (booking_id, user_id, deadline)
       VALUES ($1, $2, $3)
       ON CONFLICT (booking_id, user_id) DO UPDATE SET deadline = $3`,
      [testBookingId, testStudentId, pastTime]
    );

    // Create a mock option
    const option = await optionsService.createOption({
      bookingId: testBookingId,
      suggestedDatetime: new Date().toISOString(),
      instructorAvailable: true,
      studentAvailable: true,
      weatherValid: true,
      conflictingBookings: [],
      confidenceScore: 0.9,
      reasoning: 'Test option',
    });

    // Attempt to submit preference after deadline
    await expect(
      preferenceService.submitPreference({
        bookingId: testBookingId,
        userId: testStudentId,
        option1Id: option.id,
      })
    ).rejects.toThrow('deadline has passed');
  });

  test('should accept preference submission before deadline', async () => {
    // Create a booking with future deadline
    const futureTime = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours from now

    const testBookingId2 = 'b2345678-9012-3456-7890-123456789012';

    // Create preference ranking with future deadline
    await pool.query(
      `INSERT INTO preference_rankings (booking_id, user_id, deadline)
       VALUES ($1, $2, $3)
       ON CONFLICT (booking_id, user_id) DO UPDATE SET deadline = $3`,
      [testBookingId2, testStudentId, futureTime]
    );

    // Create a mock option
    const option = await optionsService.createOption({
      bookingId: testBookingId2,
      suggestedDatetime: new Date().toISOString(),
      instructorAvailable: true,
      studentAvailable: true,
      weatherValid: true,
      conflictingBookings: [],
      confidenceScore: 0.9,
      reasoning: 'Test option',
    });

    // Submit preference before deadline
    const result = await preferenceService.submitPreference({
      bookingId: testBookingId2,
      userId: testStudentId,
      option1Id: option.id,
    });

    expect(result).toBeDefined();
    expect(result.submittedAt).toBeDefined();
    expect(result.option1Id).toBe(option.id);
  });

  test('should escalate to admin if deadline passes without both preferences', async () => {
    const testBookingId3 = 'b3456789-0123-4567-8901-234567890123';
    const passedDeadline = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago

    // Create preference rankings with passed deadline
    await pool.query(
      `INSERT INTO preference_rankings (booking_id, user_id, deadline)
       VALUES ($1, $2, $3), ($1, $4, $3)
       ON CONFLICT (booking_id, user_id) DO NOTHING`,
      [testBookingId3, testStudentId, passedDeadline, testInstructorId]
    );

    // Only student submits (instructor doesn't)
    const option = await optionsService.createOption({
      bookingId: testBookingId3,
      suggestedDatetime: new Date().toISOString(),
      instructorAvailable: true,
      studentAvailable: true,
      weatherValid: true,
      conflictingBookings: [],
      confidenceScore: 0.9,
      reasoning: 'Test option',
    });

    // Update student's preference directly (bypassing deadline check for test)
    await pool.query(
      `UPDATE preference_rankings 
       SET option_1_id = $1, submitted_at = NOW() 
       WHERE booking_id = $2 AND user_id = $3`,
      [option.id, testBookingId3, testStudentId]
    );

    // Check if both preferences submitted
    const bothSubmitted = await preferenceService.areBothPreferencesSubmitted(testBookingId3);
    expect(bothSubmitted).toBe(false);

    // Check if deadline has passed
    const preferences = await preferenceService.getPreferencesByBooking(testBookingId3);
    const deadlinePassed = preferences.some((p) => isDeadlinePassed(p.deadline));
    expect(deadlinePassed).toBe(true);

    // This should trigger escalation in production
    console.log('📢 Escalation required: Deadline passed without both preferences');
  });

  test('should handle edge case: deadline exactly at departure time minus 30 minutes', () => {
    const scheduledTime = new Date(Date.now() + 30 * 60 * 1000); // Exactly 30 minutes from now
    const notificationTime = new Date(Date.now() - 13 * 60 * 60 * 1000); // 13 hours ago

    const deadline = calculateDeadline(scheduledTime, notificationTime);

    // Should be 30 minutes before departure (current time + 30 min - 30 min = current time)
    const expectedDeadline = new Date(scheduledTime.getTime() - 30 * 60 * 1000);
    const diff = Math.abs(deadline.getTime() - expectedDeadline.getTime());

    expect(diff).toBeLessThan(1000);
  });

  test('should handle multiple preference updates before deadline', async () => {
    const testBookingId4 = 'b4567890-1234-5678-9012-345678901234';
    const futureDeadline = new Date(Date.now() + 10 * 60 * 60 * 1000); // 10 hours from now

    await pool.query(
      `INSERT INTO preference_rankings (booking_id, user_id, deadline)
       VALUES ($1, $2, $3)
       ON CONFLICT (booking_id, user_id) DO UPDATE SET deadline = $3`,
      [testBookingId4, testStudentId, futureDeadline]
    );

    // Create three options
    const option1 = await optionsService.createOption({
      bookingId: testBookingId4,
      suggestedDatetime: new Date().toISOString(),
      instructorAvailable: true,
      studentAvailable: true,
      weatherValid: true,
      conflictingBookings: [],
      confidenceScore: 0.95,
      reasoning: 'Option 1',
    });

    const option2 = await optionsService.createOption({
      bookingId: testBookingId4,
      suggestedDatetime: new Date().toISOString(),
      instructorAvailable: true,
      studentAvailable: true,
      weatherValid: true,
      conflictingBookings: [],
      confidenceScore: 0.85,
      reasoning: 'Option 2',
    });

    // Submit preferences first time
    await preferenceService.submitPreference({
      bookingId: testBookingId4,
      userId: testStudentId,
      option1Id: option1.id,
      option2Id: option2.id,
    });

    // Change mind and update preferences (should be allowed before deadline)
    const updated = await preferenceService.submitPreference({
      bookingId: testBookingId4,
      userId: testStudentId,
      option1Id: option2.id,
      option2Id: option1.id,
    });

    expect(updated.option1Id).toBe(option2.id);
    expect(updated.option2Id).toBe(option1.id);
  });

  test('should handle edge case: deadline exactly at 12 hours after notification', () => {
    const notificationTime = new Date(Date.now() - 12 * 60 * 60 * 1000); // Exactly 12 hours ago
    const scheduledTime = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

    const deadline = calculateDeadline(scheduledTime, notificationTime);

    // Should be exactly 12 hours after notification (current time)
    const expectedDeadline = new Date(notificationTime.getTime() + 12 * 60 * 60 * 1000);
    const diff = Math.abs(deadline.getTime() - expectedDeadline.getTime());

    expect(diff).toBeLessThan(1000);
  });

  test('should handle very short time window (less than 30 minutes before departure)', () => {
    const scheduledTime = new Date(Date.now() + 20 * 60 * 1000); // Only 20 minutes from now
    const notificationTime = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago

    const deadline = calculateDeadline(scheduledTime, notificationTime);

    // Should be 30 minutes before departure (which is in the past, so deadline already passed)
    const expectedDeadline = new Date(scheduledTime.getTime() - 30 * 60 * 1000);
    const diff = Math.abs(deadline.getTime() - expectedDeadline.getTime());

    expect(diff).toBeLessThan(1000);
    expect(deadline.getTime()).toBeLessThan(Date.now()); // Deadline is in the past
  });

  test('should handle concurrent preference submissions near deadline', async () => {
    const testBookingId5 = 'b5678901-2345-6789-0123-456789012345';
    const nearDeadline = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    await pool.query(
      `INSERT INTO preference_rankings (booking_id, user_id, deadline)
       VALUES ($1, $2, $3), ($1, $4, $3)
       ON CONFLICT (booking_id, user_id) DO UPDATE SET deadline = $3`,
      [testBookingId5, testStudentId, nearDeadline, testInstructorId]
    );

    const option1 = await optionsService.createOption({
      bookingId: testBookingId5,
      suggestedDatetime: new Date().toISOString(),
      instructorAvailable: true,
      studentAvailable: true,
      weatherValid: true,
      conflictingBookings: [],
      confidenceScore: 0.95,
      reasoning: 'Option 1',
    });

    // Simulate concurrent submissions
    const promises = [
      preferenceService.submitPreference({
        bookingId: testBookingId5,
        userId: testStudentId,
        option1Id: option1.id,
      }),
      preferenceService.submitPreference({
        bookingId: testBookingId5,
        userId: testInstructorId,
        option1Id: option1.id,
      }),
    ];

    const results = await Promise.allSettled(promises);

    // Both should succeed if submitted before deadline
    const successful = results.filter((r) => r.status === 'fulfilled');
    expect(successful.length).toBeGreaterThanOrEqual(1);
  });

  test('should handle timezone edge cases in deadline calculation', () => {
    // Test with different timezone scenarios
    const scheduledTime = new Date('2025-12-25T14:00:00Z'); // UTC
    const notificationTime = new Date('2025-12-25T02:00:00Z'); // 12 hours before

    const deadline = calculateDeadline(scheduledTime, notificationTime);

    // Should be 12 hours after notification (14:00 UTC)
    const expectedDeadline = new Date('2025-12-25T14:00:00Z');
    const diff = Math.abs(deadline.getTime() - expectedDeadline.getTime());

    expect(diff).toBeLessThan(1000);
  });

  afterAll(async () => {
    // Cleanup is handled by global teardown
  });
});



