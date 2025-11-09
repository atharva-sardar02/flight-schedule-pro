/**
 * Script to set up default availability for a single user
 * This allows bookings to be created for demo purposes
 * Usage: node scripts/setup-user-availability.js <user-id>
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: User ID required');
  console.log('Usage: node scripts/setup-user-availability.js <user-id>');
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

async function setupAvailability() {
  try {
    console.log('📅 Setting up availability...');
    console.log(`  User ID: ${userId}\n`);
    
    // Set up availability for all days of week, 8AM-6PM
    const days = [0, 1, 2, 3, 4, 5, 6]; // Sunday through Saturday
    
    for (const dayOfWeek of days) {
      // Check if availability pattern already exists
      const existing = await pool.query(
        `SELECT id FROM availability_patterns 
         WHERE user_id = $1 AND day_of_week = $2`,
        [userId, dayOfWeek]
      );
      
      if (existing.rows.length === 0) {
        // Create availability pattern: 8AM-6PM
        await pool.query(
          `INSERT INTO availability_patterns (user_id, day_of_week, start_time, end_time, is_active, created_at, updated_at)
           VALUES ($1, $2, '08:00:00', '18:00:00', true, NOW(), NOW())
           ON CONFLICT (user_id, day_of_week, start_time, end_time) DO NOTHING`,
          [userId, dayOfWeek]
        );
        console.log(`  ✅ Created availability pattern for ${getDayName(dayOfWeek)}`);
      } else {
        console.log(`  ⏭️  Availability pattern for ${getDayName(dayOfWeek)} already exists`);
      }
    }
    
    console.log('\n✅ Availability setup complete!');
    console.log('📝 User now has availability:');
    console.log('   - Monday through Sunday');
    console.log('   - 8:00 AM to 6:00 PM');
    console.log('\n📅 Bookings can now be created!');
    
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

function getDayName(dayOfWeek) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

setupAvailability();

