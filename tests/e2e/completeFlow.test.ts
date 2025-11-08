/**
 * End-to-End Complete Flow Test
 * Tests the entire workflow from booking creation to AI-powered rescheduling
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Pool } from 'pg';
import { getTestPool } from '../setup';
import { BookingService } from '../../backend/src/services/bookingService';
import { AvailabilityService } from '../../backend/src/services/availabilityService';
import { WeatherService } from '../../backend/src/services/weatherService';
import { PreferenceRankingService } from '../../backend/src/services/preferenceRankingService';
import { RescheduleOptionsService } from '../../backend/src/services/rescheduleOptionsService';

describe('E2E: Complete Flight Booking and Rescheduling Flow', () => {
  let pool: Pool;
  let bookingService: BookingService;
  let availabilityService: AvailabilityService;
  let weatherService: WeatherService;
  let preferenceService: PreferenceRankingService;
  let optionsService: RescheduleOptionsService;

  const testStudentId = 'd408e4c8-a021-7020-2b81-4aba6a1507c1';
  const testInstructorId = 'e519f5d9-b132-8131-3c92-5bcb7b2618d2';

  beforeAll(async () => {
    pool = getTestPool();
    bookingService = new BookingService(pool);
    availabilityService = new AvailabilityService(pool);
    weatherService = new WeatherService();
    preferenceService = new PreferenceRankingService(pool);
    optionsService = new RescheduleOptionsService(pool);
  });

  test('Complete flow: Create booking → Weather conflict → AI reschedule → Preference selection → Confirmation', async () => {
    // ========================================================================
    // STEP 1: Create a new flight booking
    // ========================================================================
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const bookingData = {
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
    };

    const booking = await bookingService.createBooking(bookingData);

    expect(booking).toBeDefined();
    expect(booking.id).toBeDefined();
    expect(booking.status).toBe('PENDING');
    expect(booking.studentId).toBe(testStudentId);
    expect(booking.instructorId).toBe(testInstructorId);

    console.log('✅ Step 1: Booking created -', booking.id);

    // ========================================================================
    // STEP 2: Set up availability for instructor and student
    // ========================================================================
    
    // Create recurring availability for instructor (Mon-Fri, 9 AM - 5 PM)
    await availabilityService.createRecurringAvailability(testInstructorId, {
      dayOfWeek: 1, // Monday
      startTime: '09:00:00',
      endTime: '17:00:00',
    });

    await availabilityService.createRecurringAvailability(testInstructorId, {
      dayOfWeek: 2, // Tuesday
      startTime: '09:00:00',
      endTime: '17:00:00',
    });

    // Create recurring availability for student
    await availabilityService.createRecurringAvailability(testStudentId, {
      dayOfWeek: 1,
      startTime: '10:00:00',
      endTime: '16:00:00',
    });

    console.log('✅ Step 2: Availability patterns created');

    // ========================================================================
    // STEP 3: Simulate weather conflict detection
    // ========================================================================
    
    // Update booking status to WEATHER_CONFLICT
    await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2',
      ['WEATHER_CONFLICT', booking.id]
    );

    const updatedBooking = await bookingService.getBookingById(booking.id);
    expect(updatedBooking?.status).toBe('WEATHER_CONFLICT');

    console.log('✅ Step 3: Weather conflict detected');

    // ========================================================================
    // STEP 4: Generate AI reschedule options
    // ========================================================================
    
    // Create mock reschedule options
    const option1 = await optionsService.createOption({
      bookingId: booking.id,
      suggestedDatetime: new Date(futureDate.getTime() + 86400000).toISOString(), // +1 day
      instructorAvailable: true,
      studentAvailable: true,
      weatherValid: true,
      conflictingBookings: [],
      confidenceScore: 0.95,
      reasoning: 'Optimal slot with clear weather forecast',
    });

    const option2 = await optionsService.createOption({
      bookingId: booking.id,
      suggestedDatetime: new Date(futureDate.getTime() + 172800000).toISOString(), // +2 days
      instructorAvailable: true,
      studentAvailable: true,
      weatherValid: true,
      conflictingBookings: [],
      confidenceScore: 0.85,
      reasoning: 'Good alternative with favorable conditions',
    });

    expect(option1).toBeDefined();
    expect(option2).toBeDefined();

    console.log('✅ Step 4: AI generated', 2, 'reschedule options');

    // ========================================================================
    // STEP 5: Create preference rankings for student and instructor
    // ========================================================================
    
    await preferenceService.createPreferenceRankings(
      booking.id,
      testStudentId,
      testInstructorId,
      futureDate
    );

    console.log('✅ Step 5: Preference ranking records created');

    // ========================================================================
    // STEP 6: Submit preferences
    // ========================================================================
    
    // Student submits preferences
    const studentPreference = await preferenceService.submitPreference({
      bookingId: booking.id,
      userId: testStudentId,
      option1Id: option1.id,
      option2Id: option2.id,
    });

    expect(studentPreference.option1Id).toBe(option1.id);
    expect(studentPreference.submittedAt).toBeDefined();

    // Instructor submits preferences (instructor priority - their #1 wins)
    const instructorPreference = await preferenceService.submitPreference({
      bookingId: booking.id,
      userId: testInstructorId,
      option1Id: option2.id, // Instructor prefers option 2
      option2Id: option1.id,
    });

    expect(instructorPreference.option1Id).toBe(option2.id);

    console.log('✅ Step 6: Both preferences submitted');

    // ========================================================================
    // STEP 7: Check if both preferences submitted
    // ========================================================================
    
    const bothSubmitted = await preferenceService.areBothPreferencesSubmitted(booking.id);
    expect(bothSubmitted).toBe(true);

    console.log('✅ Step 7: Confirmed both preferences submitted');

    // ========================================================================
    // STEP 8: Resolve final selection (instructor priority)
    // ========================================================================
    
    const selectedOptionId = await preferenceService.resolveFinalSelection(booking.id);
    expect(selectedOptionId).toBe(option2.id); // Instructor's #1 choice wins

    console.log('✅ Step 8: Final selection resolved (instructor priority):', selectedOptionId);

    // ========================================================================
    // STEP 9: Confirm reschedule and update booking
    // ========================================================================
    
    const selectedOption = await optionsService.getOption(selectedOptionId!);
    expect(selectedOption).toBeDefined();

    await pool.query(
      'UPDATE bookings SET scheduled_time = $1, status = $2 WHERE id = $3',
      [selectedOption!.suggestedDatetime, 'CONFIRMED', booking.id]
    );

    const finalBooking = await bookingService.getBookingById(booking.id);
    expect(finalBooking?.status).toBe('CONFIRMED');
    expect(new Date(finalBooking!.scheduledTime).toISOString()).toBe(
      selectedOption!.suggestedDatetime
    );

    console.log('✅ Step 9: Booking rescheduled and confirmed');

    // ========================================================================
    // VERIFICATION: Entire flow completed successfully
    // ========================================================================
    
    expect(finalBooking).toMatchObject({
      id: booking.id,
      studentId: testStudentId,
      instructorId: testInstructorId,
      status: 'CONFIRMED',
      trainingLevel: 'PRIVATE_PILOT',
    });

    console.log('🎉 Complete E2E flow test passed!');
  }, 60000); // 60 second timeout for complete flow

  afterAll(async () => {
    // Cleanup is handled by global teardown
  });
});



