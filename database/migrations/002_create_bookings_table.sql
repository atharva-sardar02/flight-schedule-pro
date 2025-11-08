-- ============================================================================
-- Migration 002: Create Bookings Table
-- ============================================================================
-- Description: Creates the bookings table for flight training lessons
-- Dependencies: 001_create_users_table.sql (requires users table)
-- ============================================================================

-- Create bookings table
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

-- Create indexes for bookings
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_instructor ON bookings(instructor_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_datetime ON bookings(scheduled_datetime);
CREATE INDEX idx_bookings_status_datetime ON bookings(status, scheduled_datetime); -- Composite for monitoring queries
CREATE INDEX idx_bookings_training_level ON bookings(training_level);

-- Create trigger for updated_at
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

