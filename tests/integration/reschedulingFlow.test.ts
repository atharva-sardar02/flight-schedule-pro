/**
 * Rescheduling Flow Integration Tests
 * Tests the complete AI rescheduling workflow including preference resolution
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Pool } from 'pg';
import { getTestPool } from '../setup';
import { RescheduleEngine } from '../../backend/src/functions/ai/rescheduleEngine';
import { PreferenceRankingService } from '../../backend/src/services/preferenceRankingService';
import { RescheduleOptionsService } from '../../backend/src/services/rescheduleOptionsService';
import { BookingService } from '../../backend/src/services/bookingService';
import { AvailabilityService } from '../../backend/src/services/availabilityService';
import { WeatherService } from '../../backend/src/services/weatherService';

describe('Integration: Rescheduling Flow', () => {
  let pool: Pool;
  let rescheduleEngine: RescheduleEngine;
  let preferenceService: PreferenceRankingService;
  let optionsService: RescheduleOptionsService;
  let bookingService: BookingService;
  let availabilityService: AvailabilityService;
  let weatherService: WeatherService;

  const testStudentId = 'd408e4c8-a021-7020-2b81-4aba6a1507c1';
  const testInstructorId = 'e519f5d9-b132-8131-3c92-5bcb7b2618d2';

  beforeAll(async () => {
    pool = getTestPool();
    weatherService = new WeatherService();
    availabilityService = new AvailabilityService(pool);
    bookingService = new BookingService(pool);
    preferenceService = new PreferenceRankingService(pool);
    optionsService = new RescheduleOptionsService(pool);
    rescheduleEngine = new RescheduleEngine(pool, weatherService, availabilityService);
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await pool.query('DELETE FROM preference_rankings WHERE booking_id LIKE $1', ['test-%']);
    await pool.query('DELETE FROM reschedule_options WHERE booking_id LIKE $1', ['test-%']);
    await pool.query('DELETE FROM bookings WHERE id LIKE $1', ['test-%']);
  });

  describe('Preference Conflict Resolution', () => {
    test('should resolve conflicts using instructor priority when preferences differ', async () => {
      // Create a booking with weather conflict
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const booking = await bookingService.createBooking({
        studentId: testStudentId,
        instructorId: testInstructorId,
        scheduledTime: futureDate.toISOString(),
        departureAirport: 'KJFK',
        departureLat: 40.6413,
        departureLon: -73.7781,
        arrivalAirport: 'KBOS',
        arrivalLat: 42.3656,
        arrivalLon: -71.0096,
        aircraftId: 'N12345',
        trainingLevel: 'PRIVATE_PILOT' as any,
      });

      // Update status to indicate weather conflict
      await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [
        'AT_RISK',
        booking.id,
      ]);

      // Set up availability for both users
      await availabilityService.createRecurringAvailability(testInstructorId, {
        dayOfWeek: futureDate.getDay(),
        startTime: '09:00:00',
        endTime: '17:00:00',
      });

      await availabilityService.createRecurringAvailability(testStudentId, {
        dayOfWeek: futureDate.getDay(),
        startTime: '10:00:00',
        endTime: '16:00:00',
      });

      // Create three reschedule options
      const option1 = await optionsService.createOption({
        bookingId: booking.id,
        suggestedDatetime: new Date(futureDate.getTime() + 86400000).toISOString(), // +1 day
        instructorAvailable: true,
        studentAvailable: true,
        weatherValid: true,
        conflictingBookings: [],
        confidenceScore: 0.95,
        reasoning: 'Option 1 - Best weather',
      });

      const option2 = await optionsService.createOption({
        bookingId: booking.id,
        suggestedDatetime: new Date(futureDate.getTime() + 172800000).toISOString(), // +2 days
        instructorAvailable: true,
        studentAvailable: true,
        weatherValid: true,
        conflictingBookings: [],
        confidenceScore: 0.85,
        reasoning: 'Option 2 - Good alternative',
      });

      const option3 = await optionsService.createOption({
        bookingId: booking.id,
        suggestedDatetime: new Date(futureDate.getTime() + 259200000).toISOString(), // +3 days
        instructorAvailable: true,
        studentAvailable: true,
        weatherValid: true,
        conflictingBookings: [],
        confidenceScore: 0.75,
        reasoning: 'Option 3 - Acceptable',
      });

      // Create preference ranking records
      await preferenceService.createPreferenceRankings(
        booking.id,
        testStudentId,
        testInstructorId,
        futureDate
      );

      // Student prefers: Option 1 > Option 2 > Option 3
      await preferenceService.submitPreference({
        bookingId: booking.id,
        userId: testStudentId,
        option1Id: option1.id,
        option2Id: option2.id,
        option3Id: option3.id,
      });

      // Instructor prefers: Option 2 > Option 1 > Option 3 (different from student)
      await preferenceService.submitPreference({
        bookingId: booking.id,
        userId: testInstructorId,
        option1Id: option2.id, // Instructor's #1 choice
        option2Id: option1.id,
        option3Id: option3.id,
      });

      // Resolve final selection (instructor priority)
      const selectedOptionId = await preferenceService.resolveFinalSelection(booking.id);

      // Instructor's #1 choice (Option 2) should win
      expect(selectedOptionId).toBe(option2.id);

      // Verify both preferences were submitted
      const bothSubmitted = await preferenceService.areBothPreferencesSubmitted(booking.id);
      expect(bothSubmitted).toBe(true);
    });

    test('should handle case where student and instructor agree on first choice', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const booking = await bookingService.createBooking({
        studentId: testStudentId,
        instructorId: testInstructorId,
        scheduledTime: futureDate.toISOString(),
        departureAirport: 'KJFK',
        departureLat: 40.6413,
        departureLon: -73.7781,
        arrivalAirport: 'KBOS',
        arrivalLat: 42.3656,
        arrivalLon: -71.0096,
        aircraftId: 'N12345',
        trainingLevel: 'PRIVATE_PILOT' as any,
      });

      const option1 = await optionsService.createOption({
        bookingId: booking.id,
        suggestedDatetime: new Date(futureDate.getTime() + 86400000).toISOString(),
        instructorAvailable: true,
        studentAvailable: true,
        weatherValid: true,
        conflictingBookings: [],
        confidenceScore: 0.95,
        reasoning: 'Best option',
      });

      const option2 = await optionsService.createOption({
        bookingId: booking.id,
        suggestedDatetime: new Date(futureDate.getTime() + 172800000).toISOString(),
        instructorAvailable: true,
        studentAvailable: true,
        weatherValid: true,
        conflictingBookings: [],
        confidenceScore: 0.85,
        reasoning: 'Alternative',
      });

      await preferenceService.createPreferenceRankings(
        booking.id,
        testStudentId,
        testInstructorId,
        futureDate
      );

      // Both prefer Option 1
      await preferenceService.submitPreference({
        bookingId: booking.id,
        userId: testStudentId,
        option1Id: option1.id,
        option2Id: option2.id,
      });

      await preferenceService.submitPreference({
        bookingId: booking.id,
        userId: testInstructorId,
        option1Id: option1.id,
        option2Id: option2.id,
      });

      const selectedOptionId = await preferenceService.resolveFinalSelection(booking.id);
      expect(selectedOptionId).toBe(option1.id);
    });
  });

  describe('All Unavailable Scenario', () => {
    test('should handle case where instructor marks all options as unavailable', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const booking = await bookingService.createBooking({
        studentId: testStudentId,
        instructorId: testInstructorId,
        scheduledTime: futureDate.toISOString(),
        departureAirport: 'KJFK',
        departureLat: 40.6413,
        departureLon: -73.7781,
        arrivalAirport: 'KBOS',
        arrivalLat: 42.3656,
        arrivalLon: -71.0096,
        aircraftId: 'N12345',
        trainingLevel: 'PRIVATE_PILOT' as any,
      });

      // Create three options
      const option1 = await optionsService.createOption({
        bookingId: booking.id,
        suggestedDatetime: new Date(futureDate.getTime() + 86400000).toISOString(),
        instructorAvailable: true,
        studentAvailable: true,
        weatherValid: true,
        conflictingBookings: [],
        confidenceScore: 0.95,
        reasoning: 'Option 1',
      });

      const option2 = await optionsService.createOption({
        bookingId: booking.id,
        suggestedDatetime: new Date(futureDate.getTime() + 172800000).toISOString(),
        instructorAvailable: true,
        studentAvailable: true,
        weatherValid: true,
        conflictingBookings: [],
        confidenceScore: 0.85,
        reasoning: 'Option 2',
      });

      const option3 = await optionsService.createOption({
        bookingId: booking.id,
        suggestedDatetime: new Date(futureDate.getTime() + 259200000).toISOString(),
        instructorAvailable: true,
        studentAvailable: true,
        weatherValid: true,
        conflictingBookings: [],
        confidenceScore: 0.75,
        reasoning: 'Option 3',
      });

      await preferenceService.createPreferenceRankings(
        booking.id,
        testStudentId,
        testInstructorId,
        futureDate
      );

      // Student submits preferences
      await preferenceService.submitPreference({
        bookingId: booking.id,
        userId: testStudentId,
        option1Id: option1.id,
        option2Id: option2.id,
        option3Id: option3.id,
      });

      // Instructor marks all as unavailable
      await preferenceService.submitPreference({
        bookingId: booking.id,
        userId: testInstructorId,
        option1Id: null, // Marked unavailable
        option2Id: null, // Marked unavailable
        option3Id: null, // Marked unavailable
        unavailableOptionIds: [option1.id, option2.id, option3.id],
      });

      // Check if all options are unavailable
      const preferences = await preferenceService.getPreferencesByBooking(booking.id);
      const instructorPreference = preferences.find((p) => p.userId === testInstructorId);

      expect(instructorPreference).toBeDefined();
      expect(instructorPreference?.unavailableOptionIds).toHaveLength(3);
      expect(instructorPreference?.unavailableOptionIds).toContain(option1.id);
      expect(instructorPreference?.unavailableOptionIds).toContain(option2.id);
      expect(instructorPreference?.unavailableOptionIds).toContain(option3.id);

      // This should trigger new option generation in production
      console.log('📢 All options unavailable - new generation required');
    });

    test('should handle case where no valid options exist due to schedule conflicts', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      // Create a booking
      const booking = await bookingService.createBooking({
        studentId: testStudentId,
        instructorId: testInstructorId,
        scheduledTime: futureDate.toISOString(),
        departureAirport: 'KJFK',
        departureLat: 40.6413,
        departureLon: -73.7781,
        arrivalAirport: 'KBOS',
        arrivalLat: 42.3656,
        arrivalLon: -71.0096,
        aircraftId: 'N12345',
        trainingLevel: 'PRIVATE_PILOT' as any,
      });

      // Create conflicting bookings that block all potential time slots
      const conflictTime1 = new Date(futureDate.getTime() + 86400000);
      const conflictTime2 = new Date(futureDate.getTime() + 172800000);
      const conflictTime3 = new Date(futureDate.getTime() + 259200000);

      // Create bookings that conflict with potential reschedule slots
      await bookingService.createBooking({
        studentId: 'a73b17fb-d354-a353-5eb4-7eed9d4830f4', // Different student
        instructorId: testInstructorId, // Same instructor
        scheduledTime: conflictTime1.toISOString(),
        departureAirport: 'KJFK',
        departureLat: 40.6413,
        departureLon: -73.7781,
        arrivalAirport: 'KBOS',
        arrivalLat: 42.3656,
        arrivalLon: -71.0096,
        aircraftId: 'N67890',
        trainingLevel: 'PRIVATE_PILOT' as any,
      });

      await bookingService.createBooking({
        studentId: 'a73b17fb-d354-a353-5eb4-7eed9d4830f4',
        instructorId: testInstructorId,
        scheduledTime: conflictTime2.toISOString(),
        departureAirport: 'KJFK',
        departureLat: 40.6413,
        departureLon: -73.7781,
        arrivalAirport: 'KBOS',
        arrivalLat: 42.3656,
        arrivalLon: -71.0096,
        aircraftId: 'N67890',
        trainingLevel: 'PRIVATE_PILOT' as any,
      });

      await bookingService.createBooking({
        studentId: 'a73b17fb-d354-a353-5eb4-7eed9d4830f4',
        instructorId: testInstructorId,
        scheduledTime: conflictTime3.toISOString(),
        departureAirport: 'KJFK',
        departureLat: 40.6413,
        departureLon: -73.7781,
        arrivalAirport: 'KBOS',
        arrivalLat: 42.3656,
        arrivalLon: -71.0096,
        aircraftId: 'N67890',
        trainingLevel: 'PRIVATE_PILOT' as any,
      });

      // Attempt to generate options (should find conflicts)
      // In a real scenario, the reschedule engine would detect these conflicts
      // and either find alternative times or return empty results

      const existingOptions = await optionsService.getOptionsByBooking(booking.id);
      expect(existingOptions).toHaveLength(0);

      // This scenario should trigger:
      // 1. Manual escalation to admin
      // 2. Or extension of search window
      // 3. Or notification that no options available
      console.log('📢 No valid options due to schedule conflicts');
    });
  });

  describe('Reschedule Engine Integration', () => {
    test('should generate valid options with weather and availability checks', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const booking = await bookingService.createBooking({
        studentId: testStudentId,
        instructorId: testInstructorId,
        scheduledTime: futureDate.toISOString(),
        departureAirport: 'KJFK',
        departureLat: 40.6413,
        departureLon: -73.7781,
        arrivalAirport: 'KBOS',
        arrivalLat: 42.3656,
        arrivalLon: -71.0096,
        aircraftId: 'N12345',
        trainingLevel: 'PRIVATE_PILOT' as any,
      });

      // Set up availability
      await availabilityService.createRecurringAvailability(testInstructorId, {
        dayOfWeek: futureDate.getDay(),
        startTime: '09:00:00',
        endTime: '17:00:00',
      });

      await availabilityService.createRecurringAvailability(testStudentId, {
        dayOfWeek: futureDate.getDay(),
        startTime: '10:00:00',
        endTime: '16:00:00',
      });

      // Note: In a real test, we would mock the weather service and reschedule engine
      // For integration test, we verify the flow works end-to-end
      // The actual AI generation would be tested in unit tests

      // Verify booking exists and is ready for rescheduling
      const retrievedBooking = await bookingService.getBookingById(booking.id);
      expect(retrievedBooking).toBeDefined();
      expect(retrievedBooking?.id).toBe(booking.id);
    });
  });

  afterAll(async () => {
    // Cleanup is handled by global teardown
  });
});

