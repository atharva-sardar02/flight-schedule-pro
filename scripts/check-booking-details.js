/**
 * Check booking details including student and instructor IDs
 * Usage: node scripts/check-booking-details.js <booking-id>
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const bookingId = process.argv[2];

if (!bookingId) {
  console.error('❌ Error: Booking ID required');
  console.log('Usage: node scripts/check-booking-details.js <booking-id>');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : undefined,
});

async function checkBooking() {
  try {
    console.log(`🔍 Checking booking ${bookingId}...\n`);
    
    const result = await pool.query(
      `SELECT b.*, 
              s.id as student_id, s.email as student_email, s.first_name as student_first_name,
              i.id as instructor_id, i.email as instructor_email, i.first_name as instructor_first_name
       FROM bookings b
       JOIN users s ON b.student_id = s.id
       JOIN users i ON b.instructor_id = i.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      console.error(`❌ Booking ${bookingId} not found`);
      process.exit(1);
    }

    const booking = result.rows[0];
    
    console.log('📋 Booking Details:');
    console.log(`  ID: ${booking.id}`);
    console.log(`  Status: ${booking.status}`);
    console.log(`  Scheduled: ${booking.scheduled_datetime}`);
    console.log(`  Student ID: ${booking.student_id}`);
    console.log(`  Student: ${booking.student_first_name} (${booking.student_email})`);
    console.log(`  Instructor ID: ${booking.instructor_id}`);
    console.log(`  Instructor: ${booking.instructor_first_name} (${booking.instructor_email})`);
    console.log(`  Route: ${booking.departure_airport} → ${booking.arrival_airport}`);
    console.log(`  Training Level: ${booking.training_level}`);
    
    // Check if date is valid
    const scheduledDate = new Date(booking.scheduled_datetime);
    if (isNaN(scheduledDate.getTime())) {
      console.log('\n⚠️  WARNING: Scheduled date is invalid!');
    } else {
      const now = new Date();
      const isPast = scheduledDate < now;
      console.log(`\n  Date Status: ${isPast ? '⚠️  IN THE PAST' : '✅ In the future'}`);
      console.log(`  Days from now: ${Math.floor((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkBooking();

