/**
 * Quick script to set a booking to AT_RISK status
 * Usage: node scripts/set-booking-at-risk.js <booking-id>
 */

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

const bookingId = process.argv[2];

if (!bookingId) {
  console.error('❌ Error: Booking ID required');
  console.log('Usage: node scripts/set-booking-at-risk.js <booking-id>');
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

async function setBookingAtRisk() {
  try {
    console.log(`🔄 Setting booking ${bookingId} to AT_RISK...`);
    
    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'AT_RISK', updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, status, scheduled_datetime, student_id, instructor_id`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      console.error(`❌ Booking ${bookingId} not found`);
      process.exit(1);
    }

    const booking = result.rows[0];
    console.log('✅ Booking updated successfully!');
    console.log('\nBooking Details:');
    console.log(`  ID: ${booking.id}`);
    console.log(`  Status: ${booking.status}`);
    console.log(`  Scheduled: ${booking.scheduled_datetime}`);
    console.log(`  Student ID: ${booking.student_id}`);
    console.log(`  Instructor ID: ${booking.instructor_id}`);
    
  } catch (error) {
    console.error('❌ Error updating booking:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setBookingAtRisk();

