-- ============================================================================
-- Migration 003b: Update Availability Tables to Unified Pattern
-- ============================================================================
-- Description: Creates unified availability_patterns table to replace separate
--              instructor_availability and student_availability tables
-- Dependencies: 003_create_availability_tables.sql
-- ============================================================================

-- Create the unified availability_patterns table
CREATE TABLE IF NOT EXISTS availability_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1, -- For optimistic locking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, day_of_week, start_time, end_time)
);

-- Create indexes for availability_patterns
CREATE INDEX IF NOT EXISTS idx_availability_patterns_user ON availability_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_patterns_user_day ON availability_patterns(user_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_patterns_active ON availability_patterns(user_id, is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_availability_patterns_updated_at 
    BEFORE UPDATE ON availability_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate data from old tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instructor_availability') THEN
        INSERT INTO availability_patterns (id, user_id, day_of_week, start_time, end_time, is_active, version, created_at, updated_at)
        SELECT id, instructor_id, day_of_week, start_time, end_time, true, version, created_at, updated_at
        FROM instructor_availability
        ON CONFLICT (user_id, day_of_week, start_time, end_time) DO NOTHING;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_availability') THEN
        INSERT INTO availability_patterns (id, user_id, day_of_week, start_time, end_time, is_active, version, created_at, updated_at)
        SELECT id, student_id, day_of_week, start_time, end_time, true, version, created_at, updated_at
        FROM student_availability
        ON CONFLICT (user_id, day_of_week, start_time, end_time) DO NOTHING;
    END IF;
END $$;



