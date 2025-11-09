/**
 * Quick script to check if availability_patterns table exists
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function checkTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'availability_patterns'
      );
    `);
    
    if (result.rows[0].exists) {
      console.log('✅ availability_patterns table exists!');
      
      // Check if it has any data
      const count = await pool.query('SELECT COUNT(*) FROM availability_patterns');
      console.log(`📊 Current availability patterns: ${count.rows[0].count}`);
      
      return true;
    } else {
      console.log('❌ availability_patterns table does NOT exist');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

checkTable();

