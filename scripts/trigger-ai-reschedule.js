/**
 * Script to manually trigger AI rescheduling for a booking
 * Usage: node scripts/trigger-ai-reschedule.js <booking-id>
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const bookingId = process.argv[2];

if (!bookingId) {
  console.error('❌ Error: Booking ID required');
  console.log('Usage: node scripts/trigger-ai-reschedule.js <booking-id>');
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

async function triggerReschedule() {
  try {
    console.log(`🤖 Triggering AI rescheduling for booking ${bookingId}...`);
    
    // Import the reschedule engine
    const { RescheduleEngine } = require('../backend/dist/functions/ai/rescheduleEngine');
    
    const rescheduleEngine = new RescheduleEngine(pool);
    const options = await rescheduleEngine.generateRescheduleOptions(bookingId);
    
    if (options.length === 0) {
      console.log('⚠️  No reschedule options generated');
      return;
    }
    
    console.log(`✅ Generated ${options.length} reschedule options!`);
    console.log('\nOptions:');
    options.forEach((opt, index) => {
      const confidencePercent = opt.confidenceScore ? (opt.confidenceScore * 100).toFixed(1) : 'N/A';
      console.log(`\n  Option ${index + 1}:`);
      console.log(`    Date/Time: ${opt.datetime}`);
      console.log(`    Confidence: ${confidencePercent}%`);
      console.log(`    Weather: ${JSON.stringify(opt.weatherForecast || [])}`);
    });
    
    // Get booking details for notifications
    const bookingResult = await pool.query(
      `SELECT b.*, 
              u1.email as student_email, 
              u1.first_name as student_first_name,
              u2.email as instructor_email,
              u2.first_name as instructor_first_name
       FROM bookings b
       JOIN users u1 ON b.student_id = u1.id
       JOIN users u2 ON b.instructor_id = u2.id
       WHERE b.id = $1`,
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      console.error('❌ Booking not found');
      return;
    }
    
    const booking = bookingResult.rows[0];
    
    // Update booking status to RESCHEDULING
    await pool.query(
      `UPDATE bookings 
       SET status = 'RESCHEDULING', updated_at = NOW() 
       WHERE id = $1`,
      [bookingId]
    );
    
    console.log('\n✅ Booking status updated to RESCHEDULING');
    
    // Send notifications
    try {
      const { NotificationTrigger } = require('../backend/dist/services/notificationTrigger');
      const notificationTrigger = new NotificationTrigger(pool);
      
      await notificationTrigger.triggerRescheduleOptionsAvailable(booking, options.length);
      console.log('📧 Notifications sent to student and instructor');
    } catch (notifError) {
      console.warn('⚠️  Failed to send notifications:', notifError.message);
      console.log('   (Notifications are optional - reschedule options were still generated)');
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

triggerReschedule();

