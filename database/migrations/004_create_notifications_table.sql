-- ============================================================================
-- Migration 004: Create Notifications Table
-- ============================================================================
-- Description: Creates the notifications table for email and in-app alerts
-- Dependencies: 001_create_users_table.sql, 002_create_bookings_table.sql
-- ============================================================================

-- Create notifications table
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

-- Create indexes for notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_booking ON notifications(booking_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_type ON notifications(type);

