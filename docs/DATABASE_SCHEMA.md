# Database Schema Documentation

## Overview

Flight Schedule Pro uses PostgreSQL 14+ with a relational schema designed for ACID compliance, data integrity, and performance.

---

## Database Connection

**Connection String Format:**
```
postgresql://username:password@host:port/database
```

**Environment Variables:**
- `DATABASE_HOST` - Database hostname
- `DATABASE_PORT` - Database port (default: 5432)
- `DATABASE_NAME` - Database name
- `DATABASE_USER` - Database username
- `DATABASE_PASSWORD` - Database password

---

## Tables

### users

User accounts linked to AWS Cognito.

**Columns:**
- `id` (UUID, PRIMARY KEY) - Database user ID
- `cognito_user_id` (VARCHAR(255), UNIQUE, NOT NULL) - Cognito user ID
- `email` (VARCHAR(255), UNIQUE, NOT NULL) - User email
- `first_name` (VARCHAR(100), NOT NULL) - First name
- `last_name` (VARCHAR(100), NOT NULL) - Last name
- `phone_number` (VARCHAR(20)) - Phone number (optional)
- `role` (VARCHAR(20), NOT NULL) - User role: `STUDENT`, `INSTRUCTOR`, `ADMIN`
- `training_level` (VARCHAR(20)) - Training level: `STUDENT_PILOT`, `PRIVATE_PILOT`, `INSTRUMENT_RATED`
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Indexes:**
- Primary key on `id`
- Unique index on `email`
- Unique index on `cognito_user_id`
- Index on `role` for filtering

**Constraints:**
- `role` must be one of: `STUDENT`, `INSTRUCTOR`, `ADMIN`
- `training_level` must be one of: `STUDENT_PILOT`, `PRIVATE_PILOT`, `INSTRUMENT_RATED` (if provided)

---

### bookings

Flight booking records.

**Columns:**
- `id` (UUID, PRIMARY KEY) - Booking ID
- `student_id` (UUID, NOT NULL, FOREIGN KEY → users.id) - Student user ID
- `instructor_id` (UUID, NOT NULL, FOREIGN KEY → users.id) - Instructor user ID
- `aircraft_id` (VARCHAR(50)) - Aircraft N-number (optional)
- `departure_airport` (VARCHAR(10), NOT NULL) - Departure airport code (e.g., "KJFK")
- `arrival_airport` (VARCHAR(10), NOT NULL) - Arrival airport code (e.g., "KLAX")
- `departure_latitude` (DECIMAL(10, 8), NOT NULL) - Departure latitude
- `departure_longitude` (DECIMAL(11, 8), NOT NULL) - Departure longitude
- `arrival_latitude` (DECIMAL(10, 8), NOT NULL) - Arrival latitude
- `arrival_longitude` (DECIMAL(11, 8), NOT NULL) - Arrival longitude
- `scheduled_datetime` (TIMESTAMP WITH TIME ZONE, NOT NULL) - Scheduled flight time
- `status` (VARCHAR(20), NOT NULL, DEFAULT 'CONFIRMED') - Booking status
- `training_level` (VARCHAR(20), NOT NULL) - Student training level
- `duration_minutes` (INTEGER, NOT NULL, DEFAULT 60) - Flight duration in minutes
- `original_booking_id` (UUID, FOREIGN KEY → bookings.id) - For rescheduled bookings
- `rescheduled_to_datetime` (TIMESTAMP WITH TIME ZONE) - New scheduled time after reschedule
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Indexes:**
- Primary key on `id`
- Index on `student_id` for student queries
- Index on `instructor_id` for instructor queries
- Index on `scheduled_datetime` for date range queries
- Index on `status` for filtering
- Composite index on `(status, scheduled_datetime)` for weather monitor queries
- Composite index on `(student_id, status)` for student dashboard
- Composite index on `(instructor_id, status)` for instructor dashboard
- Partial index on `(status, scheduled_datetime)` WHERE `status IN ('CONFIRMED', 'AT_RISK')` for weather monitor

**Constraints:**
- `status` must be one of: `CONFIRMED`, `AT_RISK`, `RESCHEDULING`, `CANCELLED`, `COMPLETED`
- `training_level` must be one of: `STUDENT_PILOT`, `PRIVATE_PILOT`, `INSTRUMENT_RATED`
- Foreign key constraints ensure data integrity

**Status Values:**
- `CONFIRMED` - Booking is confirmed and weather is valid
- `AT_RISK` - Weather conflict detected, monitoring
- `RESCHEDULING` - AI reschedule options generated, awaiting preferences
- `CANCELLED` - Booking cancelled
- `COMPLETED` - Flight completed

---

### availability_patterns

Weekly recurring availability patterns for users.

**Columns:**
- `id` (UUID, PRIMARY KEY) - Pattern ID
- `user_id` (UUID, NOT NULL, FOREIGN KEY → users.id) - User ID
- `day_of_week` (INTEGER, NOT NULL) - Day of week (0=Sunday, 6=Saturday)
- `start_time` (TIME, NOT NULL) - Start time (HH:MM format)
- `end_time` (TIME, NOT NULL) - End time (HH:MM format)
- `is_active` (BOOLEAN, NOT NULL, DEFAULT true) - Whether pattern is active
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Indexes:**
- Primary key on `id`
- Composite index on `(user_id, day_of_week)` for availability queries
- Index on `is_active` for filtering active patterns

**Constraints:**
- `day_of_week` must be between 0 and 6
- `end_time` must be after `start_time`
- Unique constraint on `(user_id, day_of_week, start_time, end_time)` prevents duplicates

---

### availability_overrides

One-time availability overrides (blocks or additions).

**Columns:**
- `id` (UUID, PRIMARY KEY) - Override ID
- `user_id` (UUID, NOT NULL, FOREIGN KEY → users.id) - User ID
- `override_date` (DATE, NOT NULL) - Date of override
- `start_time` (TIME) - Start time (optional, null = entire day)
- `end_time` (TIME) - End time (optional, null = entire day)
- `is_blocked` (BOOLEAN, NOT NULL, DEFAULT true) - true = not available, false = available
- `reason` (VARCHAR(255)) - Reason for override
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp

**Indexes:**
- Primary key on `id`
- Index on `user_id` for user queries
- Index on `override_date` for date range queries
- Composite index on `(user_id, override_date)` for availability computation

**Constraints:**
- Unique constraint on `(user_id, override_date, start_time, end_time)` prevents duplicates

---

### reschedule_options

AI-generated reschedule options for bookings.

**Columns:**
- `id` (UUID, PRIMARY KEY) - Option ID
- `booking_id` (UUID, NOT NULL, FOREIGN KEY → bookings.id) - Booking ID
- `suggested_datetime` (TIMESTAMP WITH TIME ZONE, NOT NULL) - Suggested new time
- `weather_forecast` (JSONB) - Weather forecast data for this time
- `ai_confidence_score` (DECIMAL(3, 2)) - AI confidence (0.00 to 1.00)
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp

**Indexes:**
- Primary key on `id`
- Index on `booking_id` for option queries
- Index on `suggested_datetime` for time-based queries

**Note:** Options are deleted and regenerated when new options are created for a booking.

---

### preference_rankings

User preference submissions for reschedule options.

**Columns:**
- `id` (UUID, PRIMARY KEY) - Preference ID
- `booking_id` (UUID, NOT NULL, FOREIGN KEY → bookings.id) - Booking ID
- `user_id` (UUID, NOT NULL, FOREIGN KEY → users.id) - User ID (student or instructor)
- `option1_id` (UUID, FOREIGN KEY → reschedule_options.id) - First choice option ID
- `option2_id` (UUID, FOREIGN KEY → reschedule_options.id) - Second choice option ID
- `option3_id` (UUID, FOREIGN KEY → reschedule_options.id) - Third choice option ID
- `unavailable_option_ids` (UUID[]) - Array of option IDs marked unavailable
- `deadline` (TIMESTAMP WITH TIME ZONE, NOT NULL) - Preference submission deadline
- `submitted_at` (TIMESTAMP WITH TIME ZONE) - Submission timestamp (null if not submitted)
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp

**Indexes:**
- Primary key on `id`
- Composite index on `(booking_id, user_id)` for preference queries
- Index on `deadline` for deadline enforcement queries

**Constraints:**
- Unique constraint on `(booking_id, user_id)` ensures one preference per user per booking
- At least one option must be ranked (option1_id, option2_id, or option3_id)

**Deadline Calculation:**
- `min(30 minutes before departure, 12 hours after notification)`
- Enforced at API level (403 Forbidden after deadline)

---

### notifications

In-app notifications for users.

**Columns:**
- `id` (UUID, PRIMARY KEY) - Notification ID
- `user_id` (UUID, NOT NULL, FOREIGN KEY → users.id) - User ID
- `booking_id` (UUID, FOREIGN KEY → bookings.id) - Related booking (optional)
- `type` (VARCHAR(50), NOT NULL) - Notification type
- `title` (VARCHAR(255), NOT NULL) - Notification title
- `message` (TEXT, NOT NULL) - Notification message
- `read` (BOOLEAN, NOT NULL, DEFAULT false) - Read status
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp

**Indexes:**
- Primary key on `id`
- Composite index on `(user_id, read)` for unread notifications query
- Index on `created_at` for sorting

**Notification Types:**
- `WEATHER_ALERT` - Weather conflict detected
- `OPTIONS_AVAILABLE` - Reschedule options generated
- `DEADLINE_REMINDER` - 2 hours before deadline
- `CONFIRMATION` - Reschedule confirmed
- `ESCALATION` - Manual escalation required

---

### audit_log

Immutable audit trail for all significant actions.

**Columns:**
- `id` (UUID, PRIMARY KEY) - Audit log entry ID
- `entity_type` (VARCHAR(50), NOT NULL) - Entity type (booking, user, etc.)
- `entity_id` (UUID, NOT NULL) - Entity ID
- `action` (VARCHAR(100), NOT NULL) - Action performed
- `user_id` (UUID, FOREIGN KEY → users.id) - User who performed action (null for system)
- `metadata` (JSONB) - Additional metadata
- `created_at` (TIMESTAMP WITH TIME ZONE) - Timestamp

**Indexes:**
- Primary key on `id`
- Composite index on `(entity_type, entity_id, created_at)` for entity history
- Index on `created_at` for time-based queries
- Index on `action` for action-based queries

**Key Points:**
- Immutable (no updates or deletes)
- Comprehensive logging for compliance
- Queryable for analytics and debugging

---

## Relationships

### User → Bookings
- One user (student) can have many bookings
- One user (instructor) can have many bookings
- Foreign key constraints ensure referential integrity

### Booking → Reschedule Options
- One booking can have many reschedule options (regenerated)
- Options are deleted when new options are generated

### Booking → Preference Rankings
- One booking can have up to 2 preference rankings (student + instructor)
- Unique constraint ensures one per user per booking

### User → Availability Patterns
- One user can have many availability patterns (one per day of week)
- Patterns define weekly recurring availability

### User → Availability Overrides
- One user can have many overrides
- Overrides override patterns for specific dates

---

## Data Types

### UUID
- Used for all primary keys
- Generated using `uuid_generate_v4()`
- Ensures globally unique identifiers

### TIMESTAMP WITH TIME ZONE
- All timestamps use timezone-aware format
- Stored in UTC, displayed in user's timezone
- Supports timezone conversions

### JSONB
- Used for flexible metadata storage
- Indexable and queryable
- Used in `weather_forecast` and `metadata` columns

### DECIMAL
- Used for coordinates (latitude, longitude)
- Precision: 10,8 for latitude, 11,8 for longitude
- Ensures accurate geographic coordinates

---

## Indexes

### Performance Indexes

**Bookings:**
- `idx_bookings_scheduled_time` - Date range queries
- `idx_bookings_status` - Status filtering
- `idx_bookings_status_scheduled_time` - Weather monitor queries
- `idx_bookings_student_status` - Student dashboard
- `idx_bookings_instructor_status` - Instructor dashboard
- `idx_bookings_upcoming` - Partial index for weather monitor (CONFIRMED/AT_RISK only)

**Availability:**
- `idx_availability_patterns_user_day` - Availability computation
- `idx_availability_patterns_active` - Active pattern filtering

**Rescheduling:**
- `idx_reschedule_options_booking` - Option queries
- `idx_preference_rankings_booking` - Preference queries

**Notifications:**
- `idx_notifications_user_read` - Unread notifications

**Audit:**
- `idx_audit_log_entity_timestamp` - Entity history queries

---

## Constraints

### Foreign Key Constraints
- All foreign keys have `ON DELETE CASCADE` for data integrity
- Prevents orphaned records
- Ensures referential integrity

### Check Constraints
- `role` must be valid enum value
- `status` must be valid enum value
- `training_level` must be valid enum value
- `day_of_week` must be 0-6
- `end_time` must be after `start_time`

### Unique Constraints
- `users.email` - One account per email
- `users.cognito_user_id` - One database record per Cognito user
- `availability_patterns(user_id, day_of_week, start_time, end_time)` - No duplicate patterns
- `preference_rankings(booking_id, user_id)` - One preference per user per booking

---

## Triggers

### Updated At Trigger

All tables with `updated_at` columns have triggers to automatically update the timestamp:

```sql
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

This ensures `updated_at` is always current without manual updates.

---

## Migrations

Database schema is managed through versioned migrations in `database/migrations/`:

1. `001_create_users.sql` - Users table
2. `002_create_bookings.sql` - Bookings table
3. `003a_create_availability_tables.sql` - Availability tables (old schema)
4. `003b_create_availability_patterns.sql` - Availability patterns (new schema)
5. `004_create_rescheduling_tables.sql` - Rescheduling tables
6. `005_create_notifications.sql` - Notifications table
7. `006_create_audit_log.sql` - Audit log table

**Migration Order:**
- Run migrations in numerical order
- Each migration is idempotent (safe to run multiple times)
- Use `IF NOT EXISTS` for tables/columns

---

## Seed Data

Development seed data in `database/seeds/`:

- `dev_users.sql` - Test users (students, instructors, admin)
- `dev_bookings.sql` - Test bookings
- `dev_availability.sql` - Test availability patterns

**Note:** Seed data is for development only. Never run in production.

---

## Query Examples

### Get User's Bookings

```sql
SELECT * FROM bookings
WHERE student_id = $1
  AND status IN ('CONFIRMED', 'AT_RISK', 'RESCHEDULING')
ORDER BY scheduled_datetime ASC;
```

### Get Availability for Date Range

```sql
-- Get recurring patterns
SELECT * FROM availability_patterns
WHERE user_id = $1
  AND is_active = true;

-- Get overrides
SELECT * FROM availability_overrides
WHERE user_id = $1
  AND override_date BETWEEN $2 AND $3;
```

### Get Reschedule Options with Preferences

```sql
SELECT 
  ro.*,
  pr.option1_id,
  pr.option2_id,
  pr.option3_id
FROM reschedule_options ro
LEFT JOIN preference_rankings pr ON pr.booking_id = ro.booking_id
WHERE ro.booking_id = $1
ORDER BY ro.ai_confidence_score DESC;
```

### Get Unread Notifications

```sql
SELECT * FROM notifications
WHERE user_id = $1
  AND read = false
ORDER BY created_at DESC
LIMIT 20;
```

---

## Performance Considerations

### Query Optimization

1. **Use Indexes:** Always query on indexed columns
2. **Limit Results:** Use `LIMIT` for pagination
3. **Avoid N+1 Queries:** Use JOINs for related data
4. **Use Partial Indexes:** For filtered queries (e.g., weather monitor)

### Connection Pooling

- Global connection pool (5 connections per Lambda instance)
- Reuse connections across invocations
- Connection timeout: 30 seconds
- Statement timeout: 10 seconds

### Monitoring

- Monitor slow queries (>1 second)
- Track index usage
- Monitor connection pool usage
- Alert on high CPU/memory

---

## Backup & Recovery

### Automated Backups

**RDS Automated Backups:**
- Daily backups with 7-day retention (staging)
- Daily backups with 30-day retention (production)
- Point-in-time recovery supported

### Manual Backups

```bash
# Create snapshot
pg_dump -h $RDS_ENDPOINT -U postgres -d flight_schedule_pro > backup.sql

# Restore from snapshot
psql -h $RDS_ENDPOINT -U postgres -d flight_schedule_pro < backup.sql
```

### Recovery Procedures

See `docs/OPERATIONS.md` for detailed recovery procedures.

---

## Schema Evolution

### Adding New Tables

1. Create migration file: `database/migrations/007_create_new_table.sql`
2. Include `IF NOT EXISTS` for idempotency
3. Add indexes for performance
4. Update this documentation

### Modifying Existing Tables

1. Create migration file with `ALTER TABLE` statements
2. Test on staging first
3. Consider downtime for large changes
4. Update this documentation

---

**Last Updated:** November 2024  
**Schema Version:** 1.0.0

