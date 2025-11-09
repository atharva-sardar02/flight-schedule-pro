/**
 * Check availability patterns for a user
 * Usage: node scripts/check-user-availability.js <user-id>
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: User ID required');
  console.log('Usage: node scripts/check-user-availability.js <user-id>');
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

async function checkAvailability() {
  try {
    console.log(`🔍 Checking availability for user: ${userId}\n`);
    
    // Check recurring patterns
    const patterns = await pool.query(
      `SELECT id, day_of_week, start_time, end_time, is_active
       FROM availability_patterns
       WHERE user_id = $1
       ORDER BY day_of_week, start_time`,
      [userId]
    );
    
    console.log(`📅 Recurring Patterns (${patterns.rows.length}):`);
    if (patterns.rows.length === 0) {
      console.log('  ⚠️  No recurring patterns found!');
    } else {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      patterns.rows.forEach(p => {
        const dayName = dayNames[p.day_of_week];
        const status = p.is_active ? '✅ Active' : '❌ Inactive';
        console.log(`  ${status} - ${dayName}: ${p.start_time} to ${p.end_time}`);
      });
    }
    
    // Check overrides for next 30 days
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];
    
    const overrides = await pool.query(
      `SELECT id, override_date, start_time, end_time, is_blocked, reason
       FROM availability_overrides
       WHERE user_id = $1
         AND override_date >= $2
         AND override_date <= $3
       ORDER BY override_date`,
      [userId, todayStr, futureStr]
    );
    
    console.log(`\n📌 Overrides (next 30 days, ${overrides.rows.length}):`);
    if (overrides.rows.length === 0) {
      console.log('  No overrides found');
    } else {
      overrides.rows.forEach(o => {
        const type = o.is_blocked ? '🚫 Blocked' : '✅ Available';
        const timeRange = o.start_time && o.end_time 
          ? `${o.start_time} to ${o.end_time}`
          : 'All day';
        console.log(`  ${type} - ${o.override_date}: ${timeRange}${o.reason ? ` (${o.reason})` : ''}`);
      });
    }
    
    console.log('\n💡 If no patterns found, run: node scripts/setup-user-availability.js <user-id>');
    
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

checkAvailability();

