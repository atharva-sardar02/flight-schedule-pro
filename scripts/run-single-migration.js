/**
 * Run a single SQL migration file
 * Usage: node scripts/run-single-migration.js <migration-file-path>
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Error: Migration file path required');
  console.log('Usage: node scripts/run-single-migration.js <migration-file-path>');
  process.exit(1);
}

if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Error: Migration file not found: ${migrationFile}`);
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

async function runMigration() {
  try {
    console.log(`📄 Reading migration file: ${migrationFile}`);
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('🔄 Running migration...');
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

