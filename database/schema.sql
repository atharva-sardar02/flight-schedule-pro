-- ============================================================================
-- Flight Schedule Pro - Complete Database Schema
-- ============================================================================
-- This file contains the complete database schema for reference.
-- For production, use the migration files in migrations/ directory.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    cognito_user_id VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'INSTRUCTOR', 'ADMIN')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    aircraft_id VARCHAR(50),
    departure_airport VARCHAR(10) NOT NULL,
    arrival_airport VARCHAR(10) NOT NULL,
    departure_latitude DECIMAL(10, 8) NOT NULL,
    departure_longitude DECIMAL(11, 8) NOT NULL,
    arrival_latitude DECIMAL(10, 8) NOT NULL,
    arrival_longitude DECIMAL(11, 8) NOT NULL,
    scheduled_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' 
        CHECK (status IN ('CONFIRMED', 'AT_RISK', 'RESCHEDULING', 'CANCELLED', 'COMPLETED')),
    training_level VARCHAR(20) NOT NULL 
        CHECK (training_level IN ('STUDENT_PILOT', 'PRIVATE_PILOT', 'INSTRUMENT_RATED')),
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    original_booking_id UUID REFERENCES bookings(id), -- For rescheduled bookings
    rescheduled_to_datetime TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AVAILABILITY TABLES
-- ============================================================================

-- Instructor Weekly Availability
CREATE TABLE instructor_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    version INTEGER NOT NULL DEFAULT 1, -- For optimistic locking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(instructor_id, day_of_week, start_time, end_time)
);

-- Student Weekly Availability
CREATE TABLE student_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, day_of_week, start_time, end_time)
);

-- One-time Availability Overrides (blocks availability)
CREATE TABLE availability_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    override_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_blocked BOOLEAN NOT NULL DEFAULT true, -- true = not available, false = available
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, override_date, start_time, end_time)
);

-- ============================================================================
-- RESCHEDULING TABLES
-- ============================================================================

-- Reschedule Options (AI-generated suggestions)
CREATE TABLE reschedule_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    suggested_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    weather_forecast JSONB, -- Weather data for all 5 locations
    ai_confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Preference Rankings
CREATE TABLE preference_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    option_1_id UUID REFERENCES reschedule_options(id),
    option_2_id UUID REFERENCES reschedule_options(id),
    option_3_id UUID REFERENCES reschedule_options(id),
    unavailable_option_ids UUID[], -- Array of option IDs marked unavailable
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(booking_id, user_id)
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL 
        CHECK (type IN ('WEATHER_ALERT', 'OPTIONS_AVAILABLE', 'DEADLINE_REMINDER', 'CONFIRMATION', 'ESCALATION')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'booking', 'user', 'availability', etc.
    entity_id UUID,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    data JSONB, -- Flexible JSON for event-specific data
    metadata JSONB, -- IP address, correlation ID, user agent, etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES (for performance)
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cognito_id ON users(cognito_user_id);
CREATE INDEX idx_users_role ON users(role);

-- Bookings indexes
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_instructor ON bookings(instructor_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_datetime ON bookings(scheduled_datetime);
CREATE INDEX idx_bookings_status_datetime ON bookings(status, scheduled_datetime); -- Composite for monitoring queries
CREATE INDEX idx_bookings_training_level ON bookings(training_level);

-- Availability indexes
CREATE INDEX idx_instructor_availability_instructor ON instructor_availability(instructor_id);
CREATE INDEX idx_instructor_availability_day ON instructor_availability(instructor_id, day_of_week);
CREATE INDEX idx_student_availability_student ON student_availability(student_id);
CREATE INDEX idx_student_availability_day ON student_availability(student_id, day_of_week);
CREATE INDEX idx_availability_overrides_user_date ON availability_overrides(user_id, override_date);

-- Rescheduling indexes
CREATE INDEX idx_reschedule_options_booking ON reschedule_options(booking_id);
CREATE INDEX idx_preference_rankings_booking ON preference_rankings(booking_id);
CREATE INDEX idx_preference_rankings_user ON preference_rankings(user_id);
CREATE INDEX idx_preference_rankings_deadline ON preference_rankings(deadline) WHERE submitted_at IS NULL;

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_booking ON notifications(booking_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Audit log indexes
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructor_availability_updated_at BEFORE UPDATE ON instructor_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_availability_updated_at BEFORE UPDATE ON student_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

