/**
 * Script to create a booking between student100 and instructor100
 * 
 * Usage:
 *   node scripts/create-booking.js
 * 
 * Or with custom values:
 *   API_BASE_URL=http://3.87.74.62:3001 node scripts/create-booking.js
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// User credentials
const STUDENT_EMAIL = 'student100@gmail.com';
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD || 'Student100!'; // Update with actual password

// User IDs
const STUDENT_ID = '71ef600e-d244-4ace-8a17-a42948cf4a5a';
const INSTRUCTOR_ID = 'd8f386b9-9cfa-4405-85d0-8f433a1ecaf9';

// Booking data
const BOOKING_DATA = {
  studentId: STUDENT_ID,
  instructorId: INSTRUCTOR_ID,
  departureAirport: 'KJFK', // JFK Airport, New York
  arrivalAirport: 'KLAX',   // LAX Airport, Los Angeles
  departureLatitude: 40.6413,
  departureLongitude: -73.7781,
  arrivalLatitude: 33.9425,
  arrivalLongitude: -118.4081,
  scheduledDatetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  trainingLevel: 'STUDENT_PILOT',
  durationMinutes: 120
};

async function login() {
  console.log('🔐 Logging in as student...');
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: STUDENT_EMAIL,
      password: STUDENT_PASSWORD,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log('✅ Login successful');
  return data.accessToken;
}

async function createBooking(accessToken) {
  console.log('\n📅 Creating booking...');
  console.log('Booking details:');
  console.log(`  Student: ${STUDENT_ID}`);
  console.log(`  Instructor: ${INSTRUCTOR_ID}`);
  console.log(`  Route: ${BOOKING_DATA.departureAirport} → ${BOOKING_DATA.arrivalAirport}`);
  console.log(`  Scheduled: ${BOOKING_DATA.scheduledDatetime}`);
  console.log(`  Training Level: ${BOOKING_DATA.trainingLevel}`);

  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(BOOKING_DATA),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Booking creation failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log('\n✅ Booking created successfully!');
  console.log('\nBooking details:');
  console.log(JSON.stringify(data.booking, null, 2));
  return data.booking;
}

async function main() {
  try {
    console.log('='.repeat(60));
    console.log('Creating Booking: student100 ↔ instructor100');
    console.log('='.repeat(60));
    console.log(`API Base URL: ${API_BASE_URL}\n`);

    // Step 1: Login
    const accessToken = await login();

    // Step 2: Create booking
    const booking = await createBooking(accessToken);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Success! Booking ID:', booking.id);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('Login failed')) {
      console.error('\n💡 Tip: Make sure you have the correct password.');
      console.error('   You can set it via: STUDENT_PASSWORD=yourpassword node scripts/create-booking.js');
    }
    process.exit(1);
  }
}

// Run the script
main();

