/**
 * Load Test Script
 * Tests system with 20 concurrent bookings
 * 
 * Usage:
 *   node tests/load/loadTest.js
 * 
 * Prerequisites:
 *   - Staging environment deployed
 *   - Test accounts created
 *   - API_URL environment variable set
 */

// Note: Install dependencies first: npm install axios uuid
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_URL = process.env.API_URL || 'https://api-staging.flightschedulepro.com';
const CONCURRENT_BOOKINGS = 20;
const STUDENT_EMAIL = process.env.STUDENT_EMAIL || 'student@staging.flightschedulepro.com';
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD || 'TestPassword123!';
const INSTRUCTOR_EMAIL = process.env.INSTRUCTOR_EMAIL || 'instructor@staging.flightschedulepro.com';
const INSTRUCTOR_PASSWORD = process.env.INSTRUCTOR_PASSWORD || 'TestPassword123!';

// Test data
const airports = [
  { code: 'KJFK', lat: 40.6413, lon: -73.7781, name: 'New York JFK' },
  { code: 'KLAX', lat: 33.9425, lon: -118.4081, name: 'Los Angeles' },
  { code: 'KORD', lat: 41.9742, lon: -87.9073, name: 'Chicago O\'Hare' },
  { code: 'KDFW', lat: 32.8998, lon: -97.0403, name: 'Dallas/Fort Worth' },
  { code: 'KMIA', lat: 25.7959, lon: -80.2870, name: 'Miami' },
];

// Results tracking
const results = {
  total: 0,
  successful: 0,
  failed: 0,
  errors: [],
  responseTimes: [],
  startTime: null,
  endTime: null,
};

/**
 * Login and get JWT token
 */
async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    return response.data.tokens.accessToken;
  } catch (error) {
    console.error(`Login failed for ${email}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a booking
 */
async function createBooking(token, bookingData) {
  const startTime = Date.now();
  try {
    const response = await axios.post(
      `${API_URL}/bookings`,
      bookingData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const responseTime = Date.now() - startTime;
    results.responseTimes.push(responseTime);
    results.successful++;
    return { success: true, bookingId: response.data.booking.id, responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    results.responseTimes.push(responseTime);
    results.failed++;
    const errorMsg = error.response?.data?.message || error.message;
    results.errors.push({
      booking: bookingData,
      error: errorMsg,
      responseTime,
    });
    return { success: false, error: errorMsg, responseTime };
  }
}

/**
 * Generate random booking data
 */
function generateBookingData(instructorId) {
  const departure = airports[Math.floor(Math.random() * airports.length)];
  let arrival = airports[Math.floor(Math.random() * airports.length)];
  while (arrival.code === departure.code) {
    arrival = airports[Math.floor(Math.random() * airports.length)];
  }

  // Random date within next 30 days
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + Math.floor(Math.random() * 30));
  scheduledDate.setHours(9 + Math.floor(Math.random() * 8)); // 9 AM - 5 PM
  scheduledDate.setMinutes(Math.floor(Math.random() * 4) * 15); // 0, 15, 30, 45

  return {
    studentId: uuidv4(), // Will be replaced with actual student ID
    instructorId,
    departureAirport: departure.code,
    arrivalAirport: arrival.code,
    departureLatitude: departure.lat,
    departureLongitude: departure.lon,
    arrivalLatitude: arrival.lat,
    arrivalLongitude: arrival.lon,
    scheduledDatetime: scheduledDate.toISOString(),
    trainingLevel: 'STUDENT_PILOT',
    durationMinutes: 60,
    aircraftId: `N${Math.floor(Math.random() * 10000)}`,
  };
}

/**
 * Run load test
 */
async function runLoadTest() {
  console.log('='.repeat(80));
  console.log('Flight Schedule Pro - Load Test');
  console.log('='.repeat(80));
  console.log(`API URL: ${API_URL}`);
  console.log(`Concurrent Bookings: ${CONCURRENT_BOOKINGS}`);
  console.log('');

  results.startTime = Date.now();

  try {
    // Login as student
    console.log('Logging in as student...');
    const studentToken = await login(STUDENT_EMAIL, STUDENT_PASSWORD);
    console.log('✓ Student logged in');

    // Get student ID
    const studentResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${studentToken}` },
    });
    const studentId = studentResponse.data.id;
    console.log(`✓ Student ID: ${studentId}`);

    // Login as instructor
    console.log('Logging in as instructor...');
    const instructorToken = await login(INSTRUCTOR_EMAIL, INSTRUCTOR_PASSWORD);
    console.log('✓ Instructor logged in');

    // Get instructor ID
    const instructorResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${instructorToken}` },
    });
    const instructorId = instructorResponse.data.id;
    console.log(`✓ Instructor ID: ${instructorId}`);
    console.log('');

    // Generate booking data
    console.log('Generating booking data...');
    const bookings = Array.from({ length: CONCURRENT_BOOKINGS }, () => {
      const data = generateBookingData(instructorId);
      data.studentId = studentId;
      return data;
    });
    console.log(`✓ Generated ${bookings.length} booking requests`);
    console.log('');

    // Create bookings concurrently
    console.log('Creating bookings concurrently...');
    const promises = bookings.map((bookingData, index) => {
      return createBooking(studentToken, bookingData)
        .then(result => {
          console.log(`[${index + 1}/${CONCURRENT_BOOKINGS}] ${result.success ? '✓' : '✗'} ${result.responseTime}ms`);
          return result;
        });
    });

    const bookingResults = await Promise.all(promises);
    results.total = bookingResults.length;

    results.endTime = Date.now();
    const totalTime = results.endTime - results.startTime;

    // Print results
    console.log('');
    console.log('='.repeat(80));
    console.log('Load Test Results');
    console.log('='.repeat(80));
    console.log(`Total Bookings: ${results.total}`);
    console.log(`Successful: ${results.successful} (${(results.successful / results.total * 100).toFixed(1)}%)`);
    console.log(`Failed: ${results.failed} (${(results.failed / results.total * 100).toFixed(1)}%)`);
    console.log(`Total Time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log('');

    if (results.responseTimes.length > 0) {
      const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
      const minResponseTime = Math.min(...results.responseTimes);
      const maxResponseTime = Math.max(...results.responseTimes);
      const sortedTimes = [...results.responseTimes].sort((a, b) => a - b);
      const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
      const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

      console.log('Response Time Statistics:');
      console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`  Min: ${minResponseTime}ms`);
      console.log(`  Max: ${maxResponseTime}ms`);
      console.log(`  P50: ${p50}ms`);
      console.log(`  P95: ${p95}ms`);
      console.log(`  P99: ${p99}ms`);
      console.log('');
    }

    if (results.errors.length > 0) {
      console.log('Errors:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.error}`);
        console.log(`     Booking: ${error.booking.departureAirport} → ${error.booking.arrivalAirport}`);
        console.log(`     Response Time: ${error.responseTime}ms`);
      });
      console.log('');
    }

    // Performance assessment
    console.log('Performance Assessment:');
    if (results.successful / results.total >= 0.95) {
      console.log('  ✓ Success rate acceptable (≥95%)');
    } else {
      console.log('  ✗ Success rate below threshold (<95%)');
    }

    if (results.responseTimes.length > 0) {
      const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
      if (avgResponseTime < 2000) {
        console.log('  ✓ Average response time acceptable (<2s)');
      } else {
        console.log('  ✗ Average response time too high (≥2s)');
      }
    }

    console.log('');

    // Exit code
    if (results.successful / results.total >= 0.95) {
      console.log('✓ Load test PASSED');
      process.exit(0);
    } else {
      console.log('✗ Load test FAILED');
      process.exit(1);
    }

  } catch (error) {
    console.error('Load test failed:', error);
    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  runLoadTest();
}

module.exports = { runLoadTest };


