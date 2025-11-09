/**
 * Cleanup Incomplete Reschedules
 * 
 * This script finds bookings stuck in RESCHEDULING status and:
 * 1. Lists all incomplete reschedules
 * 2. Optionally reverts them back to AT_RISK or CONFIRMED
 * 3. Optionally cleans up orphaned reschedule options and preference rankings
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
  host: process.env.DATABASE_HOST || process.env.DB_HOST,
  port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432'),
  database: process.env.DATABASE_NAME || process.env.DB_NAME,
  user: process.env.DATABASE_USER || process.env.DB_USER,
  password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : undefined,
});

const action = process.argv[2]; // 'list', 'revert', or 'cleanup'
const bookingId = process.argv[3]; // Optional: specific booking ID

async function listIncompleteReschedules() {
  try {
    console.log('🔍 Finding bookings stuck in RESCHEDULING status...\n');
    
    let query = `
      SELECT 
        b.id,
        b.status,
        b.scheduled_time,
        b.departure_airport,
        b.arrival_airport,
        u1.email as student_email,
        u2.email as instructor_email,
        COUNT(DISTINCT ro.id) as options_count,
        COUNT(DISTINCT pr.id) as preferences_count
      FROM bookings b
      LEFT JOIN users u1 ON b.student_id = u1.id
      LEFT JOIN users u2 ON b.instructor_id = u2.id
      LEFT JOIN reschedule_options ro ON ro.booking_id = b.id
      LEFT JOIN preference_rankings pr ON pr.booking_id = b.id
      WHERE b.status = 'RESCHEDULING'
    `;
    
    const params = [];
    if (bookingId) {
      query += ' AND b.id = $1';
      params.push(bookingId);
    }
    
    query += ' GROUP BY b.id, b.status, b.scheduled_time, b.departure_airport, b.arrival_airport, u1.email, u2.email ORDER BY b.scheduled_time';
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      console.log('✅ No bookings stuck in RESCHEDULING status');
      return [];
    }
    
    console.log(`Found ${result.rows.length} booking(s) stuck in RESCHEDULING:\n`);
    
    result.rows.forEach((booking, index) => {
      console.log(`${index + 1}. Booking ID: ${booking.id}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Scheduled: ${new Date(booking.scheduled_time).toLocaleString()}`);
      console.log(`   Route: ${booking.departure_airport} → ${booking.arrival_airport}`);
      console.log(`   Student: ${booking.student_email}`);
      console.log(`   Instructor: ${booking.instructor_email}`);
      console.log(`   Reschedule Options: ${booking.options_count}`);
      console.log(`   Preference Rankings: ${booking.preferences_count}`);
      console.log('');
    });
    
    return result.rows;
  } catch (error) {
    console.error('❌ Error listing incomplete reschedules:', error.message);
    throw error;
  }
}

async function revertBooking(bookingId, targetStatus = 'AT_RISK') {
  try {
    console.log(`🔄 Reverting booking ${bookingId} from RESCHEDULING to ${targetStatus}...`);
    
    // Check if booking exists and is in RESCHEDULING status
    const checkResult = await pool.query(
      'SELECT id, status FROM bookings WHERE id = $1',
      [bookingId]
    );
    
    if (checkResult.rows.length === 0) {
      console.error(`❌ Booking ${bookingId} not found`);
      return false;
    }
    
    if (checkResult.rows[0].status !== 'RESCHEDULING') {
      console.warn(`⚠️  Booking ${bookingId} is not in RESCHEDULING status (current: ${checkResult.rows[0].status})`);
      return false;
    }
    
    // Revert status
    await pool.query(
      `UPDATE bookings 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2`,
      [targetStatus, bookingId]
    );
    
    console.log(`✅ Booking ${bookingId} reverted to ${targetStatus}`);
    return true;
  } catch (error) {
    console.error(`❌ Error reverting booking ${bookingId}:`, error.message);
    throw error;
  }
}

async function cleanupOrphanedData(bookingId) {
  try {
    console.log(`🧹 Cleaning up orphaned data for booking ${bookingId}...`);
    
    // Delete preference rankings
    const prResult = await pool.query(
      'DELETE FROM preference_rankings WHERE booking_id = $1',
      [bookingId]
    );
    console.log(`   Deleted ${prResult.rowCount} preference ranking(s)`);
    
    // Delete reschedule options
    const roResult = await pool.query(
      'DELETE FROM reschedule_options WHERE booking_id = $1',
      [bookingId]
    );
    console.log(`   Deleted ${roResult.rowCount} reschedule option(s)`);
    
    console.log(`✅ Cleanup complete for booking ${bookingId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error cleaning up booking ${bookingId}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    if (!action || !['list', 'revert', 'cleanup', 'full'].includes(action)) {
      console.log('Usage:');
      console.log('  node scripts/cleanup-incomplete-reschedules.js list [bookingId]');
      console.log('  node scripts/cleanup-incomplete-reschedules.js revert <bookingId> [targetStatus]');
      console.log('  node scripts/cleanup-incomplete-reschedules.js cleanup <bookingId>');
      console.log('  node scripts/cleanup-incomplete-reschedules.js full <bookingId> [targetStatus]');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/cleanup-incomplete-reschedules.js list');
      console.log('  node scripts/cleanup-incomplete-reschedules.js revert 4db08e23-4a3f-4edf-b4bf-b40f85ac25de AT_RISK');
      console.log('  node scripts/cleanup-incomplete-reschedules.js cleanup 4db08e23-4a3f-4edf-b4bf-b40f85ac25de');
      console.log('  node scripts/cleanup-incomplete-reschedules.js full 4db08e23-4a3f-4edf-b4bf-b40f85ac25de AT_RISK');
      process.exit(1);
    }
    
    if (action === 'list') {
      await listIncompleteReschedules();
    } else if (action === 'revert') {
      if (!bookingId) {
        console.error('❌ Error: Booking ID required for revert action');
        process.exit(1);
      }
      const targetStatus = process.argv[4] || 'AT_RISK';
      await revertBooking(bookingId, targetStatus);
    } else if (action === 'cleanup') {
      if (!bookingId) {
        console.error('❌ Error: Booking ID required for cleanup action');
        process.exit(1);
      }
      await cleanupOrphanedData(bookingId);
    } else if (action === 'full') {
      if (!bookingId) {
        console.error('❌ Error: Booking ID required for full action');
        process.exit(1);
      }
      const targetStatus = process.argv[4] || 'AT_RISK';
      await cleanupOrphanedData(bookingId);
      await revertBooking(bookingId, targetStatus);
    }
    
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

main();

