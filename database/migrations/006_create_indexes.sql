-- ============================================================================
-- Migration 006: Create Additional Indexes and Rescheduling Tables
-- ============================================================================
-- Description: Creates rescheduling-related tables and additional performance indexes
-- Dependencies: 001_create_users_table.sql, 002_create_bookings_table.sql
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

-- Create indexes for rescheduling tables
CREATE INDEX idx_reschedule_options_booking ON reschedule_options(booking_id);
CREATE INDEX idx_preference_rankings_booking ON preference_rankings(booking_id);
CREATE INDEX idx_preference_rankings_user ON preference_rankings(user_id);
CREATE INDEX idx_preference_rankings_deadline ON preference_rankings(deadline) WHERE submitted_at IS NULL;

