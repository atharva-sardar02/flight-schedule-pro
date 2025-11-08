/**
 * Test Environment Setup
 * Configures the test environment before all tests run
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Test database configuration
const TEST_DB_CONFIG = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'flight_schedule_pro_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
};

let pool: Pool;

/**
 * Global setup - runs once before all test files
 */
export default async function globalSetup() {
  console.log('🔧 Setting up test environment...');

  try {
    // Create database pool
    pool = new Pool(TEST_DB_CONFIG);

    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection established');

    // Drop and recreate test database schema
    await cleanDatabase();

    // Run migrations
    await runMigrations();

    // Load fixtures
    await loadFixtures();

    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Test environment setup failed:', error);
    throw error;
  }
}

/**
 * Clean the test database
 */
async function cleanDatabase() {
  console.log('🧹 Cleaning test database...');

  const tables = [
    'audit_log',
    'notifications',
    'preference_rankings',
    'reschedule_options',
    'availability_overrides',
    'availability_patterns',
    'bookings',
    'users',
  ];

  for (const table of tables) {
    await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
  }

  console.log('✅ Database cleaned');
}

/**
 * Run database migrations
 */
async function runMigrations() {
  console.log('📦 Running migrations...');

  const migrationsDir = path.join(__dirname, '../database/migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      await pool.query(sql);
      console.log(`✅ Applied migration: ${file}`);
    } catch (error: any) {
      // Skip if migration already applied or not critical
      if (!error.message.includes('already exists')) {
        console.warn(`⚠️  Migration ${file} warning:`, error.message);
      }
    }
  }

  console.log('✅ Migrations complete');
}

/**
 * Load test fixtures
 */
async function loadFixtures() {
  console.log('📝 Loading test fixtures...');

  const fixturesDir = path.join(__dirname, 'fixtures');

  // Load users
  const users = JSON.parse(
    fs.readFileSync(path.join(fixturesDir, 'users.json'), 'utf8')
  );

  for (const user of users) {
    await pool.query(
      `INSERT INTO users (id, cognito_user_id, email, name, phone_number, role, training_level, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        user.id,
        user.cognitoUserId,
        user.email,
        user.name,
        user.phoneNumber,
        user.role,
        user.trainingLevel,
        user.createdAt,
        user.updatedAt,
      ]
    );
  }

  console.log(`✅ Loaded ${users.length} test users`);

  // Load bookings
  const bookings = JSON.parse(
    fs.readFileSync(path.join(fixturesDir, 'bookings.json'), 'utf8')
  );

  for (const booking of bookings) {
    await pool.query(
      `INSERT INTO bookings (
        id, student_id, instructor_id, scheduled_time,
        departure_airport, departure_lat, departure_lon,
        arrival_airport, arrival_lat, arrival_lon,
        aircraft_id, training_level, status, version,
        created_at, updated_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO NOTHING`,
      [
        booking.id,
        booking.studentId,
        booking.instructorId,
        booking.scheduledTime,
        booking.departureAirport,
        booking.departureLat,
        booking.departureLon,
        booking.arrivalAirport,
        booking.arrivalLat,
        booking.arrivalLon,
        booking.aircraftId,
        booking.trainingLevel,
        booking.status,
        booking.version,
        booking.createdAt,
        booking.updatedAt,
      ]
    );
  }

  console.log(`✅ Loaded ${bookings.length} test bookings`);
}

/**
 * Get the test database pool
 */
export function getTestPool(): Pool {
  return pool;
}

/**
 * Close the database pool
 */
export async function closePool() {
  if (pool) {
    await pool.end();
  }
}



