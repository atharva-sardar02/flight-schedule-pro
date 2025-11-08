# Database Setup Guide

This directory contains the PostgreSQL database schema, migrations, and seed data for Flight Schedule Pro.

## Directory Structure

```
database/
├── schema.sql              # Complete schema reference (all tables)
├── migrations/             # Sequential migration files
│   ├── 001_create_users_table.sql
│   ├── 002_create_bookings_table.sql
│   ├── 003_create_availability_tables.sql
│   ├── 004_create_notifications_table.sql
│   ├── 005_create_audit_log_table.sql
│   └── 006_create_indexes.sql
└── seeds/                  # Development seed data
    ├── dev_users.sql
    ├── dev_bookings.sql
    └── dev_availability.sql
```

## Prerequisites

1. **PostgreSQL 14+** installed and running
2. **Database credentials** configured in `.env` file:
   ```env
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=flight_schedule_pro
   DATABASE_USER=postgres
   DATABASE_PASSWORD=your_password
   ```

## Setup Instructions

### 1. Create Database

```bash
createdb flight_schedule_pro
```

Or using psql:
```sql
CREATE DATABASE flight_schedule_pro;
```

### 2. Run Migrations

Run migrations in order (001 through 006):

```bash
# Option 1: Run all migrations sequentially
psql -d flight_schedule_pro -f database/migrations/001_create_users_table.sql
psql -d flight_schedule_pro -f database/migrations/002_create_bookings_table.sql
psql -d flight_schedule_pro -f database/migrations/003_create_availability_tables.sql
psql -d flight_schedule_pro -f database/migrations/004_create_notifications_table.sql
psql -d flight_schedule_pro -f database/migrations/005_create_audit_log_table.sql
psql -d flight_schedule_pro -f database/migrations/006_create_indexes.sql

# Option 2: Run complete schema (faster, but no migration history)
psql -d flight_schedule_pro -f database/schema.sql
```

### 3. Load Seed Data (Development Only)

```bash
psql -d flight_schedule_pro -f database/seeds/dev_users.sql
psql -d flight_schedule_pro -f database/seeds/dev_bookings.sql
psql -d flight_schedule_pro -f database/seeds/dev_availability.sql
```

### 4. Verify Setup

```bash
# Connect to database
psql -d flight_schedule_pro

# Check tables
\dt

# Check users
SELECT id, email, role, first_name, last_name FROM users;

# Check bookings
SELECT id, status, training_level, scheduled_datetime FROM bookings;

# Exit
\q
```

## Database Schema Overview

### Core Tables

- **users** - Students, instructors, and admins
- **bookings** - Flight training lessons
- **instructor_availability** - Weekly recurring availability for instructors
- **student_availability** - Weekly recurring availability for students
- **availability_overrides** - One-time availability exceptions

### Rescheduling Tables

- **reschedule_options** - AI-generated alternative time slots
- **preference_rankings** - User preferences for reschedule options

### System Tables

- **notifications** - Email and in-app notifications
- **audit_log** - Immutable event log for all system actions

## Seed Data

The seed data includes:

- **2 Instructors**: John Smith, Sarah Johnson
- **3 Students**: Michael Brown, Emily Davis, David Wilson
- **1 Admin**: Admin User
- **5 Sample Bookings**: Various statuses and training levels
- **Availability Patterns**: Weekly recurring schedules for all users
- **Availability Overrides**: Example one-time exceptions

## Migration Notes

- Migrations must be run in order (001 → 006)
- Each migration is idempotent (can be run multiple times safely)
- The `schema.sql` file contains the complete schema for reference
- Foreign key constraints ensure data integrity

## Troubleshooting

### Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env` file
- Ensure database exists: `psql -l | grep flight_schedule_pro`

### Migration Errors
- Ensure previous migrations completed successfully
- Check for existing tables: `\dt` in psql
- Drop and recreate if needed: `DROP DATABASE flight_schedule_pro; CREATE DATABASE flight_schedule_pro;`

### Seed Data Issues
- Ensure migrations completed first
- Check foreign key constraints match seed data IDs
- Verify user IDs in seed files match dev_users.sql

## Production Deployment

For production:
1. Do NOT run seed data files
2. Use migration files in order
3. Set up proper database backups
4. Configure connection pooling (RDS Proxy recommended)
5. Enable SSL connections

