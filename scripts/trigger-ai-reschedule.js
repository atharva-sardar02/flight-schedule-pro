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
      console.log(`\n  Option ${index + 1}:`);
      console.log(`    Date/Time: ${opt.datetime}`);
      console.log(`    Confidence: ${opt.confidenceScore}%`);
      console.log(`    Weather: ${JSON.stringify(opt.weatherForecast)}`);
    });
    
    // Update booking status to RESCHEDULING
    await pool.query(
      `UPDATE bookings 
       SET status = 'RESCHEDULING', updated_at = NOW() 
       WHERE id = $1`,
      [bookingId]
    );
    
    console.log('\n✅ Booking status updated to RESCHEDULING');
    console.log('📧 Users will be notified about the reschedule options');
    
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

