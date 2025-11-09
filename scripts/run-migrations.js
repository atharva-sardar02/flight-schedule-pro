/**
 * Run database migrations
 * This script runs all migration files in order
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

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

const migrationsDir = path.resolve(__dirname, '../database/migrations');
const migrationFiles = [
  '001_create_users_table.sql',
  '002_create_bookings_table.sql',
  '003_create_availability_tables.sql',
  '003b_create_availability_patterns.sql',
  '004_create_notifications_table.sql',
  '004_performance_indexes.sql',
  '005_create_audit_log_table.sql',
  '006_create_indexes.sql',
];

async function runMigration(filename) {
  const filePath = path.join(migrationsDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${filename} (file not found)`);
    return;
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`\n📄 Running ${filename}...`);
  
  try {
    await pool.query(sql);
    console.log(`✅ ${filename} completed`);
  } catch (error) {
    // Ignore "already exists" errors
    if (error.message.includes('already exists') || error.code === '42P07') {
      console.log(`⚠️  ${filename} - tables/indexes already exist (skipping)`);
    } else {
      console.error(`❌ ${filename} failed:`, error.message);
      throw error;
    }
  }
}

async function main() {
  console.log('🚀 Starting database migrations...\n');
  Database:', process.env.DATABASE_NAME);
  console.log('  Host:', process.env.DATABASE_HOST);
  console.log('  User:', process.env.DATABASE_USER);
  console.log('');

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Run migrations in order
    for (const file of migrationFiles) {
      await runMigration(file);
    }

    console.log('\n✅ All migrations completed!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

