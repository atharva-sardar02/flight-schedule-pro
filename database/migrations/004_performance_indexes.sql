-- ============================================================================
-- Migration 004: Performance Indexes
-- ============================================================================
-- Description: Adds database indexes for query optimization
-- Dependencies: All previous migrations
-- ============================================================================

-- Indexes for bookings table (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_time ON bookings(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_instructor_id ON bookings(instructor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status_scheduled_time ON bookings(status, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_bookings_student_status ON bookings(student_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_instructor_status ON bookings(instructor_id, status);

-- Indexes for availability_patterns table
CREATE INDEX IF NOT EXISTS idx_availability_patterns_user_day ON availability_patterns(user_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_patterns_active ON availability_patterns(is_active) WHERE is_active = true;

-- Indexes for availability_overrides table
CREATE INDEX IF NOT EXISTS idx_availability_overrides_user_date ON availability_overrides(user_id, override_date);
CREATE INDEX IF NOT EXISTS idx_availability_overrides_date ON availability_overrides(override_date);

-- Indexes for reschedule_options table
CREATE INDEX IF NOT EXISTS idx_reschedule_options_booking ON reschedule_options(booking_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_options_datetime ON reschedule_options(suggested_datetime);

-- Indexes for preference_rankings table
CREATE INDEX IF NOT EXISTS idx_preference_rankings_booking ON preference_rankings(booking_id);
CREATE INDEX IF NOT EXISTS idx_preference_rankings_user ON preference_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_preference_rankings_submitted ON preference_rankings(booking_id, submitted_at) WHERE submitted_at IS NOT NULL;

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Indexes for audit_log table
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type, timestamp DESC);

-- Composite index for common booking queries (status + scheduled_time range)
CREATE INDEX IF NOT EXISTS idx_bookings_status_time_range ON bookings(status, scheduled_time) 
  WHERE status IN ('CONFIRMED', 'AT_RISK', 'WEATHER_CONFLICT');

-- Partial index for active availability patterns
CREATE INDEX IF NOT EXISTS idx_availability_patterns_active_user ON availability_patterns(user_id, day_of_week, start_time, end_time)
  WHERE is_active = true;

-- Index for upcoming bookings (used by weather monitor)
CREATE INDEX IF NOT EXISTS idx_bookings_upcoming ON bookings(scheduled_time)
  WHERE scheduled_time > NOW() AND status IN ('CONFIRMED', 'AT_RISK');

-- Analyze tables to update statistics
ANALYZE bookings;
ANALYZE availability_patterns;
ANALYZE availability_overrides;
ANALYZE reschedule_options;
ANALYZE preference_rankings;
ANALYZE notifications;
ANALYZE audit_log;

