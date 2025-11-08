-- ============================================================================
-- Migration 003: Create Availability Tables
-- ============================================================================
-- Description: Creates tables for managing instructor and student availability
--              Includes weekly recurring patterns and one-time overrides
-- Dependencies: 001_create_users_table.sql (requires users table)
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

-- Create indexes for availability tables
CREATE INDEX idx_instructor_availability_instructor ON instructor_availability(instructor_id);
CREATE INDEX idx_instructor_availability_day ON instructor_availability(instructor_id, day_of_week);
CREATE INDEX idx_student_availability_student ON student_availability(student_id);
CREATE INDEX idx_student_availability_day ON student_availability(student_id, day_of_week);
CREATE INDEX idx_availability_overrides_user_date ON availability_overrides(user_id, override_date);

-- Create triggers for updated_at
CREATE TRIGGER update_instructor_availability_updated_at BEFORE UPDATE ON instructor_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_availability_updated_at BEFORE UPDATE ON student_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

