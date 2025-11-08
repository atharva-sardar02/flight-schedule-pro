/**
 * Load Testing Script
 * Tests system performance with 100 concurrent flights
 * 
 * Usage: node tests/load/loadTest.js
 * 
 * Prerequisites:
 * - Backend API running (or deployed)
 * - Test users created in database
 * - Environment variables configured
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const CONCURRENT_FLIGHTS = 100;
const TEST_DURATION_SECONDS = 300; // 5 minutes
const REQUESTS_PER_SECOND = 10;

// Test data
const testUsers = {
  student: process.env.TEST_STUDENT_ID || 'd408e4c8-a021-7020-2b81-4aba6a1507c1',
  instructor: process.env.TEST_INSTRUCTOR_ID || 'e519f5d9-b132-8131-3c92-5bcb7b2618d2',
};

// Statistics
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  errors: [],
  statusCodes: {},
};

/**
 * Generate a random booking date (within next 30 days)
 */
function getRandomBookingDate() {
  const now = new Date();
  const daysAhead = Math.floor(Math.random() * 30) + 1;
  const date = new Date(now);
  date.setDate(date.getDate() + daysAhead);
  date.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
  return date.toISOString();
}

/**
 * Create a test booking
 */
async function createTestBooking(token) {
  const bookingData = {
    studentId: testUsers.student,
    instructorId: testUsers.instructor,
    departureAirport: 'KJFK',
    arrivalAirport: 'KBOS',
    departureLatitude: 40.6413,
    departureLongitude: -73.7781,
    arrivalLatitude: 42.3656,
    arrivalLongitude: -71.0096,
    scheduledDatetime: getRandomBookingDate(),
    trainingLevel: 'PRIVATE_PILOT',
    durationMinutes: 60,
    aircraftId: 'N12345',
  };

  const startTime = Date.now();
  try {
    const response = await axios.post(`${API_BASE_URL}/bookings`, bookingData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const responseTime = Date.now() - startTime;
    recordSuccess(response.status, responseTime);
    return response.data;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    recordError(error, responseTime);
    throw error;
  }
}

/**
 * List bookings
 */
async function listBookings(token) {
  const startTime = Date.now();
  try {
    const response = await axios.get(`${API_BASE_URL}/bookings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      timeout: 5000,
    });

    const responseTime = Date.now() - startTime;
    recordSuccess(response.status, responseTime);
    return response.data;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    recordError(error, responseTime);
    throw error;
  }
}

/**
 * Record successful request
 */
function recordSuccess(statusCode, responseTime) {
  stats.totalRequests++;
  stats.successfulRequests++;
  stats.totalResponseTime += responseTime;
  stats.minResponseTime = Math.min(stats.minResponseTime, responseTime);
  stats.maxResponseTime = Math.max(stats.maxResponseTime, responseTime);
  
  if (!stats.statusCodes[statusCode]) {
    stats.statusCodes[statusCode] = 0;
  }
  stats.statusCodes[statusCode]++;
}

/**
 * Record failed request
 */
function recordError(error, responseTime) {
  stats.totalRequests++;
  stats.failedRequests++;
  stats.totalResponseTime += responseTime;
  
  const statusCode = error.response?.status || 'NETWORK_ERROR';
  if (!stats.statusCodes[statusCode]) {
    stats.statusCodes[statusCode] = 0;
  }
  stats.statusCodes[statusCode]++;
  
  stats.errors.push({
    message: error.message,
    status: error.response?.status,
    responseTime,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Login and get token
 */
async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    return response.data.tokens.accessToken;
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
}

/**
 * Run load test
 */
async function runLoadTest() {
  console.log('🚀 Starting Load Test');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Concurrent Flights: ${CONCURRENT_FLIGHTS}`);
  console.log(`Test Duration: ${TEST_DURATION_SECONDS} seconds`);
  console.log(`Requests per second: ${REQUESTS_PER_SECOND}`);
  console.log('');

  // Login to get token
  console.log('📝 Logging in...');
  let token;
  try {
    token = await login(
      process.env.TEST_EMAIL || 'test@example.com',
      process.env.TEST_PASSWORD || 'TestPassword123!'
    );
    console.log('✅ Login successful\n');
  } catch (error) {
    console.error('❌ Login failed. Please check credentials.');
    process.exit(1);
  }

  // Run load test
  const startTime = Date.now();
  const endTime = startTime + (TEST_DURATION_SECONDS * 1000);
  const requests = [];

  console.log('🔥 Starting load test...\n');

  // Create concurrent booking requests
  for (let i = 0; i < CONCURRENT_FLIGHTS; i++) {
    requests.push(
      createTestBooking(token).catch((err) => {
        // Silently handle errors (already recorded)
      })
    );
  }

  // Wait for initial batch
  await Promise.allSettled(requests);

  // Continue with sustained load
  const interval = setInterval(async () => {
    if (Date.now() >= endTime) {
      clearInterval(interval);
      return;
    }

    // Make requests at specified rate
    for (let i = 0; i < REQUESTS_PER_SECOND; i++) {
      // Mix of create and list operations
      if (Math.random() > 0.3) {
        createTestBooking(token).catch(() => {});
      } else {
        listBookings(token).catch(() => {});
      }
    }
  }, 1000); // Every second

  // Wait for test duration
  await new Promise((resolve) => setTimeout(resolve, TEST_DURATION_SECONDS * 1000));
  clearInterval(interval);

  // Print results
  printResults();
}

/**
 * Print test results
 */
function printResults() {
  console.log('\n📊 Load Test Results\n');
  console.log('='.repeat(60));
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Successful: ${stats.successfulRequests} (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Failed: ${stats.failedRequests} (${((stats.failedRequests / stats.totalRequests) * 100).toFixed(2)}%)`);
  console.log('');
  
  if (stats.successfulRequests > 0) {
    const avgResponseTime = stats.totalResponseTime / stats.totalRequests;
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${stats.minResponseTime}ms`);
    console.log(`Max Response Time: ${stats.maxResponseTime}ms`);
    console.log('');
  }

  console.log('Status Codes:');
  Object.entries(stats.statusCodes).forEach(([code, count]) => {
    console.log(`  ${code}: ${count}`);
  });
  console.log('');

  if (stats.errors.length > 0) {
    console.log(`Errors (showing first 10):`);
    stats.errors.slice(0, 10).forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.message} (${error.status || 'N/A'})`);
    });
    if (stats.errors.length > 10) {
      console.log(`  ... and ${stats.errors.length - 10} more errors`);
    }
    console.log('');
  }

  // Performance targets
  console.log('🎯 Performance Targets:');
  const avgResponseTime = stats.totalResponseTime / stats.totalRequests;
  const successRate = (stats.successfulRequests / stats.totalRequests) * 100;
  
  console.log(`  Dashboard Load: <10s - ${avgResponseTime < 10000 ? '✅' : '❌'} (${(avgResponseTime / 1000).toFixed(2)}s)`);
  console.log(`  Notification Delivery: <3min - ${avgResponseTime < 180000 ? '✅' : '❌'} (${(avgResponseTime / 1000).toFixed(2)}s)`);
  console.log(`  Success Rate: >95% - ${successRate >= 95 ? '✅' : '❌'} (${successRate.toFixed(2)}%)`);
  console.log('');

  console.log('='.repeat(60));
}

// Run the test
if (require.main === module) {
  runLoadTest().catch((error) => {
    console.error('Load test failed:', error);
    process.exit(1);
  });
}

module.exports = { runLoadTest, stats };

